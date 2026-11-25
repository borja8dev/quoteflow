import coreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  ...coreWebVitals,
  ...nextTypescript,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "error",
      "no-console": ["error", { allow: ["error"] }],
    },
  },
  {
    ignores: ["node_modules/**", ".next/**", "coverage/**", "next-env.d.ts"],
  },
];

export default config;
