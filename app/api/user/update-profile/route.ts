import {NextResponse} from "next/server";
import {prisma} from "@/lib/server/prisma";
import {getSession} from "@/lib/server/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        {error: "Not authenticated"},
        {status: 401}
      );
    }

    const data = await req.json();
    const { profile, image, interests = [] } = data;

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {
      // First, update/create the profile
      const updatedUser = await prisma.user.update({
        where: { email: session.user.email },
        data: {
          ...(image && { image }),
          profile: {
            upsert: {
              create: profile,
              update: profile,
            },
          },
        },
        include: {
          profile: true,
        },
      });

      // Process interests if any
      if (interests.length > 0 && updatedUser.profile) {
        // First, find or create all interests
        const interestOperations = interests.map((interest: { id?: string; name: string }) =>
          prisma.interest.upsert({
            where: { id: interest.id || '' },
            update: { name: interest.name },
            create: { name: interest.name },
          })
        );
        
        const createdInterests = await Promise.all(interestOperations);
        
        // Get the IDs of all created/updated interests
        const interestIds = createdInterests.map(interest => interest.id);

        // First, remove all existing interests for this profile
        await prisma.profileInterest.deleteMany({
          where: { profileId: updatedUser.profile.id },
        });

        // Then, create new connections
        if (interestIds.length > 0) {
          await prisma.profileInterest.createMany({
            data: interestIds.map(interestId => ({
              profileId: updatedUser.profile!.id,
              interestId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return updatedUser;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      {error: "Failed to update profile"},
      {status: 500}
    );
  }
}
