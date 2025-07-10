// src/routes/dashboard/+page.server.js
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
    // Check if user is authenticated
    if (!locals.user) {
        throw redirect(302, '/auth/login');
    }

    // Return user data and any dashboard-specific data
    return {
        user: {
            id: locals.user.id,
            username: locals.user.username,
            email: locals.user.email,
            display_name: locals.user.display_name,
            avatar_url: locals.user.avatar_url
        },
        // Additional dashboard data can be added here
        workspace: {
            name: 'My Workspace',
            channels: [
                { id: 1, name: 'General Discussion', unread: 12, active: true },
                { id: 2, name: 'AI Assistance', unread: 3, active: false },
                { id: 3, name: 'Payments & Trading', unread: 0, active: false },
                { id: 4, name: 'Announcements', unread: 1, active: false }
            ],
            members: [
                { id: 1, name: 'Sarah Chen', role: 'Product Manager', status: 'online' },
                { id: 2, name: 'Alex Rodriguez', role: 'Developer', status: 'online' },
                { id: 3, name: 'Maya Patel', role: 'Designer', status: 'away' }
            ]
        }
    };
}