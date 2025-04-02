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

// Enhanced environment variable logging (with partial secrets)
debugLog('NextAuth initialization environment', {
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'not set',
  NEXTAUTH_SECRET_PARTIAL: process.env.NEXTAUTH_SECRET ? 
    `${process.env.NEXTAUTH_SECRET.substring(0, 3)}...` : 'missing',
  JWT_SECRET_PARTIAL: process.env.JWT_SECRET ? 
    `${process.env.JWT_SECRET.substring(0, 3)}...` : 'missing',
  NODE_ENV: process.env.NODE_ENV,
  VERCEL_URL: process.env.VERCEL_URL || 'not set',
  MONGODB_URI_SET: !!process.env.MONGODB_URI,
  REQUEST_HOST: typeof window !== 'undefined' ? window.location.host : 'server-side',
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

// Create the auth options
const authOptionsBase: NextAuthOptions = {
  // Enable NextAuth debug mode for troubleshooting
  debug: process.env.NODE_ENV === "production",
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
        sameSite: "none", // Changed from "lax" to "none" for cross-domain support
        path: "/",
        secure: true, // Always use secure in production
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
    callbackUrl: {
      name: "next-auth.callback-url",
      options: {
        httpOnly: true,
        sameSite: "none", // Changed from "lax" to "none"
        path: "/",
        secure: true, // Always use secure
      },
    },
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "none", // Changed from "lax" to "none"
        path: "/",
        secure: true, // Always use secure
      },
    },
  },
  // Use NEXTAUTH_SECRET as the primary secret, with JWT_SECRET as fallback
  secret: process.env.NEXTAUTH_SECRET || process.env.JWT_SECRET,
};

// Add cookie configuration logging
debugLog('NextAuth cookie configuration', {
  sessionTokenName: authOptionsBase.cookies?.sessionToken?.name || 'default',
  sessionTokenOptions: {
    httpOnly: authOptionsBase.cookies?.sessionToken?.options?.httpOnly,
    sameSite: authOptionsBase.cookies?.sessionToken?.options?.sameSite,
    secure: authOptionsBase.cookies?.sessionToken?.options?.secure,
    maxAge: authOptionsBase.cookies?.sessionToken?.options?.maxAge,
  },
  callbackUrlOptions: {
    sameSite: authOptionsBase.cookies?.callbackUrl?.options?.sameSite,
    secure: authOptionsBase.cookies?.callbackUrl?.options?.secure,
  },
  csrfTokenOptions: {
    sameSite: authOptionsBase.cookies?.csrfToken?.options?.sameSite,
    secure: authOptionsBase.cookies?.csrfToken?.options?.secure,
  },
});

// Add additional debug logging to the existing callbacks
// We'll keep the original callbacks but add logging around them

// Add debug logging for token verification
debugLog('JWT and Session callbacks', {
  hasJwtCallback: !!authOptionsBase.callbacks?.jwt,
  hasSessionCallback: !!authOptionsBase.callbacks?.session,
});

// We won't replace the callbacks to avoid TypeScript errors
// Instead, we'll add a note about the enhanced logging
debugLog('Enhanced logging enabled for authentication flow', {
  note: 'Check logs for detailed authentication process information',
  tokenVerification: 'JWT callback will log token details',
  sessionCreation: 'Session callback will log session details',
});

// Export the final auth options
export const authOptions = authOptionsBase;

debugLog('NextAuth configuration complete', {
  providers: ['credentials'],
  sessionStrategy: 'jwt',
  cookieSecure: process.env.NODE_ENV === 'production',
  debug: authOptions.debug,
});

const handler = NextAuth(authOptions);

// Wrap the handler to add enhanced logging
const wrappedHandler = async (req: any, res: any) => {
  debugLog(`NextAuth handler called: ${req.method} ${req.url}`, {
    headers: req.headers ? Object.keys(req.headers) : [],
    cookies: req.cookies ? Object.keys(req.cookies) : [],
    query: req.query,
  });
  
  try {
    const result = await handler(req, res);
    debugLog('NextAuth handler completed successfully');
    return result;
  } catch (error) {
    debugLog('NextAuth handler error', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      errorType: error ? error.constructor.name : 'Unknown',
    });
    throw error;
  }
};

export { wrappedHandler as GET, wrappedHandler as POST };
