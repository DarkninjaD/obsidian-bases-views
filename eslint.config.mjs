import js from "@eslint/js";
import tseslint from "typescript-eslint";
import obsidianPlugin from "eslint-plugin-obsidianmd";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ["node_modules/**", "main.js", "*.config.*", "dist/**"],
  },
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    plugins: {
      obsidianmd: obsidianPlugin,
    },
    rules: {
      // Obsidian plugin rules
      "obsidianmd/ui/sentence-case": ["error", { enforceCamelCaseLower: true }],

      // TypeScript rules
      "@typescript-eslint/no-explicit-any": ["error", { fixToUnknown: true }],
      "@typescript-eslint/no-unused-vars": ["warn", { args: "none" }],

      // General rules
      "no-console": ["error", { allow: ["warn", "error", "debug"] }],
    },
  }
);
