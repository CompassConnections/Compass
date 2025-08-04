'use client';

import Link from "next/link";
import React, {useCallback, useEffect, useState} from "react";
import LoadingSpinner from "@/lib/client/LoadingSpinner";
import {DropdownKey, ProfileData} from "@/lib/client/schema";
import {dropdownConfig, ProfileFilters} from "./ProfileFilters";
import Image from "next/image";

// Disable static generation
export const dynamic = "force-dynamic";

const renderImages = false;

const initialState = {
  gender: '',
  minAge: null as number | null,
  maxAge: null as number | null,
  minIntroversion: null as number | null,
  maxIntroversion: null as number | null,
  interests: [] as string[],
  coreValues: [] as string[],
  causeAreas: [] as string[],
  connections: [] as string[],
  searchQuery: '',
  forceRun: false,
};


export default function ProfilePage() {
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [_, setShowFilters] = useState(true);
  const [images, setImages] = useState<string[]>([])
  const [filters, setFilters] = useState(initialState);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.gender) params.append('gender', filters.gender);
      if (filters.minAge) params.append('minAge', filters.minAge.toString());
      if (filters.maxAge) params.append('maxAge', filters.maxAge.toString());
      if (filters.minIntroversion) params.append('minIntroversion', filters.minIntroversion.toString());
      if (filters.maxIntroversion) params.append('maxIntroversion', filters.maxIntroversion.toString());

      for (let i = 0; i < dropdownConfig.length; i++) {
        const v = dropdownConfig[i];
        const filterKey = v.id as DropdownKey;
        if (filters[filterKey] && filters[filterKey].length > 0) {
          params.append(v.id, filters[filterKey].join(','));
        }
      }

      if (filters.searchQuery) params.append('search', filters.searchQuery);

      const response = await fetch(`/api/profiles?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) {
        console.log(response);
        throw Error(data?.message);
      }

      if (!response.ok) {
        console.error(data.error || 'Failed to fetch profiles');
        return;
      }

      setProfiles(data.profiles || []);
      console.log(data.profiles);

      if (renderImages) {
        for (const u of data.profiles) {
          console.log(u);
          const img = u.image;
          let url = img;
          if (img && !img.startsWith('http')) {
            const imageResponse = await fetch(`/api/download?key=${img}`);
            console.log(`imageResponse: ${imageResponse}`)
            if (imageResponse.ok) {
              const imageBlob = await imageResponse.json();
              url = imageBlob['url'];
            }
          }
          setImages(prev => [...(prev || []), url]);
        }
        console.log(images);
      }
    } catch
      (error: any) {
      console.error('Error fetching profiles:', error);
      setError('Error: ' + error.message)
    } finally {
      setLoading(false);
    }
  }, [filters, images]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const showFilterChange = (value: boolean) => {
    setShowFilters(value);
  };

  const toggleFilter = (key: DropdownKey, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((item: string) => item !== value)
        : [...prev[key], value]
    }));
  };

  const resetFilters = () => {
    setFilters(initialState);
    setText('');
  };

  const [text, setText] = useState<string>('');

  const onFilterChange = handleFilterChange

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl mx-auto">
        {/*<div className="flex justify-between items-end mb-4">*/}
        {/*  /!*<h1 className="text-4xl sm:text-5xl font-extrabold">People</h1>*!/*/}
        {/*  <div className="text-lg pb-1">*/}
        {/*    /!*Users: <span className="font-bold">{totalUsers}</span>*!/*/}
        {/*    {totalUsers} users*/}
        {/*  </div>*/}
        {/*</div>*/}

        {/*<div className="py-6">*/}
        {/*  All the profiles are searchable, simply filter them below to find your best connections!*/}
        {/*</div>*/}

        <div className="relative flex-grow py-6 w-2/4 xs:w-full mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder='Try "meditation", "hiking", or "chess"'
              className="w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const input = e.target as HTMLInputElement;
                  onFilterChange('searchQuery', input.value);
                  input.blur(); // This dismisses the keyboard
                }
              }}
            />
            {filters.searchQuery && (
              <button
                onClick={() => {
                  onFilterChange('searchQuery', '');
                  setText('');
                }}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                type="button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24"
                 stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 xs:gap-0">
          {/* Filters Sidebar */}
          <div className={`w-full md:w-80 flex-shrink-0`}>
            {/*// md:${showFilters ? 'w-80' : 'w-20'}*/}
            <div className="top-24">
              <ProfileFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onShowFilters={showFilterChange}
                onToggleFilter={toggleFilter}
                onReset={resetFilters}
              />
            </div>
          </div>

          {/* Profiles Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center py-8">
                  <div className="flex justify-center min-h-screen py-8">
                  <div data-testid="spinner" className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
              </div>
            ) : error ? (
              <div className="flex justify-center py-2">
                <p>{error}</p>
              </div>
            ) : profiles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 gap-6 py-4">
                {profiles.map((
                  user,
                  idx
                ) => (
                  <Link
                    key={user.id}
                    href={`/profiles/${user.id}`}
                    className="group block bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow duration-200 h-full"
                  >
                    <div className="p-4 h-full flex flex-col">
                      <div className="flex items-center space-x-4">
                        {renderImages && (<div className="flex-shrink-0">
                          <Image
                            className="h-16 w-16 rounded-full object-cover"
                            src={images[idx]}
                            alt={``}
                          />
                        </div>)}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                            {user.name}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3">
                            {user.profile?.description || ''}
                          </p>
                        </div>
                      </div>
                      <div className="mt-4 space-y-2 flex-grow">
                        {user.profile?.coreValues && user.profile.coreValues.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {user.profile.coreValues.slice(0, 6).map(({value}) => (
                              <span key={value?.id}
                                    className="inline-block text-xs px-2 py-1 bg-blue-50 text-blue-700 dark:text-white dark:bg-gray-700 rounded-full">
                                {value?.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="mt-4 space-y-2 flex-grow">
                        {user.profile?.intellectualInterests && user.profile.intellectualInterests.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {user.profile.intellectualInterests.slice(0, 10).map(({interest}) => (
                              <span key={interest?.id}
                                    className="inline-block text-xs px-2 py-1 bg-blue-50 text-blue-700 dark:text-white dark:bg-gray-700 rounded-full">
                                {interest?.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                {/*<p className="text-gray-500 dark:text-gray-400">No profiles found matching your criteria.</p>*/}
                <svg className="mx-auto h-12 w-12 mt-4 text-gray-400" fill="none" viewBox="0 0 24 24"
                     stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <h3 className="mt-2 text-sm font-medium">No profiles found</h3>
                <p className="mt-1 text-sm">
                  {"Try adjusting your search or filter to find what you're looking for."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
