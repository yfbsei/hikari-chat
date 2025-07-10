<!-- src/routes/dashboard/+page.svelte -->
<script>
	import Header from '$lib/components/dashboard/Header.svelte';
	import LeftSidebar from '$lib/components/dashboard/LeftSidebar.svelte';
	import MainContent from '$lib/components/dashboard/MainContent.svelte';
	import RightSidebar from '$lib/components/dashboard/RightSidebar.svelte';
	import { writable } from 'svelte/store';

	// Reactive state for right sidebar visibility
	let rightSidebarVisible = writable(true);
	
	// Grid template columns based on sidebar visibility
	$: gridCols = $rightSidebarVisible 
		? 'grid-cols-[280px_1fr_320px]' 
		: 'grid-cols-[280px_1fr]';
</script>

<svelte:head>
	<title>Hikari Chat - Dashboard</title>
</svelte:head>

<!-- Main App Container -->
<div class="h-screen flex flex-col bg-gray-900 text-white font-inter">
	<!-- Header Component -->
	<Header {rightSidebarVisible} />
	
	<!-- Main Layout Grid -->
	<main class="flex-1 grid {gridCols} h-[calc(100vh-4rem)] overflow-hidden transition-all duration-300">
		<!-- Left Sidebar -->
		<LeftSidebar />
		
		<!-- Main Content Area -->
		<MainContent />
		
		<!-- Right Sidebar (conditionally rendered) -->
		{#if $rightSidebarVisible}
			<RightSidebar />
		{/if}
	</main>
</div>

<style>
	:global(html) {
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}
	
	:global(body) {
		background: #1a1a1a;
		color: #ffffff;
	}
</style>