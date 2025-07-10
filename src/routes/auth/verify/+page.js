// src/routes/auth/verify/+page.js
import { error } from '@sveltejs/kit';

export async function load({ url, fetch }) {
	const token = url.searchParams.get('token');
	
	if (!token) {
		throw error(400, 'Verification token is required');
	}

	try {
		// Call the verification action
		const response = await fetch('/auth/verify?/verify', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			body: new URLSearchParams({ token })
		});

		if (response.ok) {
			return {
				verification: {
					status: 'success',
					message: 'Email verified successfully!'
				}
			};
		} else {
			// Try to get error message from response
			let errorMessage = 'Verification failed';
			try {
				const errorData = await response.text();
				const parsed = JSON.parse(errorData);
				errorMessage = parsed.message || errorMessage;
			} catch {
				// Fallback error message
			}

			return {
				verification: {
					status: 'error',
					message: errorMessage
				}
			};
		}
	} catch (err) {
		console.error('Verification error:', err);
		return {
			verification: {
				status: 'error',
				message: 'Network error during verification'
			}
		};
	}
}