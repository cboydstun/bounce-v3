"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut, getSession } from "next-auth/react";
import { IUser } from "@/types/user";

// Debug logger function
const debugLog = (message: string, data?: any) => {
  console.log(
    `[AUTH CONTEXT DEBUG] ${message}`,
    data ? JSON.stringify(data, null, 2) : "",
  );
};

// Log environment info
debugLog("Environment", {
  NODE_ENV: process.env.NODE_ENV,
});

interface AuthContextType {
  user: IUser | null;
  loading: boolean;
  error: string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Debug function to check cookies
  const checkAuthCookies = () => {
    const cookies = document.cookie.split(";").reduce(
      (acc, cookie) => {
        const [name, value] = cookie.trim().split("=");
        if (name.includes("next-auth")) {
          acc[name] = "exists";
        }
        return acc;
      },
      {} as Record<string, string>,
    );

  };

  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
      return;
    }

    // Check cookies on status change
    checkAuthCookies();

    if (status === "authenticated" && session?.user) {
      // Convert NextAuth session user to our IUser type
      const userObj = {
        email: session.user.email || "",
        name: session.user.name || undefined,
      };

      setUser(userObj);
    } else {
      setUser(null);
    }

    setLoading(false);
  }, [session, status]);

  const logout = async () => {
    try {
      // Check cookies before logout (for debugging)
      checkAuthCookies();

      // Call NextAuth signOut with redirect: false to prevent automatic redirect
      // NextAuth.js will handle clearing cookies and session data
      await signOut({ redirect: false });

      // Clear user state
      setUser(null);

      // Check cookies after logout (for debugging)
      checkAuthCookies();

      // Redirect to login page
      router.push("/login");
    } catch (error) {

      console.error("Logout error:", error);
      // Still attempt to redirect even if there was an error
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
