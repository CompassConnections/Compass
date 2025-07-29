"use server";

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
