// Plain ES modules, so no transform. DOM tests opt in with a
// `@jest-environment jsdom` docblock; everything else runs in plain Node.
export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["<rootDir>/tests/**/*.test.js"]
};
