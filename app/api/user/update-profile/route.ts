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
    const {profile, image, name, interests = [], connections = [], coreValues = [], causeAreas = []} = data;

    Object.keys(profile).forEach(key => {
      if (profile[key] === '' || !profile[key]) {
        delete profile[key];
      }
    });

    console.log('profile', profile);

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (prisma) => {

      if (profile.promptAnswers) {
        const profileData = await prisma.profile.findUnique({
          where: {
            userId: session.user.id,
          },
        });
        console.log('profileData:', profileData);

        const profileId = profileData?.id;
        if (profileId) {
          const deleted = await prisma.promptAnswer.deleteMany({
            where: {
              profileId: profileData?.id,
            },
          });
          console.log('Deleted prompt answers:', deleted);
        }
      }

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

      const modelMap: any = {
        interest: prisma.interest,
        profileInterest: prisma.profileInterest,
        connection: prisma.connection,
        profileConnection: prisma.profileConnection,
        value: prisma.value,
        profileValue: prisma.profileValue,
        causeArea: prisma.causeArea,
        profileCauseArea: prisma.profileCauseArea,
      } as const;

      type ModelKey = keyof typeof modelMap;

      async function handleFeatures(features: any, attribute: ModelKey, profileAttribute: string, idName: string) {
        // Add new features
        if (features.length > 0 && updatedUser.profile) {
          // First, find or create all features
          console.log('profile', profileAttribute, profileAttribute);
          const operations = features.map((feat: { id?: string; name: string }) =>
            modelMap[attribute].upsert({
              where: {id: feat.id || ''},
              update: {name: feat.name},
              create: {name: feat.name},
            })
          );

          const createdFeatures = await Promise.all(operations);

          // Get the IDs of all created/updated features
          const ids = createdFeatures.map(v => v.id);

          // First, remove all existing interests for this profile
          await modelMap[profileAttribute].deleteMany({
            where: {profileId: updatedUser.profile.id},
          });

          // Then, create new connections
          if (ids.length > 0) {
            await modelMap[profileAttribute].createMany({
              data: ids.map(id => ({
                profileId: updatedUser.profile!.id,
                [idName]: id,
              })),
              skipDuplicates: true,
            });
          }
        }
      }

      await handleFeatures(interests, 'interest', 'profileInterest', 'interestId')
      await handleFeatures(connections, 'connection', 'profileConnection', 'connectionId')
      await handleFeatures(coreValues, 'value', 'profileValue', 'valueId')
      await handleFeatures(causeAreas, 'causeArea', 'profileCauseArea', 'causeAreaId')

      return updatedUser
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
