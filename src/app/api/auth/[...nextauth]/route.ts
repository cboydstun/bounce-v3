import NextAuth from "next-auth";
import type { NextAuthOptions, Session, User as NextAuthUser } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import dbConnect from "@/lib/db/mongoose";
import User from "@/models/User";
import { IUserDocument } from "@/types/user";
import { NextRequest } from "next/server";

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(`[AUTH DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
};

// Log environment variables (without exposing secrets)
debugLog('Environment check', {
  NODE_ENV: process.env.NODE_ENV,
  NEXTAUTH_URL_SET: !!process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET_SET: !!process.env.NEXTAUTH_SECRET,
  JWT_SECRET_SET: !!process.env.JWT_SECRET,
  MONGODB_URI_SET: !!process.env.MONGODB_URI,
});

// Rate limiting implementation (simplified version of the existing one)
const ipThrottling = new Map<string, { count: number; timestamp: number }>();

const applyRateLimit = (ip: string): boolean => {
  debugLog(`Rate limit check for IP: ${ip}`);
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
  debug: true, // Enable NextAuth debug mode in production for troubleshooting
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "checkbox" },
      },
      async authorize(credentials, req): Promise<NextAuthUser | null> {
        debugLog('authorize() called with credentials', { 
          email: credentials?.email ? 'provided' : 'missing',
          password: credentials?.password ? 'provided' : 'missing'
        });
        
        if (!credentials?.email || !credentials?.password) {
          debugLog('Missing credentials');
          return null;
        }

        // Apply rate limiting
        // Handle headers properly for Node.js IncomingMessage
        let ip = "unknown";

        if (req && req.headers) {
          const headerKeys = Object.keys(req.headers);
          debugLog('Request headers available', { headerKeys });
          
          const forwardedFor = req.headers["x-forwarded-for"];
          ip = Array.isArray(forwardedFor)
            ? forwardedFor[0]
            : typeof forwardedFor === "string"
              ? forwardedFor.split(",")[0].trim()
              : "unknown";
          
          debugLog(`IP address detected: ${ip}`);
        } else {
          debugLog('No request or headers object available');
        }

        if (!applyRateLimit(ip)) {
          debugLog('Rate limit exceeded');
          throw new Error("Too many login attempts, please try again later");
        }

        try {
          debugLog('Connecting to database...');
          await dbConnect();
          debugLog('Database connection successful');

          // Find user and include password for comparison
          debugLog(`Looking up user with email: ${credentials.email}`);
          const user = (await User.findOne({ email: credentials.email }).select(
            "+password",
          )) as IUserDocument | null;

          if (!user) {
            debugLog('User not found');
            return null;
          }

          // Check password
          debugLog('Comparing password...');
          const passwordValid = await user.comparePassword(credentials.password);
          debugLog(`Password valid: ${passwordValid}`);
          
          if (!passwordValid) {
            return null;
          }

          // Convert Mongoose document to NextAuth user
          const authUser = {
            id: user._id ? user._id.toString() : user.id,
            email: user.email,
            name: user.name || undefined,
          };
          
          debugLog('Authentication successful', { userId: authUser.id });
          return authUser;
        } catch (error) {
          debugLog('Authentication error', { error });
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
      debugLog('jwt() callback called', { 
        hasUser: !!user, 
        trigger, 
        tokenBefore: { ...token, sub: token.sub ? 'exists' : 'missing' } 
      });
      
      // Initial sign in
      if (user) {
        token.id = user.id;
        debugLog('User info added to token', { userId: user.id });
      }

      // Handle remember me option during sign in
      if (trigger === "signIn" && session?.rememberMe === "true") {
        // Set token expiration to 30 days if remember me is checked
        token.rememberMe = true;
        debugLog('Remember me enabled for token');
      }

      debugLog('JWT token created/updated', { 
        tokenAfter: { ...token, sub: token.sub ? 'exists' : 'missing' } 
      });
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      debugLog('session() callback called', { 
        hasToken: !!token,
        sessionBefore: session ? { 
          ...session, 
          user: session.user ? { 
            ...session.user, 
            email: session.user.email || 'missing' 
          } : null 
        } : null
      });
      
      if (session.user) {
        session.user.id = token.id as string;
        debugLog('User ID added to session', { userId: token.id });
      }

      debugLog('Session created/updated', { 
        sessionAfter: { 
          ...session, 
          user: session.user ? { 
            ...session.user, 
            email: session.user.email || 'missing' 
          } : null 
        } 
      });
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

debugLog('NextAuth configuration complete', {
  providers: ['credentials'],
  sessionStrategy: 'jwt',
  cookieSecure: process.env.NODE_ENV === 'production',
});

const handler = NextAuth(authOptions);

// Wrap the handler to add logging
const wrappedHandler = async (req: any, res: any) => {
  debugLog(`NextAuth handler called: ${req.method} ${req.url}`);
  try {
    return await handler(req, res);
  } catch (error) {
    debugLog('NextAuth handler error', { error });
    throw error;
  }
};

export { wrappedHandler as GET, wrappedHandler as POST };
