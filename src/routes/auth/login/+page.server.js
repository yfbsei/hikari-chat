// src/routes/auth/login/+page.server.js
import { fail, redirect } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '$lib/server/database.js';
import { redis, rateLimiter } from '$lib/server/redis.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '$lib/server/email.js';
import { logAuditEvent, AUDIT_ACTIONS } from '$lib/server/audit.js';
import { JWT_SECRET, BCRYPT_ROUNDS } from '$env/static/private';

// Validation schemas
const loginSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(1, 'Password is required'),
	rememberMe: z.boolean().optional()
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

// Helper function to increment failed attempts manually
async function incrementFailedAttempts(rateLimitKey) {
	await redis.incr(rateLimitKey);
	await redis.expire(rateLimitKey, 3600);
}

export const actions = {
	// Login action
	login: async ({ request, getClientAddress, cookies }) => {
		const ipAddress = getClientAddress();
		const userAgent = request.headers.get('user-agent') || 'unknown';
		
		const formData = await request.formData();
		const data = {
			email: formData.get('email'),
			password: formData.get('password'),
			rememberMe: formData.get('rememberMe') === 'on'
		};

		// Rate limiting: 5 FAILED login attempts per IP per hour
		const rateLimitKey = `failed_login_attempts:${ipAddress}`;
		
		// Check current status without incrementing first
		const currentStatus = await rateLimiter.getRateLimitStatus(rateLimitKey, 5, 3600);
		console.log(`📊 Failed attempts: ${currentStatus.count}/5`);
		
		// Check if already rate limited
		if (currentStatus.count >= 5) {
			console.log(`🚫 BLOCKING: Too many failed attempts for ${ipAddress}`);
			await logAuditEvent(
				null, 
				AUDIT_ACTIONS.LOGIN_ATTEMPT, 
				'rate_limit', 
				null, 
				ipAddress, 
				userAgent, 
				null, 
				{ email: data.email, failed_attempts: currentStatus.count, limit: 5 }, 
				false, 
				'Rate limit exceeded - too many failed attempts'
			);
			
			return fail(429, {
				message: `Too many failed login attempts (${currentStatus.count}/5). Please try again in an hour.`,
				email: data.email
			});
		}

		// Validate input
		const result = loginSchema.safeParse(data);
		if (!result.success) {
			// Increment failed attempts for validation errors
			await incrementFailedAttempts(rateLimitKey);
			
			await logAuditEvent(
				null, 
				AUDIT_ACTIONS.LOGIN_ATTEMPT, 
				'validation', 
				null, 
				ipAddress, 
				userAgent, 
				null, 
				{ email: data.email, validation_error: result.error.errors[0].message }, 
				false, 
				result.error.errors[0].message
			);
			
			return fail(400, {
				message: result.error.errors[0].message,
				email: data.email
			});
		}

		try {
			// Find user by email
			const user = await db.query(
				'SELECT id, username, email, password_hash, is_verified, is_active, created_at FROM users WHERE email = $1 AND deleted_at IS NULL',
				[data.email]
			);

			if (user.rows.length === 0) {
				// Increment failed attempts for user not found
				await incrementFailedAttempts(rateLimitKey);
				
				await logAuditEvent(
					null, 
					AUDIT_ACTIONS.LOGIN_FAILED, 
					'user_lookup', 
					null, 
					ipAddress, 
					userAgent, 
					null, 
					{ email: data.email, reason: 'user_not_found' }, 
					false, 
					'Invalid email or password'
				);
				
				return fail(400, {
					message: 'Invalid email or password',
					email: data.email
				});
			}

			const userRecord = user.rows[0];

			// Check if account is active
			if (!userRecord.is_active) {
				// Increment failed attempts for inactive account
				await incrementFailedAttempts(rateLimitKey);
				
				await logAuditEvent(
					userRecord.id, 
					AUDIT_ACTIONS.LOGIN_FAILED, 
					'user', 
					userRecord.id, 
					ipAddress, 
					userAgent, 
					{ is_active: false }, 
					{ email: data.email, reason: 'account_inactive' }, 
					false, 
					'Account is inactive'
				);
				
				return fail(400, {
					message: 'Your account has been deactivated. Please contact support.',
					email: data.email
				});
			}

			// Verify password
			const isValidPassword = await bcrypt.compare(data.password, userRecord.password_hash);
			if (!isValidPassword) {
				// Increment failed attempts for wrong password
				await incrementFailedAttempts(rateLimitKey);
				
				await logAuditEvent(
					userRecord.id, 
					AUDIT_ACTIONS.LOGIN_FAILED, 
					'user', 
					userRecord.id, 
					ipAddress, 
					userAgent, 
					null, 
					{ email: data.email, reason: 'invalid_password' }, 
					false, 
					'Invalid password'
				);
				
				return fail(400, {
					message: 'Invalid email or password',
					email: data.email
				});
			}

			// Check if user is verified
			if (!userRecord.is_verified) {
				// Don't increment failed attempts for unverified users (they have correct password)
				await logAuditEvent(
					userRecord.id, 
					AUDIT_ACTIONS.LOGIN_FAILED, 
					'user', 
					userRecord.id, 
					ipAddress, 
					userAgent, 
					{ is_verified: false }, 
					{ email: data.email, reason: 'email_not_verified' }, 
					false, 
					'Email not verified'
				);
				
				return fail(400, {
					message: 'Please verify your email address before logging in',
					email: data.email
				});
			}

			// SUCCESS - Clear failed attempts counter
			await rateLimiter.resetRateLimit(rateLimitKey);
			console.log(`🧹 Cleared failed attempts for ${ipAddress} after successful login`);

			// Generate JWT token
			const token = jwt.sign(
				{
					userId: userRecord.id,
					email: userRecord.email,
					username: userRecord.username
				},
				JWT_SECRET,
				{
					expiresIn: data.rememberMe ? '30d' : '7d'
				}
			);

			// Update last login
			await db.query(
				'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
				[userRecord.id]
			);

			// Store session in Redis if remember me is checked
			if (data.rememberMe) {
				await redis.setex(
					`session:${userRecord.id}`,
					30 * 24 * 60 * 60, // 30 days
					JSON.stringify({
						userId: userRecord.id,
						email: userRecord.email,
						username: userRecord.username,
						loginTime: new Date().toISOString()
					})
				);
			}

			// Set HTTP-only cookie
			cookies.set('auth_token', token, {
				httpOnly: true,
				secure: true,
				sameSite: 'strict',
				maxAge: data.rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60,
				path: '/'
			});

			// Successful login audit log
			await logAuditEvent(
				userRecord.id, 
				AUDIT_ACTIONS.LOGIN_SUCCESS, 
				'user', 
				userRecord.id, 
				ipAddress, 
				userAgent, 
				null, 
				{ 
					email: userRecord.email, 
					username: userRecord.username,
					remember_me: data.rememberMe,
					session_duration: data.rememberMe ? '30d' : '7d'
				},
				true,
				null
			);

			console.log(`✅ Successful login: ${userRecord.email} (${userRecord.id}) from ${ipAddress}`);

			return {
				success: true,
				user: {
					id: userRecord.id,
					username: userRecord.username,
					email: userRecord.email
				}
			};

		} catch (error) {
			// Increment failed attempts for system errors
			await incrementFailedAttempts(rateLimitKey);
			
			console.error('Login error:', error);
			
			await logAuditEvent(
				null, 
				AUDIT_ACTIONS.LOGIN_ATTEMPT, 
				'system', 
				null, 
				ipAddress, 
				userAgent, 
				null, 
				{ email: data.email, error: error.message }, 
				false, 
				'System error during login'
			);
			
			return fail(500, {
				message: 'An error occurred during login. Please try again.',
				email: data.email
			});
		}
	},

	// Signup action
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

		// Rate limiting: 5 signup attempts per IP per hour
		const rateLimitKey = `signup_attempts:${ipAddress}`;
		const isRateLimited = await rateLimiter.isRateLimited(rateLimitKey, 5, 3600);
		
		if (isRateLimited) {
			await logAuditEvent(
				null, 
				AUDIT_ACTIONS.SIGNUP_ATTEMPT, 
				'rate_limit', 
				null, 
				ipAddress, 
				userAgent, 
				null, 
				{ email: data.email, username: data.username }, 
				false, 
				'Rate limit exceeded'
			);
			
			return fail(429, {
				message: 'Too many signup attempts. Please try again in an hour.',
				username: data.username,
				email: data.email
			});
		}

		// Validate input
		const result = signupSchema.safeParse(data);
		if (!result.success) {
			await logAuditEvent(
				null, 
				AUDIT_ACTIONS.SIGNUP_ATTEMPT, 
				'validation', 
				null, 
				ipAddress, 
				userAgent, 
				null, 
				{ 
					email: data.email, 
					username: data.username, 
					validation_error: result.error.errors[0].message 
				}, 
				false, 
				result.error.errors[0].message
			);
			
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
				const existingUsername = await db.query('SELECT username FROM users WHERE username = $1', [data.username]);
				
				let errorMessage;
				if (existingEmail.rows.length > 0) {
					errorMessage = 'An account with this email already exists';
				} else if (existingUsername.rows.length > 0) {
					errorMessage = 'This username is already taken';
				}
				
				await logAuditEvent(
					null, 
					AUDIT_ACTIONS.SIGNUP_ATTEMPT, 
					'duplicate_check', 
					null, 
					ipAddress, 
					userAgent, 
					null, 
					{ 
						email: data.email, 
						username: data.username, 
						conflict_type: existingEmail.rows.length > 0 ? 'email' : 'username'
					}, 
					false, 
					errorMessage
				);
				
				return fail(400, {
					message: errorMessage,
					username: existingEmail.rows.length > 0 ? data.username : '',
					email: existingUsername.rows.length > 0 ? data.email : ''
				});
			}

			// Hash password
			const passwordHash = await bcrypt.hash(data.password, parseInt(BCRYPT_ROUNDS) || 12);

			// Generate verification token (1 hour expiration)
			const verificationToken = jwt.sign(
				{ email: data.email },
				JWT_SECRET,
				{ expiresIn: '1h' }  // ✅ Reduced to 1 hour
			);

			// Create user
			const newUser = await db.query(
				`INSERT INTO users (username, email, password_hash, verification_token, verification_expires, created_at, updated_at) 
				 VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
				 RETURNING id, username, email, created_at`,
				[data.username, data.email, passwordHash, verificationToken, new Date(Date.now() + 60 * 60 * 1000)]  // ✅ 1 hour
			);

			const user = newUser.rows[0];

			// Store verification token in Redis (expires in 1 hour)
			await redis.setex(
				`verification:${verificationToken}`,
				60 * 60,  // ✅ 1 hour in seconds
				JSON.stringify({
					userId: user.id,
					email: user.email,
					username: user.username
				})
			);

			// Send verification email
			await sendVerificationEmail(user.email, verificationToken);

			// Audit log for successful signup
			await logAuditEvent(
				user.id, 
				AUDIT_ACTIONS.USER_CREATED, 
				'user', 
				user.id, 
				ipAddress, 
				userAgent, 
				null, 
				{ 
					username: user.username, 
					email: user.email, 
					is_verified: false,
					verification_token_expires: '1h'
				},
				true,
				null
			);

			console.log(`✅ New user created: ${user.email} (${user.id})`);

			return {
				success: true,
				message: 'Account created successfully! Please check your email to verify your account.',
				user: {
					id: user.id,
					username: user.username,
					email: user.email
				}
			};

		} catch (error) {
			console.error('Signup error:', error);
			
			await logAuditEvent(
				null, 
				AUDIT_ACTIONS.SIGNUP_ATTEMPT, 
				'system', 
				null, 
				ipAddress, 
				userAgent, 
				null, 
				{ 
					email: data.email, 
					username: data.username, 
					error: error.message 
				}, 
				false, 
				'System error during signup'
			);
			
			return fail(500, {
				message: 'An error occurred during account creation. Please try again.',
				username: data.username,
				email: data.email
			});
		}
	},

	// Forgot password action
	forgot: async ({ request, getClientAddress }) => {
		const ipAddress = getClientAddress();
		const userAgent = request.headers.get('user-agent') || 'unknown';
		
		const formData = await request.formData();
		const data = {
			email: formData.get('email')
		};

		// Rate limiting: 3 password reset attempts per IP per hour
		const rateLimitKey = `password_reset_attempts:${ipAddress}`;
		const isRateLimited = await rateLimiter.isRateLimited(rateLimitKey, 3, 3600);
		
		if (isRateLimited) {
			await logAuditEvent(
				null, 
				AUDIT_ACTIONS.PASSWORD_RESET_ATTEMPT, 
				'rate_limit', 
				null, 
				ipAddress, 
				userAgent, 
				null, 
				{ email: data.email }, 
				false, 
				'Rate limit exceeded'
			);
			
			return fail(429, {
				message: 'Too many password reset attempts. Please try again in an hour.'
			});
		}

		// Validate input
		const result = forgotPasswordSchema.safeParse(data);
		if (!result.success) {
			await logAuditEvent(
				null, 
				AUDIT_ACTIONS.PASSWORD_RESET_ATTEMPT, 
				'validation', 
				null, 
				ipAddress, 
				userAgent, 
				null, 
				{ email: data.email, validation_error: result.error.errors[0].message }, 
				false, 
				result.error.errors[0].message
			);
			
			return fail(400, {
				message: result.error.errors[0].message
			});
		}

		try {
			// Check if user exists
			const user = await db.query(
				'SELECT id, username, email FROM users WHERE email = $1 AND deleted_at IS NULL',
				[data.email]
			);

			// Always return success to prevent email enumeration
			if (user.rows.length === 0) {
				await logAuditEvent(
					null, 
					AUDIT_ACTIONS.PASSWORD_RESET_ATTEMPT, 
					'user_lookup', 
					null, 
					ipAddress, 
					userAgent, 
					null, 
					{ email: data.email, reason: 'user_not_found' }, 
					false, 
					'User not found'
				);
				
				return {
					success: true,
					message: 'If an account with this email exists, you will receive a password reset link.'
				};
			}

			const userRecord = user.rows[0];

			// Generate reset token (1 hour expiration)
			const resetToken = jwt.sign(
				{
					userId: userRecord.id,
					email: userRecord.email,
					type: 'password_reset'
				},
				JWT_SECRET,
				{ expiresIn: '1h' }  // ✅ 1 hour expiration
			);

			// Store reset token in Redis (expires in 1 hour)
			await redis.setex(
				`reset:${resetToken}`,
				60 * 60,  // ✅ 1 hour in seconds
				JSON.stringify({
					userId: userRecord.id,
					email: userRecord.email,
					username: userRecord.username
				})
			);

			// Update user with reset token
			await db.query(
				'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
				[resetToken, new Date(Date.now() + 60 * 60 * 1000), userRecord.id]  // ✅ 1 hour
			);

			// Send password reset email
			await sendPasswordResetEmail(userRecord.email, resetToken);

			// Audit log for password reset request
			await logAuditEvent(
				userRecord.id, 
				AUDIT_ACTIONS.PASSWORD_RESET_ATTEMPT, 
				'user', 
				userRecord.id, 
				ipAddress, 
				userAgent, 
				null, 
				{ email: userRecord.email, reset_token_expires: '1h' },
				true,
				null
			);

			console.log(`🔐 Password reset requested for: ${userRecord.email} (${userRecord.id})`);

			return {
				success: true,
				message: 'If an account with this email exists, you will receive a password reset link.'
			};

		} catch (error) {
			console.error('Forgot password error:', error);
			
			await logAuditEvent(
				null, 
				AUDIT_ACTIONS.PASSWORD_RESET_ATTEMPT, 
				'system', 
				null, 
				ipAddress, 
				userAgent, 
				null, 
				{ email: data.email, error: error.message }, 
				false, 
				'System error during password reset'
			);
			
			return fail(500, {
				message: 'An error occurred while processing your request. Please try again.'
			});
		}
	},

	// Logout action
	logout: async ({ request, cookies, getClientAddress }) => {
		const ipAddress = getClientAddress();
		const userAgent = request.headers.get('user-agent') || 'unknown';
		
		try {
			// Get the current token to invalidate session
			const token = cookies.get('auth_token');
			let userId = null;
			
			if (token) {
				try {
					const decoded = jwt.verify(token, JWT_SECRET);
					userId = decoded.userId;
					
					// Remove session from Redis
					await redis.del(`session:${decoded.userId}`);
					
					// Audit log for logout
					await logAuditEvent(
						userId, 
						'logout_success', 
						'user', 
						userId, 
						ipAddress, 
						userAgent, 
						null, 
						{ email: decoded.email },
						true,
						null
					);
					
				} catch (err) {
					// Token might be invalid, but we still want to clear the cookie
					console.log('Token verification failed during logout:', err.message);
					
					await logAuditEvent(
						null, 
						'logout_attempt', 
						'token', 
						null, 
						ipAddress, 
						userAgent, 
						null, 
						{ error: err.message }, 
						false, 
						'Invalid token during logout'
					);
				}
			}

			// Clear auth cookie
			cookies.delete('auth_token', { path: '/' });

			console.log(`👋 User logged out: ${userId || 'unknown'} from ${ipAddress}`);

			return {
				success: true,
				message: 'Logged out successfully'
			};

		} catch (error) {
			console.error('Logout error:', error);
			
			await logAuditEvent(
				null, 
				'logout_attempt', 
				'system', 
				null, 
				ipAddress, 
				userAgent, 
				null, 
				{ error: error.message }, 
				false, 
				'System error during logout'
			);
			
			return fail(500, {
				message: 'An error occurred during logout'
			});
		}
	}
};