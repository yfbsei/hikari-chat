// src/routes/auth/login/+page.server.js
import { fail, redirect } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '$lib/server/database.js';
import { redis } from '$lib/server/redis.js';
import { sendPasswordResetEmail } from '$lib/server/email.js';
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

export const actions = {
	// Login action
	login: async ({ request, cookies }) => {
		const formData = await request.formData();
		const data = {
			email: formData.get('email'),
			password: formData.get('password'),
			rememberMe: formData.get('rememberMe') === 'on'
		};

		// Validate input
		const result = loginSchema.safeParse(data);
		if (!result.success) {
			return fail(400, {
				message: result.error.errors[0].message,
				email: data.email
			});
		}

		try {
			// Find user by email
			const user = await db.query(
				'SELECT id, username, email, password_hash, is_verified, created_at FROM users WHERE email = $1 AND deleted_at IS NULL',
				[data.email]
			);

			if (user.rows.length === 0) {
				return fail(400, {
					message: 'Invalid email or password',
					email: data.email
				});
			}

			const userRecord = user.rows[0];

			// Verify password
			const isValidPassword = await bcrypt.compare(data.password, userRecord.password_hash);
			if (!isValidPassword) {
				return fail(400, {
					message: 'Invalid email or password',
					email: data.email
				});
			}

			// Check if user is verified
			if (!userRecord.is_verified) {
				return fail(400, {
					message: 'Please verify your email address before logging in',
					email: data.email
				});
			}

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

			return {
				success: true,
				user: {
					id: userRecord.id,
					username: userRecord.username,
					email: userRecord.email
				}
			};

		} catch (error) {
			console.error('Login error:', error);
			return fail(500, {
				message: 'An error occurred during login. Please try again.',
				email: data.email
			});
		}
	},

	// Signup action
	signup: async ({ request }) => {
		const formData = await request.formData();
		const data = {
			username: formData.get('username'),
			email: formData.get('email'),
			password: formData.get('password'),
			confirmPassword: formData.get('confirmPassword'),
			agreeTerms: formData.get('agreeTerms') === 'on'
		};

		// Validate input
		const result = signupSchema.safeParse(data);
		if (!result.success) {
			return fail(400, {
				message: result.error.errors[0].message,
				username: data.username,
				email: data.email
			});
		}

		try {
			// Check if user already exists
			const existingUser = await db.query(
				'SELECT id FROM users WHERE email = $1 OR username = $2',
				[data.email, data.username]
			);

			if (existingUser.rows.length > 0) {
				const existing = existingUser.rows[0];
				const existingEmail = await db.query('SELECT email FROM users WHERE email = $1', [data.email]);
				const existingUsername = await db.query('SELECT username FROM users WHERE username = $1', [data.username]);
				
				if (existingEmail.rows.length > 0) {
					return fail(400, {
						message: 'An account with this email already exists',
						username: data.username
					});
				}
				
				if (existingUsername.rows.length > 0) {
					return fail(400, {
						message: 'This username is already taken',
						email: data.email
					});
				}
			}

			// Hash password
			const passwordHash = await bcrypt.hash(data.password, parseInt(BCRYPT_ROUNDS) || 12);

			// Generate verification token
			const verificationToken = jwt.sign(
				{ email: data.email },
				JWT_SECRET,
				{ expiresIn: '24h' }
			);

			// Create user
			const newUser = await db.query(
				`INSERT INTO users (username, email, password_hash, verification_token, created_at, updated_at) 
				 VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) 
				 RETURNING id, username, email, created_at`,
				[data.username, data.email, passwordHash, verificationToken]
			);

			const user = newUser.rows[0];

			// Store verification token in Redis (expires in 24 hours)
			await redis.setex(
				`verification:${verificationToken}`,
				24 * 60 * 60,
				JSON.stringify({
					userId: user.id,
					email: user.email,
					username: user.username
				})
			);

			// TODO: Send verification email
			await sendVerificationEmail(user.email, verificationToken);

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
			return fail(500, {
				message: 'An error occurred during account creation. Please try again.',
				username: data.username,
				email: data.email
			});
		}
	},

	// Forgot password action
	forgot: async ({ request }) => {
		const formData = await request.formData();
		const data = {
			email: formData.get('email')
		};

		// Validate input
		const result = forgotPasswordSchema.safeParse(data);
		if (!result.success) {
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
				return {
					success: true,
					message: 'If an account with this email exists, you will receive a password reset link.'
				};
			}

			const userRecord = user.rows[0];

			// Generate reset token
			const resetToken = jwt.sign(
				{
					userId: userRecord.id,
					email: userRecord.email,
					type: 'password_reset'
				},
				JWT_SECRET,
				{ expiresIn: '1h' }
			);

			// Store reset token in Redis (expires in 1 hour)
			await redis.setex(
				`reset:${resetToken}`,
				60 * 60,
				JSON.stringify({
					userId: userRecord.id,
					email: userRecord.email,
					username: userRecord.username
				})
			);

			// Update user with reset token
			await db.query(
				'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
				[resetToken, new Date(Date.now() + 60 * 60 * 1000), userRecord.id]
			);

			// TODO: Send password reset email
			// await sendPasswordResetEmail(userRecord.email, resetToken);

			return {
				success: true,
				message: 'If an account with this email exists, you will receive a password reset link.'
			};

		} catch (error) {
			console.error('Forgot password error:', error);
			return fail(500, {
				message: 'An error occurred while processing your request. Please try again.'
			});
		}
	},

	// Logout action
	logout: async ({ cookies }) => {
		try {
			// Get the current token to invalidate session
			const token = cookies.get('auth_token');
			
			if (token) {
				try {
					const decoded = jwt.verify(token, JWT_SECRET);
					// Remove session from Redis
					await redis.del(`session:${decoded.userId}`);
				} catch (err) {
					// Token might be invalid, but we still want to clear the cookie
					console.log('Token verification failed during logout:', err.message);
				}
			}

			// Clear auth cookie
			cookies.delete('auth_token', { path: '/' });

			return {
				success: true,
				message: 'Logged out successfully'
			};

		} catch (error) {
			console.error('Logout error:', error);
			return fail(500, {
				message: 'An error occurred during logout'
			});
		}
	}
};