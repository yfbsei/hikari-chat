// src/lib/server/email.js
// Simple email stub for development - no dependencies required

export async function sendVerificationEmail(email, token) {
	console.log('📧 [DEV] Verification email would be sent to:', email);
	console.log('📧 [DEV] Verification token:', token);
	console.log('📧 [DEV] Verification URL: http://localhost:5173/auth/verify?token=' + token);
	
	return { 
		success: true, 
		message: 'Email service disabled in development - check console for verification link' 
	};
}

export async function sendPasswordResetEmail(email, token) {
	console.log('📧 [DEV] Password reset email would be sent to:', email);
	console.log('📧 [DEV] Reset token:', token);
	console.log('📧 [DEV] Reset URL: http://localhost:5173/auth/reset?token=' + token);
	
	return { 
		success: true, 
		message: 'Email service disabled in development - check console for reset link' 
	};
}

export async function testEmailConfig() {
	return { 
		success: false, 
		error: 'Email service not configured for development' 
	};
}
