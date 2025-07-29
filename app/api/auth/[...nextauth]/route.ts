import NextAuth from "next-auth";
import {authOptions} from "@/lib/server/auth";

const authHandler = NextAuth(authOptions);
export {authHandler as GET, authHandler as POST};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image: string;
      emailVerified?: Date | null;
    };
  }

  interface User {
    emailVerified?: Date | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
  }
}
