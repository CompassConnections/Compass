'use client';

import {ChangeEvent, Suspense, useEffect, useRef, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {useSession} from 'next-auth/react';
import Image from 'next/image';
import {ConflictStyle, Gender, PersonalityType} from "@prisma/client";
import {parseImage} from "@/lib/client/media";

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
  const [gender, setGender] = useState('');
  const [personalityType, setPersonalityType] = useState('');
  const [conflictStyle, setConflictStyle] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [key, setKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [allInterests, setAllInterests] = useState<{ id: string, name: string }[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set());
  const [newInterest, setNewInterest] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const {data: session, update} = useSession();

  console.log('image', image)

  // Fetch user profile data
  useEffect(() => {
    async function fetchUserProfile() {
      if (!session?.user?.email) return;

      try {
        const response = await fetch('/api/profile');
        if (response.ok) {
          const userData = await response.json();
          if (userData?.profile) {
            const {profile} = userData;
            setDescription(profile.description || '');
            setContactInfo(profile.contactInfo || '');
            setLocation(profile.location || '');
            setGender(profile.gender || '');
            setPersonalityType(profile.personalityType || null);
            setConflictStyle(profile.conflictStyle || '');
            await parseImage(profile.image, setImage);

            // Set selected interests if any
            if (profile.intellectualInterests?.length > 0) {
              const interestIds = profile.intellectualInterests
                .map((pi: any) => pi.interest.id);
              setSelectedInterests(new Set(interestIds));
            }
          }
          if (userData?.image) {
            await parseImage(userData.image, setImage);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
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
      setImage(url);
      setKey(key);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!gender) {
      setError('Please select your gender');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const body = JSON.stringify({
        profile: {
          description,
          contactInfo,
          location,
          gender,
          personalityType,
          conflictStyle,
        },
        interests: Array.from(selectedInterests).map(id => ({
          id: id.startsWith('new-') ? undefined : id,
          name: allInterests.find(i => i.id === id)?.name || id.replace('new-', '')
        })),
        ...(key && {image: key}),
      });
      console.log(`Body: ${body}`)

      const response = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: body,
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
  const personalityOptions = Object.values(PersonalityType);
  const conflictOptions = Object.values(ConflictStyle);

  const headingStyle = "block text-sm font-medium text-gray-700 dark:text-white mb-1";

  return (
    <div className="min-h-screen flex items-center justify-center  py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
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

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
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

          <div className="space-y-4">
            <div>
              <label htmlFor="gender" className={headingStyle}>
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                id="gender"
                name="gender"
                required
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
              <label htmlFor="location" className={headingStyle}>
                Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500  focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="City, Country"
              />
            </div>

            <div>
              <label htmlFor="personalityType" className={headingStyle}>
                Personality Type
              </label>
              <select
                id="personalityType"
                name="personalityType"
                value={personalityType || ''}
                onChange={(e) => setPersonalityType(e.target.value as PersonalityType)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500  focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              >
                <option value="">Select your personality type</option>
                {personalityOptions.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

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

            <div className="relative" ref={dropdownRef}>
              <label className={headingStyle}>
                Interests
              </label>

              <div className="relative">
                <div className="flex items-center border border-gray-300 rounded-md shadow-sm">
                  <input
                    type="text"
                    value={newInterest}
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
                        className=" cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
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
                          className=" cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-blue-50"
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
              <label htmlFor="description" className={headingStyle}>
                About You <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500  focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Tell us about yourself, your background, and what you're looking for in connections."
              />
            </div>

            <div>
              <label htmlFor="contactInfo" className={headingStyle}>
                Contact Information
              </label>
              <textarea
                id="contactInfo"
                name="contactInfo"
                rows={2}
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500  focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="How can people reach you? (Email, social media, etc.)"
              />
            </div>
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
        </form>
      </div>
    </div>
  );
}
