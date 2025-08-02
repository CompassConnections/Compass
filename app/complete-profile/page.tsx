'use client';

import {ChangeEvent, Suspense, useEffect, useRef, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {signOut, useSession} from 'next-auth/react';
import Image from 'next/image';
import {ConflictStyle, Gender, PersonalityType} from "@prisma/client";
import {parseImage} from "@/lib/client/media";
import {DeleteProfileButton} from "@/lib/client/profile";

export default function CompleteProfile() {
  return (
    <Suspense fallback={<div></div>}>
      <RegisterComponent/>
    </Suspense>
  );
}

function RegisterComponent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [description, setDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [location, setLocation] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [age, setAge] = useState<number | null>(null);
  const [introversion, setIntroversion] = useState<number | null>(null);
  const [personalityType, setPersonalityType] = useState('');
  const [conflictStyle, setConflictStyle] = useState('');
  const [image, setImage] = useState<string>('');
  const [key, setKey] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [keys, setKeys] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [allInterests, setAllInterests] = useState<{ id: string, name: string }[]>([]);
  const [allConnections, setAllConnections] = useState<{ id: string, name: string }[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());
  const [selectedConnections, setSelectedConnections] = useState<Set<string>>(new Set());
  const [newInterest, setNewInterest] = useState('');
  const [newConnection, setNewConnection] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dropdownRefC = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDropdownC, setShowDropdownC] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const {data: session, update} = useSession();
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  const id = session?.user.id

  console.log(session)

  // Fetch user profile data
  useEffect(() => {
    async function fetchUserProfile() {
      if (!session?.user?.email) return;

      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const userData = await response.json();
          await parseImage(userData.image, setImage);
          setName(userData.name || '');
          if (userData?.profile) {
            const {profile} = userData;
            setDescription(profile.description || '');
            setContactInfo(profile.contactInfo || '');
            setLocation(profile.location || '');
            setGender(profile.gender || '');
            setPersonalityType(profile.personalityType || null);
            setConflictStyle(profile.conflictStyle || '');
            setIntroversion(profile.introversion || null);
            if (profile.birthYear) {
              setAge(new Date().getFullYear() - profile.birthYear);
            }

            // Set selected interests if any
            if (profile.intellectualInterests?.length > 0) {
              const ids = profile.intellectualInterests
                .map((pi: any) => pi.interest.id);
              setSelectedInterests(new Set(ids));
            }

            if (profile.desiredConnections?.length > 0) {
              const ids = profile.desiredConnections
                .map((pi: any) => pi.connection.id);
              setSelectedConnections(new Set(ids));
            }

            setImages([])
            setKeys(profile?.images)
            await Promise.all(
              (profile?.images || []).map(async (img: string) => {
                await parseImage(img, setImages, true);
              })
            );
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserProfile();
  }, [session]);

  // Load existing interests and set up click-outside handler
  useEffect(() => {
    async function fetchInterests() {
      try {
        const res = await fetch('/api/interests');
        if (res.ok) {
          const data = await res.json();
          setAllInterests(data.interests || []);
        }
      } catch (error) {
        console.error('Error loading interests:', error);
      }
    }

    fetchInterests();

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load existing connections
  useEffect(() => {
    async function fetchConnections() {
      try {
        const res = await fetch('/api/interests');
        if (res.ok) {
          const data = await res.json();
          setAllConnections(data.connections || []);
        }
      } catch (error) {
        console.error('Error loading interests:', error);
      }
    }

    fetchConnections();

    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRefC.current && !dropdownRefC.current.contains(event.target as Node)) {
        setShowDropdownC(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleConnection = (id: string) => {
    setSelectedConnections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleKeyDownC = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowDropdownC(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const toggleInterest = (interestId: string) => {
    setSelectedInterests(prev => {
      const newSet = new Set(prev);
      if (newSet.has(interestId)) {
        newSet.delete(interestId);
      } else {
        newSet.add(interestId);
      }
      return newSet;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addNewInterest();
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const addNewInterest = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const interestToAdd = newInterest.trim();
    if (!interestToAdd) return;

    // Check if interest already exists (case-insensitive)
    const existingInterest = allInterests.find(
      i => i.name.toLowerCase() === interestToAdd.toLowerCase()
    );

    if (existingInterest) {
      // Toggle selection if it exists
      toggleInterest(existingInterest.id);
    } else {
      // Add new interest
      const newInterestObj = {id: `new-${Date.now()}`, name: interestToAdd};
      setAllInterests(prev => [...prev, newInterestObj]);
      setSelectedInterests(prev => new Set(prev).add(newInterestObj.id));
    }

    setNewInterest('');
    setShowDropdown(false);
  };

  const handleImagesUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    return handleImageUpload(e, false);
  }

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>, headShot = true) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      setError('');

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to upload image');
        return;
      }

      const {url, key} = await response.json();
      if (headShot) {
        setImage(url);
        setKey(key);
        console.log('headshot', key, url)
      } else {
        setImages(prev => [...prev, url]);
        setKeys(prev => [...prev, key]);
      }
      // console.log(url, key);
      console.log('image', key);
      console.log('images', keys);

    } catch
      (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.email) return;

    try {
      setIsSubmitting(true);
      setError('');

      console.log('submit image', key);
      console.log('submit images', keys);

      const data = {
        profile: {
          description,
          contactInfo,
          location,
          gender: gender as Gender,
          ...(age && {birthYear: new Date().getFullYear() - age}),
          introversion,
          personalityType: personalityType as PersonalityType,
          conflictStyle: conflictStyle as ConflictStyle,
          images: keys,
        },
        allConnections,
        interests: Array.from(selectedInterests).map(id => ({
          id: id.startsWith('new-') ? undefined : id,
          name: allInterests.find(i => i.id === id)?.name || id.replace('new-', '')
        })),
        connections: Array.from(selectedConnections).map(id => ({
          id: id,
          name: allConnections.find(i => i.id === id)?.name || id
        })),
        ...(key && {image: key}),
        ...(name && {name}),
      };
      console.log('data', data)
      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update profile');
        return;
      }

      await update();
      router.push(redirect);
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const genderOptions = Object.values(Gender);
  // const personalityOptions = Object.values(PersonalityType);
  const conflictOptions = Object.values(ConflictStyle);

  const headingStyle = "block text-sm font-medium text-gray-700 dark:text-white mb-1";

  return (
    <div className="min-h-screen flex items-center justify-center  py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold ">
            Complete Your Profile
          </h2>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                     fill="currentColor">
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

        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-md">
              {image ? (
                <Image
                  src={image}
                  alt="Profile"
                  width={128}
                  height={128}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full bg-gray-200 flex items-center justify-center">
                    <span className="text-4xl text-gray-500">
                      {session?.user?.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                </div>
              )}
            </div>
            <label
              className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors"
              title="Upload photo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd"
                      d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
                      clipRule="evenodd"/>
              </svg>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
                disabled={isUploading}
              />
            </label>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>

          <div>
            <label htmlFor="name" className={headingStyle}>
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={name}
              maxLength={100}
              onChange={(e) => setName(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500  focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              // placeholder=""
            />
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="gender" className={headingStyle}>
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                // required
                value={gender || ''}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500  focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              >
                <option value="">Select your gender</option>
                {genderOptions.map((g) => (
                  <option key={g} value={g}>
                    {g.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="age" className={headingStyle}>
                Age
              </label>
              <input
                id="age"
                name="age"
                type="number"
                min="15"
                max="100"
                value={age ?? ''}
                onChange={(e) => setAge(Number(e.target.value))}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500  focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                // placeholder=""
              />
            </div>

            <div>
              <label htmlFor="location" className={headingStyle}>
                Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                value={location}
                maxLength={100}
                onChange={(e) => setLocation(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500  focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="City, Country"
              />
            </div>

            <div className="relative" ref={dropdownRefC}>
              <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                Desired Connections
              </label>
              <div className="relative">
                <div className="flex items-center border border-gray-300 rounded-md shadow-sm">
                  <input
                    type="text"
                    value={newConnection}
                    onChange={(e) => setNewConnection(e.target.value)}
                    onFocus={() => setShowDropdownC(true)}
                    onKeyDown={handleKeyDownC}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border-0 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Type to search"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDropdownC(!showDropdownC)}
                    className="px-3 py-2 border-l border-gray-300 text-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                         fill="currentColor">
                      <path fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"/>
                    </svg>
                  </button>
                </div>
              </div>

              {(showDropdownC) && (<div
                className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black dark:ring-white ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                {allConnections
                  .filter(v => v.name.toLowerCase().includes(newConnection.toLowerCase()))
                  .map((v) => (
                    <div
                      key={v.id}
                      className=" dark:text-white cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 dark:hover:bg-gray-700"
                      onClick={() => {
                        toggleConnection(v.id);
                        setNewConnection('');
                        // setNewInterest('');
                      }}
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={selectedConnections.has(v.id)}
                          onChange={() => {
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span className="font-normal ml-3 block truncate">{v.name}</span>
                      </div>
                    </div>
                  ))}
              </div>
              )
              }
              <div className="flex flex-wrap gap-2 mt-3">
                {Array.from(selectedConnections).map(id => {
                  const v = allConnections.find(i => i.id === id);
                  if (!v) return null;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {v.name}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleConnection(id);
                        }}
                        className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-200 hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <span className="sr-only">Remove {v.name}</span>
                        <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                          <path
                            d="M4 3.293L6.646.646a.5.5 0 01.708.708L4.707 4l2.647 2.646a.5.5 0 01-.708.708L4 4.707l-2.646 2.647a.5.5 0 01-.708-.708L3.293 4 .646 1.354a.5.5 0 01.708-.708L4 3.293z"/>
                        </svg>
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="relative" ref={dropdownRef}>
              <label className={headingStyle}>
                Core Interests
              </label>

              <div className="relative">
                <div className="flex items-center border border-gray-300 rounded-md shadow-sm">
                  <input
                    type="text"
                    value={newInterest}
                    maxLength={100}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onFocus={() => setShowDropdown(true)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border-0 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Type to search or add new interest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="px-3 py-2 border-l border-gray-300  text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                         fill="currentColor">
                      <path fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"/>
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={addNewInterest}
                    disabled={!newInterest.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add
                  </button>
                </div>

                {(showDropdown || newInterest) && (
                  <div
                    className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {/* New interest option */}
                    {newInterest && !allInterests.some(i =>
                      i.name.toLowerCase() === newInterest.toLowerCase()
                    ) && (
                      <div
                        className=" cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 dark:hover:bg-gray-700"
                        onClick={() => addNewInterest()}
                      >
                        <div className="flex items-center">
                          <span className="font-normal ml-3 block truncate">
                            Add "{newInterest}"
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Filtered interests */}
                    {allInterests
                      .filter(interest =>
                        interest.name.toLowerCase().includes(newInterest.toLowerCase())
                      )
                      .map((interest) => (
                        <div
                          key={interest.id}
                          className=" cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 dark:hover:bg-gray-700"
                          onClick={() => {
                            toggleInterest(interest.id);
                            setNewInterest('');
                          }}
                        >
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              checked={selectedInterests.has(interest.id)}
                              onChange={() => {
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="font-normal ml-3 block truncate">
                              {interest.name}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Selected interests */}
              <div className="flex flex-wrap gap-2 mt-3">
                {Array.from(selectedInterests).map(interestId => {
                  const interest = allInterests.find(i => i.id === interestId);
                  if (!interest) return null;
                  return (
                    <span
                      key={interestId}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {interest.name}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleInterest(interestId);
                        }}
                        className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-200 hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <span className="sr-only">Remove {interest.name}</span>
                        <svg className="h-2 w-2" fill="currentColor" viewBox="0 0 8 8">
                          <path
                            d="M4 3.293L6.646.646a.5.5 0 01.708.708L4.707 4l2.647 2.646a.5.5 0 01-.708.708L4 4.707l-2.646 2.647a.5.5 0 01-.708-.708L3.293 4 .646 1.354a.5.5 0 01.708-.708L4 3.293z"/>
                        </svg>
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="introversion" className={headingStyle}>
                Introversion (in %)
              </label>
              <input
                id="introversion"
                name="introversion"
                type="number"
                min="0"
                max="100"
                value={introversion ?? ''}
                onChange={(e) => setIntroversion(Number(e.target.value))}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500  focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                // placeholder=""
              />
            </div>

            {/*<div>*/}
            {/*  <label htmlFor="personalityType" className={headingStyle}>*/}
            {/*    Personality Type*/}
            {/*  </label>*/}
            {/*  <select*/}
            {/*    id="personalityType"*/}
            {/*    name="personalityType"*/}
            {/*    value={personalityType || ''}*/}
            {/*    onChange={(e) => setPersonalityType(e.target.value as PersonalityType)}*/}
            {/*    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500  focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"*/}
            {/*  >*/}
            {/*    <option value="">Select your personality type</option>*/}
            {/*    {personalityOptions.map((type) => (*/}
            {/*      <option key={type} value={type}>*/}
            {/*        {type}*/}
            {/*      </option>*/}
            {/*    ))}*/}
            {/*  </select>*/}
            {/*</div>*/}

            <div>
              <label htmlFor="conflictStyle" className={headingStyle}>
                Conflict Style
              </label>
              <select
                id="conflictStyle"
                name="conflictStyle"
                value={conflictStyle || ''}
                onChange={(e) => setConflictStyle(e.target.value as ConflictStyle)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500  focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              >
                <option value="">Select your conflict style</option>
                {conflictOptions.map((style) => (
                  <option key={style} value={style}>
                    {style}
                  </option>
                ))}
              </select>
            </div>

            <div className="max-w-3xl w-full">
              <label htmlFor="description" className={headingStyle}>
                About You
                <p className="text-xs italic">
                  Feel free to include any relevant links (dating / friends docs, etc.), but consider copy-pasting
                  the content here so that people can find you by keyword search.
                </p>
              </label>
              <div className="mt-2 mb-4">
                <button 
                  type="button" 
                  onClick={() => setShowMoreInfo(!showMoreInfo)}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
                >
                  {showMoreInfo ? 'Hide info' : 'Key details for fulfilling encounters'}
                  <svg 
                    className={`w-4 h-4 ml-1 transition-transform ${showMoreInfo ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showMoreInfo && (
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm text-gray-700 dark:text-gray-300">
                    <p className="mt-2">To the extent that you are comfortable sharing, consider writing about:</p>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Your interests and what you're looking for: type of connection, activities to do, etc.</li>
                      <li>Your availability and timezone</li>
                      <li>What makes you unique</li>
                      <li>Your expectations and boundaries</li>
                      <li>Your intellectual interests (currently exploring, favorite, and least favorite)</li>
                      <li>Your core values</li>
                      <li>Your altruistic values: community engagement, social justice, and other cause areas</li>
                      <li>Your level of education, hobbies, pets, habits, subcultures, diet, emotional sensitivity, sense of humor, ambition, organization, pet peeves, non-negotiables</li>
                      <li>Your thinking style, results from evidence-based personality tests (e.g., Big 5)</li>
                      <li>Your physical and mental health: some traits that rub people the wrong way, triggers, therapy, or what you are trying to improve</li>
                      <li>If interested in romantic relationships, your love languages (giving and receiving), timeline, romantic orientation, family projects, work-life balance, financial goals / habits, career goals, housing situation (renting vs owning), and whether you would date someone who already has kids</li>
                      <li>What you would like in your ideal person or connection—where they should be similar or different from your own description</li>
                      <li>Conversation starters or questions</li>
                    </ul>
                  </div>
                )}
              </div>
              <textarea
                id="description"
                name="description"
                rows={20}
                // required
                value={description}
                maxLength={30000}
                onChange={(e) => setDescription(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500  focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Tell us about yourself, your background, and what you're looking for."
              />
            </div>

            <div>
              <label htmlFor="contactInfo" className={headingStyle}>
                Contact Information
              </label>
              <textarea
                id="contactInfo"
                name="contactInfo"
                rows={5}
                value={contactInfo}
                maxLength={5000}
                onChange={(e) => setContactInfo(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500  focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="How can people reach you? (Email, social media, phone, Google Forms, etc.)"
              />
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Photos</h3>
            <div className="grid grid-cols-3 gap-4">
              {Array.from(new Set(images)).map((img, index) => (
                <div key={index}
                     className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <Image
                    src={img}
                    alt={`Uploaded image ${index + 1}`}
                    width={200}
                    height={200}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImages(prev => prev.filter((_, i) => i !== index));
                      setKeys(prev => prev.filter((_, i) => i !== index));
                    }}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove image"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"/>
                    </svg>
                  </button>
                </div>
              ))}

              {Array.from(new Set(images)).length < 9 && (
                <label
                  className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400 mb-1" fill="none"
                       viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                  </svg>
                  {/*<span className="text-sm text-gray-500">*/}
                  {/*  {images.length === 0 ? 'Add photos' : 'Add more'}*/}
                  {/*</span>*/}
                  <span className="text-xs text-gray-400">
                    {9 - Array.from(new Set(images)).length} remaining
                  </span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImagesUpload}
                    accept="image/*"
                    className="hidden"
                    disabled={isUploading || Array.from(new Set(images)).length >= 9}
                    multiple
                  />
                </label>
              )}
            </div>
            {images.length === 0 && (
              <p className="mt-1 text-sm text-gray-500">
                Add up to 9 photos to your profile
              </p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white ${
                isSubmitting || isUploading
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              {isSubmitting || isUploading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

          {id &&
              <div>
                  <DeleteProfileButton
                      profileId={id}
                      onDelete={() => signOut({callbackUrl: "/"})}
                  />
              </div>
          }
        </form>
      </div>
    </div>
  );
}
