'use client';

import {signIn} from 'next-auth/react';
import {useRouter, useSearchParams} from 'next/navigation';
import {useState, useEffect} from 'react';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
    const errorParam = searchParams.get('error');
    const registered = searchParams.get('registered');

    // Handle URL parameters and errors
    useEffect(() => {
        const newSearchParams = new URLSearchParams(searchParams);

        // Handle error parameter
        if (errorParam) {
            let errorMessage = 'An error occurred during login';

            // Map common error codes to user-friendly messages
            if (errorParam === 'CredentialsSignin') {
                errorMessage = 'Invalid email or password';
            } else if (errorParam === 'OAuthAccountNotLinked') {
                errorMessage = 'This email is already associated with another account';
            } else if (errorParam === 'OAuthCallbackError') {
                errorMessage = 'An error occurred during social sign in';
            } else if (errorParam === 'AccessDenied') {
                errorMessage = 'You do not have permission to sign in';
            } else if (errorParam === 'Verification') {
                errorMessage = 'Account not verified. Please check your email.';
            }

            setError(errorMessage);

            // Clean up the URL
            newSearchParams.delete('error');
            router.replace(`/login?${newSearchParams.toString()}`);
        }

        // Show success message if user was just registered
        if (registered) {
            setSuccess('Registration successful! Please sign in with your credentials.');
            newSearchParams.delete('registered');
            router.replace(`/login?${newSearchParams.toString()}`);
        }
    }, [errorParam, registered, router, searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);

        try {
            // Validate inputs
            if (!email || !password) {
                throw new Error('Email and password are required');
            }

            // Basic email validation
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                throw new Error('Please enter a valid email address');
            }

            // Attempt to sign in
            const result = await signIn('credentials', {
                redirect: false,
                email: email.trim(),
                password,
                callbackUrl,
            });

            // Handle the result
            if (result?.error) {
                // Handle specific error messages
                let errorMessage = 'Invalid email or password';
                if (result.error === 'CredentialsSignin') {
                    errorMessage = 'Invalid email or password';
                } else if (result.error === 'AccessDenied') {
                    errorMessage = 'You do not have permission to sign in';
                } else if (result.error === 'Configuration') {
                    errorMessage = 'Server configuration error';
                } else if (result.error === 'Verification') {
                    errorMessage = 'Account not verified. Please check your email.';
                } else if (result.error === 'OAuthSignin') {
                    errorMessage = 'Error in OAuth sign in. Please try again.';
                } else if (result.error === 'OAuthCallback') {
                    errorMessage = 'Error in OAuth callback. Please try again.';
                } else if (result.error === 'OAuthCreateAccount') {
                    errorMessage = 'Error creating OAuth account. Please try again.';
                } else if (result.error === 'EmailCreateAccount') {
                    errorMessage = 'Error creating account. Please try again.';
                } else if (result.error === 'Callback') {
                    errorMessage = 'Error in authentication callback. Please try again.';
                } else if (result.error === 'OAuthAccountNotLinked') {
                    errorMessage = 'This email is already associated with another account';
                }

                throw new Error(errorMessage);
            }

            // If we got here, sign in was successful
            if (result?.url) {
                // Ensure we're using the correct callback URL
                const url = new URL(result.url);
                const callbackUrlParam = url.searchParams.get('callbackUrl');
                const finalUrl = callbackUrlParam || callbackUrl;

                // Force a full page reload to ensure all session data is loaded
                window.location.href = finalUrl;
            } else {
                // Fallback in case result.url is not available
                window.location.href = callbackUrl;
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Don't have an account?{' '}
                        <Link
                            href={`/signup${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ''}`}
                            className="font-medium text-indigo-600 hover:text-indigo-500"
                        >
                            Sign up
                        </Link>
                    </p>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center">
                            <div className="w-full max-w-xs">
                                <div>
                                    <button
                                        onClick={() => signIn('google', {callbackUrl})}
                                        className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                                    >
                                        <span className="sr-only">Sign in with Google</span>
                                        <svg className="w-5 h-5" aria-hidden="true" fill="currentColor"
                                             viewBox="0 0 24 24">
                                            <path
                                                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {success && (
                    <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                          clipRule="evenodd"/>
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-green-700">{success}</p>
                            </div>
                        </div>
                    </div>
                )}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd"
                                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                          clipRule="evenodd"/>
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <input type="hidden" name="remember" value="true"/>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <label
                                htmlFor="remember-me"
                                className="ml-2 block text-sm text-gray-900"
                            >
                                Remember me
                            </label>
                        </div>

                        <div className="text-sm">
                            <a
                                href="#"
                                className="font-medium text-indigo-600 hover:text-indigo-500"
                            >
                                Forgot your password?
                            </a>
                        </div>
                    </div>

                    <div>
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Sign in
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
