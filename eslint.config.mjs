// @ts-check
import eslintConfigPrettier from "eslint-config-prettier/flat";
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
    eslintConfigPrettier,
    // Your custom configs here
    {
        files: ["./**/*.{js,ts,vue}"],
        rules: {
            semi: ["error", "always"], // 强制语句末尾使用分号
            indent: [
                "error",
                4,
                {
                    // 2 空格缩进
                    SwitchCase: 1, // case 子句缩进 1 级（2 空格）
                    ignoredNodes: ["TemplateLiteral", "TemplateElement", "StyleElement"],
                },
            ],
            "@typescript-eslint/no-unused-vars": "error", // 关闭未使用变量检查
            "@typescript-eslint/no-var-requires": "warn", // 允许使用 require()
            "@typescript-eslint/no-explicit-any": "error", // 允许使用 any 类型
            "@typescript-eslint/no-this-alias": "warn", // 允许 this 别名
            "@typescript-eslint/no-empty-object-type": "error",
            "no-debugger": "warn", // 允许 debugger 语句

            // ----- Vue 专用规则 -----
            "vue/multi-word-component-names": [
                // 组件名必须多单词
                "off",
                {
                    ignores: ["Index", "Header", "App", "pages/**"], // 允许例外的组件名
                },
            ],
            "vue/no-multiple-template-root": "off", // 允许多个根节点
            "vue/no-unused-vars": "error", // 关闭 Vue 未使用变量检查
            "vue/no-template-shadow": "warn", // 允许模板变量遮蔽
            "vue/require-v-for-key": "error", // 关闭 v-for 必须带 key 的检查
            "vue/no-textarea-mustache": "warn", // 允许 textarea 使用 mustache
            "vue/no-v-html": "warn", // 允许使用 v-html（注意 XSS 风险）
            "vue/no-v-model-argument": "off", // 允许 v-model 使用自定义修饰符
            "vue/no-v-text-v-html-on-component": "off", // 允许 v-text 和 v-html 在组件上使用
            "vue/no-v-for-template-key": "off", // 允许 v-for 使用 template 标签
        },
    },
);
