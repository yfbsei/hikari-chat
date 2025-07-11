<!-- src/lib/components/dashboard/MainContent.svelte -->
<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	
	// Component state
	let messageInput = '';
	let isComposing = false;
	
	// Initial welcome message
	let messages = [
		{
			id: 1,
			type: 'ai',
			author: 'Hikari AI',
			content: "Welcome to Hikari Chat! I'm your AI assistant, ready to help with translations, summaries, payment assistance, and smart automation. Try mentioning @ai followed by your question, or use @send to send payments.",
			timestamp: formatTime(new Date()),
			reactions: [],
			isSystem: true
		}
	];

	// Platform features configuration
	const platformFeatures = [
		{
			icon: 'fas fa-brain',
			title: 'AI Assistant',
			description: 'Get instant help with message summaries, translations, and smart suggestions.',
			gradient: 'from-blue-500 to-blue-600',
			action: () => setQuickMessage('@ai Hello! Can you help me get started with Hikari Chat?')
		},
		{
			icon: 'fas fa-layer-group',
			title: 'Crypto Payments',
			description: 'Send and receive payments instantly with integrated Hikari Coin and other cryptocurrencies.',
			gradient: 'from-yellow-500 to-yellow-600',
			action: () => setQuickMessage('@send 50 alex')
		},
		{
			icon: 'fas fa-shield-halved',
			title: 'Enterprise Security',
			description: 'End-to-end encryption and Canadian compliance ensure your data stays protected.',
			gradient: 'from-green-500 to-green-600',
			action: () => setQuickMessage('@ai Tell me about Hikari Chat\'s security features')
		}
	];

	// AI response templates
	const aiResponses = {
		payment: "I can assist with Hikari Coin payments! You can send HC to friends, check exchange rates, or set up automated payments. What would you like to do?",
		security: "Hikari Chat uses Signal Protocol with end-to-end encryption to keep your messages secure. All data stays in Canada and complies with PIPEDA privacy laws.",
		help: "Here are some things I can help you with:\n• Send payments (@send 100 username)\n• Summarize conversations\n• Automate workflows\n• Search message history\n• Security information\n\nWhat would you like to try first?",
		default: "I'm processing your request! I can help with payments, summaries, and more. Try asking me something specific or use commands like @send or @ai."
	};

	// Reactive derived values
	$: user = $page.data?.user;
	$: hasUserMessages = messages.some(m => m.type === 'user');

	// Core message handling
	function handleSubmit() {
		const trimmedMessage = messageInput.trim();
		if (!trimmedMessage) return;

		const newMessage = createMessage(trimmedMessage, 'user');
		addMessage(newMessage);
		
		messageInput = '';
		
		if (shouldTriggerAI(trimmedMessage)) {
			handleAIResponse(trimmedMessage);
		}
	}

	function createMessage(content, type, author = null) {
		return {
			id: Date.now() + Math.random(), // Better unique ID generation
			type,
			author: author || (type === 'user' ? (user?.display_name || user?.username || 'You') : 'Hikari AI'),
			content,
			timestamp: formatTime(new Date()),
			reactions: []
		};
	}

	function addMessage(message) {
		messages = [...messages, message];
		scrollToBottom();
	}

	// AI interaction logic
	function shouldTriggerAI(content) {
		const triggers = ['@ai', '@send', 'hikari', 'payment', 'help', 'security'];
		return triggers.some(trigger => content.toLowerCase().includes(trigger));
	}

	function handleAIResponse(userMessage) {
		isComposing = true;
		
		setTimeout(() => {
			const response = generateAIResponse(userMessage);
			const aiMessage = createMessage(response, 'ai', 'Hikari AI');
			addMessage(aiMessage);
			isComposing = false;
		}, 1200);
	}

	function generateAIResponse(userMessage) {
		const message = userMessage.toLowerCase();
		
		if (message.includes('@send')) {
			return "Payment request processed! Use the format '@send [amount] [username]' to send Hikari Coin. For example: '@send 100 alex' sends 100 HC to Alex.";
		}
		
		if (message.includes('payment') || message.includes('hikari coin') || message.includes(' hc')) {
			return aiResponses.payment;
		}
		
		if (message.includes('security') || message.includes('encryption')) {
			return aiResponses.security;
		}
		
		if (message.includes('help') || message.includes('started')) {
			return aiResponses.help;
		}
		
		return aiResponses.default;
	}

	// UI utility functions
	function setQuickMessage(message) {
		messageInput = message;
		document.querySelector('#message-input')?.focus();
	}

	function handleKeyPress(event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit();
		}
	}

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

	// Message styling helpers
	function getMessageStyles(type) {
		return type === 'ai' 
			? 'bg-gradient-to-r from-purple-500 to-purple-600'
			: 'bg-gradient-to-r from-blue-500 to-blue-600';
	}

	function getMessageBadge(type) {
		return type === 'ai' ? 'AI' : 'YOU';
	}

	function getMessageIcon(type) {
		return type === 'ai' ? 'fas fa-brain' : 'fas fa-user';
	}

	// Text processing for highlighting
	function processMessageContent(content) {
		return content
			.replace(/@ai/g, '<code class="bg-gray-700 text-purple-400 px-1 rounded">@ai</code>')
			.replace(/@send/g, '<code class="bg-gray-700 text-blue-400 px-1 rounded">@send</code>')
			.replace(/Hikari Coin|HC(?!\w)/g, '<span class="text-yellow-400 font-medium">$&</span>');
	}

	// Utility functions
	function formatTime(date) {
		const now = new Date();
		const diffMs = now - date;
		const diffMins = Math.floor(diffMs / 60000);
		
		if (diffMins < 1) return 'Now';
		if (diffMins < 60) return `${diffMins}m ago`;
		if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
		
		return date.toLocaleTimeString('en-CA', { 
			hour: 'numeric', 
			minute: '2-digit',
			hour12: true 
		});
	}

	function scrollToBottom() {
		setTimeout(() => {
			const container = document.querySelector('.messages-container');
			if (container) {
				container.scrollTop = container.scrollHeight;
			}
		}, 100);
	}

	// Lifecycle
	onMount(() => {
		scrollToBottom();
	});
</script>

<section class="bg-gray-800 flex flex-col overflow-hidden h-full">
	<!-- Messages Container -->
	<div class="flex-1 overflow-y-auto messages-container">
		<!-- Welcome Section -->
		{#if !hasUserMessages}
			<div class="text-center max-w-4xl mx-auto py-12 px-6">
				<!-- Logo & Branding -->
				<header class="mb-12">
					<div class="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden shadow-lg shadow-blue-500/20">
						<img 
							src="https://i.ibb.co/N2GZgbxm/symbol1.png" 
							alt="Hikari Chat Logo" 
							class="w-full h-full object-cover" 
						/>
					</div>
					
					<h1 class="text-3xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent mb-4">
						Welcome to Hikari Chat!
					</h1>
					<p class="text-gray-400 text-lg leading-relaxed max-w-2xl mx-auto">
						Experience the future of messaging with AI-powered assistance and seamless cryptocurrency payments.
					</p>
				</header>

				<!-- Feature Grid -->
				<div class="grid md:grid-cols-3 gap-6 mb-8">
					{#each platformFeatures as feature}
						<button 
							type="button"
							on:click={feature.action}
							class="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:bg-gray-800 transition-all hover:border-blue-500/50 group cursor-pointer text-left"
							aria-label="Try {feature.title}"
						>
							<div class="w-12 h-12 bg-gradient-to-r {feature.gradient} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
								<i class="{feature.icon} text-xl text-white" aria-hidden="true"></i>
							</div>
							<h2 class="text-lg font-semibold text-white mb-2">{feature.title}</h2>
							<p class="text-gray-400 text-sm leading-relaxed">
								{feature.description}
							</p>
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Messages List -->
		<div class="space-y-4 p-6" role="log" aria-label="Chat messages">
			{#each messages as message (message.id)}
				<article class="flex gap-4 p-4 rounded-lg hover:bg-gray-900/50 transition-all group">
					<!-- Avatar -->
					<div class="w-10 h-10 {getMessageStyles(message.type)} rounded-full flex items-center justify-center flex-shrink-0">
						<i class="{getMessageIcon(message.type)} text-white" aria-hidden="true"></i>
					</div>
					
					<!-- Message Content -->
					<div class="flex-1 min-w-0">
						<!-- Message Header -->
						<header class="flex items-center gap-3 mb-2">
							<span class="font-semibold text-white">{message.author}</span>
							<time class="text-xs text-gray-500">{message.timestamp}</time>
							<span class="bg-gradient-to-r {getMessageStyles(message.type)} text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
								{getMessageBadge(message.type)}
							</span>
						</header>
						
						<!-- Message Text -->
						<div class="text-gray-300 leading-relaxed whitespace-pre-line">
							<p>{@html processMessageContent(message.content)}</p>
						</div>
						
						<!-- Message Reactions -->
						{#if message.reactions.length > 0}
							<div class="flex gap-2 mt-3" role="group" aria-label="Message reactions">
								{#each message.reactions as reaction}
									<button 
										type="button"
										class="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded-full text-xs hover:bg-gray-600 transition-colors"
										aria-label="{reaction.emoji} reaction, {reaction.count} reactions"
									>
										<span>{reaction.emoji}</span>
										<span class="text-gray-400">{reaction.count}</span>
									</button>
								{/each}
							</div>
						{/if}
						
						<!-- Message Actions -->
						<div class="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity" role="group" aria-label="Message actions">
							<button 
								type="button"
								on:click={() => addReaction(message.id, '👍')}
								class="hover:bg-gray-700 p-1 rounded text-gray-500 hover:text-gray-300 transition-colors" 
								title="Like message"
								aria-label="Like this message"
							>
								<i class="fas fa-thumbs-up text-sm" aria-hidden="true"></i>
							</button>
							<button 
								type="button"
								class="hover:bg-gray-700 p-1 rounded text-gray-500 hover:text-gray-300 transition-colors" 
								title="Reply to message"
								aria-label="Reply to this message"
							>
								<i class="fas fa-reply text-sm" aria-hidden="true"></i>
							</button>
							<button 
								type="button"
								class="hover:bg-gray-700 p-1 rounded text-gray-500 hover:text-gray-300 transition-colors" 
								title="More actions"
								aria-label="More message actions"
							>
								<i class="fas fa-ellipsis-h text-sm" aria-hidden="true"></i>
							</button>
						</div>
					</div>
				</article>
			{/each}
		</div>
	</div>

	<!-- Message Input Area -->
	<footer class="p-4 bg-gray-900 border-t border-gray-700">
		<div class="bg-gray-800 border border-gray-600 rounded-xl focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all">
			<div class="flex items-center gap-3 p-3">
				<!-- Left Actions -->
				<div class="flex gap-2 flex-shrink-0" role="group" aria-label="Attachment options">
					<button 
						type="button"
						class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-all" 
						title="Attach file"
						aria-label="Attach file"
					>
						<i class="fas fa-paperclip text-sm" aria-hidden="true"></i>
					</button>
					<button 
						type="button"
						class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-all" 
						title="Attach image"
						aria-label="Attach image"
					>
						<i class="fas fa-image text-sm" aria-hidden="true"></i>
					</button>
					<button 
						type="button"
						class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-all" 
						title="Add emoji"
						aria-label="Add emoji"
					>
						<i class="fas fa-smile text-sm" aria-hidden="true"></i>
					</button>
				</div>

				<!-- Message Input -->
				<div class="flex-1 min-w-0">
					<input
						id="message-input"
						type="text"
						bind:value={messageInput}
						on:keypress={handleKeyPress}
						placeholder="Type a message, use @ai for AI assistance, or @send to send payments..."
						class="w-full bg-transparent text-white placeholder-gray-500 outline-none border-none text-sm py-2"
						aria-label="Type your message"
					/>
				</div>

				<!-- Right Actions -->
				<div class="flex gap-2 flex-shrink-0" role="group" aria-label="Message options">
					<button 
						type="button"
						class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-all" 
						title="Send Hikari Coin"
						aria-label="Send Hikari Coin payment"
					>
						<i class="fas fa-coins text-sm" aria-hidden="true"></i>
					</button>
					<button 
						type="button"
						class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-all" 
						title="Voice message"
						aria-label="Send voice message"
					>
						<i class="fas fa-microphone text-sm" aria-hidden="true"></i>
					</button>
				</div>
			</div>
		</div>

		<!-- AI Typing Indicator -->
		{#if isComposing}
			<div class="flex items-center gap-2 mt-2 text-gray-500 text-sm" role="status" aria-label="AI is composing response">
				<div class="flex gap-1" aria-hidden="true">
					<div class="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
					<div class="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
					<div class="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
				</div>
				<span>Hikari AI is thinking...</span>
			</div>
		{/if}
	</footer>
</section>

<style>
	/* Custom scrollbar styling */
	:global(.messages-container::-webkit-scrollbar) {
		width: 6px;
	}
	
	:global(.messages-container::-webkit-scrollbar-track) {
		background: transparent;
	}
	
	:global(.messages-container::-webkit-scrollbar-thumb) {
		background: rgba(75, 85, 99, 0.5);
		border-radius: 3px;
	}
	
	:global(.messages-container::-webkit-scrollbar-thumb:hover) {
		background: rgba(75, 85, 99, 0.8);
	}
	
	/* Bounce animation for typing indicator */
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
	
	/* Message content styling */
	:global(.messages-container code) {
		font-family: 'Fira Code', 'Courier New', monospace;
		font-size: 0.875em;
		font-weight: 500;
	}
	
	/* Enhanced focus states for accessibility */
	input:focus-visible,
	button:focus-visible {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}
</style>