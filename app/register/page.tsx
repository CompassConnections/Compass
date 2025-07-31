"use client";

import {Suspense, useState} from "react";
import Link from "next/link";
import {signIn} from "next-auth/react";
import {FcGoogle} from "react-icons/fc";
import {useSearchParams} from "next/navigation";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div></div>}>
      <RegisterComponent/>
    </Suspense>
  );
}

function RegisterComponent() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(searchParams.get('error'));
  const [isLoading, setIsLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  function redirect() {
    // Redirect to complete profile page
    window.location.href = '/complete-profile';
  }

  const handleGoogleSignUp = async () => {
    try {
      setIsLoading(true);
      await signIn('google', {callbackUrl: '/complete-profile'});
    } catch (error) {
      console.error('Error signing up with Google:', error);
      setError('Failed to sign up with Google');
      setIsLoading(false);
    }
  };

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    function handleError(error: unknown) {
      console.error("Registration error:", error);
      setError(error instanceof Error ? error.message : "Registration failed");
    }

    try {
      event.preventDefault();
      setIsLoading(true);
      setError(null);

      const formData = new FormData(event.currentTarget);
      const email = formData.get("email") as string;
      const password = formData.get("password") as string;
      const name = formData.get("name") as string;

      // Basic validation
      if (!email || !password || !name) {
        handleError("All fields are required");
      }

      const res = await fetch("/api/auth/signup", {
        method: "POST",
        body: JSON.stringify({email, password, name}),
        headers: {"Content-Type": "application/json"},
      });

      const data = await res.json();
      if (!res.ok) {
        handleError(data.error || "Registration failed");
      }

      // Show a success message with email verification notice
      // setRegistrationSuccess(true);
      setRegisteredEmail(email);

      // Sign in after successful registration
      const response = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (response?.error) {
        handleError("Failed to sign in after registration");
      }

      redirect()

    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center  py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {registrationSuccess ? (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold ">
              Check your email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              We have sent a verification link to <span className="font-medium">{registeredEmail}</span>.
              Please click the link in the email to verify your account.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Did not receive the email? Check your spam folder or{' '}
              <button
                type="button"
                className="font-medium text-blue-600 hover:text-blue-500"
                onClick={() => setRegistrationSuccess(false)}
              >
                try again
              </button>
              .
            </p>
            <div className="mt-6">
              <Link
                href="/login"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium  bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <div>
              {/*<h2 className="mt-6 text-center text-xl font-extrabold text-red-700">*/}
              {/*  The project is still in development. You can sign up if you want to test it, but your account*/}
              {/*  may be deleted at any time. To get release updates, fill in this <a*/}
              {/*  href='https://forms.gle/tKnXUMAbEreMK6FC6'>form</a>.*/}
              {/*</h2>*/}
              <h2 className="mt-6 text-center text-3xl font-extrabold ">
                Create your account
              </h2>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="rounded-md shadow-sm -space-y-px">
                <div>
                  <label htmlFor="name" className="sr-only">
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    maxLength={100}
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500  rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500  focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Email address"
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
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500  rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Password"
                  />
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  By signing up, I agree to the{" "}
                  <a href="/terms" className="underline hover:text-blue-600">
                    Terms and Conditions
                  </a>{" "}
                  and{" "}
                  <a href="/privacy" className="underline hover:text-blue-600">
                    Privacy Policy
                  </a>.
                </p>
              </div>

              {error && (
                <div className="text-red-500 text-sm text-center">{error}</div>
              )}

              <div className="space-y-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? 'Creating account...' : 'Sign up with Email'}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-50 dark:bg-gray-900 text-gray-500">Or sign up with</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignUp}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700  hover: focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <FcGoogle className="w-5 h-5"/>
                  Continue with Google
                </button>
              </div>
            </form>
            <div className="text-center text-sm mt-2">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        )
        }
      </div>
    </div>
  );
}
