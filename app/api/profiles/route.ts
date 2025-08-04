import {prisma} from "@/lib/server/prisma";
import {NextResponse} from "next/server";
import {getSession} from "@/lib/server/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const gender = url.searchParams.get("gender");
  const minAge = url.searchParams.get("minAge");
  const maxAge = url.searchParams.get("maxAge");
  const minIntroversion = url.searchParams.get("minIntroversion");
  const maxIntroversion = url.searchParams.get("maxIntroversion");
  const interests = url.searchParams.get("interests")?.split(",").filter(Boolean) || [];
  const coreValues = url.searchParams.get("coreValues")?.split(",").filter(Boolean) || [];
  const causeAreas = url.searchParams.get("causeAreas")?.split(",").filter(Boolean) || [];
  const connections = url.searchParams.get("connections")?.split(",").filter(Boolean) || [];
  const searchQuery = url.searchParams.get("searchQuery") || "";

  const profilesPerPage = 100;
  const offset = (page - 1) * profilesPerPage;

  const session = await getSession();
  console.log(`Session: ${session?.user?.name}`);

  // Build the where clause based on filters
  const where: any = {
    id: {not: session?.user?.id},
  };

  where.profile = {};
  where.profile.AND = [];

  if (gender) {
    where.profile = {
      ...where.profile,
      gender: gender,
    };
  }

  // Add age filtering
  const currentYear = new Date().getFullYear();
  if (minAge || maxAge) {
    where.profile = {
      ...where.profile,
      birthYear: {}
    };

    if (minAge) {
      where.profile.birthYear.lte = currentYear - parseInt(minAge);
    }

    if (maxAge) {
      where.profile.birthYear.gte = currentYear - parseInt(maxAge);
    }
  }

  // Add introversion filtering (careful: the query value is actually extroversion
  if (minIntroversion || maxIntroversion) {
    where.profile = {
      ...where.profile,
      introversion: {}
    };

    if (minIntroversion) {
      where.profile.introversion.lte = 100 - parseInt(minIntroversion);
    }

    if (maxIntroversion) {
      where.profile.introversion.gte = 100 - parseInt(maxIntroversion);
    }
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
    where.profile.AND = [
      ...where.profile.AND,
      ...interests.map((name) => ({
        intellectualInterests: {
          some: {
            interest: {
              name: name,
            },
          },
        },
      })),
    ];
  }

  // AND
  if (coreValues.length > 0) {
    where.profile.AND = [
      ...where.profile.AND,
      ...coreValues.map((name) => ({
        coreValues: {
          some: {
            value: {
              name: name,
            },
          },
        },
      })),
    ];
  }

  if (causeAreas.length > 0) {
    where.profile.AND = [
      ...where.profile.AND,
      ...causeAreas.map((name) => ({
        causeAreas: {
          some: {
            causeArea: {
              name: name,
            },
          },
        },
      })),
    ];
  }

  // OR
  if (connections.length > 0) {
    where.profile = {
      ...where.profile,
      desiredConnections: {
        some: {
          connection: {
            name: {in: connections},
          },
        },
      },
    };
  }

  if (searchQuery) {
    where.OR = [
      ...(where.OR ?? []),
      {name: {contains: searchQuery, mode: 'insensitive'}},
      // {email: {contains: searchQuery, mode: 'insensitive'}},
      {
        profile: {
          description: {contains: searchQuery, mode: 'insensitive'},
        },
      },
      {
        profile: {
          occupation: {contains: searchQuery, mode: 'insensitive'},
        },
      },
      {
        profile: {
          location: {contains: searchQuery, mode: 'insensitive'},
        },
      },
      {
        profile: {
          contactInfo: {contains: searchQuery, mode: 'insensitive'},
        },
      },
      {
        profile: {
          intellectualInterests: {
            some: {
              interest: {
                name: {contains: searchQuery, mode: "insensitive"},
              },
            },
          },
        },
      },
      {
        profile: {
          coreValues: {
            some: {
              value: {
                name: {contains: searchQuery, mode: "insensitive"},
              },
            },
          },
        },
      },
      {
        profile: {
          causeAreas: {
            some: {
              causeArea: {
                name: {contains: searchQuery, mode: "insensitive"},
              },
            },
          },
        },
      },
      {
        profile: {
          desiredConnections: {
            some: {
              connection: {
                name: {contains: searchQuery, mode: "insensitive"},
              },
            },
          },
        },
      },
      {
        profile: {
          promptAnswers: {
            some: {
              answer: {contains: searchQuery, mode: "insensitive"},
            },
          },
        },
      },
      {
        profile: {
          promptAnswers: {
            some: {
              prompt: {contains: searchQuery, mode: "insensitive"},
            },
          },
        },
      },
    ];
  }

  console.log(where.profile);

  // Fetch paginated and filtered profiles
  const cacheStrategy = {swr: 60, ttl: 60, tags: ["profiles"]};
  const profiles = await prisma.user.findMany({
    skip: offset,
    take: profilesPerPage,
    orderBy: {createdAt: "desc"},
    where,
    select: {
      id: true,
      name: true,
      // email: true,
      image: true,
      createdAt: true,
      profile: {
        include: {
          intellectualInterests: {include: {interest: true}},
          coreValues: {include: {value: true}},
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
