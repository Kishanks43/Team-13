import js from "@eslint/js";
import globals from "globals";

export default [
  { ignores: ["node_modules/**", "coverage/**"] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: { ...globals.browser }
    }
  },
  {
    files: ["scripts/**/*.js", "tests/**/*.js", "jest.config.js", "eslint.config.js"],
    languageOptions: { globals: { ...globals.node, ...globals.browser } }
  }
];
