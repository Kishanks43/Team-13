export default [
  {
    ignores: ["node_modules/**", "coverage/**"]
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly",
        document: "readonly",
        window: "readonly",
        HTMLElement: "readonly",
        DOMParser: "readonly",
        TextDecoder: "readonly",
        URL: "readonly"
      }
    },
    rules: {
      "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "no-undef": "error",
      "no-unreachable": "error",
      "no-constant-condition": "error"
    }
  }
];