import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";

export default defineConfig([
  {
    files: ["**/*.mjs"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      "no-unused-vars": "error",
      "no-unused-expressions": "error",
      "no-unreachable": "error",
      indent: ["error", 2],
    },
  },
]);
