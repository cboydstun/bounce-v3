"use client";

import { useState, useEffect } from "react";
import { useSession, getSession, signIn, signOut } from "next-auth/react";
import { checkAuthEnvVars, checkAuthCookies, authDebug } from "@/utils/debug";

export default function DebugAuthPage() {
  const { data: session, status } = useSession();
  const [envVars, setEnvVars] = useState<any>(null);
  const [cookies, setCookies] = useState<Record<string, string>>({});
  const [localStorageItems, setLocalStorageItems] = useState<Record<string, string>>({});
  const [sessionChecked, setSessionChecked] = useState(false);
  const [getSessionResult, setGetSessionResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Log session status
  useEffect(() => {
    authDebug.log("Session status in debug page", { status, hasSession: !!session });
    
    // Check environment variables
    try {
      const vars = checkAuthEnvVars();
      setEnvVars(vars);
      
      if (vars.missing.length > 0) {
        setError(`Missing required environment variables: ${vars.missing.join(", ")}`);
      }
    } catch (err) {
      authDebug.error("Error checking environment variables", err);
    }
    
    // Check cookies
    try {
      const authCookies = checkAuthCookies();
      setCookies(authCookies);
    } catch (err) {
      authDebug.error("Error checking cookies", err);
    }
    
    // Check localStorage
    try {
      if (typeof window !== "undefined") {
        const items: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.includes("next-auth") || key.includes("token"))) {
            items[key] = "[STORED VALUE]";
          }
        }
        setLocalStorageItems(items);
      }
    } catch (err) {
      authDebug.error("Error checking localStorage", err);
    }
  }, [session, status]);

  // Check session with getSession()
  const checkSessionManually = async () => {
    try {
      setSessionChecked(true);
      const sessionData = await getSession();
      authDebug.session("getSession() result in debug page", sessionData);
      setGetSessionResult(sessionData);
    } catch (err) {
      authDebug.error("Error in getSession()", err);
      setError(`getSession() error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Test login
  const testLogin = async () => {
    try {
      authDebug.log("Testing login with credentials");
      const result = await signIn("credentials", {
        redirect: false,
        email: "test@example.com",
        password: "password123",
      });
      
      authDebug.log("Test login result", result);
      
      if (result?.error) {
        setError(`Login test error: ${result.error}`);
      }
    } catch (err) {
      authDebug.error("Error in test login", err);
      setError(`Login test error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Test logout
  const testLogout = async () => {
    try {
      authDebug.log("Testing logout");
      await signOut({ redirect: false });
      authDebug.log("Logout completed");
    } catch (err) {
      authDebug.error("Error in test logout", err);
      setError(`Logout test error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug Page</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Error:</strong> {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Session Status */}
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Session Status</h2>
          <div className="text-sm">
            <p><strong>Status:</strong> {status}</p>
            <p><strong>Session Exists:</strong> {session ? "Yes" : "No"}</p>
            {session && session.user && (
              <>
                <p><strong>User ID:</strong> {session.user.id || "Not set"}</p>
                <p><strong>User Email:</strong> {session.user.email || "Not set"}</p>
                <p><strong>Expires:</strong> {session.expires || "Not set"}</p>
              </>
            )}
          </div>
          
          <div className="mt-4">
            <button
              onClick={checkSessionManually}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2"
            >
              Check Session
            </button>
            
            {sessionChecked && (
              <div className="mt-2 text-sm">
                <p><strong>getSession() Result:</strong> {getSessionResult ? "Session exists" : "No session"}</p>
                {getSessionResult && getSessionResult.user && (
                  <>
                    <p><strong>User ID:</strong> {getSessionResult.user.id || "Not set"}</p>
                    <p><strong>User Email:</strong> {getSessionResult.user.email || "Not set"}</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Environment Variables */}
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Environment Variables</h2>
          <div className="text-sm">
            {envVars && (
              <>
                <p><strong>NODE_ENV:</strong> {envVars.vars.NODE_ENV || "Not set"}</p>
                <p><strong>NEXTAUTH_URL:</strong> {envVars.vars.NEXTAUTH_URL_SET ? "Set" : "Not set"}</p>
                <p><strong>NEXTAUTH_SECRET:</strong> {envVars.vars.NEXTAUTH_SECRET_SET ? "Set" : "Not set"}</p>
                <p><strong>JWT_SECRET:</strong> {envVars.vars.JWT_SECRET_SET ? "Set" : "Not set"}</p>
                <p><strong>MONGODB_URI:</strong> {envVars.vars.MONGODB_URI_SET ? "Set" : "Not set"}</p>
                
                {envVars.missing.length > 0 && (
                  <div className="mt-2 text-red-600">
                    <p><strong>Missing Variables:</strong> {envVars.missing.join(", ")}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Cookies */}
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-2">Authentication Cookies</h2>
          <div className="text-sm">
            {Object.keys(cookies).length === 0 ? (
              <p>No NextAuth cookies found</p>
            ) : (
              <ul>
                {Object.keys(cookies).map(cookie => (
                  <li key={cookie}>{cookie}: {cookies[cookie]}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        {/* LocalStorage */}
        <div className="bg-white shadow rounded p-4">
          <h2 className="text-lg font-semibold mb-2">LocalStorage Items</h2>
          <div className="text-sm">
            {Object.keys(localStorageItems).length === 0 ? (
              <p>No relevant localStorage items found</p>
            ) : (
              <ul>
                {Object.keys(localStorageItems).map(key => (
                  <li key={key}>{key}: {localStorageItems[key]}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      
      {/* Test Actions */}
      <div className="mt-6 bg-white shadow rounded p-4">
        <h2 className="text-lg font-semibold mb-2">Test Actions</h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={testLogin}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Test Login
          </button>
          
          <button
            onClick={testLogout}
            className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Test Logout
          </button>
          
          <a
            href="/login"
            className="bg-purple-500 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded inline-block"
          >
            Go to Login Page
          </a>
          
          <a
            href="/admin"
            className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded inline-block"
          >
            Try Admin Access
          </a>
        </div>
      </div>
      
      {/* Browser Info */}
      <div className="mt-6 bg-white shadow rounded p-4">
        <h2 className="text-lg font-semibold mb-2">Browser Information</h2>
        <div className="text-sm">
          <p><strong>User Agent:</strong> {typeof navigator !== "undefined" ? navigator.userAgent : "Not available"}</p>
          <p><strong>Cookies Enabled:</strong> {typeof navigator !== "undefined" ? (navigator.cookieEnabled ? "Yes" : "No") : "Not available"}</p>
          <p><strong>Window Location:</strong> {typeof window !== "undefined" ? window.location.href : "Not available"}</p>
        </div>
      </div>
      
      <div className="mt-6 text-sm text-gray-600">
        <p>This page is for debugging authentication issues. It displays sensitive information and should not be accessible in production.</p>
      </div>
    </div>
  );
}
