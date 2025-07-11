<!-- src/lib/components/dashboard/LeftSidebar.svelte -->
<script>
	let directMessages = [
		{ id: 1, name: 'Sarah Chen', status: 'online', unread: true },
		{ id: 2, name: 'Alex Rodriguez', status: 'away', unread: false },
		{ id: 3, name: 'Maya Patel', status: 'offline', lastSeen: '2h ago', unread: false }
	];
	
	function getStatusColor(status) {
		switch(status) {
			case 'online': return 'bg-green-500';
			case 'away': return 'bg-yellow-500';
			case 'offline': return 'bg-gray-500';
			default: return 'bg-gray-500';
		}
	}
</script>

<aside class="bg-gray-900 border-r border-gray-700 flex flex-col overflow-hidden">
	<!-- Workspace Header -->
	<div class="p-6 border-b border-gray-700">
		<div class="flex items-center justify-between">
			<h2 class="text-lg font-semibold text-white">My Workspace</h2>
			<button class="w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-all hover:scale-105">
				<i class="fas fa-plus text-white"></i>
			</button>
		</div>
	</div>

	<!-- Quick Actions -->
	<div class="p-4 space-y-3">
		<button class="w-full flex items-center gap-3 p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all hover:scale-[1.02] font-medium">
			<i class="fas fa-robot text-lg"></i>
			<span>Ask AI</span>
		</button>
		<button class="w-full flex items-center gap-3 p-3 bg-gray-800 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:border-blue-500 hover:text-white transition-all font-medium">
			<i class="fas fa-paper-plane text-lg"></i>
			<span>Send Payment</span>
		</button>
	</div>

	<!-- Navigation -->
	<div class="flex-1 overflow-y-auto p-4 space-y-6">
		<!-- Direct Messages Section -->
		<div class="space-y-3">
			<div class="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider">
				<div class="flex items-center gap-2">
					<i class="fas fa-user-friends text-sm"></i>
					<span>Direct Messages</span>
				</div>
				<button class="hover:text-gray-300 transition-colors">
					<i class="fas fa-chevron-down text-xs"></i>
				</button>
			</div>
			
			<div class="space-y-1">
				{#each directMessages as dm}
					<div class="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-800 transition-all group">
						<!-- Avatar with Status -->
						<div class="relative flex-shrink-0">
							<div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
								<span class="text-xs font-semibold text-white">
									{dm.name.split(' ').map(n => n[0]).join('')}
								</span>
							</div>
							<div class="absolute -bottom-0.5 -right-0.5 w-3 h-3 {getStatusColor(dm.status)} border-2 border-gray-900 rounded-full"></div>
						</div>
						
						<!-- User Info -->
						<div class="flex-1 min-w-0">
							<div class="text-sm font-medium text-white truncate">{dm.name}</div>
							<div class="text-xs text-gray-400 capitalize">
								{#if dm.lastSeen}
									Last seen {dm.lastSeen}
								{:else}
									{dm.status}
								{/if}
							</div>
						</div>
						
						<!-- Unread Indicator -->
						{#if dm.unread}
							<div class="w-2 h-2 bg-blue-500 rounded-full"></div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- AI Message History -->
		<div class="space-y-3">
			<div class="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider">
				<div class="flex items-center gap-2">
					<i class="fas fa-robot text-sm"></i>
					<span>AI Message History</span>
				</div>
			</div>
			
			<div class="space-y-1">
				<div class="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-800 transition-all group">
					<div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
						<i class="fas fa-robot text-white text-xs"></i>
					</div>
					<div class="flex-1 min-w-0">
						<div class="text-sm font-medium text-white truncate">Translation Request</div>
						<div class="text-xs text-gray-400 truncate">Translate "Hello" to French</div>
					</div>
				</div>
				
				<div class="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-800 transition-all group">
					<div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
						<i class="fas fa-robot text-white text-xs"></i>
					</div>
					<div class="flex-1 min-w-0">
						<div class="text-sm font-medium text-white truncate">Content Summary</div>
						<div class="text-xs text-gray-400 truncate">Summarize team meeting notes</div>
					</div>
				</div>

				<div class="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-800 transition-all group">
					<div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
						<i class="fas fa-robot text-white text-xs"></i>
					</div>
					<div class="flex-1 min-w-0">
						<div class="text-sm font-medium text-white truncate">Code Review</div>
						<div class="text-xs text-gray-400 truncate">Review JavaScript function</div>
					</div>
				</div>

				<div class="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-800 transition-all group">
					<div class="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
						<i class="fas fa-robot text-white text-xs"></i>
					</div>
					<div class="flex-1 min-w-0">
						<div class="text-sm font-medium text-white truncate">Email Draft</div>
						<div class="text-xs text-gray-400 truncate">Help with client proposal</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</aside>