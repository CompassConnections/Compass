import NextAuth, {type NextAuthOptions} from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import {PrismaAdapter} from "@next-auth/prisma-adapter";
import {prisma} from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: {label: "Email", type: "email"},
        name: {label: "Name", type: "name"},
        password: {label: "Password", type: "password"},
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: {email: credentials.email},
        });

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const isCorrectPassword = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isCorrectPassword) {
          throw new Error("Invalid email or password");
        }
        console.log(user);
        return user;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "database",
  },
  adapter: PrismaAdapter(prisma),
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
  // callbacks: {
  //   async jwt({ token, user }) {
  //     return { ...token, id: token.id ?? user?.id };
  //   },
  //   async session({ session, token }) {
  //     return { ...session, user: { ...session.user, id: token.id } };
  //   },
  // },
} satisfies NextAuthOptions;

// Export **named** HTTP handlers (required by App Router)
console.log("Auth route hit");

// export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
const authHandler = NextAuth(authOptions);
// export const GET = handlers.GET;
// export const POST = handlers.POST;
export { authHandler as GET, authHandler as POST };

// declare module "next-auth" {
//   interface Session {
//     user: { id: string; name: string; email: string };
//     // user: { id: string };
//   }
// }
//
// declare module "next-auth/jwt" {
//   interface JWT {
//     id: string;
//   }
// }
