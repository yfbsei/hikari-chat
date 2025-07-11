<!-- src/lib/components/dashboard/RightSidebar.svelte -->
<script>
	// Use Font Awesome icons instead of Lucide for now
	let activeTab = 'team';
	
	let teamMembers = [
		{ name: 'Sarah Chen', role: 'Product Manager', status: 'online' },
		{ name: 'Alex Rodriguez', role: 'Developer', status: 'online' },
		{ name: 'Maya Patel', role: 'Designer', status: 'away' }
	];
	
	let recentActivity = [
		{ type: 'payment', text: 'Payment sent to Alex', time: '2 minutes ago', icon: 'fas fa-coins', color: 'text-yellow-500' },
		{ type: 'ai', text: 'AI translated message', time: '5 minutes ago', icon: 'fas fa-robot', color: 'text-purple-500' },
		{ type: 'message', text: 'New message in #general', time: '8 minutes ago', icon: 'fas fa-comment', color: 'text-blue-500' }
	];
	
	function getStatusColor(status) {
		switch(status) {
			case 'online': return 'bg-green-500';
			case 'away': return 'bg-yellow-500';
			case 'offline': return 'bg-gray-500';
			default: return 'bg-gray-500';
		}
	}
	
	function getStatusIcon(status) {
		switch(status) {
			case 'online': return 'fas fa-circle';
			case 'away': return 'fas fa-moon';
			case 'offline': return 'fas fa-circle';
			default: return 'fas fa-circle';
		}
	}
</script>

<aside class="bg-gray-900 border-l border-gray-700 flex flex-col overflow-hidden">
	<!-- Tab Navigation -->
	<div class="flex bg-gray-800 border-b border-gray-700">
		<button 
			class="flex-1 flex flex-col items-center gap-1 py-4 px-3 transition-all border-b-2 {activeTab === 'team' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}"
			on:click={() => activeTab = 'team'}
		>
			<i class="fas fa-users text-sm"></i>
			<span class="text-xs font-medium uppercase tracking-wide">Team</span>
		</button>
		<button 
			class="flex-1 flex flex-col items-center gap-1 py-4 px-3 transition-all border-b-2 {activeTab === 'analytics' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}"
			on:click={() => activeTab = 'analytics'}
		>
			<i class="fas fa-chart-bar text-sm"></i>
			<span class="text-xs font-medium uppercase tracking-wide">Analytics</span>
		</button>
		<button 
			class="flex-1 flex flex-col items-center gap-1 py-4 px-3 transition-all border-b-2 {activeTab === 'ai' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-500 hover:text-gray-300'}"
			on:click={() => activeTab = 'ai'}
		>
			<i class="fas fa-robot text-sm"></i>
			<span class="text-xs font-medium uppercase tracking-wide">AI Tools</span>
		</button>
	</div>

	<!-- Tab Content -->
	<div class="flex-1 overflow-y-auto p-6">
		{#if activeTab === 'team'}
			<!-- Team Members Section -->
			<div class="space-y-6">
				<div class="flex items-center justify-between">
					<h3 class="text-sm font-semibold text-white">Members</h3>
					<span class="text-xs text-gray-400">8 online</span>
				</div>

				<div class="space-y-3">
					{#each teamMembers as member}
						<div class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-all cursor-pointer">
							<!-- Avatar with Status -->
							<div class="relative flex-shrink-0">
								<div class="w-9 h-9 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
									<span class="text-sm font-semibold text-white">
										{member.name.split(' ').map(n => n[0]).join('')}
									</span>
								</div>
								<div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 {getStatusColor(member.status)} border-2 border-gray-900 rounded-full"></div>
							</div>
							
							<!-- Member Info -->
							<div class="flex-1 min-w-0">
								<div class="text-sm font-medium text-white truncate">{member.name}</div>
								<div class="text-xs text-gray-400 truncate">{member.role}</div>
							</div>
							
							<!-- Status Icon -->
							<div class="flex items-center">
								<i class="{getStatusIcon(member.status)} text-xs {getStatusColor(member.status).replace('bg-', 'text-')}"></i>
							</div>
						</div>
					{/each}
				</div>

				<!-- Quick Tools -->
				<div class="pt-6 border-t border-gray-700">
					<h3 class="text-sm font-semibold text-white mb-4">Quick Tools</h3>
					<div class="grid grid-cols-2 gap-3">
						<button class="flex flex-col items-center gap-2 p-4 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 hover:border-blue-500 transition-all group">
							<i class="fas fa-language text-lg text-blue-400 group-hover:scale-110 transition-transform"></i>
							<span class="text-xs font-medium text-gray-300 group-hover:text-white">Translate</span>
						</button>
						<button class="flex flex-col items-center gap-2 p-4 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 hover:border-blue-500 transition-all group">
							<i class="fas fa-compress-alt text-lg text-blue-400 group-hover:scale-110 transition-transform"></i>
							<span class="text-xs font-medium text-gray-300 group-hover:text-white">Summarize</span>
						</button>
						<button class="flex flex-col items-center gap-2 p-4 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 hover:border-blue-500 transition-all group">
							<i class="fas fa-chart-bar text-lg text-blue-400 group-hover:scale-110 transition-transform"></i>
							<span class="text-xs font-medium text-gray-300 group-hover:text-white">Analytics</span>
						</button>
						<button class="flex flex-col items-center gap-2 p-4 bg-gray-800 border border-gray-600 rounded-lg hover:bg-gray-700 hover:border-blue-500 transition-all group">
							<i class="fas fa-paper-plane text-lg text-blue-400 group-hover:scale-110 transition-transform"></i>
							<span class="text-xs font-medium text-gray-300 group-hover:text-white">Send Payment</span>
						</button>
					</div>
				</div>

				<!-- Recent Activity -->
				<div class="pt-6 border-t border-gray-700">
					<h3 class="text-sm font-semibold text-white mb-4">Recent Activity</h3>
					<div class="space-y-3">
						{#each recentActivity as activity}
							<div class="flex items-center gap-3 p-3 bg-gray-800 border border-gray-600 rounded-lg">
								<div class="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
									<i class="{activity.icon} text-sm {activity.color}"></i>
								</div>
								<div class="flex-1 min-w-0">
									<div class="text-sm font-medium text-white truncate">{activity.text}</div>
									<div class="text-xs text-gray-400">{activity.time}</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{:else if activeTab === 'analytics'}
			<!-- Analytics Tab Content -->
			<div class="space-y-6">
				<h3 class="text-sm font-semibold text-white">Analytics Dashboard</h3>
				
				<!-- Stats Cards -->
				<div class="space-y-4">
					<div class="bg-gray-800 border border-gray-600 rounded-lg p-4">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm text-gray-400">Messages Today</span>
							<i class="fas fa-comment text-blue-400"></i>
						</div>
						<div class="text-2xl font-bold text-white">247</div>
						<div class="text-xs text-green-400">+12% from yesterday</div>
					</div>
					
					<div class="bg-gray-800 border border-gray-600 rounded-lg p-4">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm text-gray-400">AI Interactions</span>
							<i class="fas fa-robot text-purple-400"></i>
						</div>
						<div class="text-2xl font-bold text-white">43</div>
						<div class="text-xs text-green-400">+8% from yesterday</div>
					</div>
					
					<div class="bg-gray-800 border border-gray-600 rounded-lg p-4">
						<div class="flex items-center justify-between mb-2">
							<span class="text-sm text-gray-400">Payments Sent</span>
							<i class="fas fa-coins text-yellow-400"></i>
						</div>
						<div class="text-2xl font-bold text-white">12</div>
						<div class="text-xs text-red-400">-3% from yesterday</div>
					</div>
				</div>
			</div>
		{:else if activeTab === 'ai'}
			<!-- AI Tools Tab Content -->
			<div class="space-y-6">
				<h3 class="text-sm font-semibold text-white">AI Assistant Tools</h3>
				
				<!-- AI Actions -->
				<div class="space-y-3">
					<button class="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg hover:from-purple-500/20 hover:to-purple-600/20 transition-all text-left">
						<i class="fas fa-brain text-purple-400"></i>
						<div>
							<div class="text-sm font-medium text-white">Smart Summary</div>
							<div class="text-xs text-gray-400">Summarize channel conversations</div>
						</div>
					</button>
					
					<button class="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg hover:from-blue-500/20 hover:to-blue-600/20 transition-all text-left">
						<i class="fas fa-language text-blue-400"></i>
						<div>
							<div class="text-sm font-medium text-white">Auto Translate</div>
							<div class="text-xs text-gray-400">English ⇄ French translation</div>
						</div>
					</button>
					
					<button class="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg hover:from-green-500/20 hover:to-green-600/20 transition-all text-left">
						<i class="fas fa-search text-green-400"></i>
						<div>
							<div class="text-sm font-medium text-white">Smart Search</div>
							<div class="text-xs text-gray-400">AI-powered message search</div>
						</div>
					</button>
					
					<button class="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-lg hover:from-orange-500/20 hover:to-orange-600/20 transition-all text-left">
						<i class="fas fa-chart-line text-orange-400"></i>
						<div>
							<div class="text-sm font-medium text-white">Sentiment Analysis</div>
							<div class="text-xs text-gray-400">Team mood insights</div>
						</div>
					</button>
				</div>
				
				<!-- AI Usage Stats -->
				<div class="pt-6 border-t border-gray-700">
					<h4 class="text-sm font-medium text-white mb-3">Today's AI Usage</h4>
					<div class="space-y-2">
						<div class="flex justify-between text-sm">
							<span class="text-gray-400">Translations</span>
							<span class="text-white">23</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-gray-400">Summaries</span>
							<span class="text-white">12</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-gray-400">Smart Searches</span>
							<span class="text-white">8</span>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</aside>