<!-- src/routes/auth/login/+page.svelte -->
<script>
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let currentForm = 'login';
	let passwordVisible = false;
	let signupPasswordVisible = false;
	let confirmPasswordVisible = false;
	let isLoading = false;

	// Form data
	let loginData = { email: '', password: '' };
	let forgotData = { email: '' };
	let signupData = { username: '', email: '', password: '', confirmPassword: '', agreeTerms: false };

	$: form = $page.form;

	onMount(() => {
		if (currentForm === 'login') {
			document.getElementById('email')?.focus();
		}
	});

	// Toggle functions
	const togglePassword = () => passwordVisible = !passwordVisible;
	const toggleSignupPassword = () => signupPasswordVisible = !signupPasswordVisible;
	const toggleConfirmPassword = () => confirmPasswordVisible = !confirmPasswordVisible;

	// Form navigation
	function showForgotPassword() {
		currentForm = 'forgot';
		if (loginData.email) forgotData.email = loginData.email;
		setTimeout(() => document.getElementById('resetEmail')?.focus(), 100);
	}

	function showCreateAccount() {
		currentForm = 'signup';
		setTimeout(() => document.getElementById('username')?.focus(), 100);
	}

	function showLoginForm() {
		currentForm = 'login';
		setTimeout(() => document.getElementById('email')?.focus(), 100);
	}

	// Validation
	function validateSignup() {
		if (!signupData.username || !signupData.email || !signupData.password || !signupData.confirmPassword) {
			alert('Please fill in all required fields');
			return false;
		}
		if (signupData.password.length < 8) {
			alert('Password must be at least 8 characters long');
			return false;
		}
		if (signupData.password !== signupData.confirmPassword) {
			alert('Passwords do not match');
			return false;
		}
		if (!signupData.agreeTerms) {
			alert('Please agree to the Terms of Service and Privacy Policy');
			return false;
		}
		return true;
	}

	// Enhanced form submission handler
	const handleSubmit = () => {
		return ({ form, data, action, cancel }) => {
			isLoading = true;
			
			if (action.search === '?/signup' && !validateSignup()) {
				cancel();
				isLoading = false;
				return;
			}

			return async ({ result, update }) => {
				console.log('Form result:', result);
				
				try {
					if (result.type === 'success') {
						if (action.search === '?/login') {
							// Login success - redirect will be handled by SvelteKit automatically
							console.log('Login successful - redirect should happen automatically');
							return;
						} else if (action.search === '?/signup') {
							alert(`Account created successfully!\n\nWelcome to Hikari Chat, ${signupData.username}!`);
							showLoginForm();
						} else if (action.search === '?/forgot') {
							alert(`Password reset link sent to: ${forgotData.email}\n\nPlease check your email and follow the instructions to reset your password.`);
							showLoginForm();
						}
					} else if (result.type === 'redirect') {
						console.log('Redirect detected, location:', result.location);
						// Let SvelteKit handle the redirect
						return;
					} else if (result.type === 'failure') {
						alert(result.data?.message || 'An error occurred. Please try again.');
					} else if (result.type === 'error') {
						console.error('Form error:', result.error);
						alert('An unexpected error occurred. Please try again.');
					}
				} finally {
					isLoading = false;
					await update();
				}
			};
		};
	};
</script>

<svelte:head>
	<title>Hikari Chat - Login</title>
	<link rel="icon" type="image/png" href="https://i.ibb.co/5hCsg9gj/symbol.png">
</svelte:head>

<!-- Floating Particles -->
<div class="particle fixed w-1 h-1 bg-blue-500/20 rounded-full top-[15%] left-[25%] pointer-events-none z-[-1]"></div>
<div class="particle fixed w-1.5 h-1.5 bg-blue-500/20 rounded-full top-[70%] left-[75%] pointer-events-none z-[-1]"></div>
<div class="particle fixed w-0.5 h-0.5 bg-blue-500/20 rounded-full top-[35%] left-[70%] pointer-events-none z-[-1]"></div>
<div class="particle fixed w-1.5 h-1.5 bg-blue-500/20 rounded-full top-[80%] left-[15%] pointer-events-none z-[-1]"></div>

<!-- Main Container -->
<div class="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700">
	<!-- Background Effects -->
	<div class="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-blue-600/5"></div>
	
	<div class="w-full max-w-md p-6 relative z-10">
		<!-- Glass Card -->
		<div class="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-12 shadow-2xl relative overflow-hidden">
			<!-- Top Border Gradient -->
			<div class="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 opacity-60"></div>
			
			<!-- Logo Section -->
			<div class="text-center mb-12">
				<div class="inline-flex items-center gap-3 mb-4">
					<img src="https://i.ibb.co/N2GZgbxm/symbol1.png" alt="Hikari Chat" class="w-12 h-12 rounded-xl shadow-lg shadow-blue-500/30">
					<div class="text-2xl font-bold bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 bg-clip-text text-transparent">Hikari Chat</div>
				</div>
				<div class="text-gray-300 text-base mb-2">
					{#if currentForm === 'login'}Welcome back!
					{:else if currentForm === 'forgot'}Reset Password
					{:else}Create Account{/if}
				</div>
				<div class="text-gray-400 text-sm leading-relaxed">
					{#if currentForm === 'login'}Sign in to your account to continue
					{:else if currentForm === 'forgot'}Enter your email to receive a reset link
					{:else}Join Hikari Chat to get started{/if}
				</div>
			</div>

			<!-- Login Form -->
			{#if currentForm === 'login'}
				<form method="POST" action="?/login" use:enhance={handleSubmit()} class="mb-6">
					<!-- Email Input -->
					<div class="mb-6 group">
						<label for="email" class="block text-gray-300 text-sm font-medium mb-2 transition-colors group-focus-within:text-blue-400">Email Address</label>
						<div class="relative">
							<i class="fas fa-envelope absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm transition-colors group-focus-within:text-blue-400"></i>
							<input 
								type="email" 
								id="email" 
								name="email" 
								bind:value={loginData.email}
								class="w-full bg-white/3 border border-gray-600 rounded-xl pl-11 pr-4 py-4 text-white text-sm backdrop-blur-md transition-all focus:outline-none focus:border-blue-500 focus:bg-white/5 focus:shadow-lg focus:shadow-blue-500/10 placeholder-gray-500" 
								placeholder="Enter your email" 
								required
							>
						</div>
					</div>

					<!-- Password Input -->
					<div class="mb-6 group">
						<label for="password" class="block text-gray-300 text-sm font-medium mb-2 transition-colors group-focus-within:text-blue-400">Password</label>
						<div class="relative">
							<i class="fas fa-lock absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm transition-colors group-focus-within:text-blue-400"></i>
							<input 
								type={passwordVisible ? 'text' : 'password'}
								id="password" 
								name="password" 
								bind:value={loginData.password}
								class="w-full bg-white/3 border border-gray-600 rounded-xl pl-11 pr-12 py-4 text-white text-sm backdrop-blur-md transition-all focus:outline-none focus:border-blue-500 focus:bg-white/5 focus:shadow-lg focus:shadow-blue-500/10 placeholder-gray-500" 
								placeholder="Enter your password" 
								required
							>
							<button 
								type="button" 
								on:click={togglePassword}
								class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 p-2 rounded-md hover:bg-white/5 transition-all"
							>
								<i class="fas {passwordVisible ? 'fa-eye-slash' : 'fa-eye'}"></i>
							</button>
						</div>
					</div>

					<!-- Forgot Password Link -->
					<div class="flex justify-center mb-6">
						<button 
							type="button" 
							on:click={showForgotPassword}
							class="text-gray-300 text-sm hover:text-blue-400 px-2 py-1 rounded-md hover:bg-blue-500/10 transition-all"
						>
							Forgot password?
						</button>
					</div>

					<!-- Login Button -->
					<button 
						type="submit" 
						disabled={isLoading}
						class="w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 text-white font-semibold py-4 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-px transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mb-6 flex items-center justify-center gap-2"
					>
						{#if isLoading}
							<i class="fas fa-spinner fa-spin"></i>
							Signing in...
						{:else}
							<i class="fas fa-sign-in-alt"></i>
							Sign In
						{/if}
					</button>
				</form>
			{/if}

			<!-- Forgot Password Form -->
			{#if currentForm === 'forgot'}
				<form method="POST" action="?/forgot" use:enhance={handleSubmit()} class="mb-6">
					<!-- Email Input for Reset -->
					<div class="mb-6 group">
						<label for="resetEmail" class="block text-gray-300 text-sm font-medium mb-2 transition-colors group-focus-within:text-blue-400">Email Address</label>
						<div class="relative">
							<i class="fas fa-envelope absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm transition-colors group-focus-within:text-blue-400"></i>
							<input 
								type="email" 
								id="resetEmail" 
								name="email" 
								bind:value={forgotData.email}
								class="w-full bg-white/3 border border-gray-600 rounded-xl pl-11 pr-4 py-4 text-white text-sm backdrop-blur-md transition-all focus:outline-none focus:border-blue-500 focus:bg-white/5 focus:shadow-lg focus:shadow-blue-500/10 placeholder-gray-500" 
								placeholder="Enter your email address" 
								required
							>
						</div>
						<div class="mt-2 text-gray-400 text-xs leading-relaxed">
							We'll send you a link to reset your password
						</div>
					</div>

					<!-- Reset Button -->
					<button 
						type="submit" 
						disabled={isLoading}
						class="w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 text-white font-semibold py-4 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-px transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mb-6 flex items-center justify-center gap-2"
					>
						{#if isLoading}
							<i class="fas fa-spinner fa-spin"></i>
							Sending...
						{:else}
							<i class="fas fa-paper-plane"></i>
							Send Reset Link
						{/if}
					</button>

					<!-- Back to Login -->
					<button 
						type="button" 
						on:click={showLoginForm}
						class="w-full bg-transparent border border-white/10 text-gray-300 font-medium py-4 rounded-xl hover:bg-white/5 hover:border-blue-500 hover:text-white transition-all backdrop-blur-md mb-6 flex items-center justify-center gap-2"
					>
						<i class="fas fa-arrow-left"></i>
						Back to Sign In
					</button>
				</form>
			{/if}

			<!-- Create Account Form -->
			{#if currentForm === 'signup'}
				<form method="POST" action="?/signup" use:enhance={handleSubmit()} class="mb-6">
					<!-- Username Input -->
					<div class="mb-6 group">
						<label for="username" class="block text-gray-300 text-sm font-medium mb-2 transition-colors group-focus-within:text-blue-400">Username</label>
						<div class="relative">
							<i class="fas fa-user absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm transition-colors group-focus-within:text-blue-400"></i>
							<input 
								type="text" 
								id="username" 
								name="username" 
								bind:value={signupData.username}
								class="w-full bg-white/3 border border-gray-600 rounded-xl pl-11 pr-4 py-4 text-white text-sm backdrop-blur-md transition-all focus:outline-none focus:border-blue-500 focus:bg-white/5 focus:shadow-lg focus:shadow-blue-500/10 placeholder-gray-500" 
								placeholder="Choose a username" 
								required
							>
						</div>
					</div>

					<!-- Email Input -->
					<div class="mb-6 group">
						<label for="signupEmail" class="block text-gray-300 text-sm font-medium mb-2 transition-colors group-focus-within:text-blue-400">Email Address</label>
						<div class="relative">
							<i class="fas fa-envelope absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm transition-colors group-focus-within:text-blue-400"></i>
							<input 
								type="email" 
								id="signupEmail" 
								name="email" 
								bind:value={signupData.email}
								class="w-full bg-white/3 border border-gray-600 rounded-xl pl-11 pr-4 py-4 text-white text-sm backdrop-blur-md transition-all focus:outline-none focus:border-blue-500 focus:bg-white/5 focus:shadow-lg focus:shadow-blue-500/10 placeholder-gray-500" 
								placeholder="Enter your email address" 
								required
							>
						</div>
					</div>

					<!-- Password Input -->
					<div class="mb-6 group">
						<label for="signupPassword" class="block text-gray-300 text-sm font-medium mb-2 transition-colors group-focus-within:text-blue-400">Password</label>
						<div class="relative">
							<i class="fas fa-lock absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm transition-colors group-focus-within:text-blue-400"></i>
							<input 
								type={signupPasswordVisible ? 'text' : 'password'}
								id="signupPassword" 
								name="password" 
								bind:value={signupData.password}
								class="w-full bg-white/3 border border-gray-600 rounded-xl pl-11 pr-12 py-4 text-white text-sm backdrop-blur-md transition-all focus:outline-none focus:border-blue-500 focus:bg-white/5 focus:shadow-lg focus:shadow-blue-500/10 placeholder-gray-500" 
								placeholder="Create a password" 
								required
							>
							<button 
								type="button" 
								on:click={toggleSignupPassword}
								class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 p-2 rounded-md hover:bg-white/5 transition-all"
							>
								<i class="fas {signupPasswordVisible ? 'fa-eye-slash' : 'fa-eye'}"></i>
							</button>
						</div>
						<div class="mt-2 text-gray-400 text-xs leading-relaxed">
							Password must be at least 8 characters long
						</div>
					</div>

					<!-- Confirm Password Input -->
					<div class="mb-6 group">
						<label for="confirmPassword" class="block text-gray-300 text-sm font-medium mb-2 transition-colors group-focus-within:text-blue-400">Confirm Password</label>
						<div class="relative">
							<i class="fas fa-lock absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm transition-colors group-focus-within:text-blue-400"></i>
							<input 
								type={confirmPasswordVisible ? 'text' : 'password'}
								id="confirmPassword" 
								name="confirmPassword" 
								bind:value={signupData.confirmPassword}
								class="w-full bg-white/3 border border-gray-600 rounded-xl pl-11 pr-12 py-4 text-white text-sm backdrop-blur-md transition-all focus:outline-none focus:border-blue-500 focus:bg-white/5 focus:shadow-lg focus:shadow-blue-500/10 placeholder-gray-500" 
								placeholder="Confirm your password" 
								required
							>
							<button 
								type="button" 
								on:click={toggleConfirmPassword}
								class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-300 p-2 rounded-md hover:bg-white/5 transition-all"
							>
								<i class="fas {confirmPasswordVisible ? 'fa-eye-slash' : 'fa-eye'}"></i>
							</button>
						</div>
					</div>

					<!-- Terms and Privacy -->
					<div class="mb-6">
						<label class="flex items-start gap-2 text-gray-300 text-sm cursor-pointer hover:text-white transition-colors leading-relaxed">
							<input 
								type="checkbox" 
								name="agreeTerms"
								bind:checked={signupData.agreeTerms}
								class="w-4 h-4 border border-gray-600 rounded-md bg-transparent checked:bg-gradient-to-r checked:from-blue-500 checked:to-blue-600 checked:border-blue-500 transition-all appearance-none relative mt-0.5 flex-shrink-0" 
								required
							>
							<span>I agree to the <a href="#" class="text-blue-400 hover:text-blue-300 hover:underline transition-colors">Terms of Service</a> and <a href="#" class="text-blue-400 hover:text-blue-300 hover:underline transition-colors">Privacy Policy</a></span>
						</label>
					</div>

					<!-- Create Account Button -->
					<button 
						type="submit" 
						disabled={isLoading}
						class="w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 text-white font-semibold py-4 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-px transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none mb-6 flex items-center justify-center gap-2"
					>
						{#if isLoading}
							<i class="fas fa-spinner fa-spin"></i>
							Creating Account...
						{:else}
							<i class="fas fa-user-plus"></i>
							Create Account
						{/if}
					</button>

					<!-- Back to Login -->
					<button 
						type="button" 
						on:click={showLoginForm}
						class="w-full bg-transparent border border-white/10 text-gray-300 font-medium py-4 rounded-xl hover:bg-white/5 hover:border-blue-500 hover:text-white transition-all backdrop-blur-md mb-6 flex items-center justify-center gap-2"
					>
						<i class="fas fa-arrow-left"></i>
						Back to Sign In
					</button>
				</form>
			{/if}

			<!-- Divider and Social Login (only show for login form) -->
			{#if currentForm === 'login'}
				<!-- Divider -->
				<div class="flex items-center my-6">
					<div class="flex-1 h-px bg-gray-600"></div>
					<span class="px-4 text-gray-500 text-sm">or continue with</span>
					<div class="flex-1 h-px bg-gray-600"></div>
				</div>

				<!-- Social Login -->
				<div class="flex gap-3 mb-6">
					<button type="button" class="flex-1 bg-white/5 border border-white/10 text-gray-300 font-medium py-4 rounded-xl hover:bg-white/10 hover:border-blue-500 hover:text-white transition-all backdrop-blur-md flex items-center justify-center gap-2">
						<i class="fab fa-google text-base"></i>
						<span>Google</span>
					</button>
					<button type="button" class="flex-1 bg-white/5 border border-white/10 text-gray-300 font-medium py-4 rounded-xl hover:bg-white/10 hover:border-blue-500 hover:text-white transition-all backdrop-blur-md flex items-center justify-center gap-2">
						<i class="fab fa-microsoft text-base"></i>
						<span>Microsoft</span>
					</button>
				</div>

				<!-- Sign Up Link -->
				<div class="text-center mb-6 text-gray-300 text-sm">
					<div class="mb-2">Don't have an account?</div>
					<button 
						type="button" 
						on:click={showCreateAccount}
						class="text-blue-400 font-semibold hover:text-blue-300 px-2 py-1 rounded-md hover:bg-blue-500/10 transition-all inline-block"
					>
						Create Account
					</button>
				</div>
			{/if}

			<!-- Features Preview -->
			<div class="flex justify-around pt-6 border-t border-gray-600">
				<div class="flex flex-col items-center gap-2 text-gray-400 text-xs text-center">
					<i class="fas fa-robot text-base text-blue-500 opacity-70"></i>
					<span>AI-Powered</span>
				</div>
				<div class="flex flex-col items-center gap-2 text-gray-400 text-xs text-center">
					<i class="fas fa-coins text-base text-blue-500 opacity-70"></i>
					<span>Crypto Payments</span>
				</div>
				<div class="flex flex-col items-center gap-2 text-gray-400 text-xs text-center">
					<i class="fas fa-shield-alt text-base text-blue-500 opacity-70"></i>
					<span>Secure</span>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	/* Custom checkbox styling */
	input[type="checkbox"]:checked::after {
		content: '✓';
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		color: white;
		font-size: 10px;
		font-weight: bold;
	}

	/* Spinner animation */
	.fa-spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}

	/* Focus states for accessibility */
	button:focus-visible,
	input:focus-visible {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}
</style>