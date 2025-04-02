import NextAuth from "next-auth";
import type { NextAuthOptions, Session, User as NextAuthUser } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/db/mongoose";
import User from "@/models/User";
import { IUserDocument } from "@/types/user";
import { NextRequest } from "next/server";

// Rate limiting implementation (simplified version of the existing one)
const ipThrottling = new Map<string, { count: number; timestamp: number }>();

const applyRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxAttempts = 5; // 5 login attempts per IP in the window

  const record = ipThrottling.get(ip);

  // If no record exists or the record is expired, create a new one
  if (!record || now - record.timestamp > windowMs) {
    ipThrottling.set(ip, { count: 1, timestamp: now });
    return true;
  }

  // If the record exists and is within the window, increment the count
  if (record.count < maxAttempts) {
    record.count++;
    return true;
  }

  // If the record exists and the count exceeds the limit, block the request
  return false;
};

export const authOptions: NextAuthOptions = {
  debug: false,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "checkbox" },
      },
      async authorize(credentials, req): Promise<NextAuthUser | null> {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // Apply rate limiting
        // Handle headers properly for Node.js IncomingMessage
        let ip = "unknown";

        if (req && req.headers) {
          const forwardedFor = req.headers["x-forwarded-for"];
          ip = Array.isArray(forwardedFor)
            ? forwardedFor[0]
            : typeof forwardedFor === "string"
              ? forwardedFor.split(",")[0].trim()
              : "unknown";
        }

        if (!applyRateLimit(ip)) {
          throw new Error("Too many login attempts, please try again later");
        }

        try {
          await dbConnect();

          // Find user and include password for comparison
          const user = (await User.findOne({ email: credentials.email }).select(
            "+password",
          )) as IUserDocument | null;

          // Check if user exists and password is correct
          if (!user || !(await user.comparePassword(credentials.password))) {
            return null;
          }

          // Convert Mongoose document to NextAuth user
          return {
            id: user._id ? user._id.toString() : user.id,
            email: user.email,
            name: user.name || undefined,
            // Role is no longer needed for access control
            // Add any other fields needed by NextAuth
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt" as const,
    // Default session expiration - will be overridden by callback if rememberMe is true
    maxAge: 60 * 60 * 24, // 1 day by default
  },
  callbacks: {
    async jwt({
      token,
      user,
      trigger,
      session,
    }: {
      token: JWT;
      user?: NextAuthUser;
      trigger?: "signIn" | "signUp" | "update";
      session?: any;
    }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        // No longer adding role to token
      }

      // Handle remember me option during sign in
      if (trigger === "signIn" && session?.rememberMe === "true") {
        // Set token expiration to 30 days if remember me is checked
        token.rememberMe = true;
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string;
        // No longer adding role to session
      }

      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login", // Error code passed in query string
  },
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
