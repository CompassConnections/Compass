import { prisma } from "@/lib/server/prisma";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/auth";

type FilterParams = {
  gender?: string;
  interests?: string[];
  causeAreas?: string[];
  searchQuery?: string;
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const gender = url.searchParams.get("gender");
  const interests = url.searchParams.get("interests")?.split(",").filter(Boolean) || [];
  const causeAreas = url.searchParams.get("causeAreas")?.split(",").filter(Boolean) || [];
  const searchQuery = url.searchParams.get("search") || "";
  
  const profilesPerPage = 20;
  const offset = (page - 1) * profilesPerPage;

  const session = await getSession();
  console.log(`Session: ${session?.user?.name}`);

  // Build the where clause based on filters
  const where: any = {
    id: { not: session?.user?.id },
  };

  if (gender) {
    where.profile = {
      ...where.profile,
      gender: gender,
    };
  }

  if (interests.length > 0) {
    where.profile = {
      ...where.profile,
      intellectualInterests: {
        some: {
          interest: {
            name: { in: interests },
          },
        },
      },
    };
  }

  if (causeAreas.length > 0) {
    where.profile = {
      ...where.profile,
      causeAreas: {
        some: {
          causeArea: {
            name: { in: causeAreas },
          },
        },
      },
    };
  }

  if (searchQuery) {
    where.OR = [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { email: { contains: searchQuery, mode: 'insensitive' } },
      {
        profile: {
          description: { contains: searchQuery, mode: 'insensitive' },
        },
      },
    ];
  }

  // Fetch paginated and filtered profiles
  const profiles = await prisma.user.findMany({
    skip: offset,
    take: profilesPerPage,
    orderBy: { createdAt: "desc" },
    where,
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      profile: {
        include: {
          intellectualInterests: { include: { interest: true } },
          causeAreas: { include: { causeArea: true } },
          desiredConnections: { include: { connection: true } },
          promptAnswers: true,
        },
      },
    },
  });

  const totalProfiles = await prisma.user.count();
  const totalPages = Math.ceil(totalProfiles / profilesPerPage);

  console.log({ profiles, totalPages });
  return NextResponse.json({ profiles, totalPages });
}
