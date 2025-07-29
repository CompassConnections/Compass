import { prisma } from "@/lib/server/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get all interests from the database
    const interests = await prisma.interest.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    const causeAreas = await prisma.causeArea.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    const connection = await prisma.connection.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ interests, causeAreas, connection });
  } catch (error) {
    console.error('Error fetching interests:', error);
    return NextResponse.json(
      { error: "Failed to fetch interests" },
      { status: 500 }
    );
  }
}
