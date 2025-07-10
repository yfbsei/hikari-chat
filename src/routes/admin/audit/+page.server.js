// src/routes/admin/audit/+page.server.js
import { redirect } from '@sveltejs/kit';
import { 
	getRecentSecurityEvents, 
	detectSuspiciousActivity, 
	getAuditSummary 
} from '$lib/server/audit.js';

export async function load({ locals }) {
	// Check if user is authenticated and is admin
	if (!locals.user) {
		throw redirect(302, '/auth/login');
	}
	
	// For now, check if user ID ends with specific pattern or is specific user
	// In production, you'd have a proper admin role system
	const isAdmin = locals.user.is_admin || locals.user.email === 'admin@hikarichat.com';
	
	if (!isAdmin) {
		throw redirect(302, '/dashboard');
	}

	try {
		// Fetch audit data in parallel
		const [securityEvents, suspiciousActivity, auditSummary] = await Promise.all([
			getRecentSecurityEvents(24, 50), // Last 24 hours, max 50 events
			detectSuspiciousActivity(),
			getAuditSummary(7) // Last 7 days
		]);

		return {
			securityEvents,
			suspiciousActivity,
			auditSummary,
			user: locals.user
		};
	} catch (error) {
		console.error('Failed to load audit dashboard data:', error);
		
		// Return empty data if there's an error
		return {
			securityEvents: [],
			suspiciousActivity: {
				suspiciousVerifications: [],
				suspiciousIPs: [],
				rapidSignups: []
			},
			auditSummary: [],
			user: locals.user,
			error: 'Failed to load audit data'
		};
	}
}