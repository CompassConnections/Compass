import {NextResponse} from "next/server";
import {getSession} from "@/lib/server/auth";
import {retrieveUser} from "@/lib/server/db-utils";


export async function GET() {
  const session = await getSession();
  console.log(`Session: ${session?.user?.name}`);

  if (!session?.user?.id)
    return new NextResponse(JSON.stringify({error: "User not found"}), {
      status: 404,
      headers: {"Content-Type": "application/json"},
    });

  const id = session.user.id;

  const user = await retrieveUser(id);

  if (!user) {
    return new NextResponse(JSON.stringify({error: "User not found"}), {
      status: 404,
      headers: {"Content-Type": "application/json"},
    });
  }

  return NextResponse.json(user);
}
