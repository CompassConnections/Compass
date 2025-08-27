import { prisma } from "@/lib/server/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    let data = await prisma.promptAnswer.findMany({
      select: {
        prompt: true,
      },
      distinct: ['prompt'],
    });

    const uniquePrompts = data.map((prompt) => prompt.prompt);
    
    return NextResponse.json({ uniquePrompts });
  } catch (error) {
    console.error('Error fetching prompts:', error);
    return NextResponse.json(
      { error: "Failed to fetch prompts" },
      { status: 500 }
    );
  }
}

// This ensures the route is not cached
export const dynamic = 'force-dynamic';
