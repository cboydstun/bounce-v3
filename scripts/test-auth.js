#!/usr/bin/env node

/**
 * Authentication Test Script
 *
 * This script tests the authentication flow by making direct requests to the NextAuth endpoints.
 * It can be used to diagnose issues with authentication in production.
 *
 * Usage:
 *   node scripts/test-auth.js [base-url]
 *
 * Example:
 *   node scripts/test-auth.js https://your-production-site.com
 */

// const https = require('https');
// const http = require('http');
// const { URL } = require('url');
// const readline = require('readline');
import https from "https";
import http from "http";
import { URL } from "url";
import readline from "readline";

// Default to localhost if no URL provided
const baseUrl = process.argv[2] || "http://localhost:3000";

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

// Helper function to make HTTP requests
function makeRequest(url, method = "GET", data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
      path: `${parsedUrl.pathname}${parsedUrl.search}`,
      method: method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    const client = parsedUrl.protocol === "https:" ? https : http;

    const req = client.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        let parsedData;
        try {
          parsedData = responseData ? JSON.parse(responseData) : {};
        } catch (e) {
          parsedData = { raw: responseData };
        }

        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsedData,
        });
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Helper function to extract cookies from response
function extractCookies(headers) {
  const cookies = {};
  const cookieHeader = headers["set-cookie"] || [];

  cookieHeader.forEach((cookie) => {
    const parts = cookie.split(";")[0].split("=");
    const name = parts[0].trim();
    const value = parts.length > 1 ? parts[1].trim() : "";
    cookies[name] = value;
  });

  return cookies;
}

// Helper function to format cookies for request header
function formatCookies(cookies) {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

// Log with timestamp and color
function log(message, color = colors.reset) {
  const timestamp = new Date().toISOString();
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

// Test NextAuth endpoints
async function testNextAuth() {
  log("Starting NextAuth authentication tests", colors.cyan);
  log(`Base URL: ${baseUrl}`, colors.cyan);

  // Step 1: Check if CSRF token is required
  log("\nStep 1: Checking CSRF protection...", colors.blue);
  try {
    const csrfResponse = await makeRequest(`${baseUrl}/api/auth/csrf`);
    log(
      `CSRF endpoint status: ${csrfResponse.statusCode}`,
      csrfResponse.statusCode === 200 ? colors.green : colors.yellow,
    );

    if (csrfResponse.statusCode === 200 && csrfResponse.data.csrfToken) {
      log(
        `CSRF token obtained: ${csrfResponse.data.csrfToken.substring(0, 10)}...`,
        colors.green,
      );
    } else {
      log("No CSRF token found or endpoint not available", colors.yellow);
    }

    const csrfToken = csrfResponse.data.csrfToken;
    const cookies = extractCookies(csrfResponse.headers);

    // Step 2: Test credentials provider
    log("\nStep 2: Testing credentials provider...", colors.blue);

    // Get email and password from user input
    const email = await new Promise((resolve) => {
      rl.question("Enter email for testing: ", (answer) => resolve(answer));
    });

    const password = await new Promise((resolve) => {
      rl.question("Enter password for testing: ", (answer) => resolve(answer));
    });

    const loginData = {
      csrfToken,
      email,
      password,
      redirect: false,
      json: true,
    };

    const loginHeaders = {};
    if (Object.keys(cookies).length > 0) {
      loginHeaders["Cookie"] = formatCookies(cookies);
    }

    log("Attempting login...", colors.blue);
    const loginResponse = await makeRequest(
      `${baseUrl}/api/auth/callback/credentials`,
      "POST",
      loginData,
      loginHeaders,
    );

    log(
      `Login response status: ${loginResponse.statusCode}`,
      loginResponse.statusCode === 200 ? colors.green : colors.red,
    );

    if (loginResponse.statusCode === 200) {
      log("Login successful!", colors.green);

      // Extract session cookies
      const sessionCookies = extractCookies(loginResponse.headers);
      log("Session cookies:", colors.green);
      Object.entries(sessionCookies).forEach(([name, value]) => {
        if (name.includes("next-auth")) {
          log(`  ${name}: ${value ? "Set" : "Not set"}`, colors.green);
        }
      });

      // Step 3: Test session endpoint
      log("\nStep 3: Testing session endpoint...", colors.blue);
      const sessionHeaders = {
        Cookie: formatCookies({ ...cookies, ...sessionCookies }),
      };

      const sessionResponse = await makeRequest(
        `${baseUrl}/api/auth/session`,
        "GET",
        null,
        sessionHeaders,
      );

      log(
        `Session endpoint status: ${sessionResponse.statusCode}`,
        sessionResponse.statusCode === 200 ? colors.green : colors.red,
      );

      if (sessionResponse.statusCode === 200) {
        if (sessionResponse.data.user) {
          log("Session contains user data:", colors.green);
          log(
            `  User ID: ${sessionResponse.data.user.id || "Not set"}`,
            colors.green,
          );
          log(
            `  User Email: ${sessionResponse.data.user.email || "Not set"}`,
            colors.green,
          );
        } else {
          log(
            "Session endpoint returned success but no user data found",
            colors.yellow,
          );
        }
      } else {
        log("Failed to retrieve session data", colors.red);
      }

      // Step 4: Test signout
      log("\nStep 4: Testing signout...", colors.blue);
      const signoutData = { csrfToken };
      const signoutResponse = await makeRequest(
        `${baseUrl}/api/auth/signout`,
        "POST",
        signoutData,
        sessionHeaders,
      );

      log(
        `Signout response status: ${signoutResponse.statusCode}`,
        signoutResponse.statusCode === 200 ? colors.green : colors.red,
      );

      if (signoutResponse.statusCode === 200) {
        log("Signout successful!", colors.green);

        // Check if session was cleared
        const postSignoutSessionResponse = await makeRequest(
          `${baseUrl}/api/auth/session`,
          "GET",
          null,
          sessionHeaders,
        );

        if (postSignoutSessionResponse.data.user) {
          log(
            "Warning: Session still contains user data after signout",
            colors.yellow,
          );
        } else {
          log("Session cleared successfully after signout", colors.green);
        }
      } else {
        log("Signout failed", colors.red);
      }
    } else {
      log(`Login failed: ${JSON.stringify(loginResponse.data)}`, colors.red);
    }
  } catch (error) {
    log(`Error during NextAuth tests: ${error.message}`, colors.red);
    console.error(error);
  }

  log("\nNextAuth tests completed", colors.cyan);
  rl.close();
}

// Run the tests
testNextAuth().catch((error) => {
  log(`Error: ${error.message}`, colors.red);
  rl.close();
});
// Close readline interface on exit
rl.on("SIGINT", () => {
  log("\nExiting...", colors.yellow);
  rl.close();
  process.exit(0);
});
