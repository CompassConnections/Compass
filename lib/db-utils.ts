"use server";

import prisma from "@/lib/prisma";

/**
 * Checks if the Post table exists in the database
 * @returns Promise<boolean> - true if the table exists, false otherwise
 */
export async function checkPostTableExists(): Promise<boolean> {
  try {
    // Try to query the post table
    await prisma.post.findFirst();
    return true;
  } catch {
    // If there's an error, the table likely doesn't exist
    return false;
  }
}
