import Image from "next/image";
import {pStyle} from "@/lib/client/constants";
import {useEffect, useState} from "react";
import {parseImage} from "@/lib/client/media";
import LoadingSpinner from "@/lib/client/LoadingSpinner";

export function getProfile(url, header = null) {

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<any>(null);
  const [image, setImage] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  useEffect(() => {
    async function fetchImage() {
      const res = await fetch(url);
      const data = await res.json();
      setUserData(data);
      console.log('userData', data);
      if (data?.image) {
        await parseImage(data.image, setImage);
      }

      setImages([]);
      await Promise.all(
        (data?.profile?.images || []).map(async (img) => {
          await parseImage(img, setImages, true);
        })
      );
      console.log('images', data?.profile?.images);
      setLoading(false);
    }

    fetchImage();
  }, []);

  if (loading) {
    return <LoadingSpinner/>;
  }

  if (!userData) {
    return <div>
      <h1 className="text-center">Profile not found</h1>
    </div>;
  }

  console.log('userData', userData);

  return (
    <article className="max-w-3xl mx-auto shadow-lg rounded-lg overflow-hidden">
      {header}
      <div className="flex items-start">
        <div className="pt-20 px-8 pb-8 flex-1">
          <h1 className="text-3xl font-bold  mb-2">
            {userData.name}
          </h1>

          < div
            className="space-y-6 pt-4 border-t border-gray-200">

            {userData?.profile?.desiredConnections && (
              <div className="mt-3"><
                h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider"> Desired
                Connections </h2>

                < ul
                  className="flex flex-wrap gap-2 mt-1">
                  {userData?.profile?.desiredConnections.map((value, idx) => (
                    <li
                      key={idx}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-800 dark:text-white dark:bg-gray-700  rounded-full hover:bg-gray-200 transition"
                    >
                      {value?.connection?.name
                      }
                    </li>
                  ))
                  }
                </ul>
              </div>
            )
            }

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
              userData?.profile?.personalityType && (
                <div>
                  <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider"> Personality
                    Type </h2>
                  < p
                    className={pStyle}> {userData.profile.personalityType} </p>
                </div>
              )
            }

            {
              userData?.profile?.conflictStyle && (
                <div>
                  <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider"> Conflict
                    Style </h2>
                  < p
                    className={pStyle}> {userData.profile.conflictStyle} </p>
                </div>
              )
            }

            {
              userData?.profile?.intellectualInterests && (
                <div className="mt-3"><
                  h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider"> Interests </h2>

                  < ul
                    className="flex flex-wrap gap-2 mt-1">
                    {
                      userData.profile.intellectualInterests.map((value, idx) => (
                        <li
                          key={idx}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-800 dark:text-white dark:bg-gray-700  rounded-full hover:bg-gray-200 transition"
                        >
                          {value?.interest?.name
                          }
                        </li>
                      ))
                    }
                  </ul>
                </div>
              )
            }

            {
              userData?.profile?.causeAreas && (
                <div className="mt-3"><
                  h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider"> Cause
                  Areas </h2>

                  < ul
                    className="flex flex-wrap gap-2 mt-1">
                    {
                      userData.profile.causeAreas.map((value, idx) => (
                        <li
                          key={idx}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-800 dark:text-white dark:bg-gray-700  rounded-full hover:bg-gray-200 transition"
                        >
                          {value?.causeArea?.name
                          }
                        </li>
                      ))
                    }
                  </ul>
                </div>
              )
            }

            {
              userData?.profile?.description && (
                <div>
                  <h2 className="text-sm font-medium text-gray-500  uppercase tracking-wider"> About </h2>
                  < p
                    className={pStyle}> {userData.profile.description} </p>
                </div>
              )
            }

            {
              userData?.profile?.contactInfo && (
                <div>
                  <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider"> Contact </h2>
                  < p
                    className={pStyle}> {userData.profile.contactInfo} </p>
                </div>
              )
            }

            {
              userData?.profile?.promptAnswers && (
                <div className="mt-3"><
                  h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider"> Prompt
                  Answers </h2>

                  < ul
                    className="flex flex-wrap gap-2 mt-1">
                    {
                      userData.profile.promptAnswers.map((value, idx) => (
                        <li
                          key={idx}
                          // className="px-3 py-1 text-sm bg-gray-100 rounded-full hover:bg-gray-200 transition"
                        >
                          • {value.prompt} {value.answer}
                        </li>
                      ))
                    }
                  </ul>
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
                          <Image
                            src={img}
                            alt={`Uploaded image ${index + 1}`}
                            width={150}
                            height={150}
                            className="h-full w-full object-cover"
                          />
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
        <div className="bg-gradient-to-r relative float-right h-auto flex items-start pt-20 px-8 pb-8">
          {
            image ? (
                <div className="flex-1">
                  <div className="h-32 w-32 rounded-full border-4 border-white overflow-hidden ">
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
                  </div>
                </div>
              ) :
              (
                <div
                  className="absolute -bottom-16 left-8 h-32 w-32 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center">
    <span className="text-4xl font-bold text-gray-600">
      {userData.name ? userData.name.charAt(0).toUpperCase() : 'U'}
      </span>
                </div>
              )
          }
        </div>
      </div>

    </article>

  )
    ;
}