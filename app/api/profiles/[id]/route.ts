import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/server/auth";
import {retrieveUser} from "@/lib/server/db-utils";

// Handler for GET /api/profiles/[id]
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;

    const user = await retrieveUser(id)

    // If user not found, return 404
    if (!user) {
      return new NextResponse(JSON.stringify({error: "User not found"}), {
        status: 404,
        headers: {"Content-Type": "application/json"},
      });
    }

    return new NextResponse(JSON.stringify(user), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return new NextResponse(
      JSON.stringify({ error: "Failed to fetch user profile" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

// Handler for DELETE /api/profiles/[id]
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ error: 'You must be signed in to delete a profile' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const params = await context.params;
    const { id } = params;

    // Verify the user is trying to delete their own profile
    if (session.user.id !== id) {
      return new NextResponse(
        JSON.stringify({ error: 'You can only delete your own profile' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete related records first to avoid foreign key constraints
    await prisma.$transaction([
      // Delete prompt answers
      prisma.promptAnswer.deleteMany({
        where: { profileId: id },
      }),
      // Delete intellectual interests
      prisma.profileInterest.deleteMany({
        where: { profileId: id },
      }),
      prisma.profileValue.deleteMany({
        where: { profileId: id },
      }),
      // Delete cause areas
      prisma.profileCauseArea.deleteMany({
        where: { profileId: id },
      }),
      // Delete desired connections
      prisma.profileConnection.deleteMany({
        where: { profileId: id },
      }),
      // Delete the profile
      prisma.profile.deleteMany({
        where: { id: id },
      }),
      // Finally, delete the user
      prisma.user.delete({
        where: { id },
      }),
    ]);

    return new NextResponse(
      JSON.stringify({ success: true, message: 'Profile deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting profile:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to delete profile' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}