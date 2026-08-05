// ============================================================================
// Library Of Legends
// Project Phoenix
//
// File.............: eslint.config.mjs
// Category.........: Linting Configuration
// File-ID..........: LOL-CONFIG-0010
// Version..........: 1.0.0
// Status...........: Stable
// ============================================================================

import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [

    js.configs.recommended,

    ...tseslint.configs.recommended,

    {

        files: ["**/*.{ts,tsx,js,mjs,cjs}"],

        languageOptions: {

            globals: {
                ...globals.node
            }

        },

        rules: {

            "no-console": "warn",

            "no-debugger": "error",

            "no-unused-vars": "off",

            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    "argsIgnorePattern": "^_",
                    "varsIgnorePattern": "^_"
                }
            ],

            "@typescript-eslint/consistent-type-imports": "error",

            "eqeqeq": [
                "error",
                "always"
            ],

            "curly": [
                "error",
                "all"
            ]

        }

    }

];