<!-- src/lib/components/dashboard/MainContent.svelte -->
<script>
	let messageInput = '';
	let isComposing = false;
	
	// Sample messages data
	let messages = [
		{
			id: 1,
			type: 'ai',
			author: 'Hikari AI',
			content: "Welcome to your new workspace! I'm here to help you with translations, summaries, and smart automation. Try asking me anything by typing @ai followed by your question.",
			timestamp: 'Today at 2:30 PM',
			reactions: []
		}
	];
	
	// Handle message submission
	function handleSubmit() {
		if (messageInput.trim()) {
			const newMessage = {
				id: messages.length + 1,
				type: 'user',
				author: 'You',
				content: messageInput.trim(),
				timestamp: 'Now',
				reactions: []
			};
			
			messages = [...messages, newMessage];
			messageInput = '';
			
			// Simulate AI response for @ai mentions
			if (newMessage.content.toLowerCase().includes('@ai')) {
				setTimeout(() => {
					const aiResponse = {
						id: messages.length + 1,
						type: 'ai',
						author: 'Hikari AI',
						content: "I received your message! I'm processing your request and will help you shortly.",
						timestamp: 'Now',
						reactions: []
					};
					messages = [...messages, aiResponse];
				}, 1000);
			}
		}
	}
	
	function handleKeyPress(event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit();
		}
	}
	
	// Auto-resize textarea
	function autoResize(event) {
		const textarea = event.target;
		textarea.style.height = 'auto';
		textarea.style.height = Math.min(textarea.scrollHeight, 128) + 'px';
	}
	
	// Message actions
	function addReaction(messageId, emoji) {
		messages = messages.map(msg => {
			if (msg.id === messageId) {
				const existingReaction = msg.reactions.find(r => r.emoji === emoji);
				if (existingReaction) {
					existingReaction.count++;
				} else {
					msg.reactions.push({ emoji, count: 1 });
				}
			}
			return msg;
		});
	}
	
	function getMessageStyles(type) {
		return type === 'ai' 
			? 'bg-gradient-to-r from-purple-500 to-purple-600'
			: 'bg-gradient-to-r from-blue-500 to-blue-600';
	}
	
	function getMessageBadge(type) {
		return type === 'ai' ? 'AI' : 'USER';
	}
	
	function getMessageIcon(type) {
		return type === 'ai' ? 'fas fa-robot' : 'fas fa-user';
	}
</script>

<section class="bg-gray-800 flex flex-col overflow-hidden h-full">
	<!-- Messages Container -->
	<div class="flex-1 overflow-y-auto">
		<!-- Welcome Section (only show when no user messages) -->
		{#if messages.filter(m => m.type === 'user').length === 0}
			<div class="text-center max-w-4xl mx-auto py-12 px-6">
				<!-- Logo -->
				<div class="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/20">
					<img src="https://i.ibb.co/N2GZgbxm/symbol1.png" alt="Hikari Logo" class="w-full h-full object-cover" />
				</div>
				
				<!-- Welcome Message -->
				<h2 class="text-3xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent mb-4">
					Welcome to Hikari Chat!
				</h2>
				<p class="text-gray-400 text-lg mb-12 leading-relaxed max-w-2xl mx-auto">
					Experience the future of messaging with AI-powered assistance and seamless cryptocurrency payments.
				</p>

				<!-- Feature Grid -->
				<div class="grid md:grid-cols-3 gap-6 mb-12">
					{#each [
						{
							icon: 'fas fa-robot',
							title: 'AI Assistant',
							description: 'Get instant help with message summaries, translations, and smart suggestions.',
							gradient: 'from-blue-500 to-blue-600'
						},
						{
							icon: 'fas fa-coins',
							title: 'Crypto Payments',
							description: 'Send and receive payments instantly with integrated Hikari Coin and other cryptocurrencies.',
							gradient: 'from-yellow-500 to-yellow-600'
						},
						{
							icon: 'fas fa-shield-alt',
							title: 'Enterprise Security',
							description: 'End-to-end encryption and Canadian compliance ensure your data stays protected.',
							gradient: 'from-green-500 to-green-600'
						}
					] as feature}
						<div class="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:bg-gray-800 transition-all hover:border-blue-500/50 group cursor-pointer">
							<div class="w-12 h-12 bg-gradient-to-r {feature.gradient} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
								<i class="{feature.icon} text-xl text-white"></i>
							</div>
							<h3 class="text-lg font-semibold text-white mb-2">{feature.title}</h3>
							<p class="text-gray-400 text-sm leading-relaxed">
								{feature.description}
							</p>
						</div>
					{/each}
				</div>

				<!-- Quick Start Actions -->
				<div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
					<button 
						on:click={() => messageInput = '@ai Hello! Can you help me get started?'}
						class="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all hover:scale-105 font-medium"
					>
						<i class="fas fa-robot"></i>
						Try AI Assistant
					</button>
					<button 
						on:click={() => messageInput = 'I\'d like to send a payment'}
						class="flex items-center gap-2 px-6 py-3 bg-gray-800 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 hover:border-blue-500 hover:text-white transition-all font-medium"
					>
						<i class="fas fa-coins"></i>
						Send Payment
					</button>
				</div>
			</div>
		{/if}

		<!-- Messages List -->
		<div class="space-y-4 p-6">
			{#each messages as message (message.id)}
				<div class="flex gap-4 p-4 rounded-lg hover:bg-gray-900/50 transition-all group">
					<!-- Avatar -->
					<div class="w-10 h-10 {getMessageStyles(message.type)} rounded-full flex items-center justify-center flex-shrink-0">
						<i class="{getMessageIcon(message.type)} text-white"></i>
					</div>
					
					<!-- Message Content -->
					<div class="flex-1 min-w-0">
						<!-- Message Header -->
						<div class="flex items-center gap-3 mb-2">
							<span class="font-semibold text-white">{message.author}</span>
							<span class="text-xs text-gray-500">{message.timestamp}</span>
							<span class="bg-gradient-to-r {getMessageStyles(message.type)} text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
								{getMessageBadge(message.type)}
							</span>
						</div>
						
						<!-- Message Text -->
						<div class="text-gray-300 leading-relaxed">
							<p>{@html message.content.replace(/@ai/g, '<code class="bg-gray-700 text-blue-400 px-1 rounded">@ai</code>')}</p>
						</div>
						
						<!-- Message Reactions -->
						{#if message.reactions.length > 0}
							<div class="flex gap-2 mt-3">
								{#each message.reactions as reaction}
									<button class="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded-full text-xs hover:bg-gray-600 transition-colors">
										<span>{reaction.emoji}</span>
										<span class="text-gray-400">{reaction.count}</span>
									</button>
								{/each}
							</div>
						{/if}
						
						<!-- Message Actions -->
						<div class="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
							<button 
								on:click={() => addReaction(message.id, '👍')}
								class="hover:bg-gray-700 p-1 rounded text-gray-500 hover:text-gray-300 transition-colors" 
								aria-label="Like message"
							>
								<i class="fas fa-thumbs-up text-sm"></i>
							</button>
							<button class="hover:bg-gray-700 p-1 rounded text-gray-500 hover:text-gray-300 transition-colors" aria-label="Reply to message">
								<i class="fas fa-reply text-sm"></i>
							</button>
							<button class="hover:bg-gray-700 p-1 rounded text-gray-500 hover:text-gray-300 transition-colors" aria-label="More actions">
								<i class="fas fa-ellipsis-h text-sm"></i>
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Message Input Area -->
	<div class="p-6 bg-gray-900 border-t border-gray-700">
		<div class="bg-gray-800 border border-gray-600 rounded-xl p-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
			<div class="flex items-end gap-3">
				<!-- Left Actions -->
				<div class="flex gap-2 flex-shrink-0">
					<button class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-all" aria-label="Attach file">
						<i class="fas fa-paperclip text-sm"></i>
					</button>
					<button class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-all" aria-label="Attach image">
						<i class="fas fa-image text-sm"></i>
					</button>
					<button class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-all" aria-label="Add emoji">
						<i class="fas fa-smile text-sm"></i>
					</button>
				</div>

				<!-- Message Input -->
				<div class="flex-1 min-w-0">
					<textarea
						bind:value={messageInput}
						on:keypress={handleKeyPress}
						on:input={autoResize}
						placeholder="Type a message, or use @ai for AI assistance..."
						class="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none min-h-[24px] max-h-32 leading-6"
						rows="1"
					></textarea>
				</div>

				<!-- Right Actions -->
				<div class="flex gap-2 flex-shrink-0">
					<button class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-all" aria-label="Send payment">
						<i class="fas fa-coins text-sm"></i>
					</button>
					<button class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-all" aria-label="Voice message">
						<i class="fas fa-microphone text-sm"></i>
					</button>
					<button 
						on:click={handleSubmit}
						disabled={!messageInput.trim()}
						class="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center hover:from-blue-600 hover:to-blue-700 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:from-blue-500 disabled:hover:to-blue-600"
						aria-label="Send message"
					>
						<i class="fas fa-paper-plane text-sm"></i>
					</button>
				</div>
			</div>
		</div>

		<!-- Typing Indicator -->
		{#if isComposing}
			<div class="flex items-center gap-2 mt-2 text-gray-500 text-sm">
				<div class="flex gap-1">
					<div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
					<div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
					<div class="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
				</div>
				<span>AI is thinking...</span>
			</div>
		{/if}
	</div>
</section>

<style>
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
	
	/* Smooth animations */
	.animate-bounce {
		animation: bounce 1.4s infinite;
	}
	
	@keyframes bounce {
		0%, 80%, 100% {
			transform: scale(0);
		}
		40% {
			transform: scale(1);
		}
	}
</style>