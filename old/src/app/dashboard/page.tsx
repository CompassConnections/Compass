'use client';

import { signOut, useSession, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  console.log('DashboardPage rendering');
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isClient, setIsClient] = useState(false);
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  useEffect(() => {
    console.log('=== DASHBOARD SESSION DEBUG ===');
    console.log('Session status:', status);
    console.log('Session data:', session);
    console.log('Is client:', isClient);
    console.log('Callback URL:', callbackUrl);
    
    const checkSession = async () => {
      try {
        const serverSession = await getSession();
        console.log('Server session:', serverSession);
        
        if (status === 'unauthenticated' || !session) {
          console.log('No active session, redirecting to login');
          router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
          return;
        }

        if (status === 'authenticated' && session) {
          console.log('User authenticated:', session.user);
          // Force update the session to ensure it's fresh
          await update();
        }
      } catch (error) {
        console.error('Error checking session:', error);
        router.push(`/login?error=SessionError&callbackUrl=${encodeURIComponent(callbackUrl)}`);
      } finally {
        setIsClient(true);
      }
    };

    checkSession();
  }, [status, session, router, update, callbackUrl]);

  // Show loading state while checking authentication
  if (status === 'loading' || !isClient) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600">Please wait while we verify your session...</p>
        </div>
      </div>
    );
  }

  // If unauthenticated but still showing the page (should be caught by useEffect)
  if (status === 'unauthenticated' || !session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="text-center max-w-md">
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
            <p className="font-bold">Session Expired</p>
            <p>You need to be signed in to view this page.</p>
          </div>
          <Link 
            href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {session.user?.name || 'User'}!
              </span>
              <button
                onClick={() => signOut({redirect: true, callbackUrl: '/'})}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h2>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {/* User Info Card */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"
                             stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Account</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              {session.user?.name || 'User'}
                            </div>
                          </dd>
                          <dd className="text-sm text-gray-500 truncate">
                            {session.user?.email}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Card 1 */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"
                             stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Projects</dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">3</div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Card 2 */}
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24"
                             stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Last
                            Login
                          </dt>
                          <dd className="flex items-baseline">
                            <div className="text-2xl font-semibold text-gray-900">
                              Just now
                            </div>
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
                <div className="bg-white shadow overflow-hidden sm:rounded-md">
                  <ul className="divide-y divide-gray-200">
                    <li className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div
                            className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <svg className="h-6 w-6 text-indigo-600" fill="none"
                                 viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round"
                                    strokeWidth={2} d="M5 13l4 4L19 7"/>
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">Successfully logged
                            in</p>
                          <p className="text-sm text-gray-500">A few seconds ago</p>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
