<!-- src/routes/auth/verify/+page.svelte -->
<script>
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';

	// Get data from page load
	export let data;

	let verificationStatus = data?.verification?.status || 'pending';
	let errorMessage = data?.verification?.message || '';
	let isLoading = verificationStatus === 'pending';

	// Get token from URL params for resend functionality
	$: token = $page.url.searchParams.get('token');

	onMount(() => {
		// If verification was successful, redirect after 3 seconds
		if (verificationStatus === 'success') {
			setTimeout(() => {
				goto('/auth/login');
			}, 3000);
		}
	});

	const handleResendVerification = () => {
		return ({ form, data, action, cancel }) => {
			return async ({ result, update }) => {
				if (result.type === 'success') {
					alert('Verification email resent! Please check your inbox.');
				} else if (result.type === 'failure') {
					alert(result.data?.message || 'Failed to resend verification email');
				}
				await update();
			};
		};
	};
</script>

<svelte:head>
	<title>Hikari Chat - Verify Email</title>
	<link rel="icon" type="image/png" href="https://i.ibb.co/5hCsg9gj/symbol.png">
</svelte:head>

<!-- Background and particles (same as login page) -->
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
					Email Verification
				</div>
				<div class="text-gray-400 text-sm leading-relaxed">
					{#if verificationStatus === 'success'}
						Your email has been verified successfully!
					{:else if verificationStatus === 'error'}
						Email verification failed
					{:else}
						Verifying your email address...
					{/if}
				</div>
			</div>

			<!-- Content based on verification status -->
			{#if verificationStatus === 'pending'}
				<!-- Loading State -->
				<div class="text-center mb-8">
					<div class="inline-flex items-center gap-3 text-blue-400 mb-4">
						<i class="fas fa-spinner fa-spin text-2xl"></i>
						<span class="text-lg">Verifying...</span>
					</div>
					<p class="text-gray-300 text-sm">Please wait while we verify your email address.</p>
				</div>

			{:else if verificationStatus === 'success'}
				<!-- Success State -->
				<div class="text-center mb-8">
					<div class="inline-flex items-center gap-3 text-green-400 mb-4">
						<i class="fas fa-check-circle text-3xl"></i>
						<span class="text-lg font-semibold">Verified!</span>
					</div>
					<p class="text-gray-300 text-sm mb-4">
						Your email address has been successfully verified. Your account is now active.
					</p>
					<p class="text-gray-400 text-xs">
						Redirecting to login page in 3 seconds...
					</p>
				</div>

				<!-- Login Button -->
				<a 
					href="/auth/login"
					class="w-full bg-gradient-to-r from-green-500 via-green-400 to-green-600 text-white font-semibold py-4 rounded-xl hover:shadow-lg hover:shadow-green-500/30 hover:-translate-y-px transition-all mb-6 flex items-center justify-center gap-2"
				>
					<i class="fas fa-sign-in-alt"></i>
					Continue to Login
				</a>

			{:else if verificationStatus === 'error'}
				<!-- Error State -->
				<div class="text-center mb-8">
					<div class="inline-flex items-center gap-3 text-red-400 mb-4">
						<i class="fas fa-exclamation-triangle text-3xl"></i>
						<span class="text-lg font-semibold">Verification Failed</span>
					</div>
					<p class="text-gray-300 text-sm mb-4">
						{errorMessage || 'We were unable to verify your email address.'}
					</p>
					<div class="text-gray-400 text-xs leading-relaxed">
						The verification link may have expired or is invalid. You can request a new verification email below.
					</div>
				</div>

				<!-- Resend Verification Form -->
				<form method="POST" action="/auth/resend-verification" use:enhance={handleResendVerification()} class="mb-6">
					<button 
						type="submit"
						class="w-full bg-gradient-to-r from-blue-500 via-blue-400 to-blue-600 text-white font-semibold py-4 rounded-xl hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-px transition-all mb-4 flex items-center justify-center gap-2"
					>
						<i class="fas fa-paper-plane"></i>
						Resend Verification Email
					</button>
				</form>

				<!-- Back to Login -->
				<a 
					href="/auth/login"
					class="w-full bg-transparent border border-white/10 text-gray-300 font-medium py-4 rounded-xl hover:bg-white/5 hover:border-blue-500 hover:text-white transition-all backdrop-blur-md flex items-center justify-center gap-2"
				>
					<i class="fas fa-arrow-left"></i>
					Back to Login
				</a>
			{/if}

			<!-- Help Text -->
			<div class="text-center mt-8 pt-6 border-t border-gray-600">
				<p class="text-gray-400 text-xs leading-relaxed">
					Having trouble? Contact support at 
					<a href="mailto:support@hikarichat.com" class="text-blue-400 hover:text-blue-300 transition-colors">
						support@hikarichat.com
					</a>
				</p>
			</div>
		</div>
	</div>
</div>

<style>
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
	a:focus-visible {
		outline: 2px solid #3b82f6;
		outline-offset: 2px;
	}
</style>