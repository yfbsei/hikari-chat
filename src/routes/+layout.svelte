<!-- src/routes/+layout.svelte -->
<script>
	import '../app.css';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Get user data from page data using $derived instead of $:
	const user = $derived($page.data?.user);
	
	// Calculate page title using $derived
	const pageTitle = $derived(() => {
		const routeId = $page.route.id;
		if (routeId === '/auth/login') {
			return 'Hikari Chat - Login';
		} else if (routeId === '/dashboard') {
			return 'Hikari Chat - Dashboard';
		} else {
			return 'Hikari Chat - AI-Powered Messaging Platform';
		}
	});

	onMount(() => {
		// Add Inter font family to Tailwind config
		document.documentElement.style.setProperty('--font-inter', 'Inter, system-ui, sans-serif');
	});
</script>

<svelte:head>
	<title>{pageTitle()}</title>
</svelte:head>

{@render children()}

<style>
	:global(html) {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	:global(body) {
		background: #0f0f0f;
		color: #ffffff;
	}
</style>
