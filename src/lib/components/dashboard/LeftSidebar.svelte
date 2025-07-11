<!-- src/lib/components/dashboard/LeftSidebar.svelte -->
<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	// Loading states - show skeleton when arrays are empty
	$: isLoadingDirectMessages = directMessages.length === 0;
	$: isLoadingAIHistory = aiMessageHistory.length === 0;

	// Direct Messages data - empty for new users
	let directMessages = [];

	// AI Message History data - empty for new users
	let aiMessageHistory = [];

	// User data from page store
	$: user = $page.data?.user;

	// Status and AI type styling helpers
	const statusConfig = {
		online: { color: 'bg-green-500', icon: 'fas fa-circle', label: 'Online' },
		away: { color: 'bg-yellow-500', icon: 'fas fa-moon', label: 'Away' },
		offline: { color: 'bg-gray-500', icon: 'fas fa-circle', label: 'Offline' }
	};

	const aiTypeConfig = {
		translation: { icon: 'fas fa-language', color: 'from-blue-500 to-blue-600', label: 'Translation' },
		summary: { icon: 'fas fa-compress-alt', color: 'from-green-500 to-green-600', label: 'Summary' },
		payment: { icon: 'fas fa-coins', color: 'from-yellow-500 to-yellow-600', label: 'Payment' },
		analysis: { icon: 'fas fa-chart-line', color: 'from-purple-500 to-purple-600', label: 'Analysis' }
	};

	// Computed values
	$: onlineCount = directMessages.filter(dm => dm.status === 'online').length;
	$: unreadCount = directMessages.filter(dm => dm.unread).length;

	// Event handlers
	function handleDirectMessageClick(message) {
		console.log('Opening direct message with:', message.name);
		// TODO: Navigate to direct message conversation
	}

	function handleAIHistoryClick(historyItem) {
		console.log('Viewing AI interaction:', historyItem.title);
		// TODO: Show AI interaction details or replay
	}

	function handleQuickAction(action) {
		console.log('Quick action:', action);
		// TODO: Implement quick actions
	}

	// Helper functions
	function getStatusConfig(status) {
		return statusConfig[status] || statusConfig.offline;
	}

	function getAITypeConfig(type) {
		return aiTypeConfig[type] || aiTypeConfig.analysis;
	}

	function formatTimestamp(timestamp) {
		// Simple timestamp formatting - could be enhanced with a date library
		return timestamp;
	}

	// Lifecycle - loading states are now reactive based on array contents
	onMount(() => {
		// Loading states automatically update based on data availability
		// If arrays are empty, skeletons will show
		// If arrays have data, actual content will show
	});
</script>

<aside class="bg-gray-900 border-r border-gray-700 flex flex-col overflow-hidden h-full">
	<!-- Workspace Header -->
	<header class="p-6 border-b border-gray-700 flex-shrink-0">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-lg font-semibold text-white">My Workspace</h2>
				<p class="text-xs text-gray-400 mt-1">
					{#if user}
						Welcome back, {user.display_name || user.username}
					{:else}
						Welcome to Hikari Chat
					{/if}
				</p>
			</div>
			<button 
				type="button"
				on:click={() => handleQuickAction('create_channel')}
				class="w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all hover:scale-105 group"
				title="Create new channel"
				aria-label="Create new channel"
			>
				<i class="fas fa-plus text-white group-hover:rotate-90 transition-transform" aria-hidden="true"></i>
			</button>
		</div>
	</header>

	<!-- Quick Actions -->
	<section class="p-4 space-y-3 flex-shrink-0">
		<button 
			type="button"
			on:click={() => handleQuickAction('ask_ai')}
			class="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all hover:scale-[1.02] font-medium group"
		>
			<i class="fas fa-brain text-lg group-hover:scale-110 transition-transform" aria-hidden="true"></i>
			<span>Ask Hikari AI</span>
		</button>
		<button 
			type="button"
			on:click={() => handleQuickAction('send_payment')}
			class="w-full flex items-center gap-3 p-3 bg-gray-800 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:border-blue-500 hover:text-white transition-all font-medium group"
		>
			<i class="fas fa-coins text-lg group-hover:scale-110 transition-transform" aria-hidden="true"></i>
			<span>Send Payment</span>
		</button>
	</section>

	<!-- Scrollable Content -->
	<div class="flex-1 overflow-y-auto p-4 space-y-6">
		<!-- Direct Messages Section -->
		<section class="space-y-3">
			<header class="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider">
				<div class="flex items-center gap-2">
					<i class="fas fa-user-friends text-sm" aria-hidden="true"></i>
					<span>Direct Messages</span>
				</div>
				<button 
					type="button"
					class="hover:text-gray-300 transition-colors"
					aria-label="Toggle direct messages section"
				>
					<i class="fas fa-chevron-down text-xs transition-transform" aria-hidden="true"></i>
				</button>
			</header>
			
			<div class="space-y-1" role="list" aria-label="Direct messages">
				{#if isLoadingDirectMessages}
					<!-- Skeleton Loading for Direct Messages -->
					{#each Array(4) as _, i}
						<div class="flex items-center gap-3 p-3 rounded-lg" role="listitem">
							<div class="relative flex-shrink-0">
								<div class="placeholder w-10 h-10 rounded-full animate-pulse"></div>
								<div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 placeholder rounded-full animate-pulse"></div>
							</div>
							<div class="flex-1 min-w-0">
								<div class="placeholder h-4 w-3/5 mb-1.5 animate-pulse"></div>
								<div class="placeholder h-3 w-4/5 animate-pulse"></div>
							</div>
							<div class="flex-shrink-0">
								<div class="placeholder h-3 w-8 animate-pulse"></div>
							</div>
						</div>
					{/each}
				{:else}
					<!-- Direct Messages -->
					{#each directMessages as dm}
						<button
							type="button"
							on:click={() => handleDirectMessageClick(dm)}
							class="w-full flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-800 transition-all group text-left"
							role="listitem"
							aria-label="Open conversation with {dm.name}"
						>
							<!-- Avatar with Status -->
							<div class="relative flex-shrink-0">
								<div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
									<span class="text-sm font-semibold text-white">
										{dm.name.split(' ').map(n => n[0]).join('')}
									</span>
								</div>
								<div 
									class="absolute -bottom-0.5 -right-0.5 w-3 h-3 {getStatusConfig(dm.status).color} border-2 border-gray-900 rounded-full"
									title="{getStatusConfig(dm.status).label}"
								></div>
							</div>
							
							<!-- Message Info -->
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-0.5">
									<span class="text-sm font-medium text-white truncate">{dm.name}</span>
									{#if dm.unread}
										<div class="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
									{/if}
								</div>
								<div class="text-xs text-gray-400 truncate">
									{dm.lastMessage}
								</div>
							</div>
							
							<!-- Timestamp -->
							<div class="flex-shrink-0 text-xs text-gray-500">
								{formatTimestamp(dm.timestamp)}
							</div>
						</button>
					{/each}
				{/if}
			</div>
		</section>

		<!-- AI Message History Section -->
		<section class="space-y-3">
			<header class="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider">
				<div class="flex items-center gap-2">
					<i class="fas fa-robot text-sm" aria-hidden="true"></i>
					<span>AI Message History</span>
				</div>
				<button 
					type="button"
					class="hover:text-gray-300 transition-colors"
					aria-label="Toggle AI history section"
				>
					<i class="fas fa-chevron-down text-xs transition-transform" aria-hidden="true"></i>
				</button>
			</header>
			
			<div class="space-y-1" role="list" aria-label="AI interaction history">
				{#if isLoadingAIHistory}
					<!-- Skeleton Loading for AI Message History -->
					{#each Array(4) as _, i}
						<div class="flex items-center gap-3 p-3 rounded-lg" role="listitem">
							<div class="flex-1 min-w-0">
								<div class="placeholder h-4 w-4/5 mb-1.5 animate-pulse"></div>
								<div class="placeholder h-3 w-full animate-pulse"></div>
							</div>
							<div class="flex-shrink-0">
								<div class="placeholder h-3 w-8 animate-pulse"></div>
							</div>
						</div>
					{/each}
				{:else}
					<!-- AI Message History -->
					{#each aiMessageHistory as history}
						<button
							type="button"
							on:click={() => handleAIHistoryClick(history)}
							class="w-full flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-800 transition-all group text-left"
							role="listitem"
							aria-label="View {history.title} interaction"
						>
							<div class="flex-1 min-w-0">
								<div class="text-sm font-medium text-white truncate mb-0.5">
									{history.title}
								</div>
								<div class="text-xs text-gray-400 truncate">
									{history.description}
								</div>
							</div>
							<div class="flex-shrink-0 text-xs text-gray-500">
								{formatTimestamp(history.timestamp)}
							</div>
						</button>
					{/each}
				{/if}
			</div>
		</section>
	</div>
</aside>

<style>
	/* Custom scrollbar for the sidebar */
	:global(aside .overflow-y-auto::-webkit-scrollbar) {
		width: 6px;
	}
	
	:global(aside .overflow-y-auto::-webkit-scrollbar-track) {
		background: transparent;
	}
	
	:global(aside .overflow-y-auto::-webkit-scrollbar-thumb) {
		background: rgba(75, 85, 99, 0.5);
		border-radius: 3px;
	}
	
	:global(aside .overflow-y-auto::-webkit-scrollbar-thumb:hover) {
		background: rgba(75, 85, 99, 0.8);
	}

	/* Enhanced hover animations */
	button:hover i {
		transform: scale(1.1);
	}

	/* Focus states for accessibility */
	button:focus-visible {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}

	/* Skeleton placeholder styles for dark theme */
	:global(.placeholder) {
		background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
		background-size: 200% 100%;
		animation: loading 1.5s infinite;
	}

	:global(.placeholder-circle) {
		background: linear-gradient(90deg, #374151 25%, #4b5563 50%, #374151 75%);
		background-size: 200% 100%;
		animation: loading 1.5s infinite;
	}

	@keyframes loading {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>