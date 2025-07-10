// src/lib/server/audit.js
// Utility functions for audit logging and querying

import { db } from './database.js';

// Enhanced audit logging function
export async function logAuditEvent(
	userId, 
	action, 
	entityType, 
	entityId, 
	ipAddress, 
	userAgent, 
	oldValues = null, 
	newValues = null, 
	success = true, 
	errorMessage = null
) {
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
		
		// Log to console for development
		const status = success ? '✅' : '❌';
		console.log(`${status} AUDIT: ${action} | User: ${userId || 'anonymous'} | IP: ${ipAddress} | Success: ${success}`);
		
	} catch (error) {
		console.error('❌ Audit logging failed:', error);
		// Don't throw - audit failures shouldn't break the main flow
	}
}

// Get client IP address helper
export function getClientIP(request) {
	const forwarded = request.headers.get('x-forwarded-for');
	if (forwarded) {
		return forwarded.split(',')[0].trim();
	}
	return request.headers.get('x-real-ip') || 
		   request.headers.get('cf-connecting-ip') || 
		   'unknown';
}

// Query audit logs for a specific user
export async function getUserAuditLogs(userId, limit = 50, offset = 0) {
	try {
		const result = await db.query(`
			SELECT 
				id, action, entity_type, entity_id,
				ip_address, old_values, new_values,
				success, error_message, created_at
			FROM audit_logs 
			WHERE user_id = $1 
			ORDER BY created_at DESC 
			LIMIT $2 OFFSET $3
		`, [userId, limit, offset]);
		
		return result.rows;
	} catch (error) {
		console.error('Failed to fetch user audit logs:', error);
		return [];
	}
}

// Query failed authentication attempts by IP
export async function getFailedAttemptsByIP(ipAddress, hours = 24) {
	try {
		const result = await db.query(`
			SELECT 
				action, 
				COUNT(*) as attempt_count,
				MAX(created_at) as latest_attempt
			FROM audit_logs 
			WHERE ip_address = $1 
			  AND success = false 
			  AND created_at > NOW() - INTERVAL '${hours} hours'
			  AND action IN (
			  	'email_verification_attempt', 
			  	'login_attempt', 
			  	'signup_attempt',
			  	'resend_verification_attempt'
			  )
			GROUP BY action
			ORDER BY latest_attempt DESC
		`, [ipAddress]);
		
		return result.rows;
	} catch (error) {
		console.error('Failed to fetch failed attempts:', error);
		return [];
	}
}

// Get audit summary for dashboard
export async function getAuditSummary(days = 7) {
	try {
		const result = await db.query(`
			SELECT 
				DATE_TRUNC('day', created_at) as audit_date,
				action,
				COUNT(*) as total_attempts,
				COUNT(*) FILTER (WHERE success = true) as successful_attempts,
				COUNT(*) FILTER (WHERE success = false) as failed_attempts,
				COUNT(DISTINCT ip_address) as unique_ips
			FROM audit_logs 
			WHERE created_at > NOW() - INTERVAL '${days} days'
			GROUP BY DATE_TRUNC('day', created_at), action
			ORDER BY audit_date DESC, action
		`);
		
		return result.rows;
	} catch (error) {
		console.error('Failed to fetch audit summary:', error);
		return [];
	}
}

// Detect suspicious activity patterns
export async function detectSuspiciousActivity() {
	try {
		// Multiple IPs trying to verify the same email
		const suspiciousVerification = await db.query(`
			SELECT 
				new_values->>'email' as email,
				COUNT(DISTINCT ip_address) as ip_count,
				COUNT(*) as attempt_count,
				array_agg(DISTINCT ip_address) as ip_addresses
			FROM audit_logs 
			WHERE action IN ('email_verification_attempt', 'resend_verification_attempt')
			  AND created_at > NOW() - INTERVAL '24 hours'
			  AND new_values->>'email' IS NOT NULL
			GROUP BY new_values->>'email'
			HAVING COUNT(DISTINCT ip_address) > 3
			ORDER BY ip_count DESC
		`);

		// High volume of failed attempts from single IP
		const suspiciousIPs = await db.query(`
			SELECT 
				ip_address,
				COUNT(*) as failed_attempts,
				COUNT(DISTINCT user_id) as affected_users,
				array_agg(DISTINCT action) as attempted_actions
			FROM audit_logs 
			WHERE success = false 
			  AND created_at > NOW() - INTERVAL '24 hours'
			  AND ip_address != 'unknown'
			GROUP BY ip_address
			HAVING COUNT(*) > 10
			ORDER BY failed_attempts DESC
		`);

		// Rapid signup attempts from same IP
		const rapidSignups = await db.query(`
			SELECT 
				ip_address,
				COUNT(*) as signup_attempts,
				MIN(created_at) as first_attempt,
				MAX(created_at) as last_attempt,
				array_agg(new_values->>'email') as attempted_emails
			FROM audit_logs 
			WHERE action = 'signup_attempt'
			  AND created_at > NOW() - INTERVAL '1 hour'
			GROUP BY ip_address
			HAVING COUNT(*) > 5
			ORDER BY signup_attempts DESC
		`);

		return {
			suspiciousVerifications: suspiciousVerification.rows,
			suspiciousIPs: suspiciousIPs.rows,
			rapidSignups: rapidSignups.rows
		};
	} catch (error) {
		console.error('Failed to detect suspicious activity:', error);
		return {
			suspiciousVerifications: [],
			suspiciousIPs: [],
			rapidSignups: []
		};
	}
}

// Get recent security events
export async function getRecentSecurityEvents(hours = 24, limit = 100) {
	try {
		const result = await db.query(`
			SELECT 
				al.id, al.action, al.ip_address, al.success, 
				al.error_message, al.created_at,
				u.username, u.email,
				al.old_values, al.new_values
			FROM audit_logs al
			LEFT JOIN users u ON al.user_id = u.id
			WHERE al.created_at > NOW() - INTERVAL '${hours} hours'
			  AND (
			    al.success = false 
			    OR al.action IN (
			      'email_verified', 
			      'user_created', 
			      'login_success'
			    )
			  )
			ORDER BY al.created_at DESC
			LIMIT $1
		`, [limit]);
		
		return result.rows;
	} catch (error) {
		console.error('Failed to fetch recent security events:', error);
		return [];
	}
}

// Cleanup old audit logs (run this periodically)
export async function cleanupOldAuditLogs(retentionDays = 365) {
	try {
		const result = await db.query(`
			DELETE FROM audit_logs 
			WHERE created_at < NOW() - INTERVAL '${retentionDays} days'
		`);
		
		console.log(`🧹 Cleaned up ${result.rowCount} old audit log entries`);
		return result.rowCount;
	} catch (error) {
		console.error('Failed to cleanup old audit logs:', error);
		return 0;
	}
}

// Export common audit actions as constants
export const AUDIT_ACTIONS = {
	// Authentication
	EMAIL_VERIFICATION_ATTEMPT: 'email_verification_attempt',
	EMAIL_VERIFIED: 'email_verified',
	RESEND_VERIFICATION_ATTEMPT: 'resend_verification_attempt',
	VERIFICATION_EMAIL_RESENT: 'verification_email_resent',
	
	// User management
	SIGNUP_ATTEMPT: 'signup_attempt',
	USER_CREATED: 'user_created',
	LOGIN_ATTEMPT: 'login_attempt',
	LOGIN_SUCCESS: 'login_success',
	LOGIN_FAILED: 'login_failed',
	
	// Password management
	PASSWORD_RESET_ATTEMPT: 'password_reset_attempt',
	PASSWORD_RESET_SUCCESS: 'password_reset_success',
	
	// Account changes
	USER_UPDATED: 'user_updated',
	USER_DELETED: 'user_deleted'
};

// Rate limiting helper for audit events
export async function checkAuditRateLimit(ipAddress, action, windowHours = 1, maxAttempts = 10) {
	try {
		const result = await db.query(`
			SELECT COUNT(*) as attempt_count
			FROM audit_logs 
			WHERE ip_address = $1 
			  AND action = $2
			  AND created_at > NOW() - INTERVAL '${windowHours} hours'
		`, [ipAddress, action]);
		
		const attemptCount = parseInt(result.rows[0].attempt_count);
		const isBlocked = attemptCount >= maxAttempts;
		
		if (isBlocked) {
			console.log(`🚫 Rate limit hit: ${action} from ${ipAddress} (${attemptCount}/${maxAttempts})`);
		}
		
		return {
			isBlocked,
			attemptCount,
			maxAttempts,
			remaining: Math.max(0, maxAttempts - attemptCount)
		};
	} catch (error) {
		console.error('Failed to check audit rate limit:', error);
		return { isBlocked: false, attemptCount: 0, maxAttempts, remaining: maxAttempts };
	}
}