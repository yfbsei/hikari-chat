<!-- src/lib/components/dashboard/Header.svelte -->
<script>
	import { Search, Bell, ChevronDown, EyeOff, Eye } from 'lucide-react';
	
	export let rightSidebarVisible;
	
	function toggleRightSidebar() {
		rightSidebarVisible.update(visible => !visible);
	}
</script>

<header class="h-16 bg-gray-900 border-b border-gray-700 flex items-center px-6 z-50">
	<!-- Left Section -->
	<div class="flex items-center gap-6 flex-1">
		<!-- Logo -->
		<div class="flex items-center">
			<img 
				src="https://i.ibb.co/k2LzS8NR/logo3.png" 
				alt="Hikari Chat" 
				class="h-8 object-contain"
			/>
		</div>
		
		<!-- Breadcrumb -->
		<div class="hidden md:flex items-center gap-2 text-gray-400 text-sm">
			<span>Workspace</span>
			<ChevronDown class="w-4 h-4" />
			<span class="text-gray-300 font-medium">General Discussion</span>
		</div>
	</div>

	<!-- Center Search -->
	<div class="flex-2 max-w-lg mx-4">
		<div class="relative">
			<Search class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
			<input
				type="text"
				placeholder="Search messages, files, or ask AI..."
				class="w-full bg-gray-800 border border-gray-600 rounded-xl pl-10 pr-16 py-3 text-white text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder-gray-500 transition-all"
			/>
			<div class="absolute right-3 top-1/2 transform -translate-y-1/2 bg-gray-700 text-gray-400 px-2 py-1 rounded text-xs font-medium">
				⌘K
			</div>
		</div>
	</div>

	<!-- Right Section -->
	<div class="flex items-center gap-4 flex-1 justify-end">
		<!-- AI Status Indicator -->
		<div class="flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 px-3 py-2 rounded-lg">
			<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
			<span class="text-blue-400 text-sm font-medium hidden sm:block">AI Active</span>
		</div>

		<!-- Wallet Balance -->
		<div class="flex items-center gap-2 bg-gray-800 border border-gray-600 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-700 hover:border-blue-500 transition-all">
			<i class="fas fa-coins text-yellow-500"></i>
			<span class="font-semibold text-white hidden sm:block">1,247 HC</span>
		</div>

		<!-- Notifications -->
		<div class="relative">
			<button class="w-10 h-10 bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-700 hover:border-blue-500 transition-all">
				<Bell class="w-4 h-4 text-gray-400" />
			</button>
			<div class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
				3
			</div>
		</div>

		<!-- Right Sidebar Toggle -->
		<button 
			on:click={toggleRightSidebar}
			class="w-10 h-10 bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-700 hover:border-blue-500 transition-all"
		>
			{#if $rightSidebarVisible}
				<EyeOff class="w-4 h-4 text-gray-400" />
			{:else}
				<Eye class="w-4 h-4 text-gray-400" />
			{/if}
		</button>

		<!-- User Menu -->
		<div class="flex items-center gap-2 cursor-pointer hover:bg-gray-800 p-2 rounded-lg transition-all">
			<div class="relative">
				<div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
					<span class="text-sm font-semibold text-white">MA</span>
				</div>
				<div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-gray-900 rounded-full"></div>
			</div>
			<ChevronDown class="w-4 h-4 text-gray-400 hidden sm:block" />
		</div>
	</div>
</header>

<!-- Font Awesome for icons -->
<svelte:head>
	<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
</svelte:head>