#!/usr/bin/env node

/**
 * NextAuth.js Debug Script
 * 
 * This script helps diagnose authentication issues in production by:
 * 1. Checking environment variables
 * 2. Testing cookie settings
 * 3. Verifying JWT token generation and validation
 * 4. Testing the full authentication flow
 * 
 * Usage:
 * node scripts/debug-auth.js [--url=https://your-site.com] [--email=test@example.com] [--password=yourpassword]
 */

const fetch = require('node-fetch');
const { parse } = require('url');
const { promisify } = require('util');
const readline = require('readline');
const crypto = require('crypto');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = promisify(rl.question).bind(rl);

// Parse command line arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [key, value] = arg.slice(2).split('=');
    acc[key] = value || true;
  }
  return acc;
}, {});

// Configuration
let config = {
  url: args.url || process.env.NEXTAUTH_URL || 'http://localhost:3000',
  email: args.email || process.env.TEST_EMAIL,
  password: args.password || process.env.TEST_PASSWORD,
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Helper functions
const log = {
  info: (message) => console.log(`${colors.blue}[INFO]${colors.reset} ${message}`),
  success: (message) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`),
  warning: (message) => console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`),
  error: (message) => console.log(`${colors.red}[ERROR]${colors.reset} ${message}`),
  section: (title) => console.log(`\n${colors.cyan}=== ${title} ===${colors.reset}\n`),
  json: (data) => console.log(JSON.stringify(data, null, 2)),
};

// Check if a URL is valid
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Generate a random string for testing
function generateRandomString(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Check environment variables
async function checkEnvironmentVariables() {
  log.section('Environment Variables Check');
  
  // Check NEXTAUTH_URL
  if (!process.env.NEXTAUTH_URL) {
    log.warning('NEXTAUTH_URL is not set in the environment');
    
    if (!isValidUrl(config.url)) {
      log.error(`Invalid URL: ${config.url}`);
      config.url = await question('Please enter your site URL (e.g., https://example.com): ');
      
      if (!isValidUrl(config.url)) {
        log.error('Invalid URL provided. Exiting.');
        process.exit(1);
      }
    }
    
    log.info(`Using URL: ${config.url}`);
  } else {
    log.success(`NEXTAUTH_URL is set: ${process.env.NEXTAUTH_URL}`);
    config.url = process.env.NEXTAUTH_URL;
  }
  
  // Check NEXTAUTH_SECRET
  if (!process.env.NEXTAUTH_SECRET) {
    log.warning('NEXTAUTH_SECRET is not set in the environment');
    
    if (process.env.JWT_SECRET) {
      log.info('Using JWT_SECRET as fallback');
    } else {
      log.error('Neither NEXTAUTH_SECRET nor JWT_SECRET is set');
      log.info('Generating a random secret for testing purposes only');
      process.env.NEXTAUTH_SECRET = generateRandomString();
    }
  } else {
    log.success('NEXTAUTH_SECRET is set');
  }
  
  // Check for test credentials
  if (!config.email || !config.password) {
    log.warning('Test credentials not provided');
    config.email = await question('Enter test email: ');
    config.password = await question('Enter test password: ');
  } else {
    log.success('Test credentials are available');
  }
}

// Test cookie settings
async function testCookieSettings() {
  log.section('Cookie Settings Test');
  
  try {
    // Make a request to the site to check cookies
    log.info(`Making request to ${config.url}`);
    const response = await fetch(config.url, {
      method: 'GET',
      headers: {
        'User-Agent': 'NextAuth Debug Script',
      },
    });
    
    if (!response.ok) {
      log.error(`Failed to access ${config.url}: ${response.status} ${response.statusText}`);
      return;
    }
    
    // Check for cookies in the response
    const cookies = response.headers.get('set-cookie');
    if (!cookies) {
      log.warning('No cookies set in the response');
    } else {
      log.success('Cookies found in the response');
      
      // Parse cookies
      const cookieList = cookies.split(',').map(cookie => cookie.trim());
      log.info('Cookies:');
      cookieList.forEach(cookie => {
        const [name] = cookie.split('=');
        log.info(`- ${name}`);
        
        // Check for secure flag
        if (cookie.includes('Secure')) {
          log.success('  Secure flag is set');
        } else {
          log.warning('  Secure flag is not set');
        }
        
        // Check for HttpOnly flag
        if (cookie.includes('HttpOnly')) {
          log.success('  HttpOnly flag is set');
        } else {
          log.warning('  HttpOnly flag is not set');
        }
        
        // Check for SameSite
        if (cookie.includes('SameSite=Lax')) {
          log.success('  SameSite=Lax is set');
        } else if (cookie.includes('SameSite=Strict')) {
          log.success('  SameSite=Strict is set');
        } else if (cookie.includes('SameSite=None')) {
          log.warning('  SameSite=None is set (requires Secure flag)');
        } else {
          log.warning('  SameSite is not explicitly set');
        }
      });
    }
  } catch (error) {
    log.error(`Error testing cookie settings: ${error.message}`);
  }
}

// Test authentication flow
async function testAuthFlow() {
  log.section('Authentication Flow Test');
  
  try {
    // Step 1: Get CSRF token
    log.info('Step 1: Getting CSRF token');
    const csrfResponse = await fetch(`${config.url}/api/auth/csrf`, {
      method: 'GET',
    });
    
    if (!csrfResponse.ok) {
      log.error(`Failed to get CSRF token: ${csrfResponse.status} ${csrfResponse.statusText}`);
      return;
    }
    
    const csrfData = await csrfResponse.json();
    const csrfToken = csrfData.csrfToken;
    
    if (!csrfToken) {
      log.error('CSRF token not found in response');
      return;
    }
    
    log.success(`CSRF token obtained: ${csrfToken.substring(0, 10)}...`);
    
    // Step 2: Attempt login
    log.info('Step 2: Attempting login');
    const loginResponse = await fetch(`${config.url}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `next-auth.csrf-token=${csrfToken}`,
      },
      body: JSON.stringify({
        csrfToken,
        email: config.email,
        password: config.password,
        redirect: false,
        json: true,
      }),
    });
    
    // Get cookies from response
    const cookies = loginResponse.headers.get('set-cookie');
    
    if (!loginResponse.ok) {
      log.error(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
      const errorData = await loginResponse.json();
      log.json(errorData);
      return;
    }
    
    const loginData = await loginResponse.json();
    
    if (loginData.error) {
      log.error(`Authentication error: ${loginData.error}`);
      return;
    }
    
    log.success('Login successful');
    log.json(loginData);
    
    // Check for session cookie
    if (cookies && cookies.includes('next-auth.session-token')) {
      log.success('Session token cookie found');
    } else {
      log.error('Session token cookie not found');
    }
    
    // Step 3: Test session
    log.info('Step 3: Testing session');
    const sessionResponse = await fetch(`${config.url}/api/auth/session`, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
      },
    });
    
    if (!sessionResponse.ok) {
      log.error(`Failed to get session: ${sessionResponse.status} ${sessionResponse.statusText}`);
      return;
    }
    
    const sessionData = await sessionResponse.json();
    
    if (!sessionData.user) {
      log.error('Session does not contain user data');
      log.json(sessionData);
      return;
    }
    
    log.success('Session contains user data');
    log.json(sessionData);
    
    // Step 4: Test protected route
    log.info('Step 4: Testing access to protected route');
    const protectedResponse = await fetch(`${config.url}/admin`, {
      method: 'GET',
      headers: {
        'Cookie': cookies,
      },
      redirect: 'manual',
    });
    
    // Check if we were redirected to login
    const location = protectedResponse.headers.get('location');
    if (location && location.includes('/login')) {
      log.error('Redirected to login page - session not recognized');
      log.info(`Redirect location: ${location}`);
    } else {
      log.success('Access to protected route successful');
    }
  } catch (error) {
    log.error(`Error testing authentication flow: ${error.message}`);
    console.error(error);
  }
}

// Main function
async function main() {
  log.section('NextAuth.js Debug Script');
  log.info(`Testing URL: ${config.url}`);
  
  try {
    await checkEnvironmentVariables();
    await testCookieSettings();
    await testAuthFlow();
    
    log.section('Debug Complete');
    log.info('Check the logs above for any issues with your NextAuth.js configuration');
  } catch (error) {
    log.error(`Unexpected error: ${error.message}`);
    console.error(error);
  } finally {
    rl.close();
  }
}

// Run the script
main();
