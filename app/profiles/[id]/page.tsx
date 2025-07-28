export const dynamic = "force-dynamic"; // This disables SSG and ISR

import { prisma }from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";

export default async function Post({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // const profileId = id;

  const profile = await prisma.user.findUnique({
    where: { id: id },
    // include: {
    //   author: true,
    // },
  });

  if (!profile) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
      <article className="max-w-3xl w-full bg-white shadow-lg rounded-lg p-8">
        {/* Post Title */}
        <h1 className="text-5xl font-extrabold text-gray-900 mb-4">
          {profile.name}
        </h1>

        {/* Content Section */}
        <div className="text-lg text-gray-800 leading-relaxed space-y-6 border-t pt-6">

          <p>Gender: {profile.gender}</p>
          <p>{profile.description}</p>
        </div>
      </article>


    </div>
  );
}
