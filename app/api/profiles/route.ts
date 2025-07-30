import {prisma} from "@/lib/server/prisma";
import {NextResponse} from "next/server";
import {getSession} from "@/lib/server/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const gender = url.searchParams.get("gender");
  const interests = url.searchParams.get("interests")?.split(",").filter(Boolean) || [];
  const causeAreas = url.searchParams.get("causeAreas")?.split(",").filter(Boolean) || [];
  const searchQuery = url.searchParams.get("search") || "";

  const profilesPerPage = 100;
  const offset = (page - 1) * profilesPerPage;

  const session = await getSession();
  console.log(`Session: ${session?.user?.name}`);

  // Build the where clause based on filters
  const where: any = {
    id: {not: session?.user?.id},
  };

  if (gender) {
    where.profile = {
      ...where.profile,
      gender: gender,
    };
  }

  // OR
  // if (interests.length > 0) {
  //   where.profile = {
  //     ...where.profile,
  //     intellectualInterests: {
  //       some: {
  //         interest: {
  //           name: {in: interests},
  //         },
  //       },
  //     },
  //   };
  // }

  // AND
  if (interests.length > 0) {
    where.profile = {
      ...where.profile,
      AND: interests.map((interestName) => ({
        intellectualInterests: {
          some: {
            interest: {
              name: interestName,
            },
          },
        },
      })),
    };
  }

  if (causeAreas.length > 0) {
    where.profile = {
      ...where.profile,
      causeAreas: {
        some: {
          causeArea: {
            name: {in: causeAreas},
          },
        },
      },
    };
  }

  if (searchQuery) {
    where.OR = [
      {name: {contains: searchQuery, mode: 'insensitive'}},
      {email: {contains: searchQuery, mode: 'insensitive'}},
      {
        profile: {
          description: {contains: searchQuery, mode: 'insensitive'},
        },
      },
    ];
  }

  // Fetch paginated and filtered profiles
  const cacheStrategy = { swr: 3600, ttl: 3600 , tags: ["profiles"]};
  const profiles = await prisma.user.findMany({
    skip: offset,
    take: profilesPerPage,
    orderBy: {createdAt: "desc"},
    where,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      createdAt: true,
      profile: {
        include: {
          intellectualInterests: {include: {interest: true}},
          causeAreas: {include: {causeArea: true}},
          desiredConnections: {include: {connection: true}},
          promptAnswers: true,
        },
      },
    },
    cacheStrategy: cacheStrategy,
  });

  const totalProfiles = await prisma.user.count();
  const totalPages = Math.ceil(totalProfiles / profilesPerPage);

  console.log({profiles, totalPages});
  return NextResponse.json({profiles, totalPages});
}
