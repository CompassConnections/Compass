"use client"

import {useSearchParams} from "next/navigation"
import React, {Suspense, useEffect, useState} from "react"
import Link from "next/link"
import {auth, firebaseLogin} from "web/lib/firebase/users"
import FavIcon from "web/public/FavIcon"

import {signInWithEmailAndPassword} from "firebase/auth"
import {getProfileRow} from "common/profiles/profile"
import {db} from "web/lib/supabase/db"
import Router from "next/router"
import {PageBase} from "web/components/page-base"
import {useUser} from "web/hooks/use-user"
import {GoogleButton} from "web/components/buttons/sign-up-button"
import {SEO} from "web/components/SEO"

export default function LoginPage() {
  return (
    <Suspense fallback={<div></div>}>
      <RegisterComponent/>
    </Suspense>
  )
}

function RegisterComponent() {
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [_, setIsLoadingGoogle] = useState(false)
  const user = useUser()

  useEffect(() => {
    const error = searchParams.get('error')
    if (error === 'OAuthAccountNotLinked') {
      setError('This email is already registered with a different provider')
    } else if (error) {
      setError('An error occurred during login')
    }
  }, [searchParams])

  useEffect(() => {
    const checkAndRedirect = async () => {
      if (user) {
        console.debug("User signed in:", user)
        try {
          const profile = await getProfileRow(user.id, db)
          if (profile) {
            await Router.push('/')
          } else {
            await Router.push('/signup')
          }
        } catch (error) {
          console.error("Error fetching profile profile:", error)
        }
        setIsLoading(false)
        setIsLoadingGoogle(false)
      }
    }
    checkAndRedirect()
  }, [user])

  const handleGoogleSignIn = async () => {
    setIsLoadingGoogle(true)
    setError(null)
    try {
      const creds = await firebaseLogin();
      if (creds) {
        setIsLoading(true)
        setIsLoadingGoogle(true);
      }
    } catch (error) {
      console.error("Error signing in:", error)
      const message = 'Failed to sign in with Google'
      setError(message)
      setIsLoading(false)
      setIsLoadingGoogle(false)
    }
  }

  const handleEmailPasswordSignIn = async (email: string, password: string) => {
    try {
      const creds = await signInWithEmailAndPassword(auth, email, password)
      console.debug(creds)
    } catch (error) {
      console.error("Error signing in:", error)
      const message = 'Failed to sign in with your email and password'
      setError(message)
      setIsLoading(false)
      setIsLoadingGoogle(false)
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    try {
      event.preventDefault()
      setIsLoading(true)
      setError(null)

      const formData = new FormData(event.currentTarget)
      const email = formData.get("email") as string
      const password = formData.get("password") as string
      await handleEmailPasswordSignIn(email, password)

      // if (response?.error) {
      //   setError("Invalid email or password")
      //   setIsLoading(false)
      //   return
      // }

      // router.push("/")
      // router.refresh()
    } catch {
      setError("An error occurred during login")
      setIsLoading(false)
    }
  }

  // console.debug('Form rendering')
  return (
    <PageBase trackPageView={'signin'}>
      <SEO
        title={'Sign In'}
        description={'Sign in to your account'}
        url={`/signin`}
      />
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <div className="flex justify-center mb-6">
              <FavIcon className="dark:invert"/>
            </div>
            <h2 className="mt-6 text-center text-3xl font-extrabold ">
              Sign in to your account
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
                  className="bg-canvas-50 appearance-none rounded-none relative block w-full px-3 py-2 border rounded-b-md border-gray-300 placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
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
                {isLoading ? 'Signing in...' : 'Sign in with Email'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 body-bg text-gray-500">Or continue with</span>
                </div>
              </div>
              <GoogleButton onClick={handleGoogleSignIn} isLoading={isLoading}/>
            </div>
          </form>
          <div className="text-center custom-link">
            <p className="">
              No account?{' '}
              <Link href="/register">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageBase>
  )
}
