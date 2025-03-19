import type { Config } from "jest";
import nextJest from "next/jest";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/test/__mocks__/fileMock.js",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  transformIgnorePatterns: ["/node_modules/(?!next)"],
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
};

export default createJestConfig(config);
