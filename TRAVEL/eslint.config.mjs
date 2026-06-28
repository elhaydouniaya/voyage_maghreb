import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // French UI copy uses apostrophes in JSX text (l'inscription, d'accord, etc.)
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      // Reading localStorage / mock data on mount is intentional in this MVP
      "react-hooks/set-state-in-effect": "off",
      "@next/next/no-img-element": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    // Standalone CommonJS dev/ops scripts run directly with `node` — require() is correct here.
    files: ["scripts/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scratch/**",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
