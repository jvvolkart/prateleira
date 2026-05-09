process.env.JWT_SECRET = process.env.JWT_SECRET || "jest-jwt-secret";

/** @type {import("jest").Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/test/setup.ts"],
  testTimeout: 60000,
};
