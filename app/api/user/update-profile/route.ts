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
    console.log(`Req: ${data}`)

    // Update user with the new profile information
    const updatedUser = await prisma.user.update({
      where: {email: session.user.email},
      data: {
        ...(data.image && { image: data.image }),
        profile: {
          upsert: {
            create: data.profile,
            update: data.profile,
          },
        },
      },
        // , // Only update image if provided
      // select: {
      //   id: true,
      //   email: true,
      //   name: true,
      //   image: true,
      // },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      {error: "Failed to update profile"},
      {status: 500}
    );
  }
}
