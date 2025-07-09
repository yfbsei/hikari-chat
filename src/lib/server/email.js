// src/lib/server/email.js
// Simple email stub for development - no dependencies required

import { APP_URL } from '$env/static/private';

export async function sendVerificationEmail(email, token) {
	// Get base URL from environment or default to localhost
	const baseUrl = APP_URL || 'http://localhost:5173';
	const verificationUrl = `${baseUrl}/auth/verify?token=${token}`;

	console.log('📧 [DEV] ========================================');
	console.log('📧 [DEV] EMAIL VERIFICATION REQUESTED');
	console.log('📧 [DEV] ========================================');
	console.log('📧 [DEV] To:', email);
	console.log('📧 [DEV] Subject: Verify your Hikari Chat account');
	console.log('📧 [DEV] ----------------------------------------');
	console.log('📧 [DEV] Email Content:');
	console.log('📧 [DEV] ');
	console.log('📧 [DEV] Welcome to Hikari Chat!');
	console.log('📧 [DEV] ');
	console.log('📧 [DEV] Please click the link below to verify your email address:');
	console.log('📧 [DEV] ');
	console.log('📧 [DEV] ✅ VERIFICATION LINK:');
	console.log('📧 [DEV] ' + verificationUrl);
	console.log('📧 [DEV] ');
	console.log('📧 [DEV] This link will expire in 24 hours.');
	console.log('📧 [DEV] ');
	console.log('📧 [DEV] If you did not create this account, please ignore this email.');
	console.log('📧 [DEV] ');
	console.log('📧 [DEV] Best regards,');
	console.log('📧 [DEV] The Hikari Chat Team');
	console.log('📧 [DEV] ========================================');

	return {
		success: true,
		message: 'Email service disabled in development - check console for verification link',
		verificationUrl // Return URL for potential use
	};
}

export async function sendPasswordResetEmail(email, token) {
	const baseUrl = APP_URL || 'http://localhost:5173';
	const resetUrl = `${baseUrl}/auth/reset?token=${token}`;

	console.log('📧 [DEV] ========================================');
	console.log('📧 [DEV] PASSWORD RESET REQUESTED');
	console.log('📧 [DEV] ========================================');
	console.log('📧 [DEV] To:', email);
	console.log('📧 [DEV] Subject: Reset your Hikari Chat password');
	console.log('📧 [DEV] ----------------------------------------');
	console.log('📧 [DEV] Email Content:');
	console.log('📧 [DEV] ');
	console.log('📧 [DEV] Password Reset Request');
	console.log('📧 [DEV] ');
	console.log('📧 [DEV] Click the link below to reset your password:');
	console.log('📧 [DEV] ');
	console.log('📧 [DEV] 🔐 RESET LINK:');
	console.log('📧 [DEV] ' + resetUrl);
	console.log('📧 [DEV] ');
	console.log('📧 [DEV] This link will expire in 1 hour.');
	console.log('📧 [DEV] ');
	console.log('📧 [DEV] If you did not request this reset, please ignore this email.');
	console.log('📧 [DEV] ');
	console.log('📧 [DEV] Best regards,');
	console.log('📧 [DEV] The Hikari Chat Team');
	console.log('📧 [DEV] ========================================');

	return {
		success: true,
		message: 'Email service disabled in development - check console for reset link',
		resetUrl // Return URL for potential use
	};
}

export async function testEmailConfig() {
	return {
		success: false,
		error: 'Email service not configured for development'
	};
}

// For future production email implementation
export async function sendWelcomeEmail(email, username) {
	console.log('📧 [DEV] Welcome email would be sent to:', email);
	console.log('📧 [DEV] Username:', username);

	return {
		success: true,
		message: 'Welcome email logged to console'
	};
}

// Helper function to validate email configuration for production
export function validateEmailConfig() {
	const requiredEnvVars = [
		'SMTP_HOST',
		'SMTP_PORT',
		'SMTP_USER',
		'SMTP_PASSWORD',
		'FROM_EMAIL'
	];

	const missing = requiredEnvVars.filter(env => !process.env[env]);

	if (missing.length > 0) {
		return {
			valid: false,
			missing,
			message: `Missing required email environment variables: ${missing.join(', ')}`
		};
	}

	return {
		valid: true,
		message: 'Email configuration is complete'
	};
}