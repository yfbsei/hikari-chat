// src/lib/server/redis.js
import Redis from 'ioredis';
import { 
	REDIS_URL, 
	REDIS_HOST, 
	REDIS_PORT, 
	REDIS_PASSWORD,
	NODE_ENV 
} from '$env/static/private';

// Redis configuration
const redisConfig = {
	// Use REDIS_URL if available (for production), otherwise use individual env vars
	host: REDIS_HOST || 'localhost',
	port: parseInt(REDIS_PORT) || 6379,
	password: REDIS_PASSWORD || undefined,
	
	// Connection settings
	connectTimeout: 10000,
	lazyConnect: true,
	maxRetriesPerRequest: 3,
	retryDelayOnFailover: 100,
	enableReadyCheck: false,
	maxRetriesPerRequest: null,
	
	// Key prefix for this application
	keyPrefix: 'hikari:',
	
	// Cluster configuration (if using Redis Cluster)
	// enableOfflineQueue: false,
	
	// TLS configuration for production
	tls: NODE_ENV === 'production' && REDIS_URL?.includes('rediss://') ? {} : undefined
};

// Create Redis connection
export const redis = REDIS_URL 
	? new Redis(REDIS_URL)
	: new Redis(redisConfig);

// Redis event handlers
redis.on('connect', () => {
	console.log('Connected to Redis');
});

redis.on('ready', () => {
	console.log('Redis connection ready');
});

redis.on('error', (err) => {
	console.error('Redis connection error:', err);
});

redis.on('close', () => {
	console.log('Redis connection closed');
});

redis.on('reconnecting', () => {
	console.log('Reconnecting to Redis...');
});

// Helper functions for common Redis operations

// Session management
export const sessionManager = {
	// Set user session
	async setSession(userId, sessionData, expirySeconds = 7 * 24 * 60 * 60) {
		const key = `session:${userId}`;
		await redis.setex(key, expirySeconds, JSON.stringify(sessionData));
	},

	// Get user session
	async getSession(userId) {
		const key = `session:${userId}`;
		const data = await redis.get(key);
		return data ? JSON.parse(data) : null;
	},

	// Delete user session
	async deleteSession(userId) {
		const key = `session:${userId}`;
		await redis.del(key);
	},

	// Extend session expiry
	async extendSession(userId, expirySeconds = 7 * 24 * 60 * 60) {
		const key = `session:${userId}`;
		await redis.expire(key, expirySeconds);
	},

	// Get all active sessions for a user
	async getUserSessions(userId) {
		const pattern = `session:${userId}:*`;
		const keys = await redis.keys(pattern);
		if (keys.length === 0) return [];
		
		const sessions = await redis.mget(keys);
		return sessions.map((session, index) => ({
			key: keys[index],
			data: session ? JSON.parse(session) : null
		})).filter(s => s.data);
	}
};

// Cache management
export const cacheManager = {
	// Generic cache set
	async set(key, value, expirySeconds = 3600) {
		await redis.setex(key, expirySeconds, JSON.stringify(value));
	},

	// Generic cache get
	async get(key) {
		const data = await redis.get(key);
		return data ? JSON.parse(data) : null;
	},

	// Generic cache delete
	async del(key) {
		await redis.del(key);
	},

	// Cache with tags (for invalidation)
	async setWithTags(key, value, tags = [], expirySeconds = 3600) {
		const pipeline = redis.pipeline();
		
		// Set the main key
		pipeline.setex(key, expirySeconds, JSON.stringify(value));
		
		// Add to tag sets
		tags.forEach(tag => {
			pipeline.sadd(`tag:${tag}`, key);
			pipeline.expire(`tag:${tag}`, expirySeconds + 60); // Tag expires slightly later
		});
		
		await pipeline.exec();
	},

	// Invalidate by tags
	async invalidateByTags(tags) {
		const pipeline = redis.pipeline();
		
		for (const tag of tags) {
			const keys = await redis.smembers(`tag:${tag}`);
			if (keys.length > 0) {
				pipeline.del(...keys);
				pipeline.del(`tag:${tag}`);
			}
		}
		
		await pipeline.exec();
	}
};

// Rate limiting
export const rateLimiter = {
	// Check if action is rate limited
	async isRateLimited(key, limit = 100, windowSeconds = 3600) {
		const pipeline = redis.pipeline();
		
		pipeline.incr(key);
		pipeline.expire(key, windowSeconds);
		
		const results = await pipeline.exec();
		const count = results[0][1]; // Get result from incr command
		
		return count > limit;
	},

	// Get current rate limit status
	async getRateLimitStatus(key, limit = 100, windowSeconds = 3600) {
		const count = await redis.get(key) || 0;
		const ttl = await redis.ttl(key);
		
		return {
			count: parseInt(count),
			limit,
			remaining: Math.max(0, limit - parseInt(count)),
			resetTime: ttl > 0 ? Date.now() + (ttl * 1000) : null
		};
	},

	// Reset rate limit for a key
	async resetRateLimit(key) {
		await redis.del(key);
	}
};

// Real-time messaging support
export const messagingCache = {
	// Store user's online status
	async setUserOnline(userId, socketId = null) {
		const key = `online:${userId}`;
		const data = {
			timestamp: Date.now(),
			socketId,
			status: 'online'
		};
		await redis.setex(key, 300, JSON.stringify(data)); // 5 minutes
	},

	// Set user offline
	async setUserOffline(userId) {
		await redis.del(`online:${userId}`);
	},

	// Check if user is online
	async isUserOnline(userId) {
		const data = await redis.get(`online:${userId}`);
		return data !== null;
	},

	// Get online users in a workspace
	async getOnlineUsers(userIds) {
		if (userIds.length === 0) return [];
		
		const keys = userIds.map(id => `online:${id}`);
		const results = await redis.mget(keys);
		
		return userIds.filter((_, index) => results[index] !== null);
	},

	// Store typing indicators
	async setTyping(channelId, userId, expirySeconds = 10) {
		const key = `typing:${channelId}`;
		await redis.setex(`${key}:${userId}`, expirySeconds, Date.now());
	},

	// Get users currently typing in a channel
	async getTypingUsers(channelId) {
		const pattern = `typing:${channelId}:*`;
		const keys = await redis.keys(pattern);
		
		return keys.map(key => key.split(':').pop());
	},

	// Clear typing indicator
	async clearTyping(channelId, userId) {
		await redis.del(`typing:${channelId}:${userId}`);
	}
};

// Notification management
export const notificationManager = {
	// Add notification to user's queue
	async addNotification(userId, notification) {
		const key = `notifications:${userId}`;
		const notificationData = {
			id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			...notification,
			timestamp: Date.now(),
			read: false
		};
		
		await redis.lpush(key, JSON.stringify(notificationData));
		
		// Keep only latest 100 notifications
		await redis.ltrim(key, 0, 99);
		
		// Set expiry for the list (30 days)
		await redis.expire(key, 30 * 24 * 60 * 60);
		
		return notificationData.id;
	},

	// Get user's notifications
	async getNotifications(userId, limit = 20, offset = 0) {
		const key = `notifications:${userId}`;
		const notifications = await redis.lrange(key, offset, offset + limit - 1);
		
		return notifications.map(notif => JSON.parse(notif));
	},

	// Mark notification as read
	async markAsRead(userId, notificationId) {
		const key = `notifications:${userId}`;
		const notifications = await redis.lrange(key, 0, -1);
		
		const updatedNotifications = notifications.map(notif => {
			const parsed = JSON.parse(notif);
			if (parsed.id === notificationId) {
				parsed.read = true;
			}
			return JSON.stringify(parsed);
		});

		// Clear and repopulate the list
		const pipeline = redis.pipeline();
		pipeline.del(key);
		if (updatedNotifications.length > 0) {
			pipeline.lpush(key, ...updatedNotifications);
		}
		await pipeline.exec();
	},

	// Get unread notification count
	async getUnreadCount(userId) {
		const key = `notifications:${userId}`;
		const notifications = await redis.lrange(key, 0, -1);
		
		return notifications.filter(notif => {
			const parsed = JSON.parse(notif);
			return !parsed.read;
		}).length;
	}
};

// Analytics and metrics
export const metricsManager = {
	// Increment a counter
	async incrementCounter(metric, value = 1, tags = {}) {
		const tagString = Object.entries(tags)
			.map(([k, v]) => `${k}:${v}`)
			.join(',');
		
		const key = `metrics:${metric}${tagString ? `:${tagString}` : ''}`;
		await redis.incrby(key, value);
		
		// Set expiry to 7 days
		await redis.expire(key, 7 * 24 * 60 * 60);
	},

	// Record a gauge value
	async setGauge(metric, value, tags = {}) {
		const tagString = Object.entries(tags)
			.map(([k, v]) => `${k}:${v}`)
			.join(',');
		
		const key = `gauge:${metric}${tagString ? `:${tagString}` : ''}`;
		await redis.set(key, value);
		
		// Set expiry to 7 days
		await redis.expire(key, 7 * 24 * 60 * 60);
	},

	// Get metric value
	async getMetric(metric, tags = {}) {
		const tagString = Object.entries(tags)
			.map(([k, v]) => `${k}:${v}`)
			.join(',');
		
		const counterKey = `metrics:${metric}${tagString ? `:${tagString}` : ''}`;
		const gaugeKey = `gauge:${metric}${tagString ? `:${tagString}` : ''}`;
		
		const [counter, gauge] = await Promise.all([
			redis.get(counterKey),
			redis.get(gaugeKey)
		]);
		
		return {
			counter: counter ? parseInt(counter) : 0,
			gauge: gauge ? parseFloat(gauge) : null
		};
	}
};

// Redis health check
export async function redisHealthCheck() {
	try {
		const start = Date.now();
		await redis.ping();
		const latency = Date.now() - start;
		
		const info = await redis.info('memory');
		const memoryInfo = info
			.split('\r\n')
			.filter(line => line.includes('used_memory_human'))
			.map(line => line.split(':')[1])[0];
		
		return {
			status: 'healthy',
			latency: `${latency}ms`,
			memory: memoryInfo,
			connected: redis.status === 'ready'
		};
	} catch (error) {
		return {
			status: 'unhealthy',
			error: error.message,
			connected: false
		};
	}
}

// Graceful shutdown
process.on('SIGTERM', async () => {
	console.log('SIGTERM received, closing Redis connection...');
	await redis.quit();
});

process.on('SIGINT', async () => {
	console.log('SIGINT received, closing Redis connection...');
	await redis.quit();
});