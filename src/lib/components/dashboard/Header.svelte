<!-- src/lib/components/dashboard/Header.svelte -->
<script>
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import { enhance } from '$app/forms';
	
	export let rightSidebarVisible;
	
	let userDropdownOpen = false;
	let userStatus = 'online'; // online, away, busy, offline
	
	// Get user data from page store
	$: user = $page.data?.user;
	
	function toggleRightSidebar() {
		rightSidebarVisible.update(visible => !visible);
	}
	
	function toggleUserDropdown() {
		userDropdownOpen = !userDropdownOpen;
	}
	
	function closeUserDropdown() {
		userDropdownOpen = false;
	}
	
	function handleStatusChange(newStatus) {
		userStatus = newStatus;
		closeUserDropdown();
		// TODO: Update user status on server
		console.log('Status changed to:', newStatus);
	}
	
	function goToAccountSettings() {
		closeUserDropdown();
		goto('/settings');
	}
	
	// Handle logout using proper SvelteKit action format
	async function handleSignOut() {
		try {
			closeUserDropdown();
			
			// Use the correct SvelteKit action format
			const response = await fetch('/auth/login?/logout', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
				body: ''
			});
			
			console.log('Logout response:', response.status);
			
			// Always redirect to login after logout attempt
			window.location.replace('/auth/login');
			
		} catch (error) {
			console.error('Logout error:', error);
			// Force redirect even on error
			window.location.replace('/auth/login');
		}
	}
	
	function getStatusColor(status) {
		switch(status) {
			case 'online': return 'bg-green-500';
			case 'away': return 'bg-yellow-500';
			case 'busy': return 'bg-red-500';
			case 'offline': return 'bg-gray-500';
			default: return 'bg-green-500';
		}
	}
	
	function getStatusIcon(status) {
		switch(status) {
			case 'online': return 'fas fa-circle';
			case 'away': return 'fas fa-moon';
			case 'busy': return 'fas fa-minus-circle';
			case 'offline': return 'fas fa-circle';
			default: return 'fas fa-circle';
		}
	}
	
	function getStatusLabel(status) {
		switch(status) {
			case 'online': return 'Online';
			case 'away': return 'Away';
			case 'busy': return 'Busy';
			case 'offline': return 'Offline';
			default: return 'Online';
		}
	}
	
	// Close dropdown when clicking outside
	function handleClickOutside(event) {
		if (userDropdownOpen && !event.target.closest('.user-dropdown-container')) {
			closeUserDropdown();
		}
	}
</script>

<svelte:window on:click={handleClickOutside} />

<header class="h-16 bg-gray-900 border-b border-gray-700 flex items-center px-6 z-50 relative">
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
		
		<!-- AI Status and Wallet Balance -->
		<div class="hidden md:flex items-center gap-4">
			<!-- AI Status Indicator -->
			<div class="flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 px-3 py-2 rounded-lg">
				<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
				<span class="text-blue-400 text-sm font-medium">AI Active</span>
			</div>

			<!-- Wallet Balance -->
			<div class="flex items-center gap-2 bg-gray-800 border border-gray-600 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-700 hover:border-blue-500 transition-all">
				<i class="fas fa-coins text-yellow-500"></i>
				<span class="font-semibold text-white">1,247 HC</span>
			</div>
		</div>
	</div>

	<!-- Center Search -->
	<div class="flex-2 max-w-lg mx-4">
		<div class="relative">
			<i class="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500"></i>
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
		<!-- Mobile AI Status and Wallet (show on small screens) -->
		<div class="flex md:hidden items-center gap-2">
			<!-- AI Status Indicator (Mobile) -->
			<div class="flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 px-2 py-1 rounded-lg">
				<div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
				<span class="text-blue-400 text-xs font-medium">AI</span>
			</div>

			<!-- Wallet Balance (Mobile) -->
			<div class="flex items-center gap-1 bg-gray-800 border border-gray-600 px-2 py-1 rounded-lg cursor-pointer hover:bg-gray-700 hover:border-blue-500 transition-all">
				<i class="fas fa-coins text-yellow-500 text-xs"></i>
				<span class="font-semibold text-white text-xs">1,247</span>
			</div>
		</div>

		<!-- Notifications -->
		<div class="relative">
			<button class="w-10 h-10 bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-700 hover:border-blue-500 transition-all">
				<i class="fas fa-bell text-gray-400"></i>
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
				<i class="fas fa-eye-slash text-gray-400"></i>
			{:else}
				<i class="fas fa-eye text-gray-400"></i>
			{/if}
		</button>

		<!-- User Menu -->
		<div class="relative user-dropdown-container">
			<button 
				on:click={toggleUserDropdown}
				class="flex items-center gap-2 cursor-pointer hover:bg-gray-800 p-2 rounded-lg transition-all"
			>
				<div class="relative">
					<div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
						<span class="text-sm font-semibold text-white">
							{user?.username ? user.username.slice(0, 2).toUpperCase() : 'MA'}
						</span>
					</div>
					<div class="absolute -bottom-1 -right-1 w-3 h-3 {getStatusColor(userStatus)} border-2 border-gray-900 rounded-full"></div>
				</div>
				<i class="fas fa-chevron-down text-gray-400 hidden sm:block transform transition-transform {userDropdownOpen ? 'rotate-180' : ''}"></i>
			</button>

			<!-- User Dropdown Menu -->
			{#if userDropdownOpen}
				<div class="absolute right-0 top-full mt-2 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50">
					<!-- User Info Header -->
					<div class="p-4 border-b border-gray-700">
						<div class="flex items-center gap-3">
							<div class="relative">
								<div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
									<span class="text-lg font-semibold text-white">
										{user?.username ? user.username.slice(0, 2).toUpperCase() : 'MA'}
									</span>
								</div>
								<div class="absolute -bottom-1 -right-1 w-4 h-4 {getStatusColor(userStatus)} border-2 border-gray-900 rounded-full"></div>
							</div>
							<div class="flex-1 min-w-0">
								<div class="text-white font-semibold truncate">
									{user?.display_name || user?.username || 'Muhammad Ahmad'}
								</div>
								<div class="text-gray-400 text-sm truncate">
									{user?.email || 'm.a415150@gmail.com'}
								</div>
							</div>
						</div>
					</div>

					<!-- Menu Items -->
					<div class="py-2">
						<!-- Status Section -->
						<div class="px-4 py-2">
							<div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</div>
							<div class="space-y-1">
								{#each ['online', 'away', 'busy', 'offline'] as status}
									<button
										on:click={() => handleStatusChange(status)}
										class="w-full flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white transition-all rounded-lg {userStatus === status ? 'bg-blue-500/20 text-blue-400' : ''}"
									>
										<i class="{getStatusIcon(status)} text-xs {getStatusColor(status).replace('bg-', 'text-')}"></i>
										<span class="text-sm font-medium">{getStatusLabel(status)}</span>
									</button>
								{/each}
							</div>
						</div>

						<!-- Divider -->
						<div class="border-t border-gray-700 my-2"></div>

						<!-- Account Settings -->
						<button
							on:click={goToAccountSettings}
							class="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-all"
						>
							<i class="fas fa-cog text-gray-500"></i>
							<span class="text-sm font-medium">Account Settings</span>
						</button>

						<!-- Divider -->
						<div class="border-t border-gray-700 my-2"></div>

						<!-- Sign Out -->
						<button
							type="button"
							on:click={handleSignOut}
							class="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-red-500/10 hover:text-red-400 transition-all"
						>
							<i class="fas fa-sign-out-alt text-gray-500"></i>
							<span class="text-sm font-medium">Sign Out</span>
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</header>

<!-- Font Awesome for icons -->
<svelte:head>
	<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
</svelte:head>