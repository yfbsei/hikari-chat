<!-- src/routes/dashboard/+layout.svelte -->
<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { currentUser } from '$lib/stores/dashboard.js';
	
	export let data;
	
	let { children } = $props();
	
	// Set user data when component mounts
	onMount(() => {
		if (data.user) {
			currentUser.set(data.user);
		}
	});

	// Calculate page title
	const pageTitle = $derived(() => {
		const routeId = $page.route.id;
		if (routeId?.includes('dashboard')) {
			return 'Hikari Chat - Dashboard';
		}
		return 'Hikari Chat';
	});
</script>

<svelte:head>
	<title>{pageTitle()}</title>
	<meta name="description" content="Hikari Chat - AI-powered messaging platform with integrated payments" />
	<meta name="theme-color" content="#1e88e5" />
	
	<!-- Font Awesome -->
	<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
	<!-- Inter Font -->
	<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
</svelte:head>

<!-- Render child components -->
{@render children()}

<style>
	:global(html) {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	:global(body) {
		background: #1a1a1a;
		color: #ffffff;
	}
	
	/* Custom scrollbar styling */
	:global(::-webkit-scrollbar) {
		width: 6px;
	}

	:global(::-webkit-scrollbar-track) {
		background: #2a2a2a;
	}

	:global(::-webkit-scrollbar-thumb) {
		background: #4a5966;
		border-radius: 3px;
	}

	:global(::-webkit-scrollbar-thumb:hover) {
		background: #5a6976;
	}
	
	/* Focus states for accessibility */
	:global(button:focus-visible),
	:global(input:focus-visible),
	:global(textarea:focus-visible) {
		outline: 2px solid #1e88e5;
		outline-offset: 2px;
	}
</style>