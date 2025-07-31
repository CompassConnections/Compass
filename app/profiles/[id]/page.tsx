'use client';

import {useParams} from "next/navigation";
import {getProfile} from "@/lib/client/profile";

export const dynamic = "force-dynamic"; // This disables SSG and ISR

export default function Post() {
  const {id} = useParams();

  return (

    <div className="min-h-screen  py-12 px-4 sm:px-6 lg:px-8">
      {getProfile(`/api/profiles/${id}`)}
    </div>
  );
}
