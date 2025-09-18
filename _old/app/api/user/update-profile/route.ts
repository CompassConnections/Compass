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
    const {profile, image, name, interests = [], connections = [], coreValues = [], books = [], causeAreas = []} = data;

    console.log('books: ', books)
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
        book: prisma.book,
        profileBook: prisma.profileBook,
        causeArea: prisma.causeArea,
        profileCauseArea: prisma.profileCauseArea,
      } as const;

      type ModelKey = keyof typeof modelMap;

      async function handleFeatures(features: any, attribute: ModelKey, profileAttribute: string, idName: string) {
        // Add new features
        if (features !== null && updatedUser.profile) {
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

          const profileId = updatedUser.profile.id;
          console.log('profile ID:', profileId);

          // First, remove all existing features for this profile
          const res = await modelMap[profileAttribute].deleteMany({
            where: {profileId: profileId},
          });
          console.log('deleted profile:', profileAttribute, res);

          // Then, create new features
          if (ids.length > 0) {
            const create_res =await modelMap[profileAttribute].createMany({
              data: ids.map(id => ({
                profileId: profileId,
                [idName]: id,
              })),
              skipDuplicates: true,
            });
            console.log('created many:', profileAttribute, create_res);
          }
        }
      }

      await handleFeatures(interests, 'interest', 'profileInterest', 'interestId')
      await handleFeatures(books, 'book', 'profileBook', 'valueId')
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
