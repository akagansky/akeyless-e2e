import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import playwright from "eslint-plugin-playwright";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["node_modules/", "test-results/", "playwright-report/"] },
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  {
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  { ...playwright.configs["flat/recommended"], files: ["tests/**", "fixtures/**"] },
  { files: ["**/*.mjs"], ...tseslint.configs.disableTypeChecked },
  prettier,
);
