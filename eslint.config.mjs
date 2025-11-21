import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    // Global ignore patterns for build/generated/vendor artifacts
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "app/generated/**",
      "public/vendor/**",
    ],
  },
  {
    // Relax noisy rules for generated Prisma/runtime and bundled vendor scripts
    files: ["app/generated/**", "public/vendor/**"],
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react/no-unescaped-entities": "off",
    },
  },
  {
    // Allow `any` in UI files that interop with vendor libs and allow vendor CSS tag
    files: ["components/**", "app/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@next/next/no-css-tags": "off",
    },
  },
];

export default eslintConfig;
