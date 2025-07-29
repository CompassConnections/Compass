'use client';

import {ChangeEvent, useEffect, useRef, useState} from 'react';
import {useRouter} from 'next/navigation';
import {useSession} from 'next-auth/react';
import Image from 'next/image';
import {ConflictStyle, Gender, PersonalityType} from "@prisma/client";

export default function CompleteProfile() {
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const {data: session, update} = useSession();

  // const [selected, setSelected] = useState(new Set(selectedInterests));
  //
  // const toggleInterest = (interestId) => {
  //   setSelected((prev) => {
  //     const newSet = new Set(prev);
  //     newSet.has(interestId) ? newSet.delete(interestId) : newSet.add(interestId);
  //     return newSet;
  //   });
  // };

  // const handleInterestSubmit = (e) => {
  //   e.preventDefault();
  //   onSave(Array.from(selected)); // send to API
  // };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (5MB max)
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
        ...(key && {image: key}),
      });
      console.log(`Body: ${body}`)
      // alert(body)
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
        return
      }

      // Update the session to reflect the changes
      await update();

      // Redirect to the home page or dashboard
      router.push('/');
    } catch (error) {
      console.error('Profile update error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const img = session?.user?.image;
    if (img) {
      setImage(img);
    }
  }, [session]);

  const genderOptions = Object.values(Gender);
  const personalityOptions = Object.values(PersonalityType);
  const conflictOptions = Object.values(ConflictStyle);

  // const answers = [
  //   {
  //     prompt: 'What is your favorite color?',
  //     answer: 'Blue',
  //   },
  //   {
  //     prompt: 'What is your favorite animal?',
  //     answer: 'Dog',
  //   }
  // ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
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

          <div className="pt-4">

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                Gender <span className="text-red-500">*</span>
              </label>
              <select
                id="gender"
                name="gender"
                required
                value={gender}
                onChange={(e) => setGender(e.target.value as Gender)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              >
                <option value="">Select your gender</option>
                {genderOptions.map((g) => (
                  <option key={g} value={g}>
                    {g.replace(/_/g, ' ')} {/* optional: format label */}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4">
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <textarea
                id="location"
                name="location"
                rows={1}
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              />
            </div>

            <div className="pt-4">
              <label htmlFor="personality" className="block text-sm font-medium text-gray-700 mb-1">
                Personality <span className="text-red-500">*</span>
              </label>
              <select
                id="personality"
                name="personality"
                required
                value={personalityType}
                onChange={(e) => setPersonalityType(e.target.value as PersonalityType)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              >
                <option value="">Select your personality</option>
                {personalityOptions.map((g) => (
                  <option key={g} value={g}>
                    {g.replace(/_/g, ' ')} {/* optional: format label */}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4">
              <label htmlFor="conflictStyle" className="block text-sm font-medium text-gray-700 mb-1">
                Conflict / Disagreement Style <span className="text-red-500">*</span>
              </label>
              <select
                id="conflictStyle"
                name="conflictStyle"
                required
                value={conflictStyle}
                onChange={(e) => setConflictStyle(e.target.value as ConflictStyle)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              >
                <option value="">Select your conflictStyle</option>
                {conflictOptions.map((g) => (
                  <option key={g} value={g}>
                    {g.replace(/_/g, ' ')} {/* optional: format label */}
                  </option>
                ))}
              </select>
            </div>

          {/*  <div className="pt-4">*/}
          {/*  {allInterests.map((interest) => (*/}
          {/*    <label key={interest.id} className="flex items-center space-x-2">*/}
          {/*      <input*/}
          {/*        type="checkbox"*/}
          {/*        checked={selected.has(interest.id)}*/}
          {/*        onChange={() => toggleInterest(interest.id)}*/}
          {/*      />*/}
          {/*      <span>{interest.name}</span>*/}
          {/*    </label>*/}
          {/*  ))}*/}
          {/*</div>*/}

            <div className="pt-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                About You <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Tell us a bit about yourself. You can link to social media profiles or dating / connection documents."
              />
            </div>

            {/*<div className="pt-4">*/}
            {/*  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">*/}
            {/*    Prompts*/}
            {/*  </label>*/}
            {/*  {answers.map(({ prompt, answer }) => (*/}
            {/*    <div key={prompt}>*/}
            {/*      <label className="block font-medium">{prompt}</label>*/}
            {/*      <input*/}
            {/*        type="text"*/}
            {/*        value={answer}*/}
            {/*        onChange={(e) => handleChange(prompt, e.target.value)}*/}
            {/*        className="w-full border px-2 py-1"*/}
            {/*      />*/}
            {/*    </div>*/}
            {/*  ))}*/}
            {/*</div>*/}

            <div className="pt-4">
              <label htmlFor="contact" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Info
              </label>
              <textarea
                id="contact"
                name="contact"
                rows={4}
                required
                value={contactInfo}
                onChange={(e) => setContactInfo(e.target.value)}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Add your contact info here (email, phone, Google Form, etc.) until the chat feature is ready"
              />
            </div>

            <div className="pt-4">
              <p className="mt-1 text-xs text-gray-500">
                Note that all the information will be public and crawlable for now—in the future, we will add different
                levels of privacy.
              </p>
            </div>

          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting || isUploading ? 'Saving...' : 'Save and Continue'}
            </button>

            {/*<div className="mt-4 text-center">*/}
            {/*  <button*/}
            {/*    type="button"*/}
            {/*    onClick={() => router.push('/')}*/}
            {/*    className="text-sm font-medium text-blue-600 hover:text-blue-500"*/}
            {/*  >*/}
            {/*    Skip for now*/}
            {/*  </button>*/}
            {/*</div>*/}
          </div>
        </form>
      </div>
    </div>
  );
}
