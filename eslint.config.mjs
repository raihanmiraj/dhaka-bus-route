import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });
const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      ".next/**",
      "next-env.d.ts",
      "node_modules/**",
      "flutterapp/**",
      "server/busroute.ts",
    ],
  },
  {
    rules: {
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",
      "react-hooks/exhaustive-deps": "off",
    },
  },
];

export default config;
