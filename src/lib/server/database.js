// src/lib/server/database.js
import { Pool } from '../../../node_modules/@types/pg';
import { 
	DATABASE_URL, 
	DB_HOST, 
	DB_PORT, 
	DB_NAME, 
	DB_USER, 
	DB_PASSWORD,
	NODE_ENV 
} from '$env/static/private';

// Database configuration
const dbConfig = {
	// Use DATABASE_URL if available (for production), otherwise use individual env vars
	connectionString: DATABASE_URL,
	host: DB_HOST || 'localhost',
	port: parseInt(DB_PORT) || 5432,
	database: DB_NAME || 'hikari_chat',
	user: DB_USER || 'postgres',
	password: DB_PASSWORD || 'password',
	
	// Connection pool settings
	max: 20, // Maximum number of clients in the pool
	idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
	connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
	
	// SSL configuration for production
	ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Create the connection pool
export const db = new Pool(
	DATABASE_URL ? { connectionString: DATABASE_URL, ssl: dbConfig.ssl } : dbConfig
);

// Handle pool events
db.on('connect', (client) => {
	console.log('New client connected to PostgreSQL');
});

db.on('error', (err, client) => {
	console.error('Unexpected error on idle client', err);
	process.exit(-1);
});

// Helper function to execute queries with error handling
export async function query(text, params) {
	const start = Date.now();
	try {
		const res = await db.query(text, params);
		const duration = Date.now() - start;
		
		if (NODE_ENV === 'development') {
			console.log('Executed query', { text, duration, rows: res.rowCount });
		}
		
		return res;
	} catch (error) {
		console.error('Database query error:', error);
		throw error;
	}
}

// Helper function to execute transactions
export async function transaction(callback) {
	const client = await db.connect();
	
	try {
		await client.query('BEGIN');
		const result = await callback(client);
		await client.query('COMMIT');
		return result;
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		client.release();
	}
}

// Database health check
export async function healthCheck() {
	try {
		const result = await db.query('SELECT NOW()');
		return {
			status: 'healthy',
			timestamp: result.rows[0].now,
			connections: db.totalCount
		};
	} catch (error) {
		return {
			status: 'unhealthy',
			error: error.message
		};
	}
}

// Graceful shutdown
process.on('SIGTERM', async () => {
	console.log('SIGTERM received, closing database pool...');
	await db.end();
});

process.on('SIGINT', async () => {
	console.log('SIGINT received, closing database pool...');
	await db.end();
});