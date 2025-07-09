// src/routes/+page.server.js
import { redirect } from '@sveltejs/kit';

export async function load({ locals, url }) {
	// If user is already authenticated, redirect to dashboard
	if (locals.user) {
		throw redirect(302, '/dashboard');
	}
	
	// If user is not authenticated, redirect to login
	throw redirect(302, '/auth/login');
}