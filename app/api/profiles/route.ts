import { prisma }from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const profilesPerPage = 20;
  const offset = (page - 1) * profilesPerPage;

  // Fetch paginated posts
  const profiles = await prisma.user.findMany({
    skip: offset,
    take: profilesPerPage,
    orderBy: { createdAt: "desc" },
    // include: { author: { select: { name: true } } },
  });

  const totalProfiles = await prisma.user.count();
  const totalPages = Math.ceil(totalProfiles / profilesPerPage);

  console.log({ profiles, totalPages });
  return NextResponse.json({ profiles, totalPages });
}
