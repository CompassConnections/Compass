'use client';

import {useEffect, useState} from "react";
import {useParams} from "next/navigation";
import LoadingSpinner from "@/lib/client/LoadingSpinner";
import {ProfileData} from "@/lib/client/schema";
import {parseImage} from "@/lib/client/media";
import {getProfile} from "@/lib/client/profile";

export const dynamic = "force-dynamic"; // This disables SSG and ISR

export default function Post() {
  const {id} = useParams();
  const [userData, setUserData] = useState<ProfileData | null>(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchImage() {
      const res = await fetch(`/api/profiles/${id}`);
      console.log('res', res);
      if (res.ok) {
        const data = await res.json();
        setUserData(data);
        console.log('userData', data);
        if (data?.image) {
          await parseImage(data.image, setImage);
        }
      }
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

  console.log(`Image: ${image}`)

  return (

    <div className="min-h-screen  py-12 px-4 sm:px-6 lg:px-8">
      {getProfile(userData, image)}
    </div>
  );
}
