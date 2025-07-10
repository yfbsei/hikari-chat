// src/routes/auth/verify/+page.server.js
import { fail, redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '$lib/server/database.js';
import { redis } from '$lib/server/redis.js';
import { sendVerificationEmail } from '$lib/server/email.js';
import { JWT_SECRET } from '$env/static/private';

// Validation schemas
const verifyTokenSchema = z.object({
	token: z.string().min(1, 'Token is required')
});

const resendVerificationSchema = z.object({
	email: z.string().email('Invalid email address').optional()
});

export const actions = {
	// Verify email action
	verify: async ({ request }) => {
		try {
			const formData = await request.formData();
			const data = {
				token: formData.get('token')
			};
			
			const result = verifyTokenSchema.safeParse(data);
			
			if (!result.success) {
				return fail(400, {
					success: false,
					message: 'Invalid verification token'
				});
			}

			const { token } = result.data;

			// Verify the JWT token
			let decoded;
			try {
				decoded = jwt.verify(token, JWT_SECRET);
			} catch (error) {
				console.error('Token verification failed:', error.message);
				return fail(400, {
					success: false,
					message: 'Invalid or expired verification token'
				});
			}

			// Check if token exists in Redis
			const redisKey = `verification:${token}`;
			const sessionData = await redis.get(redisKey);
			
			if (!sessionData) {
				return fail(400, {
					success: false,
					message: 'Verification token has expired or does not exist'
				});
			}

			const userData = JSON.parse(sessionData);

			// Update user as verified in database
			const updateResult = await db.query(
				`UPDATE users 
				 SET is_verified = true, 
				     verification_token = NULL,
				     verification_expires = NULL,
				     updated_at = CURRENT_TIMESTAMP 
				 WHERE id = $1 AND email = $2 AND deleted_at IS NULL`,
				[userData.userId, decoded.email]
			);

			if (updateResult.rowCount === 0) {
				return fail(400, {
					success: false,
					message: 'User not found or already verified'
				});
			}

			// Remove verification token from Redis
			await redis.del(redisKey);

			// Log successful verification
			console.log(`Email verified successfully for user: ${decoded.email}`);

			return {
				success: true,
				message: 'Email verified successfully! You can now log in.',
				email: decoded.email
			};

		} catch (error) {
			console.error('Email verification error:', error);
			return fail(500, {
				success: false,
				message: 'An error occurred during verification. Please try again.'
			});
		}
	},

	// Resend verification email
	'resend-verification': async ({ request }) => {
		const formData = await request.formData();
		const data = {
			email: formData.get('email')
		};

		// Validate input
		const result = resendVerificationSchema.safeParse(data);
		if (!result.success && !data.email) {
			return fail(400, {
				message: 'Email address is required'
			});
		}

		try {
			// Find unverified user by email
			const user = await db.query(
				'SELECT id, username, email, is_verified FROM users WHERE email = $1 AND deleted_at IS NULL',
				[data.email]
			);

			// Always return success to prevent email enumeration
			if (user.rows.length === 0) {
				return {
					success: true,
					message: 'If an unverified account with this email exists, a new verification email has been sent.'
				};
			}

			const userRecord = user.rows[0];

			// Check if user is already verified
			if (userRecord.is_verified) {
				return {
					success: true,
					message: 'This email address is already verified. You can log in now.'
				};
			}

			// Generate new verification token
			const verificationToken = jwt.sign(
				{ email: userRecord.email },
				JWT_SECRET,
				{ expiresIn: '24h' }
			);

			// Update user with new verification token
			await db.query(
				'UPDATE users SET verification_token = $1, verification_expires = $2 WHERE id = $3',
				[verificationToken, new Date(Date.now() + 24 * 60 * 60 * 1000), userRecord.id]
			);

			// Store verification token in Redis (expires in 24 hours)
			await redis.setex(
				`verification:${verificationToken}`,
				24 * 60 * 60,
				JSON.stringify({
					userId: userRecord.id,
					email: userRecord.email,
					username: userRecord.username
				})
			);

			// Send verification email
			await sendVerificationEmail(userRecord.email, verificationToken);

			return {
				success: true,
				message: 'If an unverified account with this email exists, a new verification email has been sent.'
			};

		} catch (error) {
			console.error('Resend verification error:', error);
			return fail(500, {
				message: 'An error occurred while sending verification email. Please try again.'
			});
		}
	}
};