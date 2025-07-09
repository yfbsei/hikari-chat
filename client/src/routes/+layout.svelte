<!-- src/routes/+layout.svelte -->
<script>
	import '../app.css';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Get user data from page data
	$: user = $page.data?.user;

	onMount(() => {
		// Add Inter font family to Tailwind config
		document.documentElement.style.setProperty('--font-inter', 'Inter, system-ui, sans-serif');
	});
</script>

<svelte:head>
	<title>
		{#if $page.route.id === '/auth/login'}
			Hikari Chat - Login
		{:else if $page.route.id === '/dashboard'}
			Hikari Chat - Dashboard
		{:else}
			Hikari Chat - AI-Powered Messaging Platform
		{/if}
	</title>
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