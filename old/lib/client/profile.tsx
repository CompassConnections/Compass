'use client';

import Image from "next/image";
import {pStyle} from "@/lib/client/constants";
import React, {useEffect, useState} from "react";
import {parseImage} from "@/lib/client/media";
import {useRouter} from 'next/navigation';

interface DeleteProfileButtonProps {
  profileId: string;
  onDelete?: () => void;
}

export function DeleteProfileButton({profileId, onDelete}: DeleteProfileButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this profile? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete profile');
      }

      // Call the onDelete callback if provided
      if (onDelete) {
        onDelete();
      } else {
        router.push('/');
      }
      console.log('Done deleting')


    } catch (error) {
      console.error('Error deleting profile:', error);
      alert('Failed to delete profile. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className=" items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-gray-900 dark:text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed group relative w-full justify-center "
    >
      {isDeleting ? 'Deleting...' : 'Delete Profile'}
    </button>
  );
}

export function Profile(url: string, header: any = null) {

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [image, setImage] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  useEffect(() => {
    async function fetchImage() {
      const res = await fetch(url);
      const data = await res.json();
      setUserData(data);
      // console.log('userData', data);
      document.title = data.name;
      if (data?.image) {
        await parseImage(data.image, setImage);

        // const link: HTMLLinkElement =
        //   document.querySelector("link[rel~='icon']") || document.createElement("link");
        // link.rel = "icon";
        // console.log('image for cover', image);
        // link.href = image || "";
        // link.type = "image/png"; // Or adjust based on actual image type
        // document.head.appendChild(link);
      }

      setImages([]);
      await Promise.all(
        (data?.profile?.images || []).map(async (img: string) => {
          await parseImage(img, setImages, true);
        })
      );
      console.log('images', data?.profile?.images);
      setLoading(false);
    }

    fetchImage();
  }, [url]);

  if (loading) {
    return (
      <div className="flex justify-center min-h-screen py-8">
        <div data-testid="spinner"
             className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!userData) {
    return <div>
      <h1 className="text-center">Profile not found</h1>
    </div>;
  }

  console.log('userData', userData);

  interface Tags {
    profileAttribute: string;
    attribute?: string;
    title: string;
  }

  const tagsConfig: Tags[] = [
    {profileAttribute: 'desiredConnections', attribute: 'connection', title: 'Connection Type'},
    {profileAttribute: 'coreValues', title: 'Values'},
    {profileAttribute: 'intellectualInterests', attribute: 'interest', title: 'Interests'},
    {profileAttribute: 'books', title: 'Works to Discuss'},
    // {profileAttribute: 'causeAreas', attribute: 'causeArea', title: 'Cause Areas'},
  ]

  function getTags({profileAttribute, attribute = 'value', title}: Tags) {
    const values = userData?.profile?.[profileAttribute];
    console.log('values', values);
    return <div key={profileAttribute + '.div'}>
      {values?.length > 0 && (
        <div className="mt-3"><
          h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider"> {title} </h2>
          <div className="flex flex-wrap gap-2 mt-1">
            {values.map((a: any) => (
              <span
                key={a?.[attribute]?.id}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-800 dark:text-white dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-500 transition"
              >
                {a?.[attribute]?.name}
              </span>
            ))}
          </div>
        </div>
      )
      }
    </div>;
  }

  return (
    <article className="max-w-3xl mx-auto shadow-lg rounded-lg overflow-hidden">
      {header}
      <div>
        <div className="flex items-start">
          <div className="pt-20 px-8 pb-8 flex-1">
            <h1 className="text-3xl font-bold  mb-2">
              {userData.name}
            </h1>
            <div className="space-y-6 pt-4 border-t border-gray-200"></div>
          </div>
          <div className="bg-gradient-to-r relative float-right h-auto flex items-start pt-20 px-8 pb-8">
            {
              image ? (
                  <div className="flex-1">
                    <div className="h-32 w-32 rounded-full border-4 border-white overflow-hidden ">
                      <a href={image} target="_blank" rel="noopener noreferrer">
                        <Image
                          src={image}
                          alt={userData.name || 'Profile picture'}
                          className="h-full w-full object-cover"
                          width={200}
                          height={200}
                          // onError={(e) => {
                          //   const target = e.target as HTMLImageElement;
                          //   target.onerror = null;
                          //   target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name || 'U')}&background=random`;
                          // }}
                        />
                      </a>
                    </div>
                  </div>
                ) :
                (
                  <div
                    className="-bottom-16 left-8 h-32 w-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center">
    <span className="text-4xl font-bold text-gray-600">
      {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
      </span>
                  </div>
                )
            }
          </div>
        </div>
        <div className="pt-20 px-8 pb-8 flex-1">
          <div className="space-y-6 pt-4">

            {
              userData?.profile?.gender && (
                <div>
                  <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider"> Gender </h2>
                  < p
                    className="mt-1 capitalize"> {userData.profile.gender} </p>
                </div>
              )
            }

            {
              userData?.profile?.birthYear && (
                <div>
                  <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider"> Age </h2>
                  < p
                    className="mt-1 capitalize"> {new Date().getFullYear() - userData.profile.birthYear} </p>
                </div>
              )
            }

            {
              userData?.profile?.location && (
                <div>
                  <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider"> Location </h2>
                  < p
                    className={pStyle}> {userData.profile.location} </p>
                </div>
              )
            }

            {
              userData?.profile?.occupation && (
                <div>
                  <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider"> Occupation </h2>
                  < p
                    className={pStyle}> {userData.profile.occupation} </p>
                </div>
              )
            }

            {
              userData?.profile?.introversion && (
                <div>
                  <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                    Social Style
                  </h2>
                  <div className="flex items-center w-full max-w-xl gap-4">
                    <span className={pStyle}>Introverted</span>
                    <div className="mt-1 flex items-center gap-4 w-32">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-200"
                          style={{width: `${100 - userData.profile.introversion}%`}}
                        />
                      </div>
                    </div>
                    <span className={pStyle}>Extroverted</span>
                  </div>
                </div>
              )
            }

            {
              userData?.profile?.personalityType && (
                <div>
                  <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider"> Personality
                    Type </h2>
                  < p
                    className={pStyle}> {userData.profile.personalityType} </p>
                </div>
              )
            }

            {/*{*/}
            {/*  userData?.profile?.conflictStyle && (*/}
            {/*    <div>*/}
            {/*      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider"> Conflict Style </h2>*/}
            {/*      < p*/}
            {/*        className={pStyle}> {userData.profile.conflictStyle} </p>*/}
            {/*    </div>*/}
            {/*  )*/}
            {/*}*/}

            {tagsConfig.map((tag: any) => getTags(tag))}

            {
              userData?.profile?.description && (
                <div>
                  <h2 className="text-sm font-medium text-gray-500  uppercase tracking-wider"> About </h2>
                  <p className={pStyle} style={{whiteSpace: 'pre-line'}}>{userData.profile.description}</p>
                </div>
              )
            }

            {
              userData?.profile?.contactInfo && (
                <div>
                  <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider"> Contact </h2>
                  <p className={pStyle} style={{whiteSpace: 'pre-line'}}>{userData.profile.contactInfo}</p>
                </div>
              )
            }

            {
              userData?.profile?.promptAnswers?.length > 0 && (
                <div className="mt-3"><
                  h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider"> Prompt Answers </h2>

                  < div
                    className="gap-2 mt-1">
                    {
                      userData.profile.promptAnswers.map((value: any, idx: any) => (
                        <div
                          key={idx}
                          className="py-2"
                        >
                          <i>{value.prompt}</i><br/>{value.answer}
                        </div>
                      ))
                    }
                  </div>
                </div>
              )
            }

            {
              images &&
                <div className="mb-8">
                  {/*<h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider"> Photos </h2>*/}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {Array.from(new Set(images)).map((img, index) => ( // Set is a hack to avoid a bug where duplicates fill in images when we navigate different pages
                        <div key={index}
                             className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200 ">
                          <a href={img} target="_blank" rel="noopener noreferrer">
                            <Image
                              src={img}
                              alt={`Uploaded image ${index + 1}`}
                              width={150}
                              height={150}
                              className="h-full w-full object-cover"
                            />
                          </a>
                        </div>
                      ))}
                    </div>
                </div>
            }

            {/*<div>*/
            }
            {/*  <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Creation Date</h2>*/
            }
            {/*  <p className={pStyle}>*/
            }
            {/*    {user.profile.createdAt}*/
            }
            {/*    {new Date(user.profile.createdAt).toLocaleDateString("en-US", {*/
            }
            {/*      year: "numeric",*/
            }
            {/*      month: "long",*/
            }
            {/*      day: "numeric",*/
            }
            {/*    })}*/
            }
            {/*  </p>*/
            }
            {/*</div>*/
            }


          </div>
        </div>
      </div>
    </article>

  )
    ;
}