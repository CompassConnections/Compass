'use client';

import Link from 'next/link';
import Image from 'next/image';
import {useEffect, useState} from "react";
import LoadingSpinner from "@/lib/client/LoadingSpinner";

export default function ProfilePage() {
  const [userData, setUserData] = useState(null);
  try {
    useEffect(() => {
      fetch('/api/profile').then(r => r.json()).then(data => {
        setUserData(data);
        console.log('userData', data);
      });
    }, []);

    if (!userData) {
      return <LoadingSpinner />;
    }

    const {
      name,
      email,
      image,
      profile: {
        location,
        description,
        gender,
        personalityType,
        conflictStyle,
        intellectualInterests
      }
    } = userData;

    return (
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">My Profile</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">View and update your profile information</p>
            </div>
            <Link
              href="/complete-profile"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Edit Profile
            </Link>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Profile Picture</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100">
                    {image ? (
                      <Image
                        src={image}
                        alt={name || 'Profile picture'}
                        width={96}
                        height={96}
                        className="h-full w-full object-cover"
                        priority
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400">
                      <span className="text-2xl">
                        {name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                      </div>
                    )}
                  </div>
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {name || 'Not provided'}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {email}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Location</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {location || 'Not provided'}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">About</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {description || 'Not provided'}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Gender</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {gender || 'Not specified'}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Personality Type</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {personalityType || 'Not specified'}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Conflict Style</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {conflictStyle || 'Not specified'}
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Interests</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {intellectualInterests.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {intellectualInterests.map((value: string, index: number) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                        {value?.interest?.name}
                      </span>
                      ))}
                    </div>
                  ) : (
                    'No interests selected'
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error fetching user data:', error);
    return <div className="text-center py-10">Error loading profile. Please try again later.</div>;
  }
}
