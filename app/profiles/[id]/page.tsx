'use client';

import {useEffect, useState} from "react";
import {notFound, useParams} from "next/navigation";
import Image from "next/image";

interface ProfileData {
  name?: string;
  image?: string;
  gender?: string;
  description?: string;
}

export const dynamic = "force-dynamic"; // This disables SSG and ISR

export default function Post() {
  const {id} = useParams();
  const [profile, setProfile] = useState<ProfileData | null>(null);
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
        setProfile(data);
        console.log(`Data image: ${data.image}`)

        // If user has an image key, fetch the image
        if (data.image) {
          const imageResponse = await fetch(`/api/download?key=${data.image}`);
          console.log(`imageResponse: ${imageResponse}`)
          if (imageResponse.ok) {
            const imageBlob = await imageResponse.json();
            const imageUrl = imageBlob['url'];
            setImage(imageUrl);
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
    return <div></div>;
  }

  if (!profile) {
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
                  alt={profile.name || 'Profile picture'}
                  className="h-full w-full object-cover"
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
                {profile.name ? profile.name.charAt(0).toUpperCase() : 'U'}
              </span>
            </div>
          )}
        </div>

        {/* Profile Content */}
        <div className="pt-20 px-8 pb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {profile.name}
          </h1>

          <div className="space-y-6 pt-4 border-t border-gray-200">
            {profile.gender && (
              <div>
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Gender</h2>
                <p className="mt-1 capitalize">{profile.gender}</p>
              </div>
            )}

            {profile.description && (
              <div>
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">About</h2>
                <p className="mt-1 text-gray-800 whitespace-pre-line">{profile.description}</p>
              </div>
            )}
          </div>
        </div>
      </article>


    </div>
  );
}
