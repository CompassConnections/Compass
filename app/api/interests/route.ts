import { prisma } from "@/lib/server/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get all interests from the database
    // Disable cache for now as it bugs when saving profile with new interest and clicking on "Edit Profile" just after
    const cacheStrategy = {swr: 0, ttl: 0, tags: ["interests"]};
    const interests = await prisma.interest.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc'
      },
      cacheStrategy: cacheStrategy,
    });

    const coreValues = await prisma.value.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc'
      },
      cacheStrategy: cacheStrategy,
    });

    const causeAreas = await prisma.causeArea.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc'
      },
      cacheStrategy: cacheStrategy,
    });

    const connections = await prisma.connection.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc'
      },
      cacheStrategy: cacheStrategy,
    });

    return NextResponse.json({ interests, coreValues, causeAreas, connections });
  } catch (error) {
    console.error('Error fetching interests:', error);
    return NextResponse.json(
      { error: "Failed to fetch interests" },
      { status: 500 }
    );
  }
}
