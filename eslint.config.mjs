// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Your custom configs here

  {
    rules: {
      'nuxt/prefer-import-meta': 'off',
      'vue/no-multiple-template-roots': 'off',
      'vue/no-multiple-template-root': 'off',
      'no-shadow-restricted-names': 'error',
      'no-shadow': 'error',
      'import/no-self-import': 'error',
      'no-console': 'error',
      'vue/quote-props': 'error',
      'vue/block-tag-newline': 'error',
      'vue/block-tag-spacing': 'error',
      'vue/block-order': 'error',
      'semi': ['error', 'always'],
      'vue/key-spacing': ['error', { beforeColon: false, afterColon: true }],
      'vue/no-async-in-computed-properties': 'error',
      'vue/keyword-spacing': ['error', { before: true, after: true }],
      'vue/prop-name-casing': ['error', 'camelCase'],
      'vue/max-attributes-per-line': ['error', {
        singleline: { max: 1 },
        multiline: { max: 1 }
      }],
      'vue/max-len': ['error', {
        code: 120,
        tabWidth: 2,
        ignoreUrls: true,
      }],
      'vue/no-unused-vars': 'error',
      'no-empty-function': 'error',
      'vue/no-unused-components': 'error',
      'no-unused-private-class-members': 'error',
      'no-useless-catch': 'error',
      'vue/script-setup-uses-vars': 'error',
      'vue/no-export-in-script-setup': 'error',
    }
  }
)
