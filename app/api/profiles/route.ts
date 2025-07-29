import { prisma }from "@/lib/server/prisma";
import { NextResponse } from "next/server";
import {getSession} from "@/lib/server/auth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const profilesPerPage = 20;
  const offset = (page - 1) * profilesPerPage;

  const session = await getSession();
  console.log(`Session: ${session?.user?.name}`);

  // Fetch paginated posts
  const profiles = await prisma.user.findMany({
    skip: offset,
    take: profilesPerPage,
    orderBy: { createdAt: "desc" },
    where: { id: {not: session?.user?.id} },
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
    // where: {
    //   id: {
    //     not: session?.user?.id, // Exclude the logged-in user
        // gender: 'FEMALE',
        // intellectualInterests: {
        //   some: {
        //     interest: { name: 'Philosophy' }
        //   }
        // },
        // causeAreas: {
        //   some: {
        //     causeArea: { name: 'AI Safety' }
        //   }
        // }
      // },
      // include: {
      //   user: true,
      //   intellectualInterests: { include: { interest: true } },
      //   causeAreas: { include: { causeArea: true } }
      // }
    // },
  });

  const totalProfiles = await prisma.user.count();
  const totalPages = Math.ceil(totalProfiles / profilesPerPage);

  console.log({ profiles, totalPages });
  return NextResponse.json({ profiles, totalPages });
}
