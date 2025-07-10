// src/lib/server/email.js
// Enhanced email service with better development output

export async function sendVerificationEmail(email, token) {
	console.log('\n🎯 ============================================');
	console.log('📧 EMAIL VERIFICATION REQUIRED');
	console.log('============================================');
	console.log(`👤 To: ${email}`);
	console.log(`🔑 Token: ${token}`);
	console.log(`🌐 Click this link to verify your email:`);
	console.log(`   👉 http://localhost:5173/auth/verify?token=${token}`);
	console.log('============================================\n');
	
	// In a real implementation, you would send an actual email here
	// Example with nodemailer:
	// const transporter = nodemailer.createTransporter({ ... });
	// await transporter.sendMail({
	//   from: process.env.FROM_EMAIL,
	//   to: email,
	//   subject: 'Verify your Hikari Chat account',
	//   html: `
	//     <h1>Welcome to Hikari Chat!</h1>
	//     <p>Please click the link below to verify your email address:</p>
	//     <a href="http://localhost:5173/auth/verify?token=${token}">Verify Email</a>
	//   `
	// });
	
	return { 
		success: true, 
		message: 'Verification email sent! Check the console for the verification link.' 
	};
}

export async function sendPasswordResetEmail(email, token) {
	console.log('\n🔐 ============================================');
	console.log('📧 PASSWORD RESET REQUESTED');
	console.log('============================================');
	console.log(`👤 To: ${email}`);
	console.log(`🔑 Token: ${token}`);
	console.log(`🌐 Click this link to reset your password:`);
	console.log(`   👉 http://localhost:5173/auth/reset?token=${token}`);
	console.log('============================================\n');
	
	return { 
		success: true, 
		message: 'Password reset email sent! Check the console for the reset link.' 
	};
}

export async function testEmailConfig() {
	return { 
		success: false, 
		error: 'Email service not configured for development' 
	};
}