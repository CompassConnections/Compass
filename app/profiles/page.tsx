import {redirect} from "next/navigation";
import Link from "next/link";
import { prisma }from "@/lib/prisma";
import {checkUserTableExists} from "@/lib/db-utils";


// Disable static generation
export const dynamic = "force-dynamic";


export default async function PostsPage() {
  // Check if the post table exists
  const tableExists = await checkUserTableExists();

  // If the post table doesn't exist, redirect to setup page
  if (!tableExists) {
    redirect("/setup");
  }

  const profiles = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
    // take: 20,
    // include: {
    //   author: {
    //     select: {
    //       name: true,
    //     },
    //   },
    // },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center py-24 px-8">
      <h1 className="text-5xl font-extrabold mb-12 text-[#333333]">Profiles</h1>
      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 w-full max-w-6xl mb-8">
        {profiles.map((profile) => (
          <Link key={profile.id} href={`/profiles/${profile.id}`} className="group">
            <div className="border rounded-lg shadow-md bg-white p-6 hover:shadow-lg transition-shadow duration-300">
              <h2 className="text-2xl font-semibold text-gray-900 group-hover:underline mb-2">{profile.name}</h2>
              <p className="text-xs text-gray-400 mb-4">
                {new Date(profile.createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
