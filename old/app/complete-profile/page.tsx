'use client';

import React, {ChangeEvent, ReactNode, Suspense, useEffect, useRef, useState} from 'react';
import {useRouter, useSearchParams} from 'next/navigation';
import {signOut, useSession} from 'next-auth/react';
import Image from 'next/image';
import {ConflictStyle, Gender, PersonalityType} from "@prisma/client";
import {parseImage} from "@/lib/client/media";
import {DeleteProfileButton} from "@/lib/client/profile";
import PromptAnswer from '@/components/ui/PromptAnswer';

import imageCompression from 'browser-image-compression';
import {Item} from '@/lib/client/schema';
import {fetchFeatures} from "@/lib/client/fetching";
import {errorBlock} from "@/lib/client/errors";
import Slider from "@mui/material/Slider";


export default function CompleteProfile() {
  return (
    <Suspense fallback={<div></div>}>
      <RegisterComponent/>
    </Suspense>
  );
}

interface Prompt {
  prompt: string
  answer: string
}

function RegisterComponent() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [description, setDescription] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [location, setLocation] = useState('');
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [promptOptions, setPromptOptions] = useState([]);
  const [age, setAge] = useState<number | null>(null);
  const [introversion, setIntroversion] = useState<number | null>(null);
  const [personalityType, setPersonalityType] = useState('');
  const [conflictStyle, setConflictStyle] = useState('');
  const [promptAnswers, setPromptAnswers] = useState<any>({});
  const [image, setImage] = useState<string>('');
  const [key, setKey] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [keys, setKeys] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const {data: session, update} = useSession();

  const featureNames = ['interests', 'coreValues', 'description', 'connections', 'causeAreas', 'books'];

  const [showMoreInfo, _setShowMoreInfo] = useState(() =>
    Object.fromEntries(featureNames.map((id) => [id, false]))
  );
  const setShowMoreInfo = (id: string, value: boolean) => {
    _setShowMoreInfo((prev) => ({...prev, [id]: value}));
  };

  const [newFeature, _setNewFeature] = useState(() =>
    Object.fromEntries(featureNames.map((id) => [id, '']))
  );
  const setNewFeature = (id: string, value: string) => {
    _setNewFeature((prev) => ({...prev, [id]: value}));
  };

  const [allFeatures, _setAllFeatures] = useState(() =>
    Object.fromEntries(featureNames.map((id) => [id, [] as Item[]]))
  );
  const setAllFeatures = (id: string, value: any) => {
    _setAllFeatures((prev) => ({...prev, [id]: value}));
  };

  const [selectedFeatures, _setSelectedFeatures] = useState(() =>
    Object.fromEntries(featureNames.map((id) => [id, new Set<string>()]))
  );
  const setSelectedFeatures = (id: string, value: Set<string>) => {
    _setSelectedFeatures((prev) => ({...prev, [id]: value}));
  }

  const [showDropdown, _setShowDropdown] = useState(() =>
    Object.fromEntries(featureNames.map((id) => [id, false]))
  );
  const setShowDropdown = (id: string, value: boolean) => {
    _setShowDropdown((prev) => ({...prev, [id]: value}));
  };

  const refDropdown = useRef<any>(
    Object.fromEntries(featureNames.map((id) => [id, React.createRef<HTMLDivElement>()]))
  );

  const id = session?.user.id

  // console.log(session)

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
            if (profile.promptAnswers) {
              setPromptAnswers(Object.fromEntries(profile.promptAnswers.map((item: Prompt) => [item.prompt, item.answer])));
            }
            setIntroversion(profile.introversion || null);
            if (profile.birthYear) {
              setAge(new Date().getFullYear() - profile.birthYear);
            }

            // Set selected interests if any
            function setSelFeat(id: string, attribute: string, subAttribute: string) {
              const feature = profile[attribute];
              if (feature?.length > 0) {
                const ids = feature.map((pi: any) => pi[subAttribute].id);
                setSelectedFeatures(id, new Set(ids));
              }
            }

            setSelFeat('interests', 'intellectualInterests', 'interest')
            setSelFeat('coreValues', 'coreValues', 'value')
            setSelFeat('connections', 'desiredConnections', 'connection')
            setSelFeat('causeAreas', 'causeAreas', 'causeArea')
            setSelFeat('books', 'books', 'value')

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

  useEffect(() => {
    async function asyncRun() {
      try {
        const res = await fetch('/api/profiles/prompts');
        if (res.ok) {
          const data = await res.json();
          // console.log('uniquePrompts', data.uniquePrompts);
          setPromptOptions(data.uniquePrompts);
        }
      } catch (error) {
        console.error('Error from /api/prompts:', error);
      }
    }

    asyncRun();

  }, []);

  useEffect(() => {
    fetchFeatures(setAllFeatures)
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      for (const id in showDropdown) {
        const ref = refDropdown.current[id];
        if (
          ref?.current &&
          !ref.current.contains(event.target as Node)
        ) {
          setShowDropdown(id, false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  if (isLoading) {
    return (
      <div className="flex justify-center min-h-screen py-8">
        <div data-testid="spinner"
             className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

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

    // Compression options
    const options = {
      maxSizeMB: 1,              // Target max size in MB
      maxWidthOrHeight: 1024,    // Resize to fit within this dimension
      useWebWorker: true,
    };

    try {
      setIsUploading(true);
      setError('');

      const compressedFile = await imageCompression(file, options);

      console.log(`Original: ${file.size / 1024} KB`);
      console.log(`Compressed: ${compressedFile.size / 1024} KB`);

      // Send via FormData
      const formData = new FormData();
      formData.append('file', compressedFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('response:', response.headers);
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

      const promptAnswersList = Object.entries(promptAnswers).map(([prompt, answer]) => ({prompt, answer}));
      console.log('promptAnswersList', promptAnswersList)

      console.log('submit image', key);
      console.log('submit images', keys);

      const data: any = {
        profile: {
          description,
          contactInfo,
          location,
          gender: gender as Gender,
          ...(age && {birthYear: new Date().getFullYear() - age}),
          introversion,
          personalityType: personalityType as PersonalityType,
          conflictStyle: conflictStyle as ConflictStyle,
          promptAnswers: {create: promptAnswersList},
          images: keys,
        },
        ...(key && {image: key}),
        ...(name && {name}),
      };
      for (const name of ['books', 'interests', 'connections', 'coreValues', 'causeAreas']) {
        // if (!selectedFeatures[name].size) continue;
        data[name] = Array.from(selectedFeatures[name]).map(id => ({
          id: id.startsWith('new-') ? undefined : id,
          name: allFeatures[name].find(i => i.id === id)?.name
        }));
      }
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
  // const conflictOptions = Object.values(ConflictStyle);

  const headingStyle = "block text-base font-medium text-gray-700 dark:text-white mb-1";

  function getDetails(id: string, brief: string, text: ReactNode) {
    return <>
      <div className="mt-2 mb-4">
        <button
          type="button"
          onClick={() => setShowMoreInfo(id, !showMoreInfo[id])}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center"
        >
          {showMoreInfo[id] ? 'Hide info' : brief}
          <svg
            className={`w-4 h-4 ml-1 transition-transform ${showMoreInfo[id] ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
          </svg>
        </button>
        {showMoreInfo[id] && (
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm text-gray-700 dark:text-gray-300">
            {text}
          </div>
        )}
      </div>
    </>;
  }

  interface DropdownConfig {
    id: string;
    title: string;
    allowAdd: boolean;
    content: ReactNode;
  }

  const dropdownConfig: DropdownConfig[] = [
    {
      id: 'connections', title: 'Connection Type', allowAdd: false,
      content: null
    },
    {
      id: 'coreValues', title: 'Values', allowAdd: true,
      content: <>
        <p className="mt-2">
          When defining your core values on a platform meant for forming deep, lasting bonds, focus on what governs your
          choices, shapes your relationships, and anchors your sense of integrity—even when it's inconvenient. These
          aren't traits you aspire to signal; they’re principles you consistently return to when life is uncertain or
          difficult. Think in terms of how you treat others (e.g. intellectual honesty, compassion, loyalty), how you
          approach truth (e.g. humility, curiosity, critical thinking), and how you handle conflict or complexity (e.g.
          courage, nuance, responsibility). Be specific and truthful—avoid vague terms like “kindness” unless you can
          explain what it actually looks like in practice. The point isn't to be agreeable to everyone, but to be
          legible to those who share or deeply respect the values that define you. That clarity is what builds trust—and
          trust is the foundation of any bond worth keeping.
        </p>
      </>
    },
    {
      id: 'interests', title: 'Interests', allowAdd: true,
      content: <>
        <p className="mt-2">
          When selecting your core interests on a platform designed to foster deep, lasting
          bonds, think beyond surface-level hobbies and focus on what truly shapes how you see the world and
          connect with others. Choose interests that reveal how you think, what you care about deeply, and
          where you’re most engaged—intellectually, emotionally, or ethically. These might include long-term
          fascinations (like moral philosophy, storytelling, or systems thinking), enduring questions you
          wrestle with, or areas where you're actively growing. Don’t be afraid to show complexity or
          contradiction; honesty invites resonance. The goal isn’t to impress, but to be understood—by the
          kind of person who wants to know you for who you actually are, not just what you do for fun.
        </p>
      </>
    },
    {
      id: 'books', title: 'Works to discuss', allowAdd: true,
      content: <>
        <p className="mt-2">
          List the works (books, articles, essays, reports, etc.) you would like to bring up.
          For each work, include the exact title (as it appears on the cover), the
          author’s full name, and, if necessary, the edition or publication year. For example: <i>Peter Singer - Animal
          Liberation</i>. If you want to focus on specific
          chapters, themes, or questions, note them in your description—it helps keep the discussion targeted. Don’t just write
          “something by Orwell” or “that new mystery”; vague entries waste time and make it harder for others to find
          the right work. Be explicit so everyone is literally on the same page!
        </p>
      </>
    },
    // {
    //   id: 'causeAreas', title: 'Cause Areas', allowAdd: true,
    //   content: <>
    //     <p className="mt-2">
    //       When choosing your cause areas on a platform designed for deep, lasting connection, focus on the issues that
    //       you feel personally compelled to engage with—not just what’s socially approved or intellectually interesting.
    //       Good cause areas reveal what breaks your heart, what energizes your long-term thinking, or what you’d
    //       willingly struggle for even if no one noticed. Be honest about what genuinely matters to you: that might be
    //       existential risk reduction, prison abolition, mental health reform, animal welfare, epistemic integrity, or
    //       education equity. You don’t need to be an expert or activist to list a cause—just sincerely invested. The
    //       point isn’t to posture but to expose what kind of future you want to help shape, and to find others whose
    //       moral intuitions and sense of responsibility resonate with your own. That kind of alignment creates not just
    //       shared goals, but durable trust.
    //     </p>
    //   </>
    // },
  ]

  function getDropdown({id, title, allowAdd, content}: DropdownConfig) {
    const newFeat = newFeature[id];
    const allFeat = allFeatures[id];
    const selectedFeat = selectedFeatures[id];

    const toggleFeature = (featureId: string) => {
      const newSet = new Set(selectedFeat);
      if (newSet.has(featureId)) {
        newSet.delete(featureId);
      } else {
        newSet.add(featureId);
      }
      setSelectedFeatures(id, newSet);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addNewFeature();
      } else if (e.key === 'Escape') {
        setShowDropdown(id, false);
      }
    };

    const addNewFeature = (e?: React.FormEvent) => {
      if (e) e.preventDefault();
      const toAdd = newFeat.trim();
      if (!toAdd) return;

      // Check if interest already exists (case-insensitive)
      const existingFeature = allFeat.find(
        i => i.name.toLowerCase() === toAdd.toLowerCase()
      );

      if (existingFeature) {
        // Toggle selection if it exists
        toggleFeature(existingFeature.id);
      } else {
        // Add new feature
        const newObj = {id: `new-${Date.now()}`, name: toAdd};
        setAllFeatures(id, [...allFeat, newObj]);
        setSelectedFeatures(id, new Set(selectedFeat).add(newObj.id));
      }

      setNewFeature(id, '');
      setShowDropdown(id, false);
    };

    return <>
      <div className="relative" ref={refDropdown.current[id]}>
        <label className={headingStyle}>
          {title}
        </label>
        {content && getDetails(id, 'Tips', content)}

        <div className="relative">
          <div className="flex items-center border border-gray-300 rounded-md shadow-sm">
            <input
              type="text"
              value={newFeat}
              maxLength={100}
              onChange={(e) => setNewFeature(id, e.target.value)}
              onFocus={() => setShowDropdown(id, true)}
              onKeyDown={handleKeyDown}
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border-0 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder={allowAdd ? "Search or add your own" : "Type to search"}
            />
            <button
              type="button"
              onClick={() => setShowDropdown(id, !showDropdown[id])}
              className="px-3 py-2 border-l border-gray-300  text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 "
            >
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"
                   fill="currentColor">
                <path fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"/>
              </svg>
            </button>
            {allowAdd &&
                <button
                    type="button"
                    onClick={addNewFeature}
                    disabled={!newFeat.trim()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Add
                </button>
            }
          </div>

          {(showDropdown[id] || newFeat) && (
            <div
              className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
              {/* New interest option */}
              {allowAdd && newFeat && !allFeat.some(i =>
                i.name.toLowerCase() === newFeat.toLowerCase()
              ) && (
                <div
                  className=" cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 dark:hover:bg-gray-700"
                  onClick={() => addNewFeature()}
                >
                  <div className="flex items-center">
                          <span className="font-normal ml-3 block truncate">
                            Add "{newFeat}"
                          </span>
                  </div>
                </div>
              )}

              {/* Filtered features */}
              {(!allowAdd || newFeat.length >= 3) && allFeat
                .filter(feature =>
                  feature.name.toLowerCase().includes(newFeat.toLowerCase())
                )
                .map((feature) => (
                  <div
                    key={feature.id}
                    className="cursor-default select-none relative py-2 pl-3 pr-9 hover:bg-blue-50 dark:hover:bg-gray-700"
                    onClick={() => {
                      toggleFeature(feature.id);
                      setNewFeature(id, '');
                    }}
                  >
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded "
                        checked={selectedFeat.has(feature.id)}
                        onChange={(e) => {
                          e.stopPropagation()
                        }}
                      />
                      <span className="font-normal ml-3 block truncate">{feature.name}</span>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Selected interests */}
        <div className="flex flex-wrap gap-2 mt-3">
          {Array.from(selectedFeat).map(featureId => {
            const interest = allFeat.find(i => i.id === featureId);
            if (!interest) return null;
            return (
              <span
                key={featureId}
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:text-white dark:bg-gray-700"
              >
                      {interest.name}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFeature(featureId);
                  }}
                  className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-blue-200 dark:bg-gray-500 hover:bg-blue-300 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
    </>
  }

  return (
    <div className="min-h-screen flex items-center justify-center  py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold ">
            Complete Your Profile
          </h2>
        </div>

        {error && errorBlock(error)}

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

            {dropdownConfig.map((v, i) => (
              <React.Fragment key={i}>{getDropdown(v)}</React.Fragment>
            ))}


            <div>
              <label htmlFor="introversion" className={headingStyle}>Social Style</label>
              <div className="flex items-center w-full max-w-xl gap-4">
                <span className={headingStyle}>Introverted</span>
                <Slider
                  value={introversion ? 100 - introversion : 50}
                  onChange={(e, value) => setIntroversion(100 - Number(value))}
                  valueLabelDisplay="auto"
                  min={0}
                  max={100}
                  sx={{
                    color: '#3B82F6',
                    '& .MuiSlider-valueLabel': {
                      backgroundColor: '#3B82F6',
                      color: '#fff',
                    },
                  }}
                  className="flex-1"
                />
                <span className={headingStyle}>Extroverted</span>
              </div>
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

            {/*<div>*/}
            {/*  <label htmlFor="conflictStyle" className={headingStyle}>*/}
            {/*    Conflict Style*/}
            {/*  </label>*/}
            {/*  <select*/}
            {/*    id="conflictStyle"*/}
            {/*    name="conflictStyle"*/}
            {/*    value={conflictStyle || ''}*/}
            {/*    onChange={(e) => setConflictStyle(e.target.value as ConflictStyle)}*/}
            {/*    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500  focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"*/}
            {/*  >*/}
            {/*    <option value="">Select your conflict style</option>*/}
            {/*    {conflictOptions.map((style) => (*/}
            {/*      <option key={style} value={style}>*/}
            {/*        {style}*/}
            {/*      </option>*/}
            {/*    ))}*/}
            {/*  </select>*/}
            {/*</div>*/}

            <div className="max-w-3xl w-full">
              <label htmlFor="description" className={headingStyle}>
                About You
                <p className="text-sm italic">
                  People search by keyword, so include as many words that feel true to you!
                </p>
              </label>
              {getDetails(
                'description',
                'Tips',
                <>
                  <p className="mt-2">Consider adding:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Your interests and what you're looking for: type of connection, activities to do, etc.</li>
                    <li>Your availability and timezone</li>
                    <li>What makes you unique</li>
                    <li>Your expectations and boundaries</li>
                    <li>Your intellectual interests (currently exploring, favorite, and least favorite)</li>
                    <li>Your core values</li>
                    <li>Your altruistic values: community engagement, social justice, and other cause areas</li>
                    <li>Your level of education, hobbies, pets, habits, subcultures, diet, emotional sensitivity, sense
                      of humor, ambition, organization, pet peeves, non-negotiables
                    </li>
                    <li>Your thinking style, results from evidence-based personality tests (e.g., Big 5)</li>
                    <li>Your physical and mental health: some traits that rub people the wrong way, triggers, therapy,
                      or what you are trying to improve
                    </li>
                    <li>If interested in romantic relationships, your love languages (giving and receiving), timeline,
                      romantic orientation, family projects, work-life balance, financial goals / habits, career goals,
                      housing situation (renting vs owning), and whether you would date someone who already has kids
                    </li>
                    <li>What you would like in your ideal person or connection—where they should be similar or different
                      from your own description
                    </li>
                    <li>Conversation starters or questions</li>
                  </ul>
                </>
              )
              }
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

          <div>
            <label htmlFor="contactInfo" className={headingStyle}>
              Prompts
            </label>
            <p className="text-sm italic">
              As of now, you can only answer 1 prompt at a time—just save your profile after answering each prompt.
            </p>
            <PromptAnswer
              prompts={promptOptions}
              initialValues={promptAnswers}
              onAnswerChange={(e) => {
                console.log(e.promptId, e.prompt, e.text);
                if (!e.prompt) return;
                promptAnswers[e.prompt] = e.text;
                setPromptAnswers(promptAnswers);
                console.log(promptAnswers);
              }}
            />
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
                {/*<br/>Note: uploads may only work on desktop*/}
              </p>
            )}
          </div>

          {error && errorBlock(error)}

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
