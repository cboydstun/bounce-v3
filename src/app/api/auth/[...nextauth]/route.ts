import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/db/mongoose";
import User from "@/models/User";
import { IUserDocument } from "@/types/user";

// Create minimal auth options
const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await dbConnect();

          const user = (await User.findOne({ email: credentials.email }).select(
            "+password",
          )) as IUserDocument | null;

          if (!user) {
            return null;
          }

          const passwordValid = await user.comparePassword(
            credentials.password,
          );

          if (!passwordValid) {
            return null;
          }

          const authUser = {
            id: user._id ? user._id.toString() : user.id,
            email: user.email,
            name: user.name || undefined,
          };

          return authUser;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  // Use JWT strategy
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Enable debug mode
  debug: true,
  // Use environment secret
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
  // Minimal pages config
  pages: {
    signIn: "/login",
    error: "/login",
  },
};

// Create handler with minimal config
const handler = NextAuth(authOptions);

// Export handler and authOptions
export { handler as GET, handler as POST, authOptions };
