<!-- src/lib/components/dashboard/LeftSideServerMenu.svelte -->
<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import { page } from '$app/stores';
	import { writable } from 'svelte/store';

	// Component API
	export let user = null;
	export let onBackToWorkspace = () => {};
	export let onServerSelect = () => {};

	// Event dispatcher
	const dispatch = createEventDispatcher();

	// Reactive user data
	$: pageUser = user || $page.data?.user;

	// Component stores
	const state = writable({
		activeTab: 'my-servers',
		isCreatingServer: false,
		newServerForm: {
			name: '',
			description: ''
		}
	});

	// Data stores
	const serversStore = writable([
		{
			id: 'home',
			name: 'My Workspace',
			type: 'workspace',
			icon: null,
			unread: 0,
			isActive: true,
			color: 'from-blue-500 to-blue-600'
		}
	]);

	const publicServersStore = writable([
		{
			id: 'pub_1',
			name: 'Hikari Official',
			description: 'Official Hikari Chat community',
			icon: 'fas fa-star',
			members: 15420,
			color: 'from-blue-500 to-blue-600',
			featured: true
		},
		{
			id: 'pub_2',
			name: 'Canadian Business',
			description: 'Networking for Canadian entrepreneurs',
			icon: 'fas fa-maple-leaf',
			members: 8932,
			color: 'from-red-500 to-red-600',
			featured: true
		},
		{
			id: 'pub_3',
			name: 'Crypto Canada',
			description: 'Canadian cryptocurrency discussion',
			icon: 'fas fa-bitcoin-sign',
			members: 12456,
			color: 'from-orange-500 to-orange-600',
			featured: false
		},
		{
			id: 'pub_4',
			name: 'AI Developers',
			description: 'Machine learning and AI development',
			icon: 'fas fa-robot',
			members: 9876,
			color: 'from-purple-500 to-purple-600',
			featured: false
		}
	]);

	// Derived values
	$: servers = $serversStore;
	$: publicServers = $publicServersStore;
	$: currentState = $state;
	$: featuredServers = publicServers.filter(s => s.featured);
	$: regularPublicServers = publicServers.filter(s => !s.featured);
	$: realServers = servers.filter(s => s.type !== 'workspace');
	$: hasRealServers = realServers.length > 0;

	// Action creators
	const actions = {
		// Tab management
		switchTab: (tab) => {
			state.update(s => ({ ...s, activeTab: tab }));
			dispatch('tabChanged', { tab });
		},

		// Server management
		selectServer: (server) => {
			serversStore.update(servers => 
				servers.map(s => ({ ...s, isActive: s.id === server.id }))
			);
			
			if (server.type === 'workspace') {
				onBackToWorkspace();
				dispatch('backToWorkspace');
			} else {
				onServerSelect(server);
				dispatch('serverSelected', { server });
			}
		},

		joinServer: (server) => {
			console.log('Joining server:', server.name);
			dispatch('serverJoinRequested', { server });
		},

		// Server creation
		startServerCreation: () => {
			state.update(s => ({
				...s,
				isCreatingServer: true,
				newServerForm: { name: '', description: '' }
			}));
		},

		cancelServerCreation: () => {
			state.update(s => ({
				...s,
				isCreatingServer: false,
				newServerForm: { name: '', description: '' }
			}));
		},

		submitServerCreation: () => {
			const form = currentState.newServerForm;
			if (!form.name.trim()) return;
			
			const newServer = {
				id: `server_${Date.now()}`,
				name: form.name.trim(),
				type: 'server',
				icon: 'fas fa-users',
				unread: 0,
				isActive: false,
				color: 'from-blue-500 to-blue-600'
			};
			
			serversStore.update(servers => [...servers, newServer]);
			actions.cancelServerCreation();
			dispatch('serverCreated', { server: newServer });
		},

		// Form handling
		handleKeyPress: (event) => {
			if (event.key === 'Enter' && !event.shiftKey) {
				event.preventDefault();
				actions.submitServerCreation();
			} else if (event.key === 'Escape') {
				actions.cancelServerCreation();
			}
		},

		// Update form
		updateForm: (field, value) => {
			state.update(s => ({
				...s,
				newServerForm: { ...s.newServerForm, [field]: value }
			}));
		}
	};

	// Utility functions
	const utils = {
		formatMemberCount: (count) => {
			if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
			if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
			return count.toString();
		},

		getUserInitials: () => {
			if (!pageUser) return 'U';
			const name = pageUser.display_name || pageUser.username || 'User';
			return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
		},

		getUnreadBadge: (count) => {
			if (count === 0) return '';
			return count > 99 ? '99+' : count.toString();
		}
	};

	// Component lifecycle
	onMount(() => {
		console.log('ServerMenu mounted with user:', pageUser);
	});
</script>

<aside class="bg-gray-900 border-r border-gray-700 flex flex-col overflow-hidden h-full">
	<!-- Header -->
	<header class="p-6 border-b border-gray-700 flex-shrink-0">
		<div class="flex items-center gap-3">
			<button 
				type="button"
				on:click={() => actions.selectServer(servers.find(s => s.type === 'workspace'))}
				class="size-8 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg flex items-center justify-center transition-all group"
				title="Back to workspace"
				aria-label="Back to workspace"
			>
				<i class="fas fa-arrow-left text-gray-400 group-hover:text-white text-sm transition-colors" aria-hidden="true"></i>
			</button>
			<div class="flex-1">
				<h2 class="text-lg font-semibold text-white">Servers</h2>
				<p class="text-xs text-gray-400 mt-1">Browse and join communities</p>
			</div>
		</div>
	</header>

	<!-- Tab Navigation -->
	<nav class="flex bg-gray-800 border-b border-gray-700 mx-4 mt-4 rounded-lg" role="tablist">
		<button 
			type="button"
			role="tab"
			aria-selected={currentState.activeTab === 'my-servers'}
			class="flex-1 py-3 px-4 text-sm font-medium transition-all rounded-l-lg {currentState.activeTab === 'my-servers' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}"
			on:click={() => actions.switchTab('my-servers')}
		>
			My Servers
		</button>
		<button 
			type="button"
			role="tab"
			aria-selected={currentState.activeTab === 'discover'}
			class="flex-1 py-3 px-4 text-sm font-medium transition-all rounded-r-lg {currentState.activeTab === 'discover' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-700'}"
			on:click={() => actions.switchTab('discover')}
		>
			Discover
		</button>
	</nav>

	<!-- Content Area -->
	<div class="flex-1 overflow-y-auto p-4">
		{#if currentState.activeTab === 'my-servers'}
			<!-- My Servers Tab -->
			<div class="space-y-6">
				<!-- Server List -->
				<section class="space-y-3">
					<header class="flex items-center justify-between">
						<h3 class="text-sm font-semibold text-gray-400 uppercase tracking-wider">My Servers</h3>
						<span class="text-xs text-gray-500">{servers.length}</span>
					</header>
					
					<div class="space-y-2">
						{#each servers as server (server.id)}
							<button
								type="button"
								class="w-full flex items-center gap-3 p-3 rounded-lg transition-all group text-left border border-transparent {server.isActive ? 'bg-blue-500/20 border-blue-500/30' : 'hover:bg-gray-800'}"
								on:click={() => actions.selectServer(server)}
							>
								<!-- Server Icon -->
								<div class="relative flex-shrink-0">
									<div class="size-12 bg-gradient-to-r {server.color} rounded-xl flex items-center justify-center shadow-lg">
										{#if server.type === 'workspace'}
											<span class="text-lg font-bold text-white">
												{utils.getUserInitials()}
											</span>
										{:else}
											<i class="{server.icon} text-xl text-white" aria-hidden="true"></i>
										{/if}
									</div>
									
									<!-- Unread Badge -->
									{#if server.unread > 0}
										<div class="absolute -top-1 -right-1 min-w-[20px] h-5 bg-red-500 rounded-full flex items-center justify-center px-1 text-xs font-bold text-white">
											{utils.getUnreadBadge(server.unread)}
										</div>
									{/if}
									
									<!-- Active Indicator -->
									{#if server.isActive}
										<div class="absolute -left-1 top-1/2 w-1 h-8 bg-blue-500 rounded-r-full transform -translate-y-1/2" aria-hidden="true"></div>
									{/if}
								</div>
								
								<!-- Server Info -->
								<div class="flex-1 min-w-0">
									<div class="text-sm font-semibold text-white truncate group-hover:text-blue-400 transition-colors">
										{server.name}
									</div>
									<div class="text-xs text-gray-400">
										{server.type === 'workspace' ? 'Personal workspace' : 'Community server'}
									</div>
								</div>
							</button>
						{/each}

						<!-- Skeleton placeholders if no real servers -->
						{#if !hasRealServers && servers.length === 1}
							{#each Array(3) as _, i}
								<div class="w-full flex items-center gap-3 p-3 rounded-lg">
									<div class="size-12 bg-gray-700 rounded-xl animate-pulse"></div>
									<div class="flex-1 space-y-2">
										<div class="h-4 w-3/5 bg-gray-700 animate-pulse rounded"></div>
										<div class="h-3 w-4/5 bg-gray-700 animate-pulse rounded"></div>
									</div>
								</div>
							{/each}
						{/if}
					</div>
				</section>

				<!-- Create Server Section -->
				<section class="space-y-3">
					{#if !currentState.isCreatingServer}
						<button
							type="button"
							on:click={actions.startServerCreation}
							class="w-full flex items-center gap-3 p-3 border-2 border-dashed border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-500/5 transition-all group"
						>
							<div class="size-12 border-2 border-gray-600 border-dashed rounded-xl flex items-center justify-center group-hover:border-blue-500 transition-all">
								<i class="fas fa-plus text-gray-500 group-hover:text-blue-500" aria-hidden="true"></i>
							</div>
							<div class="text-left">
								<div class="text-sm font-medium text-gray-300 group-hover:text-blue-400">Create Server</div>
								<div class="text-xs text-gray-500">Start your own community</div>
							</div>
						</button>
					{:else}
						<!-- Create Server Form -->
						<div class="bg-gray-800 border border-gray-600 rounded-lg p-4 space-y-4">
							<header class="text-center">
								<h4 class="text-sm font-semibold text-white mb-1">Create New Server</h4>
								<p class="text-xs text-gray-400">Create a space for your community</p>
							</header>
							
							<form class="space-y-3" on:submit|preventDefault={actions.submitServerCreation}>
								<div class="space-y-1">
									<label for="server-name" class="block text-xs font-medium text-gray-300">Server Name</label>
									<input
										id="server-name"
										type="text"
										value={currentState.newServerForm.name}
										on:input={(e) => actions.updateForm('name', e.target.value)}
										on:keypress={actions.handleKeyPress}
										placeholder="My Awesome Server"
										class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 transition-colors"
										maxlength="50"
										required
									/>
								</div>
								
								<div class="space-y-1">
									<label for="server-description" class="block text-xs font-medium text-gray-300">Description (Optional)</label>
									<textarea
										id="server-description"
										value={currentState.newServerForm.description}
										on:input={(e) => actions.updateForm('description', e.target.value)}
										placeholder="What's your server about?"
										class="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 transition-colors resize-none"
										rows="2"
										maxlength="200"
									></textarea>
								</div>
								
								<div class="flex gap-2">
									<button
										type="submit"
										disabled={!currentState.newServerForm.name.trim()}
										class="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-2 px-3 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
									>
										<i class="fas fa-plus" aria-hidden="true"></i>
										Create
									</button>
									<button
										type="button"
										on:click={actions.cancelServerCreation}
										class="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium py-2 px-3 rounded-lg transition-all text-sm flex items-center justify-center gap-2"
									>
										<i class="fas fa-times" aria-hidden="true"></i>
										Cancel
									</button>
								</div>
							</form>
						</div>
					{/if}
				</section>
			</div>

		{:else if currentState.activeTab === 'discover'}
			<!-- Discover Tab -->
			<div class="space-y-6">
				<!-- Featured Servers -->
				<section class="space-y-3">
					<header class="flex items-center gap-2">
						<i class="fas fa-star text-yellow-500" aria-hidden="true"></i>
						<h3 class="text-sm font-semibold text-white">Featured Servers</h3>
					</header>
					
					<div class="space-y-3">
						{#each featuredServers as server (server.id)}
							<div class="bg-gray-800 border border-gray-600 rounded-lg p-4 hover:border-blue-500/50 transition-all">
								<div class="flex items-start gap-3">
									<div class="size-12 bg-gradient-to-r {server.color} rounded-xl flex items-center justify-center flex-shrink-0">
										<i class="{server.icon} text-xl text-white" aria-hidden="true"></i>
									</div>
									<div class="flex-1 min-w-0">
										<h4 class="text-sm font-semibold text-white mb-1">{server.name}</h4>
										<p class="text-xs text-gray-400 mb-2 leading-relaxed">{server.description}</p>
										<div class="flex items-center justify-between">
											<span class="text-xs text-gray-500">
												<i class="fas fa-users mr-1" aria-hidden="true"></i>
												{utils.formatMemberCount(server.members)} members
											</span>
											<button
												type="button"
												on:click={() => actions.joinServer(server)}
												class="bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-lg transition-all"
											>
												Join
											</button>
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</section>

				<!-- Public Servers -->
				<section class="space-y-3">
					<header class="flex items-center gap-2">
						<i class="fas fa-globe text-blue-500" aria-hidden="true"></i>
						<h3 class="text-sm font-semibold text-white">Public Servers</h3>
					</header>
					
					<div class="space-y-2">
						{#each regularPublicServers as server (server.id)}
							<div class="flex items-center gap-3 p-3 bg-gray-800 border border-gray-600 rounded-lg hover:border-blue-500/50 transition-all">
								<div class="size-10 bg-gradient-to-r {server.color} rounded-lg flex items-center justify-center flex-shrink-0">
									<i class="{server.icon} text-lg text-white" aria-hidden="true"></i>
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-sm font-medium text-white truncate">{server.name}</div>
									<div class="text-xs text-gray-500">
										<i class="fas fa-users mr-1" aria-hidden="true"></i>
										{utils.formatMemberCount(server.members)} members
									</div>
								</div>
								<button
									type="button"
									on:click={() => actions.joinServer(server)}
									class="bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-lg transition-all flex-shrink-0"
								>
									Join
								</button>
							</div>
						{/each}
					</div>
				</section>

				<!-- Help Section -->
				<section class="mt-6 pt-6 border-t border-gray-700">
					<div class="text-center p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
						<i class="fas fa-info-circle text-blue-400 text-lg mb-2" aria-hidden="true"></i>
						<h4 class="text-sm font-semibold text-white mb-2">Looking for more servers?</h4>
						<p class="text-xs text-gray-400 mb-3 leading-relaxed">
							Browse thousands of communities or search for specific topics to find the perfect server for you.
						</p>
						<button 
							type="button" 
							class="bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition-all flex items-center gap-2 mx-auto"
						>
							<i class="fas fa-search" aria-hidden="true"></i>
							Browse All Servers
						</button>
					</div>
				</section>
			</div>
		{/if}
	</div>
</aside>

<style>
	/* Enhanced hover animations */
	.group:hover .size-12 {
		transform: scale(1.05);
	}

	/* Focus states for accessibility */
	button:focus-visible,
	input:focus-visible,
	textarea:focus-visible {
		outline: 2px solid rgb(59 130 246);
		outline-offset: 2px;
	}

	/* Custom scrollbar */
	:global(.overflow-y-auto::-webkit-scrollbar) {
		width: 6px;
	}
	
	:global(.overflow-y-auto::-webkit-scrollbar-track) {
		background: transparent;
	}
	
	:global(.overflow-y-auto::-webkit-scrollbar-thumb) {
		background: rgba(75, 85, 99, 0.5);
		border-radius: 3px;
	}
	
	:global(.overflow-y-auto::-webkit-scrollbar-thumb:hover) {
		background: rgba(75, 85, 99, 0.8);
	}

	/* Animation keyframes */
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}

	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
</style>