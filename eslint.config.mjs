// @ts-check
import eslintConfigPrettier from "eslint-config-prettier/flat";
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
    eslintConfigPrettier,
    // Your custom configs here
    {
        files: ["./**/*.{js,ts,vue}"],
        rules: {
            "nuxt/prefer-import-meta": "off",
            "vue/no-multiple-template-roots": "off",
            "vue/no-multiple-template-root": "off",
            "no-shadow-restricted-names": "error",
            "no-shadow": "error",
            tabWidth: ["error", 4],
            "import/no-self-import": "error",
            "no-console": "error",
            "vue/quote-props": "error",
            "vue/block-tag-newline": "error",
            "vue/block-order": "error",
            semi: ["error", "always"],
            "vue/html-indent": ["error", 4],
            "vue/key-spacing": ["error", { beforeColon: false, afterColon: true }],
            "vue/no-async-in-computed-properties": "error",
            "vue/keyword-spacing": ["error", { before: true, after: true }],
            "vue/prop-name-casing": ["error", "camelCase"],
            "vue/max-attributes-per-line": [
                "error",
                {
                    singleline: { max: 1 },
                    multiline: { max: 1 },
                },
            ],
            "vue/max-len": [
                "error",
                {
                    code: 120,
                    tabWidth: 4,
                    ignoreUrls: true,
                },
            ],
            "vue/no-unused-vars": "error",
            "no-empty-function": "error",
            "vue/no-unused-components": "error",
            "no-unused-private-class-members": "error",
            "no-useless-catch": "error",
            "vue/no-export-in-script-setup": "error",
        },
    },
);
