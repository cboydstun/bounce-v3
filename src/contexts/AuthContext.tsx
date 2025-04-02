"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { setAuthToken } from "@/utils/api";
import { IUser } from "@/types/user";

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

  useEffect(() => {
    // Update user state when session changes
    if (status === "loading") {
      setLoading(true);
      return;
    }

    if (status === "authenticated" && session?.user) {
      // Convert NextAuth session user to our IUser type
      setUser({
        email: session.user.email || "",
        name: session.user.name || undefined,
        // Role has been removed
        // Add any other fields needed from the session
      });

      // For backward compatibility with existing code
      // Use the session token for API calls
      if (session.user.id) {
        // Create a JWT-like token for backward compatibility
        const backwardCompatToken = `nextauth-${session.user.id}`;
        setAuthToken(backwardCompatToken);
      }
    } else {
      setUser(null);
      setAuthToken(null);
    }

    setLoading(false);
  }, [session, status]);

  const logout = async () => {
    try {
      // Call NextAuth signOut with redirect: false to prevent automatic redirect
      await signOut({ redirect: false });

      // Clear auth token from localStorage and axios headers
      setAuthToken(null);

      // Clear user state
      setUser(null);

      // Clear any cookies related to authentication
      document.cookie =
        "next-auth.session-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "next-auth.csrf-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie =
        "next-auth.callback-url=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

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
