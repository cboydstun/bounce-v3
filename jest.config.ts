import type { Config } from "jest";
import nextJest from "next/jest";

const createJestConfig = nextJest({
  dir: "./",
});

// Create a custom config that will be merged with the Next.js config
const customConfig: Config = {
  // Default test environment
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/test/__mocks__/fileMock.js",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(next|next-auth|@next-auth|jose|openid-client)/)",
  ],
  testEnvironmentOptions: {
    url: "http://localhost:3000",
  },
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
  // Increase timeout for tests
  testTimeout: 30000,
  // Force exit after tests complete
  forceExit: true,
  // Detect open handles
  detectOpenHandles: true,
  // Add support for ES modules
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  transform: {
    "^.+\\.(ts|tsx|js|jsx|mjs)$": [
      "babel-jest",
      {
        presets: [
          "next/babel",
          "@babel/preset-typescript",
          ["@babel/preset-react", { runtime: "automatic" }],
        ],
        plugins: ["@babel/plugin-transform-modules-commonjs"],
      },
    ],
  },
  // Set environment variables for tests
  globals: {
    "ts-jest": {
      useESM: true,
    },
    SUPPRESS_JEST_WARNINGS: true,
  },
  // Configure test environments based on file patterns
  testMatch: [
    "**/__tests__/**/*.test.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
  ],
};

export default createJestConfig(customConfig);
