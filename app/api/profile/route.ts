import {prisma} from "@/lib/server/prisma";
import {NextResponse} from "next/server";
import {getSession} from "@/lib/server/auth";
import {notFound, redirect} from "next/navigation";


export async function GET() {
  const session = await getSession();
  console.log(`Session: ${session?.user?.name}`);

  if (!session?.user?.email)
    redirect('/login');

  const user = await prisma.user.findUnique({
    where: {email: session.user.email},
    include: {
      profile: {
        include: {
          intellectualInterests: {
            include: {
              interest: true
            },
          },
          desiredConnections: {
            include: {
              connection: true
            },
          },
          coreValues: {
            include: {
              value: true
            },
          },
        }
      }
    }
    });

  if (!user) {
    notFound();
  }

  console.log('user', user);
  return NextResponse.json(user);
}
