<!-- src/lib/components/dashboard/LeftSidebar.svelte -->
<script>
	import { Plus, ChevronDown, Hash, MessageCircle, Bot, ArrowLeftRight, Megaphone } from 'lucide-react';
	
	let channels = [
		{ id: 1, name: 'General Discussion', icon: Hash, unread: 12, active: true },
		{ id: 2, name: 'AI Assistance', icon: Bot, unread: 3, active: false },
		{ id: 3, name: 'Payments & Trading', icon: ArrowLeftRight, unread: 0, active: false },
		{ id: 4, name: 'Announcements', icon: Megaphone, unread: 1, active: false }
	];
	
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
				<Plus class="w-4 h-4 text-white" />
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
		<!-- Channels Section -->
		<div class="space-y-3">
			<div class="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider">
				<div class="flex items-center gap-2">
					<MessageCircle class="w-4 h-4" />
					<span>Channels</span>
				</div>
				<button class="hover:text-gray-300 transition-colors">
					<ChevronDown class="w-3 h-3" />
				</button>
			</div>
			
			<div class="space-y-1">
				{#each channels as channel}
					<div class="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all group {channel.active ? 'bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/30 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}">
						<!-- Active Indicator -->
						<div class="w-1 h-5 rounded-full {channel.active ? 'bg-blue-500' : 'bg-transparent'}"></div>
						
						<!-- Channel Icon -->
						<svelte:component this={channel.icon} class="w-4 h-4 {channel.active ? 'text-blue-400' : 'text-gray-500 group-hover:text-gray-400'}" />
						
						<!-- Channel Name -->
						<span class="flex-1 font-medium text-sm">{channel.name}</span>
						
						<!-- Unread Count -->
						{#if channel.unread > 0}
							<div class="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center">
								{channel.unread}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Direct Messages Section -->
		<div class="space-y-3">
			<div class="flex items-center justify-between text-gray-400 text-xs font-semibold uppercase tracking-wider">
				<div class="flex items-center gap-2">
					<i class="fas fa-user-friends text-sm"></i>
					<span>Direct Messages</span>
				</div>
				<button class="hover:text-gray-300 transition-colors">
					<ChevronDown class="w-3 h-3" />
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
	</div>
</aside>