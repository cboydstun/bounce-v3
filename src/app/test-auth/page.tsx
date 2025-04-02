"use client";

import { useSession } from "next-auth/react";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";

export default function TestAuthPage() {
  const { data: session, status } = useSession();
  const { user, loading } = useAuth();
  const [cookies, setCookies] = useState<string>("");

  useEffect(() => {
    // Get all cookies for debugging
    if (typeof document !== "undefined") {
      setCookies(document.cookie);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Authentication Test Page</h1>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">
            NextAuth Session Status
          </h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <p>
              <strong>Status:</strong> {status}
            </p>
            <p>
              <strong>Session:</strong>{" "}
              {session ? "Available" : "Not available"}
            </p>
            {session && (
              <pre className="mt-2 bg-gray-200 p-2 rounded overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Auth Context</h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <p>
              <strong>Loading:</strong> {loading ? "True" : "False"}
            </p>
            <p>
              <strong>User:</strong> {user ? "Logged in" : "Not logged in"}
            </p>
            {user && (
              <pre className="mt-2 bg-gray-200 p-2 rounded overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Cookies</h2>
          <div className="bg-gray-50 p-4 rounded-md">
            <pre className="bg-gray-200 p-2 rounded overflow-auto">
              {cookies || "No cookies found"}
            </pre>
          </div>
        </div>

        <div className="flex space-x-4">
          <a
            href="/login"
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Go to Login
          </a>
          <a
            href="/admin"
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Go to Admin
          </a>
        </div>
      </div>
    </div>
  );
}
