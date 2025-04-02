import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/db/mongoose";
import User from "@/models/User";
import { IUserDocument } from "@/types/user";

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(
    `[AUTH DEBUG] ${message}`,
    data ? JSON.stringify(data, null, 2) : "",
  );
};

// Log environment variables
debugLog("Environment variables", {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || "not set",
  NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
  JWT_SECRET_SET: !!process.env.JWT_SECRET,
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_URL: process.env.VERCEL_URL || "not set",
});

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
        debugLog("authorize() called", {
          hasEmail: !!credentials?.email,
          hasPassword: !!credentials?.password,
        });

        if (!credentials?.email || !credentials?.password) {
          debugLog("Missing credentials");
          return null;
        }

        try {
          debugLog("Connecting to database...");
          await dbConnect();

          const user = (await User.findOne({ email: credentials.email }).select(
            "+password",
          )) as IUserDocument | null;

          if (!user) {
            debugLog("User not found");
            return null;
          }

          const passwordValid = await user.comparePassword(
            credentials.password,
          );
          debugLog("Password validation", { valid: passwordValid });

          if (!passwordValid) {
            return null;
          }

          const authUser = {
            id: user._id ? user._id.toString() : user.id,
            email: user.email,
            name: user.name || undefined,
          };

          debugLog("Authentication successful", { userId: authUser.id });
          return authUser;
        } catch (error) {
          debugLog("Authentication error", { error });
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

debugLog("NextAuth configuration", {
  providers: ["credentials"],
  sessionStrategy: "jwt",
  debug: true,
  pagesConfigured: !!authOptions.pages,
});

// Create handler with minimal config
const handler = NextAuth(authOptions);

// Export handler
export { handler as GET, handler as POST };
