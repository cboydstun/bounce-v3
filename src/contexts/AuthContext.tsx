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
import { IUser } from "@/types/user";

interface AuthContextType {
  user: IUser | null;
  loading: boolean;
  error: string | null;
  logout: () => void;
  isAdmin: boolean; // Add role-based helper
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  logout: () => {},
  isAdmin: false,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: session, status } = useSession();
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
      return;
    }

    if (status === "authenticated" && session?.user) {
      // Convert NextAuth session user to our IUser type
      const role = session.user.role || "customer";
      // Validate role is one of the allowed values
      const validRole =
        role === "admin" || role === "customer" || role === "user"
          ? (role as "admin" | "customer" | "user")
          : "customer";

      const userObj = {
        email: session.user.email || "",
        name: session.user.name || undefined,
        role: validRole,
      };

      setUser(userObj);
    } else {
      setUser(null);
    }

    setLoading(false);
  }, [session, status]);

  const logout = async () => {
    try {
      // Call NextAuth signOut with redirect: false to prevent automatic redirect
      // NextAuth.js will handle clearing cookies and session data
      await signOut({ redirect: false });

      // Clear user state
      setUser(null);

      // Redirect to login page
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Still attempt to redirect even if there was an error
      router.push("/login");
    }
  };

  // Compute admin status
  const isAdmin = user?.role === "admin";

  return (
    <AuthContext.Provider value={{ user, loading, error, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};
