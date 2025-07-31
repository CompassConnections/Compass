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
    const {profile, image, name, interests = [], connections = []} = data;

    Object.keys(profile).forEach(key => {
      if (profile[key] === '' || !profile[key]) {
        delete profile[key];
      }
    });

    console.log('profile', profile);

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {
      // First, update/create the profile
      const updatedUser = await prisma.user.update({
        where: {email: session.user.email},
        data: {
          ...(image && {image}),
          ...(name && {name}),
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
            where: {id: interest.id || ''},
            update: {name: interest.name},
            create: {name: interest.name},
          })
        );

        const createdInterests = await Promise.all(interestOperations);

        // Get the IDs of all created/updated interests
        const interestIds = createdInterests.map(interest => interest.id);

        // First, remove all existing interests for this profile
        await prisma.profileInterest.deleteMany({
          where: {profileId: updatedUser.profile.id},
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

      if (connections.length > 0 && updatedUser.profile) {
        // First, find or create all interests
        const connectionOperations = connections.map((v: { id?: string; name: string }) =>
          prisma.connection.upsert({
            where: {id: v.id || ''},
            update: {name: v.name},
            create: {name: v.name},
          })
        );
        const createdConnections = await Promise.all(connectionOperations);
        const connectionIds = createdConnections.map(v => v.id);
        await prisma.profileConnection.deleteMany({
          where: {profileId: updatedUser.profile.id},
        });
        if (connectionIds.length > 0) {
          await prisma.profileConnection.createMany({
            data: connectionIds.map(id => ({
              profileId: updatedUser.profile!.id,
              connectionId: id,
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
