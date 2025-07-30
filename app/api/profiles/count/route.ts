import { prisma } from "@/lib/server/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get the total count of users from the database
    const count = await prisma.user.count();
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error fetching user count:', error);
    return NextResponse.json(
      { error: "Failed to fetch user count" },
      { status: 500 }
    );
  }
}

// This ensures the route is not cached
export const dynamic = 'force-dynamic';
