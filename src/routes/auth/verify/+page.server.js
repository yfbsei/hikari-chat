// src/routes/auth/verify/+page.server.js
import { fail, redirect } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db } from '$lib/server/database.js';
import { redis, rateLimiter } from '$lib/server/redis.js';
import { sendVerificationEmail } from '$lib/server/email.js';
import { JWT_SECRET } from '$env/static/private';

// Validation schemas
const verifyTokenSchema = z.object({
	token: z.string().min(1, 'Token is required')
});

const resendVerificationSchema = z.object({
	email: z.string().email('Invalid email address').optional()
});

// Audit logging function
async function logAuditEvent(userId, action, entityType, entityId, ipAddress, userAgent, oldValues = null, newValues = null, success = true, errorMessage = null) {
	try {
		await db.query(`
			INSERT INTO audit_logs (
				user_id, action, entity_type, entity_id, 
				ip_address, user_agent, old_values, new_values,
				success, error_message, created_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
		`, [
			userId, 
			action, 
			entityType, 
			entityId, 
			ipAddress, 
			userAgent, 
			oldValues ? JSON.stringify(oldValues) : null,
			newValues ? JSON.stringify(newValues) : null,
			success,
			errorMessage
		]);
	} catch (error) {
		console.error('Audit logging failed:', error);
		// Don't throw - audit failures shouldn't break the main flow
	}
}

// Get client IP address
function getClientIP(request) {
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) {
		return forwarded.split(',')[0].trim();
	}
	return request.headers.get('x-real-ip') || 
		   request.headers.get('cf-connecting-ip') || 
		   'unknown';
}

export const actions = {
	// Verify email action
	verify: async ({ request, getClientAddress }) => {
		const ipAddress = getClientAddress();
		const userAgent = request.headers.get('user-agent') || 'unknown';
		
		try {
			// Rate limiting: 5 verification attempts per IP per hour
			const rateLimitKey = `verify_attempts:${ipAddress}`;
			const isRateLimited = await rateLimiter.isRateLimited(rateLimitKey, 5, 3600);
			
			if (isRateLimited) {
				await logAuditEvent(
					null, 
					'email_verification_attempt', 
					'rate_limit', 
					null, 
					ipAddress, 
					userAgent, 
					null, 
					null, 
					false, 
					'Rate limit exceeded'
				);
				
				return fail(429, {
					success: false,
					message: 'Too many verification attempts. Please try again in an hour.'
				});
			}

			const formData = await request.formData();
			const data = {
				token: formData.get('token')
			};
			
			const result = verifyTokenSchema.safeParse(data);
			
			if (!result.success) {
				await logAuditEvent(
					null, 
					'email_verification_attempt', 
					'validation', 
					null, 
					ipAddress, 
					userAgent, 
					null, 
					{ error: 'Invalid token format' }, 
					false, 
					'Invalid verification token format'
				);
				
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
				
				await logAuditEvent(
					null, 
					'email_verification_attempt', 
					'jwt_validation', 
					null, 
					ipAddress, 
					userAgent, 
					null, 
					{ error: error.message }, 
					false, 
					'JWT token verification failed'
				);
				
				return fail(400, {
					success: false,
					message: 'Invalid or expired verification token'
				});
			}

			// Check if token exists in Redis
			const redisKey = `verification:${token}`;
			const sessionData = await redis.get(redisKey);
			
			if (!sessionData) {
				await logAuditEvent(
					null, 
					'email_verification_attempt', 
					'token_lookup', 
					null, 
					ipAddress, 
					userAgent, 
					null, 
					{ email: decoded.email }, 
					false, 
					'Token not found in Redis or expired'
				);
				
				return fail(400, {
					success: false,
					message: 'Verification token has expired or does not exist'
				});
			}

			const userData = JSON.parse(sessionData);

			// Get user's current status for audit log
			const currentUser = await db.query(
				'SELECT id, email, is_verified FROM users WHERE id = $1 AND deleted_at IS NULL',
				[userData.userId]
			);

			if (currentUser.rows.length === 0) {
				await logAuditEvent(
					userData.userId, 
					'email_verification_attempt', 
					'user_lookup', 
					userData.userId, 
					ipAddress, 
					userAgent, 
					null, 
					{ email: decoded.email }, 
					false, 
					'User not found in database'
				);
				
				return fail(400, {
					success: false,
					message: 'User not found'
				});
			}

			const user = currentUser.rows[0];

			// Check if already verified
			if (user.is_verified) {
				await logAuditEvent(
					userData.userId, 
					'email_verification_attempt', 
					'user', 
					userData.userId, 
					ipAddress, 
					userAgent, 
					{ is_verified: true }, 
					null, 
					true, 
					'User already verified'
				);
				
				return {
					success: true,
					message: 'Email address is already verified',
					email: decoded.email
				};
			}

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
				await logAuditEvent(
					userData.userId, 
					'email_verification_attempt', 
					'user', 
					userData.userId, 
					ipAddress, 
					userAgent, 
					null, 
					{ email: decoded.email }, 
					false, 
					'Database update failed'
				);
				
				return fail(400, {
					success: false,
					message: 'Failed to verify email address'
				});
			}

			// Remove verification token from Redis
			await redis.del(redisKey);

			// Successful verification audit log
			await logAuditEvent(
				userData.userId, 
				'email_verified', 
				'user', 
				userData.userId, 
				ipAddress, 
				userAgent, 
				{ is_verified: false, verification_token: '[REDACTED]' }, 
				{ is_verified: true, verification_token: null },
				true,
				null
			);

			// Log successful verification
			console.log(`✅ Email verified successfully for user: ${decoded.email} (${userData.userId})`);

			return {
				success: true,
				message: 'Email verified successfully! You can now log in.',
				email: decoded.email
			};

		} catch (error) {
			console.error('Email verification error:', error);
			
			await logAuditEvent(
				null, 
				'email_verification_attempt', 
				'system', 
				null, 
				ipAddress, 
				userAgent, 
				null, 
				{ error: error.message }, 
				false, 
				'System error during verification'
			);
			
			return fail(500, {
				success: false,
				message: 'An error occurred during verification. Please try again.'
			});
		}
	},

	// Resend verification email
	'resend-verification': async ({ request, getClientAddress }) => {
		const ipAddress = getClientAddress();
		const userAgent = request.headers.get('user-agent') || 'unknown';
		
		try {
			// Rate limiting: 3 resend attempts per IP per hour
			const rateLimitKey = `resend_verification:${ipAddress}`;
			const isRateLimited = await rateLimiter.isRateLimited(rateLimitKey, 3, 3600);
			
			if (isRateLimited) {
				await logAuditEvent(
					null, 
					'resend_verification_attempt', 
					'rate_limit', 
					null, 
					ipAddress, 
					userAgent, 
					null, 
					null, 
					false, 
					'Rate limit exceeded'
				);
				
				return fail(429, {
					message: 'Too many resend attempts. Please try again in an hour.'
				});
			}

			const formData = await request.formData();
			const data = {
				email: formData.get('email')
			};

			// Validate input
			const result = resendVerificationSchema.safeParse(data);
			if (!result.success && !data.email) {
				await logAuditEvent(
					null, 
					'resend_verification_attempt', 
					'validation', 
					null, 
					ipAddress, 
					userAgent, 
					null, 
					{ error: 'Invalid email format' }, 
					false, 
					'Invalid email address format'
				);
				
				return fail(400, {
					message: 'Email address is required'
				});
			}

			// Find unverified user by email
			const user = await db.query(
				'SELECT id, username, email, is_verified FROM users WHERE email = $1 AND deleted_at IS NULL',
				[data.email]
			);

			// Always return success to prevent email enumeration, but log the attempt
			if (user.rows.length === 0) {
				await logAuditEvent(
					null, 
					'resend_verification_attempt', 
					'user_lookup', 
					null, 
					ipAddress, 
					userAgent, 
					null, 
					{ email: data.email }, 
					false, 
					'Email not found in database'
				);
				
				return {
					success: true,
					message: 'If an unverified account with this email exists, a new verification email has been sent.'
				};
			}

			const userRecord = user.rows[0];

			// Check if user is already verified
			if (userRecord.is_verified) {
				await logAuditEvent(
					userRecord.id, 
					'resend_verification_attempt', 
					'user', 
					userRecord.id, 
					ipAddress, 
					userAgent, 
					{ is_verified: true }, 
					null, 
					true, 
					'User already verified'
				);
				
				return {
					success: true,
					message: 'This email address is already verified. You can log in now.'
				};
			}

			// Generate new verification token (1 hour expiration)
			const verificationToken = jwt.sign(
				{ email: userRecord.email },
				JWT_SECRET,
				{ expiresIn: '1h' }  // ✅ Reduced to 1 hour
			);

			// Update user with new verification token
			await db.query(
				'UPDATE users SET verification_token = $1, verification_expires = $2 WHERE id = $3',
				[verificationToken, new Date(Date.now() + 60 * 60 * 1000), userRecord.id]  // ✅ 1 hour
			);

			// Store verification token in Redis (expires in 1 hour)
			await redis.setex(
				`verification:${verificationToken}`,
				60 * 60,  // ✅ 1 hour in seconds
				JSON.stringify({
					userId: userRecord.id,
					email: userRecord.email,
					username: userRecord.username
				})
			);

			// Send verification email
			await sendVerificationEmail(userRecord.email, verificationToken);

			// Audit log for successful resend
			await logAuditEvent(
				userRecord.id, 
				'verification_email_resent', 
				'user', 
				userRecord.id, 
				ipAddress, 
				userAgent, 
				null, 
				{ email: userRecord.email },
				true,
				null
			);

			console.log(`📧 Verification email resent to: ${userRecord.email} (${userRecord.id})`);

			return {
				success: true,
				message: 'If an unverified account with this email exists, a new verification email has been sent.'
			};

		} catch (error) {
			console.error('Resend verification error:', error);
			
			await logAuditEvent(
				null, 
				'resend_verification_attempt', 
				'system', 
				null, 
				ipAddress, 
				userAgent, 
				null, 
				{ error: error.message }, 
				false, 
				'System error during resend'
			);
			
			return fail(500, {
				message: 'An error occurred while sending verification email. Please try again.'
			});
		}
	}
};