import { defineConfig, globalIgnores } from "eslint/config";
import centralUi from "./scripts/eslint/central-ui.mjs";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  {files:["app/**/*.{ts,tsx}","components/**/*.{ts,tsx}"],plugins:{"binso-ui":centralUi},rules:{"binso-ui/central-components":"error"}},
  { rules: { "@next/next/no-img-element": "off" } },
  globalIgnores([".next/**", "out/**", "build/**", "deploy/**", "next-env.d.ts"]),
]);
