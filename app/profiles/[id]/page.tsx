'use client';

import {useEffect, useState} from "react";
import {notFound, useParams} from "next/navigation";
import Image from "next/image";
import LoadingSpinner from "@/lib/LoadingSpinner";

interface ProfileData {
  name?: string;
  image?: string;
  profile?: any;
}

export const dynamic = "force-dynamic"; // This disables SSG and ISR

export default function Post() {
  const {id} = useParams();
  const [user, setUser] = useState<ProfileData | null>(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/profiles/${id}`);
        if (!response.ok) {
          notFound();
        }
        const data = await response.json();
        setUser(data);
        const img = data.image;
        console.log(`Data image: ${img}`)

        // If user has an image key, fetch the image
        if (img) {
          if (img.startsWith('http')) {
            setImage(img);
          } else {
            const imageResponse = await fetch(`/api/download?key=${img}`);
            console.log(`imageResponse: ${imageResponse}`)
            if (imageResponse.ok) {
              const imageBlob = await imageResponse.json();
              const imageUrl = imageBlob['url'];
              setImage(imageUrl);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [id]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    notFound();
  }

  console.log(`Image: ${image}`)


  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <article className="max-w-3xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Profile Header with Image */}
        <div className="bg-gradient-to-r h-16 relative">
          {image ? (
            <div className="absolute -bottom-16 left-8">
              <div className="h-32 w-32 rounded-full border-4 border-white overflow-hidden bg-white">
                <Image
                  src={image}
                  alt={user.name || 'Profile picture'}
                  className="h-full w-full object-cover"
                  width={200}
                  height={200}
                  // onError={(e) => {
                  //   const target = e.target as HTMLImageElement;
                  //   target.onerror = null;
                  //   target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'U')}&background=random`;
                  // }}
                />
              </div>
            </div>
          ) : (
            <div
              className="absolute -bottom-16 left-8 h-32 w-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center">
              <span className="text-4xl font-bold text-gray-600">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          )}
        </div>

        {/* Profile Content */}
        <div className="pt-20 px-8 pb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {user.name}
          </h1>

          <div className="space-y-6 pt-4 border-t border-gray-200">

            {user.profile.desiredConnections && (
              <div className="mt-3">                <
                h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Connection</h2>

                <ul className="flex flex-wrap gap-2 mt-1">
                  {user.profile.desiredConnections.map((value, idx) => (
                    <li
                      key={idx}
                      className="px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200 transition"
                    >
                      {value.connection.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {user.profile.gender && (
              <div>
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Gender</h2>
                <p className="mt-1 capitalize">{user.profile.gender}</p>
              </div>
            )}

            {user.profile.location && (
              <div>
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Location</h2>
                <p className="mt-1 text-gray-800 whitespace-pre-line">{user.profile.location}</p>
              </div>
            )}

            {user.profile.personalityType && (
              <div>
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Personality Type</h2>
                <p className="mt-1 text-gray-800 whitespace-pre-line">{user.profile.personalityType}</p>
              </div>
            )}

            {user.profile.conflictStyle && (
              <div>
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Conflit Style</h2>
                <p className="mt-1 text-gray-800 whitespace-pre-line">{user.profile.conflictStyle}</p>
              </div>
            )}

            {user.profile.intellectualInterests && (
              <div className="mt-3">                <
                h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Interests</h2>

                <ul className="flex flex-wrap gap-2 mt-1">
                  {user.profile.intellectualInterests.map((value, idx) => (
                    <li
                      key={idx}
                      className="px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200 transition"
                    >
                      {value.interest.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {user.profile.causeAreas && (
              <div className="mt-3">                <
                h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Cause Areas</h2>

                <ul className="flex flex-wrap gap-2 mt-1">
                  {user.profile.causeAreas.map((value, idx) => (
                    <li
                      key={idx}
                      className="px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200 transition"
                    >
                      {value.causeArea.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {user.profile.promptAnswers && (
              <div className="mt-3">                <
                h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Prompt Answers</h2>

                <ul className="flex flex-wrap gap-2 mt-1">
                  {user.profile.promptAnswers.map((value, idx) => (
                    <li
                      key={idx}
                      // className="px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200 transition"
                    >
                      • {value.prompt} {value.answer}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {user.profile.description && (
              <div>
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">About</h2>
                <p className="mt-1 text-gray-800 whitespace-pre-line">{user.profile.description}</p>
              </div>
            )}

            {user.profile.contactInfo && (
              <div>
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Contact</h2>
                <p className="mt-1 text-gray-800 whitespace-pre-line">{user.profile.contactInfo}</p>
              </div>
            )}

            {/*<div>*/}
            {/*  <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Creation Date</h2>*/}
            {/*  <p className="mt-1 text-gray-800 whitespace-pre-line">*/}
            {/*    {user.profile.createdAt}*/}
            {/*    {new Date(user.profile.createdAt).toLocaleDateString("en-US", {*/}
            {/*      year: "numeric",*/}
            {/*      month: "long",*/}
            {/*      day: "numeric",*/}
            {/*    })}*/}
            {/*  </p>*/}
            {/*</div>*/}



          </div>

        </div>

      </article>

    </div>
  );
}
