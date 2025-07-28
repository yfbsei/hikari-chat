<!-- src/lib/components/dashboard/LeftSidebar.svelte -->
<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import { page } from '$app/stores';
	import LeftSideServerMenu from './LeftSideServerMenu.svelte';

	// Event dispatcher for parent communication
	const dispatch = createEventDispatcher();

	// Props
	export let user = null;

	// View state management
	let currentView = 'workspace'; // 'workspace' | 'servers'

	// Data stores
	let directMessages = [];
	let aiMessageHistory = [];

	// Derived states
	$: isLoadingDirectMessages = directMessages.length === 0;
	$: isLoadingAIHistory = aiMessageHistory.length === 0;
	$: pageUser = user || $page.data?.user;

	// Configuration objects
	const statusConfig = {
		online: { color: 'bg-green-500', icon: 'fas fa-circle', label: 'Online' },
		away: { color: 'bg-yellow-500', icon: 'fas fa-moon', label: 'Away' },
		offline: { color: 'bg-gray-500', icon: 'fas fa-circle', label: 'Offline' }
	};

	const quickActions = [
		{
			id: 'ask_ai',
			icon: 'fas fa-brain',
			label: 'Ask Hikari AI',
			primary: true
		},
		{
			id: 'send_payment',
			icon: 'fas fa-coins',
			label: 'Send Payment',
			primary: false
		}
	];

	// Navigation functions
	const navigation = {
		showServerMenu: () => {
			currentView = 'servers';
			dispatch('viewChanged', { view: 'servers' });
		},
		
		showWorkspaceMenu: () => {
			currentView = 'workspace';
			dispatch('viewChanged', { view: 'workspace' });
		}
	};

	// Event handlers
	const handlers = {
		quickAction: (action) => {
			switch (action) {
				case 'create_channel':
					navigation.showServerMenu();
					break;
				case 'ask_ai':
					dispatch('aiRequested');
					break;
				case 'send_payment':
					dispatch('paymentRequested');
					break;
				default:
					console.log('Quick action:', action);
			}
		},

		directMessageClick: (message) => {
			dispatch('directMessageSelected', { message });
		},

		aiHistoryClick: (historyItem) => {
			dispatch('aiHistorySelected', { historyItem });
		},

		serverSelect: (server) => {
			dispatch('serverSelected', { server });
		}
	};

	// Utility functions
	const utils = {
		getStatusConfig: (status) => statusConfig[status] || statusConfig.offline,
		
		formatTimestamp: (timestamp) => {
			// Enhanced timestamp formatting
			if (!timestamp) return '';
			const date = new Date(timestamp);
			const now = new Date();
			const diffMs = now - date;
			const diffMins = Math.floor(diffMs / 60000);
			
			if (diffMins < 1) return 'now';
			if (diffMins < 60) return `${diffMins}m`;
			if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
			
			return date.toLocaleTimeString('en-CA', { 
				hour: 'numeric', 
				minute: '2-digit',
				hour12: true 
			});
		},

		getUserDisplayName: () => {
			if (!pageUser) return 'Welcome to Hikari Chat';
			return `Welcome back, ${pageUser.display_name || pageUser.username}`;
		}
	};

	// Component lifecycle
	onMount(() => {
		console.log('LeftSidebar mounted, view:', currentView);
	});
</script>

{#if currentView === 'servers'}
	<LeftSideServerMenu 
		{user}
		onBackToWorkspace={navigation.showWorkspaceMenu}
		onServerSelect={handlers.serverSelect}
	/>
{:else}
	<aside class="bg-gray-900 border-r border-gray-700 flex flex-col overflow-hidden h-full">
		<!-- Workspace Header -->
		<header class="p-6 border-b border-gray-700 flex-shrink-0">
			<div class="flex items-center justify-between">
				<div class="flex-1 min-w-0">
					<h2 class="text-lg font-semibold text-white">My Workspace</h2>
					<p class="text-xs text-gray-400 mt-1">
						{utils.getUserDisplayName()}
					</p>
				</div>
				<button 
					type="button"
					on:click={() => handlers.quickAction('create_channel')}
					class="size-8 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all hover:scale-105 group"
					title="Browse servers"
					aria-label="Browse servers"
				>
					<i class="fas fa-plus text-white group-hover:rotate-90 transition-transform" aria-hidden="true"></i>
				</button>
			</div>
		</header>

		<!-- Quick Actions -->
		<section class="p-4 space-y-3 flex-shrink-0">
			{#each quickActions as action}
				<button 
					type="button"
					on:click={() => handlers.quickAction(action.id)}
					class="w-full flex items-center gap-3 p-3 text-white rounded-lg transition-all hover:scale-[1.02] font-medium group {action.primary ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700' : 'bg-gray-800 border border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-blue-500 hover:text-white'}"
				>
					<i class="{action.icon} text-lg group-hover:scale-110 transition-transform" aria-hidden="true"></i>
					<span>{action.label}</span>
				</button>
			{/each}
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
				
				<div class="space-y-1">
					{#if isLoadingDirectMessages}
						{#each Array(4) as _, i}
							<div class="flex items-center gap-3 p-3 rounded-lg">
								<div class="relative flex-shrink-0">
									<div class="size-10 rounded-full bg-gray-700 animate-pulse"></div>
									<div class="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-gray-700 animate-pulse"></div>
								</div>
								<div class="flex-1 min-w-0 space-y-1.5">
									<div class="h-4 w-3/5 bg-gray-700 animate-pulse rounded"></div>
									<div class="h-3 w-4/5 bg-gray-700 animate-pulse rounded"></div>
								</div>
								<div class="flex-shrink-0">
									<div class="h-3 w-8 bg-gray-700 animate-pulse rounded"></div>
								</div>
							</div>
						{/each}
					{:else if directMessages.length === 0}
						<div class="flex flex-col items-center justify-center py-8 text-center">
							<i class="fas fa-comments text-gray-500 text-2xl mb-2" aria-hidden="true"></i>
							<p class="text-gray-400 text-sm">No direct messages yet</p>
							<p class="text-gray-500 text-xs">Start a conversation with someone!</p>
						</div>
					{:else}
						{#each directMessages as dm}
							<button
								type="button"
								on:click={() => handlers.directMessageClick(dm)}
								class="w-full flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-800 transition-all group text-left"
							>
								<div class="relative flex-shrink-0">
									<div class="size-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
										<span class="text-sm font-semibold text-white">
											{dm.name.split(' ').map(n => n[0]).join('')}
										</span>
									</div>
									<div 
										class="absolute -bottom-0.5 -right-0.5 size-3 {utils.getStatusConfig(dm.status).color} border-2 border-gray-900 rounded-full"
										title="{utils.getStatusConfig(dm.status).label}"
									></div>
								</div>
								
								<div class="flex-1 min-w-0">
									<div class="flex items-center gap-2 mb-0.5">
										<span class="text-sm font-medium text-white truncate">{dm.name}</span>
										{#if dm.unread}
											<div class="size-2 bg-blue-500 rounded-full flex-shrink-0"></div>
										{/if}
									</div>
									<div class="text-xs text-gray-400 truncate">
										{dm.lastMessage}
									</div>
								</div>
								
								<div class="flex-shrink-0 text-xs text-gray-500">
									{utils.formatTimestamp(dm.timestamp)}
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
				
				<div class="space-y-1">
					{#if isLoadingAIHistory}
						{#each Array(4) as _, i}
							<div class="flex items-center gap-3 p-3 rounded-lg">
								<div class="flex-1 min-w-0 space-y-1.5">
									<div class="h-4 w-4/5 bg-gray-700 animate-pulse rounded"></div>
									<div class="h-3 w-full bg-gray-700 animate-pulse rounded"></div>
								</div>
								<div class="flex-shrink-0">
									<div class="h-3 w-8 bg-gray-700 animate-pulse rounded"></div>
								</div>
							</div>
						{/each}
					{:else if aiMessageHistory.length === 0}
						<div class="flex flex-col items-center justify-center py-8 text-center">
							<i class="fas fa-robot text-gray-500 text-2xl mb-2" aria-hidden="true"></i>
							<p class="text-gray-400 text-sm">No AI interactions yet</p>
							<p class="text-gray-500 text-xs">Try asking Hikari AI a question!</p>
						</div>
					{:else}
						{#each aiMessageHistory as history}
							<button
								type="button"
								on:click={() => handlers.aiHistoryClick(history)}
								class="w-full flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-800 hover:bg-purple-500/5 transition-all group text-left"
							>
								<div class="flex-1 min-w-0">
									<div class="text-sm font-medium text-white truncate mb-0.5">{history.title}</div>
									<div class="text-xs text-gray-400 truncate">{history.description}</div>
								</div>
								<div class="flex-shrink-0 text-xs text-gray-500">
									{utils.formatTimestamp(history.timestamp)}
								</div>
							</button>
						{/each}
					{/if}
				</div>
			</section>
		</div>
	</aside>
{/if}

<style>
	/* Enhanced hover animations */
	.group:hover i {
		transform: scale(1.1);
	}

	/* Focus states for accessibility */
	button:focus-visible {
		outline: 2px solid rgb(59 130 246);
		outline-offset: 2px;
	}

	/* Custom scrollbar */
	div::-webkit-scrollbar {
		width: 6px;
	}
	
	div::-webkit-scrollbar-track {
		background: transparent;
	}
	
	div::-webkit-scrollbar-thumb {
		background: rgba(75, 85, 99, 0.5);
		border-radius: 3px;
	}
	
	div::-webkit-scrollbar-thumb:hover {
		background: rgba(75, 85, 99, 0.8);
	}
</style>