<!-- src/lib/components/dashboard/MainContent.svelte -->
<script>
	import { Users, Settings, Paperclip, Image, Smile, Mic, Send } from 'lucide';
	
	let messageInput = '';
	
	function handleSubmit() {
		if (messageInput.trim()) {
			console.log('Sending message:', messageInput);
			messageInput = '';
		}
	}
	
	function handleKeyPress(event) {
		if (event.key === 'Enter' && !event.shiftKey) {
			event.preventDefault();
			handleSubmit();
		}
	}
</script>

<section class="bg-gray-800 flex flex-col overflow-hidden">
	<!-- Channel Header -->
	<div class="p-6 border-b border-gray-700 bg-gray-900">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-xl font-bold text-white mb-1">General Discussion</h1>
				<p class="text-gray-400 text-sm">Main workspace channel for team collaboration</p>
			</div>
			<div class="flex gap-3">
				<button class="flex items-center gap-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-700 hover:border-blue-500 hover:text-white transition-all text-sm" aria-label="View channel members">
					<Users class="w-4 h-4" />
					<span class="hidden sm:inline">23 members</span>
				</button>
				<button class="w-10 h-10 bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-700 hover:border-blue-500 transition-all" aria-label="Channel settings">
					<Settings class="w-4 h-4 text-gray-400" />
				</button>
			</div>
		</div>
	</div>

	<!-- Messages Container -->
	<div class="flex-1 overflow-y-auto p-6">
		<!-- Welcome Banner -->
		<div class="text-center max-w-4xl mx-auto py-12">
			<div class="w-20 h-20 mx-auto mb-6 rounded-2xl overflow-hidden">
				<img src="https://i.ibb.co/N2GZgbxm/symbol1.png" alt="Hikari Logo" class="w-full h-full object-cover" />
			</div>
			
			<h2 class="text-3xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-text text-transparent mb-4">
				Welcome to Hikari Chat!
			</h2>
			<p class="text-gray-400 text-lg mb-12 leading-relaxed">
				Experience the future of messaging with AI-powered assistance and seamless cryptocurrency payments.
			</p>

			<!-- Feature Grid -->
			<div class="grid md:grid-cols-3 gap-6 mb-12">
				<div class="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:bg-gray-800 transition-all hover:border-blue-500/50 group">
					<div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
						<i class="fas fa-robot text-xl text-white"></i>
					</div>
					<h3 class="text-lg font-semibold text-white mb-2">AI Assistant</h3>
					<p class="text-gray-400 text-sm leading-relaxed">
						Get instant help with message summaries, translations, and smart suggestions.
					</p>
				</div>

				<div class="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:bg-gray-800 transition-all hover:border-blue-500/50 group">
					<div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
						<i class="fas fa-coins text-xl text-white"></i>
					</div>
					<h3 class="text-lg font-semibold text-white mb-2">Crypto Payments</h3>
					<p class="text-gray-400 text-sm leading-relaxed">
						Send and receive payments instantly with integrated Hikari Coin and other cryptocurrencies.
					</p>
				</div>

				<div class="bg-gray-900 border border-gray-700 rounded-xl p-6 hover:bg-gray-800 transition-all hover:border-blue-500/50 group">
					<div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
						<i class="fas fa-shield-alt text-xl text-white"></i>
					</div>
					<h3 class="text-lg font-semibold text-white mb-2">Enterprise Security</h3>
					<p class="text-gray-400 text-sm leading-relaxed">
						End-to-end encryption and Canadian compliance ensure your data stays protected.
					</p>
				</div>
			</div>
		</div>

		<!-- Sample AI Message -->
		<div class="mb-8">
			<div class="flex gap-4 p-4 rounded-lg hover:bg-gray-900/50 transition-all">
				<div class="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
					<i class="fas fa-robot text-white"></i>
				</div>
				<div class="flex-1">
					<div class="flex items-center gap-3 mb-2">
						<span class="font-semibold text-white">Hikari AI</span>
						<span class="text-xs text-gray-500">Today at 2:30 PM</span>
						<span class="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">AI</span>
					</div>
					<div class="text-gray-300 leading-relaxed">
						<p>Welcome to your new workspace! I'm here to help you with translations, summaries, and smart automation. Try asking me anything by typing <code class="bg-gray-700 text-blue-400 px-1 rounded">@ai</code> followed by your question.</p>
					</div>
					<div class="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
						<button class="hover:bg-gray-700 p-1 rounded text-gray-500 hover:text-gray-300 transition-colors" aria-label="Like message">
							<i class="fas fa-thumbs-up text-sm"></i>
						</button>
						<button class="hover:bg-gray-700 p-1 rounded text-gray-500 hover:text-gray-300 transition-colors" aria-label="Reply to message">
							<i class="fas fa-reply text-sm"></i>
						</button>
						<button class="hover:bg-gray-700 p-1 rounded text-gray-500 hover:text-gray-300 transition-colors" aria-label="Bookmark message">
							<i class="fas fa-bookmark text-sm"></i>
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Message Input Area -->
	<div class="p-6 bg-gray-900 border-t border-gray-700">
		<div class="bg-gray-800 border border-gray-600 rounded-xl p-4 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
			<div class="flex items-end gap-3">
				<!-- Left Actions -->
				<div class="flex gap-2">
					<button class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-all" aria-label="Attach file">
						<Paperclip class="w-4 h-4" />
					</button>
					<button class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-all" aria-label="Attach image">
						<Image class="w-4 h-4" />
					</button>
					<button class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-all" aria-label="Add emoji">
						<Smile class="w-4 h-4" />
					</button>
				</div>

				<!-- Message Input -->
				<div class="flex-1">
					<textarea
						bind:value={messageInput}
						on:keypress={handleKeyPress}
						placeholder="Type a message, or use @ai for AI assistance..."
						class="w-full bg-transparent text-white placeholder-gray-500 resize-none outline-none min-h-[20px] max-h-32"
						rows="1"
					></textarea>
				</div>

				<!-- Right Actions -->
				<div class="flex gap-2">
					<button class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-all" aria-label="Send payment">
						<i class="fas fa-coins"></i>
					</button>
					<button class="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-all" aria-label="Voice message">
						<Mic class="w-4 h-4" />
					</button>
					<button 
						on:click={handleSubmit}
						disabled={!messageInput.trim()}
						class="w-9 h-9 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center hover:from-blue-600 hover:to-blue-700 transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
						aria-label="Send message"
					>
						<Send class="w-4 h-4" />
					</button>
				</div>
			</div>
		</div>
	</div>
</section>