"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Create a separate client component for the login form
const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Check if we were redirected from a protected page
  useEffect(() => {
    const from = searchParams.get("from");
    if (from) {
      setError(`You need to be logged in to access ${from}`);
    }

    // If already authenticated, redirect
    if (status === "authenticated") {
      router.push(from || "/admin");
    }
  }, [searchParams, router, status, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Enhanced validation
    if (!email) {
      setError("Please provide an email address");
      setIsLoading(false);
      return;
    }

    if (!email.match(/^\S+@\S+\.\S+$/)) {
      setError("Please provide a valid email address");
      setIsLoading(false);
      return;
    }

    if (!password) {
      setError("Please provide a password");
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long");
      setIsLoading(false);
      return;
    }

    try {
      // Call NextAuth.js signIn
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        rememberMe: rememberMe.toString(),
      });

      if (result?.error) {
        console.error("Login error:", result.error);

        // Handle specific error messages
        if (result.error.includes("Too many login attempts")) {
          setError("Too many login attempts. Please try again later.");
        } else {
          setError("Invalid email or password. Please try again.");
        }
      } else if (result?.ok) {
        // Redirect to admin dashboard or the page they were trying to access
        const from = searchParams.get("from");
        router.push(from || "/admin");
      }
    } catch (err) {
      console.error("Login error:", err);

      // Improved error handling with more specific messages
      if (err instanceof Error) {
        if (
          err.message.includes("network") ||
          err.message.includes("connection")
        ) {
          setError(
            "Network error. Please check your internet connection and try again.",
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
      <div className="rounded-md shadow-sm -space-y-px">
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={isLoading}
          />
          <label
            htmlFor="remember-me"
            className="ml-2 block text-sm text-gray-900"
          >
            Remember me
          </label>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={isLoading}
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? <LoadingSpinner className="w-5 h-5" /> : "Sign in"}
        </button>
      </div>
    </form>
  );
};

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>

        <Suspense
          fallback={
            <div className="flex justify-center">
              <LoadingSpinner className="w-8 h-8" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
