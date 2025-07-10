<!-- src/routes/admin/audit/+page.svelte -->
<script>
	import { onMount } from 'svelte';
	
	export let data;
	
	let selectedTab = 'recent';
	let auditLogs = data.auditLogs || [];
	let suspiciousActivity = data.suspiciousActivity || {};
	let securityEvents = data.securityEvents || [];
	let auditSummary = data.auditSummary || [];
	
	// Format date for display
	function formatDate(dateString) {
		return new Date(dateString).toLocaleString();
	}
	
	// Format IP address for display
	function formatIP(ip) {
		return ip === 'unknown' ? '🔍 Unknown' : ip;
	}
	
	// Get status emoji
	function getStatusEmoji(success) {
		return success ? '✅' : '❌';
	}
	
	// Get action color
	function getActionColor(action) {
		const colorMap = {
			'email_verified': 'text-green-400',
			'user_created': 'text-blue-400',
			'login_success': 'text-green-400',
			'email_verification_attempt': 'text-yellow-400',
			'signup_attempt': 'text-blue-400',
			'login_attempt': 'text-yellow-400'
		};
		return colorMap[action] || 'text-gray-400';
	}
</script>

<svelte:head>
	<title>Hikari Chat - Audit Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 p-6">
	<div class="max-w-7xl mx-auto">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-white mb-2">🛡️ Security Audit Dashboard</h1>
			<p class="text-gray-400">Monitor authentication events and suspicious activity</p>
		</div>

		<!-- Tab Navigation -->
		<div class="flex space-x-1 mb-8 bg-white/5 rounded-xl p-1">
			<button 
				class="flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all {selectedTab === 'recent' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}"
				on:click={() => selectedTab = 'recent'}
			>
				Recent Events
			</button>
			<button 
				class="flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all {selectedTab === 'suspicious' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}"
				on:click={() => selectedTab = 'suspicious'}
			>
				Suspicious Activity
			</button>
			<button 
				class="flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all {selectedTab === 'summary' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'}"
				on:click={() => selectedTab = 'summary'}
			>
				Summary
			</button>
		</div>

		{#if selectedTab === 'recent'}
			<!-- Recent Security Events -->
			<div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
				<h2 class="text-xl font-semibold text-white mb-4">Recent Security Events (24 hours)</h2>
				
				{#if securityEvents.length === 0}
					<p class="text-gray-400 text-center py-8">No recent security events</p>
				{:else}
					<div class="space-y-3">
						{#each securityEvents as event}
							<div class="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-all">
								<div class="flex items-start justify-between mb-2">
									<div class="flex items-center gap-3">
										<span class="text-lg">{getStatusEmoji(event.success)}</span>
										<span class="font-medium {getActionColor(event.action)}">
											{event.action.replace(/_/g, ' ').toUpperCase()}
										</span>
									</div>
									<span class="text-xs text-gray-400">{formatDate(event.created_at)}</span>
								</div>
								
								<div class="text-sm text-gray-300 mb-2">
									{#if event.username}
										<span class="text-blue-400">{event.username}</span>
										({event.email})
									{:else}
										Anonymous user
									{/if}
									from <span class="font-mono text-yellow-400">{formatIP(event.ip_address)}</span>
								</div>
								
								{#if event.error_message}
									<div class="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-1 mt-2">
										{event.error_message}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>

		{:else if selectedTab === 'suspicious'}
			<!-- Suspicious Activity -->
			<div class="space-y-6">
				<!-- Suspicious IPs -->
				<div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
					<h2 class="text-xl font-semibold text-white mb-4">🚨 High-Volume Failed Attempts</h2>
					
					{#if suspiciousActivity.suspiciousIPs?.length === 0}
						<p class="text-gray-400 text-center py-4">No suspicious IP activity detected</p>
					{:else}
						<div class="grid gap-4">
							{#each suspiciousActivity.suspiciousIPs as suspicious}
								<div class="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
									<div class="flex items-center justify-between mb-2">
										<span class="font-mono text-red-400 font-semibold">{suspicious.ip_address}</span>
										<span class="text-red-300 font-bold">{suspicious.failed_attempts} failed attempts</span>
									</div>
									<div class="text-sm text-gray-300">
										Affected {suspicious.affected_users} users • 
										Actions: {suspicious.attempted_actions.join(', ')}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Rapid Signups -->
				<div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
					<h2 class="text-xl font-semibold text-white mb-4">⚡ Rapid Signup Attempts</h2>
					
					{#if suspiciousActivity.rapidSignups?.length === 0}
						<p class="text-gray-400 text-center py-4">No rapid signup activity detected</p>
					{:else}
						<div class="grid gap-4">
							{#each suspiciousActivity.rapidSignups as rapid}
								<div class="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
									<div class="flex items-center justify-between mb-2">
										<span class="font-mono text-yellow-400 font-semibold">{rapid.ip_address}</span>
										<span class="text-yellow-300 font-bold">{rapid.signup_attempts} signups in 1 hour</span>
									</div>
									<div class="text-xs text-gray-400">
										{formatDate(rapid.first_attempt)} → {formatDate(rapid.last_attempt)}
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Multi-IP Verification Attempts -->
				<div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
					<h2 class="text-xl font-semibold text-white mb-4">🔍 Multi-IP Verification Attempts</h2>
					
					{#if suspiciousActivity.suspiciousVerifications?.length === 0}
						<p class="text-gray-400 text-center py-4">No multi-IP verification attempts detected</p>
					{:else}
						<div class="grid gap-4">
							{#each suspiciousActivity.suspiciousVerifications as verification}
								<div class="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
									<div class="flex items-center justify-between mb-2">
										<span class="text-purple-400 font-semibold">{verification.email}</span>
										<span class="text-purple-300 font-bold">{verification.ip_count} different IPs</span>
									</div>
									<div class="text-sm text-gray-300">
										{verification.attempt_count} total attempts
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>
			</div>

		{:else if selectedTab === 'summary'}
			<!-- Audit Summary -->
			<div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
				<h2 class="text-xl font-semibold text-white mb-4">📊 Activity Summary (7 days)</h2>
				
				{#if auditSummary.length === 0}
					<p class="text-gray-400 text-center py-8">No activity data available</p>
				{:else}
					<div class="overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-white/10">
									<th class="text-left py-3 px-4 font-medium text-gray-300">Date</th>
									<th class="text-left py-3 px-4 font-medium text-gray-300">Action</th>
									<th class="text-center py-3 px-4 font-medium text-gray-300">Total</th>
									<th class="text-center py-3 px-4 font-medium text-gray-300">Success</th>
									<th class="text-center py-3 px-4 font-medium text-gray-300">Failed</th>
									<th class="text-center py-3 px-4 font-medium text-gray-300">Unique IPs</th>
								</tr>
							</thead>
							<tbody>
								{#each auditSummary as summary}
									<tr class="border-b border-white/5 hover:bg-white/5">
										<td class="py-3 px-4 text-gray-300">
											{new Date(summary.audit_date).toLocaleDateString()}
										</td>
										<td class="py-3 px-4 {getActionColor(summary.action)}">
											{summary.action.replace(/_/g, ' ')}
										</td>
										<td class="py-3 px-4 text-center text-white font-medium">
											{summary.total_attempts}
										</td>
										<td class="py-3 px-4 text-center text-green-400">
											{summary.successful_attempts}
										</td>
										<td class="py-3 px-4 text-center text-red-400">
											{summary.failed_attempts}
										</td>
										<td class="py-3 px-4 text-center text-blue-400">
											{summary.unique_ips}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	/* Custom scrollbar for the table */
	.overflow-x-auto::-webkit-scrollbar {
		height: 8px;
	}
	
	.overflow-x-auto::-webkit-scrollbar-track {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 4px;
	}
	
	.overflow-x-auto::-webkit-scrollbar-thumb {
		background: rgba(59, 130, 246, 0.5);
		border-radius: 4px;
	}
	
	.overflow-x-auto::-webkit-scrollbar-thumb:hover {
		background: rgba(59, 130, 246, 0.7);
	}
</style>