'use client';

import Link from "next/link";
import {useCallback, useEffect, useState} from "react";
import LoadingSpinner from "@/lib/client/LoadingSpinner";
import {ProfileData} from "@/lib/client/schema";
import {ProfileFilters} from "./ProfileFilters";

// Disable static generation
export const dynamic = "force-dynamic";

export default function ProfilePage() {
  const [profiles, setProfiles] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    gender: '',
    interests: [] as string[],
    causeAreas: [] as string[],
    searchQuery: '',
  });

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (filters.gender) params.append('gender', filters.gender);
      if (filters.interests.length > 0) params.append('interests', filters.interests.join(','));
      if (filters.causeAreas.length > 0) params.append('causeAreas', filters.causeAreas.join(','));
      if (filters.searchQuery) params.append('search', filters.searchQuery);

      const response = await fetch(`/api/profiles?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        console.error(data.error || 'Failed to fetch profiles');
        return;
      }

      setProfiles(data.profiles || []);
    } catch (error) {
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

  const toggleFilter = (key: 'interests' | 'causeAreas', value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter((item: string) => item !== value)
        : [...prev[key], value]
    }));
  };

  const resetFilters = () => {
    setFilters({
      gender: '',
      interests: [],
      causeAreas: [],
      searchQuery: '',
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-6xl">
        <h1 className="text-4xl sm:text-5xl font-extrabold mb-8">Profiles</h1>

        <ProfileFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onToggleFilter={toggleFilter}
          onReset={resetFilters}
        />

        {loading ? (
          <div className="flex justify-center my-12">
            <LoadingSpinner/>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 w-full">
            {profiles.length > 0 ? (
              profiles.map((user) => (
                <Link key={user.id} href={`/profiles/${user.id}`} className="group">
                  <div
                    className="border rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-300 h-full">
                    <div className="flex items-start space-x-4">
                      <div className="flex-1">
                        <h2 className="text-xl font-semibold group-hover:underline mb-1">
                          {user.name}
                        </h2>
                        {user?.profile?.description && (
                          <p className="text-sm line-clamp-2">
                            {user.profile.description}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap gap-2">
                          {user.profile?.intellectualInterests && user.profile.intellectualInterests.length > 0 && (
                            <div>
                              {user.profile.intellectualInterests.slice(0, 3).map(({interest}) => (
                                <span key={interest?.id}
                                      className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                                {interest?.name}
                              </span>
                              ))}
                            </div>
                          )}
                          {user.profile?.causeAreas && user.profile.causeAreas.length > 0 && (
                            <div>
                              {user.profile.causeAreas.slice(0, 3).map(({causeArea}) => (
                                <span key={causeArea?.id}
                                      className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                                {causeArea?.name}
                              </span>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <svg
                  className="mx-auto h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    vectorEffect="non-scaling-stroke"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium">No profiles found</h3>
                <p className="mt-1 text-sm ">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
