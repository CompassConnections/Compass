"use client"

import React, {Suspense, useEffect, useState} from "react"
import Link from "next/link"
import {useSearchParams} from "next/navigation"
import {signupThenMaybeRedirectToSignup} from "web/lib/util/signup"

import {createUserWithEmailAndPassword} from "firebase/auth"
import {auth} from "web/lib/firebase/users"
import FavIcon from "web/components/FavIcon"
import {PageBase} from "web/components/page-base"
import {getProfileRow} from "common/profiles/profile"
import {db} from "web/lib/supabase/db"
import Router from "next/router"
import {useUser} from "web/hooks/use-user"
import {GoogleButton} from "web/components/buttons/sign-up-button"
import {SEO} from "web/components/SEO"
import toast from "react-hot-toast"


export default function RegisterPage() {
  return (
    <Suspense fallback={<div></div>}>
      <RegisterComponent/>
    </Suspense>
  )
}

// const href = '/signup'

function RegisterComponent() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(searchParams.get('error'))
  const [isLoading, setIsLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [registeredEmail, _] = useState('')
  const user = useUser()

  // function redirect() {
  //   // Redirect to complete profile page
  //   window.location.href = href
  // }

  useEffect(() => {
    const checkProfileAndRedirect = async () => {
      if (user) {
        const profile = await getProfileRow(user.id, db)
        if (profile) {
          console.log("Router.push('/')")
          await Router.push('/')
        } else {
          console.log("Router.push('/signup')")
          await Router.push('/signup')
        }
        setIsLoading(false)
      }
    }
    checkProfileAndRedirect()
  }, [user])

  const handleEmailPasswordSignUp = async (email: string, password: string) => {
    try {
      const creds = await createUserWithEmailAndPassword(auth, email, password)
      console.debug("User signed up:", creds.user)
    } catch (error: any) {
      console.error("Error signing up:", error)
      toast.error("Failed to sign up: " + error.message)
      setError(error.message)
      setIsLoading(false)
      if (error instanceof Error && error.message.includes("email-already-in-use")) {
        throw new Error("This email is already registered")
      }
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    function handleError(error: unknown) {
      console.error("Registration error:", error)
      setError(error instanceof Error ? error.message : "Registration failed")
    }

    try {
      event.preventDefault()
      setIsLoading(true)
      setError(null)

      const formData = new FormData(event.currentTarget)
      const email = formData.get("email") as string
      const password = formData.get("password") as string

      // Basic validation
      if (!email || !password) {
        handleError("All fields are required")
      }

      await handleEmailPasswordSignUp(email, password)

      // Show a success message with email verification notice
      // setRegistrationSuccess(true)
      // setRegisteredEmail(email)

      // Sign in after successful registration
      // ...

      // if (response?.error) {
      //   handleError("Failed to sign in after registration")
      // }

      // redirect()

    } catch (error) {
      handleError(error)
      setIsLoading(false)
    }
  }

  return (
    <PageBase trackPageView={'register'}>
      <SEO
        title={'Register'}
        description={'Register for a new account'}
        url={`/register`}
      />
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
                  href="/signin"
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
                {/*  The project is still in development...*/}
                {/*</h2>*/}
                <div className="flex justify-center mb-6">
                  <FavIcon className="dark:invert"/>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold ">
                  Get Started
                </h2>
              </div>
              <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                <div className="rounded-md shadow-sm -space-y-px">
                  <div>
                    <label htmlFor="email" className="sr-only">
                      Email
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      className="bg-canvas-50 appearance-none rounded-none relative block w-full px-3 py-2 border rounded-t-md border-gray-300 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                      placeholder="Email"
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
                      className="bg-canvas-50 bg-input appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500  rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                      placeholder="Password"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-sm mt-2 text-center custom-link">
                    By signing up, I agree to the{" "}
                    <Link href="/terms">
                      Terms and Conditions
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy">
                      Privacy Policy
                    </Link>.
                  </p>
                </div>

                {error && (
                  <div className="text-red-500 text-sm text-center">{error}</div>
                )}

                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    {isLoading ? 'Creating account...' : 'Sign up with Email'}
                  </button>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 body-bg text-gray-500">Or sign up with</span>
                    </div>
                  </div>
                  <GoogleButton onClick={signupThenMaybeRedirectToSignup} isLoading={isLoading}/>
                </div>
              </form>
              <div className="my-8"/>
              <div className="text-center custom-link">
                <p className="">
                  Already have an account?{' '}
                  <Link href="/signin">
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          )
          }
        </div>
      </div>
    </PageBase>
  )
}
