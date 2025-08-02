"use server";
import 'server-only';

import {prisma} from "@/lib/server/prisma";


export async function checkUserTableExists(): Promise<boolean> {
  try {
    await prisma.user.findFirst();
    return true;
  } catch {
    // If there's an error, the table likely doesn't exist
    return false;
  }
}

export async function retrieveUser(id: string) {
  const cacheStrategy = {swr: 60, ttl: 60, tags: ["profiles_id"]};
  const user = await prisma.user.findUnique({
    where: {id},
    select: {
      id: true,
      name: true,
      // email: true,
      image: true,
      createdAt: true,
      profile: {
        include: {
          intellectualInterests: {include: {interest: true}},
          causeAreas: {include: {causeArea: true}},
          coreValues: {include: {value: true}},
          desiredConnections: {include: {connection: true}},
          promptAnswers: true,
        },
      },
    },
    // cacheStrategy: cacheStrategy, TODO
  });

  // console.log("Fetched user profile:", user);
  return user;
}
