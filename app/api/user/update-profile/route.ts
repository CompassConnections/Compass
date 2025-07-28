import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {getSession} from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        {error: "Not authenticated"},
        {status: 401}
      );
    }

    const {description, gender, image} = await req.json();
    console.log(`Req: ${description}, ${gender}, ${image}`)

    // Validate required fields
    if (!gender) {
      return NextResponse.json(
        {error: "Gender is required"},
        {status: 400}
      );
    }

    // Update user with the new profile information
    const updatedUser = await prisma.user.update({
      where: {email: session.user.email},
      data: {
        description: description || null,
        gender: gender || null,
        ...(image && { image }), // Only update image if provided
      },
      select: {
        id: true,
        email: true,
        name: true,
        description: true,
        gender: true,
        image: true,
      },
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
