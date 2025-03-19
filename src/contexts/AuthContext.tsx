"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { getUserProfile, setAuthToken } from "@/utils/api";
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
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) {
          setLoading(false);
          return;
        }

        // Set token in axios headers
        setAuthToken(token);

        // Fetch user profile
        const userData = await getUserProfile();
        setUser(userData);
      } catch (err) {
        console.error("Auth initialization error:", err);
        setError("Authentication failed");
        // Clear invalid token
        setAuthToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const logout = () => {
    setAuthToken(null);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
