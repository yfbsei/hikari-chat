// src/routes/auth/login/+page.server.js
import { fail, redirect } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '$lib/server/database.js';
import { redis, rateLimiter, sessionManager } from '$lib/server/redis.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '$lib/server/email.js';
import { logAuditEvent, AUDIT_ACTIONS } from '$lib/server/audit.js';
import { JWT_SECRET, BCRYPT_ROUNDS } from '$env/static/private';

// Validation schemas
const loginSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(1, 'Password is required')
});

const signupSchema = z.object({
	username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username must be less than 30 characters'),
	email: z.string().email('Invalid email address'),
	password: z.string().min(8, 'Password must be at least 8 characters'),
	confirmPassword: z.string(),
	agreeTerms: z.boolean().refine(val => val === true, 'You must agree to the terms')
}).refine(data => data.password === data.confirmPassword, {
	message: "Passwords don't match",
	path: ["confirmPassword"]
});

const forgotPasswordSchema = z.object({
	email: z.string().email('Invalid email address')
});

// Helper function to increment failed attempts
async function incrementFailedAttempts(rateLimitKey) {
	await redis.incr(rateLimitKey);
	await redis.expire(rateLimitKey, 3600);
}

export const actions = {
	login: async ({ request, getClientAddress, cookies, url }) => {
		const ipAddress = getClientAddress();
		const userAgent = request.headers.get('user-agent') || 'unknown';
		
		const formData = await request.formData();
		const data = {
			email: formData.get('email'),
			password: formData.get('password')
		};

		// Rate limiting check
		const rateLimitKey = `failed_login_attempts:${ipAddress}`;
		const currentStatus = await rateLimiter.getRateLimitStatus(rateLimitKey, 5, 3600);
		
		if (currentStatus.count >= 5) {
			await logAuditEvent(null, AUDIT_ACTIONS.LOGIN_ATTEMPT, 'rate_limit', null, ipAddress, userAgent, null, 
				{ email: data.email, failed_attempts: currentStatus.count, limit: 5 }, false, 'Rate limit exceeded');
			
			return fail(429, {
				message: `Too many failed login attempts (${currentStatus.count}/5). Please try again in an hour.`,
				email: data.email
			});
		}

		// Validate input
		const result = loginSchema.safeParse(data);
		if (!result.success) {
			await incrementFailedAttempts(rateLimitKey);
			await logAuditEvent(null, AUDIT_ACTIONS.LOGIN_ATTEMPT, 'validation', null, ipAddress, userAgent, null,
				{ email: data.email, validation_error: result.error.errors[0].message }, false, result.error.errors[0].message);
			
			return fail(400, {
				message: result.error.errors[0].message,
				email: data.email
			});
		}

		try {
			// Find user by email
			const userQuery = await db.query(
				'SELECT id, username, email, password_hash, is_verified, is_active FROM users WHERE email = $1 AND deleted_at IS NULL',
				[data.email]
			);

			if (userQuery.rows.length === 0) {
				await incrementFailedAttempts(rateLimitKey);
				await logAuditEvent(null, AUDIT_ACTIONS.LOGIN_FAILED, 'user_lookup', null, ipAddress, userAgent, null,
					{ email: data.email, reason: 'user_not_found' }, false, 'Invalid email or password');
				
				return fail(400, {
					message: 'Invalid email or password',
					email: data.email
				});
			}

			const user = userQuery.rows[0];

			// Check if account is active
			if (!user.is_active) {
				await incrementFailedAttempts(rateLimitKey);
				await logAuditEvent(user.id, AUDIT_ACTIONS.LOGIN_FAILED, 'user', user.id, ipAddress, userAgent,
					{ is_active: false }, { email: data.email, reason: 'account_inactive' }, false, 'Account is inactive');
				
				return fail(400, {
					message: 'Your account has been deactivated. Please contact support.',
					email: data.email
				});
			}

			// Verify password
			const isValidPassword = await bcrypt.compare(data.password, user.password_hash);
			if (!isValidPassword) {
				await incrementFailedAttempts(rateLimitKey);
				await logAuditEvent(user.id, AUDIT_ACTIONS.LOGIN_FAILED, 'user', user.id, ipAddress, userAgent, null,
					{ email: data.email, reason: 'invalid_password' }, false, 'Invalid password');
				
				return fail(400, {
					message: 'Invalid email or password',
					email: data.email
				});
			}

			// Check if user is verified
			if (!user.is_verified) {
				await logAuditEvent(user.id, AUDIT_ACTIONS.LOGIN_FAILED, 'user', user.id, ipAddress, userAgent,
					{ is_verified: false }, { email: data.email, reason: 'email_not_verified' }, false, 'Email not verified');
				
				return fail(400, {
					message: 'Please verify your email address before logging in',
					email: data.email
				});
			}

			// SUCCESS - Clear failed attempts and create session
			await rateLimiter.resetRateLimit(rateLimitKey);
			
			const sessionExpiry = 30 * 24 * 60 * 60; // 30 days

			// Generate JWT token
			const token = jwt.sign(
				{ userId: user.id, email: user.email, username: user.username },
				JWT_SECRET,
				{ expiresIn: '30d' }
			);

			// Update last login
			await db.query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

			// Create Redis session
			const sessionData = {
				userId: user.id,
				email: user.email,
				username: user.username,
				loginTime: new Date().toISOString(),
				autoRemember: true
			};
			
			await sessionManager.setSession(user.id, sessionData, sessionExpiry);

			// Set HTTP-only cookie
			cookies.set('auth_token', token, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'strict',
				maxAge: sessionExpiry,
				path: '/'
			});

			// Audit log for successful login
			await logAuditEvent(user.id, AUDIT_ACTIONS.LOGIN_SUCCESS, 'user', user.id, ipAddress, userAgent, null,
				{ email: user.email, username: user.username, auto_remember: true, session_duration: '30d' }, true, null);

			console.log(`✅ Successful login: ${user.email} (${user.id}) from ${ipAddress}`);

			// Redirect to dashboard
			const redirectTo = url.searchParams.get('redirectTo') || '/dashboard';
			throw redirect(302, redirectTo);

		} catch (error) {
			// Re-throw redirect errors
			if (error?.status === 302) {
				throw error;
			}
			
			await incrementFailedAttempts(rateLimitKey);
			console.error('Login error:', error);
			
			await logAuditEvent(null, AUDIT_ACTIONS.LOGIN_ATTEMPT, 'system', null, ipAddress, userAgent, null,
				{ email: data.email, error: error.message }, false, 'System error during login');
			
			return fail(500, {
				message: 'An error occurred during login. Please try again.',
				email: data.email
			});
		}
	},

	signup: async ({ request, getClientAddress }) => {
		const ipAddress = getClientAddress();
		const userAgent = request.headers.get('user-agent') || 'unknown';
		
		const formData = await request.formData();
		const data = {
			username: formData.get('username'),
			email: formData.get('email'),
			password: formData.get('password'),
			confirmPassword: formData.get('confirmPassword'),
			agreeTerms: formData.get('agreeTerms') === 'on'
		};

		// Rate limiting
		const rateLimitKey = `signup_attempts:${ipAddress}`;
		const isRateLimited = await rateLimiter.isRateLimited(rateLimitKey, 5, 3600);
		
		if (isRateLimited) {
			await logAuditEvent(null, AUDIT_ACTIONS.SIGNUP_ATTEMPT, 'rate_limit', null, ipAddress, userAgent, null,
				{ email: data.email, username: data.username }, false, 'Rate limit exceeded');
			
			return fail(429, {
				message: 'Too many signup attempts. Please try again in an hour.',
				username: data.username,
				email: data.email
			});
		}

		// Validate input
		const result = signupSchema.safeParse(data);
		if (!result.success) {
			await logAuditEvent(null, AUDIT_ACTIONS.SIGNUP_ATTEMPT, 'validation', null, ipAddress, userAgent, null,
				{ email: data.email, username: data.username, validation_error: result.error.errors[0].message },
				false, result.error.errors[0].message);
			
			return fail(400, {
				message: result.error.errors[0].message,
				username: data.username,
				email: data.email
			});
		}

		try {
			// Check if user already exists
			const existingUser = await db.query(
				'SELECT id, email, username FROM users WHERE email = $1 OR username = $2',
				[data.email, data.username]
			);

			if (existingUser.rows.length > 0) {
				const existingEmail = await db.query('SELECT email FROM users WHERE email = $1', [data.email]);
				const errorMessage = existingEmail.rows.length > 0 
					? 'An account with this email already exists'
					: 'This username is already taken';
				
				await logAuditEvent(null, AUDIT_ACTIONS.SIGNUP_ATTEMPT, 'duplicate_check', null, ipAddress, userAgent, null,
					{ email: data.email, username: data.username, conflict_type: existingEmail.rows.length > 0 ? 'email' : 'username' },
					false, errorMessage);
				
				return fail(400, {
					message: errorMessage,
					username: existingEmail.rows.length > 0 ? data.username : '',
					email: existingEmail.rows.length === 0 ? data.email : ''
				});
			}

			// Hash password and create user
			const passwordHash = await bcrypt.hash(data.password, parseInt(BCRYPT_ROUNDS) || 12);
			const verificationToken = jwt.sign({ email: data.email }, JWT_SECRET, { expiresIn: '1h' });

			const newUser = await db.query(
				`INSERT INTO users (username, email, password_hash, verification_token, verification_expires, created_at, updated_at) 
				 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
				 RETURNING id, username, email, created_at`,
				[data.username, data.email, passwordHash, verificationToken, new Date(Date.now() + 60 * 60 * 1000)]
			);

			const user = newUser.rows[0];

			// Store verification token in Redis
			await redis.setex(`verification:${verificationToken}`, 60 * 60, JSON.stringify({
				userId: user.id,
				email: user.email,
				username: user.username
			}));

			// Send verification email
			await sendVerificationEmail(user.email, verificationToken);

			// Audit log
			await logAuditEvent(user.id, AUDIT_ACTIONS.USER_CREATED, 'user', user.id, ipAddress, userAgent, null,
				{ username: user.username, email: user.email, is_verified: false, verification_token_expires: '1h' }, true, null);

			console.log(`✅ New user created: ${user.email} (${user.id})`);

			return {
				success: true,
				message: 'Account created successfully! Please check your email to verify your account.',
				user: { id: user.id, username: user.username, email: user.email }
			};

		} catch (error) {
			console.error('Signup error:', error);
			
			await logAuditEvent(null, AUDIT_ACTIONS.SIGNUP_ATTEMPT, 'system', null, ipAddress, userAgent, null,
				{ email: data.email, username: data.username, error: error.message }, false, 'System error during signup');
			
			return fail(500, {
				message: 'An error occurred during account creation. Please try again.',
				username: data.username,
				email: data.email
			});
		}
	},

	forgot: async ({ request, getClientAddress }) => {
		const ipAddress = getClientAddress();
		const userAgent = request.headers.get('user-agent') || 'unknown';
		
		const formData = await request.formData();
		const data = { email: formData.get('email') };

		// Rate limiting
		const rateLimitKey = `password_reset_attempts:${ipAddress}`;
		const isRateLimited = await rateLimiter.isRateLimited(rateLimitKey, 3, 3600);
		
		if (isRateLimited) {
			await logAuditEvent(null, AUDIT_ACTIONS.PASSWORD_RESET_ATTEMPT, 'rate_limit', null, ipAddress, userAgent, null,
				{ email: data.email }, false, 'Rate limit exceeded');
			
			return fail(429, {
				message: 'Too many password reset attempts. Please try again in an hour.'
			});
		}

		// Validate input
		const result = forgotPasswordSchema.safeParse(data);
		if (!result.success) {
			await logAuditEvent(null, AUDIT_ACTIONS.PASSWORD_RESET_ATTEMPT, 'validation', null, ipAddress, userAgent, null,
				{ email: data.email, validation_error: result.error.errors[0].message }, false, result.error.errors[0].message);
			
			return fail(400, { message: result.error.errors[0].message });
		}

		try {
			// Check if user exists
			const userQuery = await db.query(
				'SELECT id, username, email FROM users WHERE email = $1 AND deleted_at IS NULL',
				[data.email]
			);

			// Always return success to prevent email enumeration
			if (userQuery.rows.length === 0) {
				await logAuditEvent(null, AUDIT_ACTIONS.PASSWORD_RESET_ATTEMPT, 'user_lookup', null, ipAddress, userAgent, null,
					{ email: data.email, reason: 'user_not_found' }, false, 'User not found');
				
				return {
					success: true,
					message: 'If an account with this email exists, you will receive a password reset link.'
				};
			}

			const user = userQuery.rows[0];

			// Generate reset token
			const resetToken = jwt.sign(
				{ userId: user.id, email: user.email, type: 'password_reset' },
				JWT_SECRET,
				{ expiresIn: '1h' }
			);

			// Store reset token in Redis
			await redis.setex(`reset:${resetToken}`, 60 * 60, JSON.stringify({
				userId: user.id,
				email: user.email,
				username: user.username
			}));

			// Update user with reset token
			await db.query(
				'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
				[resetToken, new Date(Date.now() + 60 * 60 * 1000), user.id]
			);

			// Send password reset email
			await sendPasswordResetEmail(user.email, resetToken);

			// Audit log
			await logAuditEvent(user.id, AUDIT_ACTIONS.PASSWORD_RESET_ATTEMPT, 'user', user.id, ipAddress, userAgent, null,
				{ email: user.email, reset_token_expires: '1h' }, true, null);

			console.log(`🔐 Password reset requested for: ${user.email} (${user.id})`);

			return {
				success: true,
				message: 'If an account with this email exists, you will receive a password reset link.'
			};

		} catch (error) {
			console.error('Forgot password error:', error);
			
			await logAuditEvent(null, AUDIT_ACTIONS.PASSWORD_RESET_ATTEMPT, 'system', null, ipAddress, userAgent, null,
				{ email: data.email, error: error.message }, false, 'System error during password reset');
			
			return fail(500, {
				message: 'An error occurred while processing your request. Please try again.'
			});
		}
	},

	logout: async ({ request, cookies, getClientAddress }) => {
		const ipAddress = getClientAddress();
		const userAgent = request.headers.get('user-agent') || 'unknown';
		
		try {
			const token = cookies.get('auth_token');
			let userId = null;
			
			if (token) {
				try {
					const decoded = jwt.verify(token, JWT_SECRET);
					userId = decoded.userId;
					
					// Remove session from Redis
					await redis.del(`session:${decoded.userId}`);
					
					// Audit log for logout
					await logAuditEvent(userId, 'logout_success', 'user', userId, ipAddress, userAgent, null,
						{ email: decoded.email }, true, null);
					
					console.log(`👋 User logged out: ${decoded.email} (${userId}) from ${ipAddress}`);
					
				} catch (err) {
					console.log('Token verification failed during logout:', err.message);
					await logAuditEvent(null, 'logout_attempt', 'token', null, ipAddress, userAgent, null,
						{ error: err.message }, false, 'Invalid token during logout');
				}
			}

			// Clear auth cookie
			cookies.delete('auth_token', { path: '/' });
			console.log(`🔓 Logout successful for ${userId || 'unknown'} from ${ipAddress}`);

			return { success: true, message: 'Logged out successfully' };

		} catch (error) {
			console.error('Logout error:', error);
			await logAuditEvent(null, 'logout_attempt', 'system', null, ipAddress, userAgent, null,
				{ error: error.message }, false, 'System error during logout');
			
			cookies.delete('auth_token', { path: '/' });
			return { success: false, message: 'Logout completed with errors' };
		}
	}
};