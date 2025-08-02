'use client';

import Link from "next/link";
import {useCallback, useEffect, useState} from "react";
import LoadingSpinner from "@/lib/client/LoadingSpinner";
import {ProfileData} from "@/lib/client/schema";
import {dropdownConfig, ProfileFilters} from "./ProfileFilters";

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
  causeAreas: [] as string[],
  connections: [] as string[],
  searchQuery: '',
  forceRun: false,
};

export type DropdownKey = 'interests' | 'causeAreas' | 'connections';
export type RangeKey = 'age' | 'introversion';
type OtherKey = 'gender' | 'searchQuery';

export default function ProfilePage() {
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true);
  const [totalUsers, setTotalUsers] = useState<number>(0);
  const [images, setImages] = useState<string[]>([])
  const [filters, setFilters] = useState(initialState);


  useEffect(() => {
    const getCount = async () => {
      const countResponse = await fetch('/api/profiles/count');
      if (countResponse.ok) {
        const {count} = await countResponse.json();
        setTotalUsers(count);
      }
    };

    getCount();
  }, []); // <- runs once after initial mount

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
      (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

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
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-4">
          <h1 className="text-4xl sm:text-5xl font-extrabold">People</h1>
          <div className="text-lg pb-1">
            Users: <span className="font-bold">{totalUsers}</span>
          </div>
        </div>

        <div className="py-6">
          All the profiles are searchable, simply filter them below to find your best connections!
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className={`w-full 
          md:w-80
           flex-shrink-0`}>
            {/*// md:${showFilters ? 'w-80' : 'w-20'}*/}
            <div className="sticky top-24">
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
              <div className="flex justify-center py-12">
                <LoadingSpinner/>
              </div>
            ) : profiles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 gap-6">
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
                          <img
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
                        {/*{user.profile?.causeAreas && user.profile.causeAreas.length > 0 && (*/}
                        {/*  <div className="flex flex-wrap gap-1">*/}
                        {/*    {user.profile.causeAreas.slice(0, 3).map(({causeArea}) => (*/}
                        {/*      <span key={causeArea?.id}*/}
                        {/*            className="inline-block text-xs px-2 py-1 bg-blue-50 text-blue-700 dark:text-white dark:bg-gray-700 rounded-full">*/}
                        {/*        {causeArea?.name}*/}
                        {/*      </span>*/}
                        {/*    ))}*/}
                        {/*  </div>*/}
                        {/*)}*/}
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
                  Try adjusting your search or filter to find what you're looking for.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
