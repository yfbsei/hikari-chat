// src/hooks.server.js
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '$env/static/private';
import { redis, sessionManager } from '$lib/server/redis.js';
import { db } from '$lib/server/database.js';

export async function handle({ event, resolve }) {
	// Get the auth token from cookies
	const token = event.cookies.get('auth_token');
	
	if (token) {
		try {
			// Verify the JWT token
			const decoded = jwt.verify(token, JWT_SECRET);
			
			// Check if session exists in Redis
			const session = await sessionManager.getSession(decoded.userId);
			
			if (session) {
				// Get fresh user data from database
				const userQuery = await db.query(
					'SELECT id, username, email, display_name, avatar_url, is_active, is_verified FROM users WHERE id = $1 AND deleted_at IS NULL',
					[decoded.userId]
				);
				
				if (userQuery.rows.length > 0) {
					const user = userQuery.rows[0];
					
					// Only set user if account is active and verified
					if (user.is_active && user.is_verified) {
						event.locals.user = user;
						
						// Extend session if it's close to expiring
						await sessionManager.extendSession(decoded.userId);
					}
				}
			}
		} catch (error) {
			// Invalid token, clear the cookie
			console.log('Invalid auth token:', error.message);
			event.cookies.delete('auth_token', { path: '/' });
		}
	}
	
	// Check if the route requires authentication
	const protectedRoutes = ['/dashboard', '/workspace', '/settings', '/api/protected'];
	const isProtectedRoute = protectedRoutes.some(route => 
		event.url.pathname.startsWith(route)
	);
	
	// Redirect to login if accessing protected route without authentication
	if (isProtectedRoute && !event.locals.user) {
		if (event.url.pathname.startsWith('/api/')) {
			// Return 401 for API routes
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'content-type': 'application/json' }
			});
		} else {
			// Redirect to login for page routes
			const redirectTo = encodeURIComponent(event.url.pathname + event.url.search);
			return Response.redirect(`${event.url.origin}/auth/login?redirectTo=${redirectTo}`, 302);
		}
	}
	
	// Redirect authenticated users away from auth pages
	const authRoutes = ['/auth/login', '/auth/signup', '/auth/forgot-password'];
	if (event.locals.user && authRoutes.includes(event.url.pathname)) {
		return Response.redirect(`${event.url.origin}/dashboard`, 302);
	}
	
	// Add security headers
	const response = await resolve(event);
	
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
	
	// Only add HSTS in production
	if (event.url.protocol === 'https:') {
		response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	}
	
	return response;
}

// Handle errors
export async function handleError({ error, event }) {
	console.error('Application error:', error);
	
	// Log error details for debugging
	if (event.locals.user) {
		console.error('Error for user:', event.locals.user.id);
	}
	
	// Don't expose internal errors to the client in production
	return {
		message: 'An unexpected error occurred',
		code: error?.code || 'UNKNOWN_ERROR'
	};
}

// User utility functions for use in routes
export function requireAuth(user) {
	if (!user) {
		throw new Error('Authentication required');
	}
	return user;
}

export function requireAdmin(user) {
	requireAuth(user);
	if (!user.is_admin) {
		throw new Error('Admin access required');
	}
	return user;
}