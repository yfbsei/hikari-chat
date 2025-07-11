<!-- src/lib/components/dashboard/RightSidebar.svelte -->
<script>
	import { onMount } from 'svelte';
	
	// Component state
	let activeTab = 'friends';
	
	// Friends data - empty for new users (will show skeleton)
	let friends = [];
	
	// Analytics data for Hikari Chat
	let analytics = {
		todayMessages: 247,
		aiInteractions: 43,
		paymentsSent: 12,
		hikaricoinBalance: 1247.5,
		stakingRewards: 156.3,
		conversionRate: 0.304 // HC to CAD
	};

	// Reactive loading states - show skeleton when arrays are empty
	$: isLoadingFriends = friends.length === 0;
	$: onlineFriends = friends.filter(f => f.status === 'online');
	$: offlineFriends = friends.filter(f => f.status === 'offline');

	// Helper functions
	function getStatusColor(status) {
		switch(status) {
			case 'online': return 'bg-green-500';
			case 'offline': return 'bg-gray-500';
			default: return 'bg-gray-500';
		}
	}

	// Format Hikari Coin amounts
	function formatHC(amount) {
		return new Intl.NumberFormat('en-CA', { 
			minimumFractionDigits: 1, 
			maximumFractionDigits: 1 
		}).format(amount);
	}

	// Format CAD amounts
	function formatCAD(amount) {
		return new Intl.NumberFormat('en-CA', { 
			style: 'currency', 
			currency: 'CAD' 
		}).format(amount);
	}

	// Calculate CAD value of HC
	function hcToCAD(hc) {
		return hc * analytics.conversionRate;
	}

	// Tab switching
	function switchTab(tab) {
		activeTab = tab;
	}
</script>

<aside class="bg-gray-900 border-l border-gray-700 flex flex-col overflow-hidden">
	<!-- Tab Navigation -->
	<nav class="flex bg-gray-800 border-b border-gray-700" role="tablist" aria-label="Sidebar tabs">
		<button 
			type="button"
			role="tab"
			aria-selected={activeTab === 'friends'}
			aria-controls="friends-panel"
			class="flex-1 flex flex-col items-center gap-1 py-4 px-3 transition-all border-b-2 {activeTab === 'friends' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}"
			on:click={() => switchTab('friends')}
		>
			<i class="fas fa-user-friends text-sm" aria-hidden="true"></i>
			<span class="text-xs font-medium uppercase tracking-wide">Friends</span>
		</button>
		
		<button 
			type="button"
			role="tab"
			aria-selected={activeTab === 'analytics'}
			aria-controls="analytics-panel"
			class="flex-1 flex flex-col items-center gap-1 py-4 px-3 transition-all border-b-2 {activeTab === 'analytics' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}"
			on:click={() => switchTab('analytics')}
		>
			<i class="fas fa-chart-bar text-sm" aria-hidden="true"></i>
			<span class="text-xs font-medium uppercase tracking-wide">Analytics</span>
		</button>
		
		<button 
			type="button"
			role="tab"
			aria-selected={activeTab === 'ai'}
			aria-controls="ai-panel"
			class="flex-1 flex flex-col items-center gap-1 py-4 px-3 transition-all border-b-2 {activeTab === 'ai' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}"
			on:click={() => switchTab('ai')}
		>
			<i class="fas fa-robot text-sm" aria-hidden="true"></i>
			<span class="text-xs font-medium uppercase tracking-wide">AI Tools</span>
		</button>
	</nav>

	<!-- Tab Content -->
	<div class="flex-1 overflow-y-auto p-6">
		<!-- Friends Tab -->
		{#if activeTab === 'friends'}
			<div id="friends-panel" role="tabpanel" aria-labelledby="friends-tab" class="space-y-6">
				{#if isLoadingFriends}
					<!-- Skeleton Loading for Friends -->
					<section class="space-y-3">
						<header class="flex items-center justify-between">
							<h3 class="text-sm font-semibold text-white">Online Friends</h3>
						</header>

						<div class="space-y-3" role="list" aria-label="Loading online friends">
							{#each Array(4) as _, i}
								<div class="flex items-center gap-3 p-3 rounded-lg" role="listitem">
									<div class="relative flex-shrink-0">
										<div class="placeholder w-9 h-9 rounded-full animate-pulse"></div>
										<div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 placeholder rounded-full animate-pulse"></div>
									</div>
									<div class="flex-1 min-w-0">
										<div class="placeholder h-4 w-3/5 mb-1 animate-pulse"></div>
										<div class="placeholder h-3 w-4/5 animate-pulse"></div>
									</div>
									<div class="flex gap-1 opacity-30">
										<div class="w-6 h-6 bg-gray-700 rounded"></div>
										<div class="w-6 h-6 bg-gray-700 rounded"></div>
									</div>
								</div>
							{/each}
						</div>
					</section>

					<section class="space-y-3">
						<header class="flex items-center justify-between">
							<h3 class="text-sm font-semibold text-white">Offline Friends</h3>
						</header>

						<div class="space-y-3 opacity-60" role="list" aria-label="Loading offline friends">
							{#each Array(2) as _, i}
								<div class="flex items-center gap-3 p-3 rounded-lg" role="listitem">
									<div class="relative flex-shrink-0">
										<div class="placeholder w-9 h-9 rounded-full animate-pulse"></div>
										<div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 placeholder rounded-full animate-pulse"></div>
									</div>
									<div class="flex-1 min-w-0">
										<div class="placeholder h-4 w-3/5 mb-1 animate-pulse"></div>
										<div class="placeholder h-3 w-4/5 animate-pulse"></div>
									</div>
									<div class="flex gap-1 opacity-30">
										<div class="w-6 h-6 bg-gray-700 rounded"></div>
									</div>
								</div>
							{/each}
						</div>
					</section>
				{:else}
					<!-- Actual Friends Content -->
					<section class="space-y-3">
						<header class="flex items-center justify-between">
							<h3 class="text-sm font-semibold text-white">Online Friends</h3>
							<span class="text-xs text-gray-400">{onlineFriends.length} online</span>
						</header>

						<div class="space-y-3" role="list" aria-label="Online friends">
							{#each onlineFriends as friend}
								<div class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-all cursor-pointer group" role="listitem">
									<!-- Avatar with Status -->
									<div class="relative flex-shrink-0">
										<div class="w-9 h-9 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
											<span class="text-sm font-semibold text-white">
												{friend.name.split(' ').map(n => n[0]).join('')}
											</span>
										</div>
										<div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 {getStatusColor(friend.status)} border-2 border-gray-900 rounded-full"></div>
									</div>
									
									<!-- Friend Info -->
									<div class="flex-1 min-w-0">
										<div class="text-sm font-medium text-white truncate">{friend.name}</div>
										<div class="text-xs text-gray-400 truncate">{friend.location}</div>
									</div>
									
									<!-- Quick Actions -->
									<div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
										<button 
											type="button"
											class="w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded text-white text-xs flex items-center justify-center" 
											title="Send Message"
											aria-label="Send message to {friend.name}"
										>
											<i class="fas fa-comment" aria-hidden="true"></i>
										</button>
										<button 
											type="button"
											class="w-6 h-6 bg-yellow-500 hover:bg-yellow-600 rounded text-white text-xs flex items-center justify-center" 
											title="Send HC"
											aria-label="Send Hikari Coin to {friend.name}"
										>
											<i class="fas fa-coins" aria-hidden="true"></i>
										</button>
									</div>
								</div>
							{/each}
						</div>
					</section>

					<section class="space-y-3">
						<header class="flex items-center justify-between">
							<h3 class="text-sm font-semibold text-white">Offline Friends</h3>
							<span class="text-xs text-gray-400">{offlineFriends.length} offline</span>
						</header>

						<div class="space-y-3 opacity-60" role="list" aria-label="Offline friends">
							{#each offlineFriends as friend}
								<div class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-all cursor-pointer group" role="listitem">
									<!-- Avatar with Status -->
									<div class="relative flex-shrink-0">
										<div class="w-9 h-9 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
											<span class="text-sm font-semibold text-white">
												{friend.name.split(' ').map(n => n[0]).join('')}
											</span>
										</div>
										<div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 {getStatusColor(friend.status)} border-2 border-gray-900 rounded-full"></div>
									</div>
									
									<!-- Friend Info -->
									<div class="flex-1 min-w-0">
										<div class="text-sm font-medium text-gray-300 truncate">{friend.name}</div>
										<div class="text-xs text-gray-500 truncate">{friend.location}</div>
									</div>
									
									<!-- Quick Actions -->
									<div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
										<button 
											type="button"
											class="w-6 h-6 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs flex items-center justify-center" 
											title="Send Message"
											aria-label="Send message to {friend.name}"
										>
											<i class="fas fa-comment" aria-hidden="true"></i>
										</button>
									</div>
								</div>
							{/each}
						</div>
					</section>
				{/if}
			</div>

		<!-- Analytics Tab -->
		{:else if activeTab === 'analytics'}
			<div id="analytics-panel" role="tabpanel" aria-labelledby="analytics-tab" class="space-y-6">
				<header>
					<h2 class="text-sm font-semibold text-white">Hikari Analytics</h2>
				</header>
				
				<!-- Wallet Overview -->
				<section class="bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-xl p-4">
					<header class="flex items-center justify-between mb-3">
						<h3 class="text-sm text-gray-400">Hikari Coin Balance</h3>
						<i class="fas fa-coins text-yellow-400" aria-hidden="true"></i>
					</header>
					<div class="text-2xl font-bold text-white mb-1">{formatHC(analytics.hikaricoinBalance)} HC</div>
					<div class="text-xs text-gray-300">{formatCAD(hcToCAD(analytics.hikaricoinBalance))}</div>
					<div class="text-xs text-green-400 mt-2">
						<i class="fas fa-chart-line" aria-hidden="true"></i> +{formatHC(analytics.stakingRewards)} HC earned this month
					</div>
				</section>

				<!-- Usage Stats -->
				<section class="space-y-4">
					<div class="bg-gray-800 border border-gray-600 rounded-lg p-4">
						<header class="flex items-center justify-between mb-2">
							<h3 class="text-sm text-gray-400">Messages Today</h3>
							<i class="fas fa-comment text-blue-400" aria-hidden="true"></i>
						</header>
						<div class="text-2xl font-bold text-white">{analytics.todayMessages}</div>
						<div class="text-xs text-green-400">+12% from yesterday</div>
					</div>
					
					<div class="bg-gray-800 border border-gray-600 rounded-lg p-4">
						<header class="flex items-center justify-between mb-2">
							<h3 class="text-sm text-gray-400">AI Interactions</h3>
							<i class="fas fa-robot text-purple-400" aria-hidden="true"></i>
						</header>
						<div class="text-2xl font-bold text-white">{analytics.aiInteractions}</div>
						<div class="text-xs text-green-400">+8% from yesterday</div>
					</div>
					
					<div class="bg-gray-800 border border-gray-600 rounded-lg p-4">
						<header class="flex items-center justify-between mb-2">
							<h3 class="text-sm text-gray-400">HC Payments Sent</h3>
							<i class="fas fa-paper-plane text-yellow-400" aria-hidden="true"></i>
						</header>
						<div class="text-2xl font-bold text-white">{analytics.paymentsSent}</div>
						<div class="text-xs text-gray-400">Total: {formatCAD(hcToCAD(485))}</div>
					</div>
				</section>

				<!-- Market Info -->
				<section class="bg-gray-800 border border-gray-600 rounded-lg p-4">
					<header class="flex items-center justify-between mb-3">
						<h3 class="text-sm text-gray-400">HC Exchange Rate</h3>
						<i class="fas fa-exchange-alt text-blue-400" aria-hidden="true"></i>
					</header>
					<div class="text-lg font-bold text-white">1 HC = {formatCAD(analytics.conversionRate)}</div>
					<div class="text-xs text-green-400 mt-1">
						<i class="fas fa-arrow-up" aria-hidden="true"></i> +2.4% (24h)
					</div>
				</section>
			</div>

		<!-- AI Tools Tab -->
		{:else if activeTab === 'ai'}
			<div id="ai-panel" role="tabpanel" aria-labelledby="ai-tab" class="space-y-6">
				<header>
					<h2 class="text-sm font-semibold text-white">Hikari AI Assistant</h2>
				</header>
				
				<!-- AI Status -->
				<section class="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-xl p-4">
					<div class="flex items-center gap-3 mb-3">
						<div class="w-3 h-3 bg-green-500 rounded-full animate-pulse" aria-hidden="true"></div>
						<span class="text-sm font-medium text-white">AI Assistant Active</span>
					</div>
					<p class="text-xs text-gray-400">
						Canadian English/French • Real-time translation • Smart automation
					</p>
				</section>
				
				<!-- AI Actions -->
				<section class="space-y-3">
					<button 
						type="button"
						class="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg hover:from-purple-500/20 hover:to-purple-600/20 transition-all text-left group"
					>
						<i class="fas fa-language text-purple-400 group-hover:scale-110 transition-transform" aria-hidden="true"></i>
						<div>
							<div class="text-sm font-medium text-white">Smart Translation</div>
							<div class="text-xs text-gray-400">English ⇄ French (Canadian)</div>
						</div>
					</button>
					
					<button 
						type="button"
						class="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg hover:from-blue-500/20 hover:to-blue-600/20 transition-all text-left group"
					>
						<i class="fas fa-brain text-blue-400 group-hover:scale-110 transition-transform" aria-hidden="true"></i>
						<div>
							<div class="text-sm font-medium text-white">Conversation Summary</div>
							<div class="text-xs text-gray-400">Generate key points & actions</div>
						</div>
					</button>
					
					<button 
						type="button"
						class="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg hover:from-green-500/20 hover:to-green-600/20 transition-all text-left group"
					>
						<i class="fas fa-search text-green-400 group-hover:scale-110 transition-transform" aria-hidden="true"></i>
						<div>
							<div class="text-sm font-medium text-white">Smart Search</div>
							<div class="text-xs text-gray-400">AI-powered message search</div>
						</div>
					</button>
					
					<button 
						type="button"
						class="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-lg hover:from-orange-500/20 hover:to-orange-600/20 transition-all text-left group"
					>
						<i class="fas fa-chart-line text-orange-400 group-hover:scale-110 transition-transform" aria-hidden="true"></i>
						<div>
							<div class="text-sm font-medium text-white">Sentiment Analysis</div>
							<div class="text-xs text-gray-400">Team mood insights</div>
						</div>
					</button>

					<button 
						type="button"
						class="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-lg hover:from-yellow-500/20 hover:to-yellow-600/20 transition-all text-left group"
					>
						<i class="fas fa-coins text-yellow-400 group-hover:scale-110 transition-transform" aria-hidden="true"></i>
						<div>
							<div class="text-sm font-medium text-white">Payment Assistant</div>
							<div class="text-xs text-gray-400">Smart HC payment suggestions</div>
						</div>
					</button>
				</section>
				
				<!-- AI Usage Stats -->
				<section class="pt-6 border-t border-gray-700">
					<h3 class="text-sm font-medium text-white mb-3">Today's AI Usage</h3>
					<div class="space-y-2">
						<div class="flex justify-between text-sm">
							<span class="text-gray-400">Translations (EN↔FR)</span>
							<span class="text-white">23</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-gray-400">Message Summaries</span>
							<span class="text-white">12</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-gray-400">Smart Searches</span>
							<span class="text-white">8</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-gray-400">Payment Suggestions</span>
							<span class="text-white">5</span>
						</div>
					</div>
				</section>

				<!-- Canadian AI Features -->
				<section class="pt-6 border-t border-gray-700">
					<h3 class="text-sm font-medium text-white mb-3">Canadian Features</h3>
					<div class="space-y-2">
						<div class="flex items-center gap-2 text-sm text-gray-300">
							<i class="fas fa-flag text-red-500" aria-hidden="true"></i>
							<span>Canadian French dialect support</span>
						</div>
						<div class="flex items-center gap-2 text-sm text-gray-300">
							<i class="fas fa-shield-alt text-blue-500" aria-hidden="true"></i>
							<span>PIPEDA compliant AI processing</span>
						</div>
						<div class="flex items-center gap-2 text-sm text-gray-300">
							<i class="fas fa-maple-leaf text-orange-500" aria-hidden="true"></i>
							<span>Canadian business context</span>
						</div>
					</div>
				</section>
			</div>
		{/if}
	</div>
</aside>

<style>
	/* Custom scrollbar styling */
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

	/* Skeleton placeholder styles for dark theme */
	:global(.placeholder) {
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

	/* Enhanced hover animations */
	button:hover i {
		transform: scale(1.1);
	}

	/* Focus states for accessibility */
	button:focus-visible {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}
</style>