// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  // Your custom configs here
  {
    rules: {
      'nuxt/prefer-import-meta': 'off',
      'vue/no-multiple-template-roots': 'off',
      'vue/no-multiple-template-root':'off',
      'no-shadow-restricted-names': 'error',
      'no-shadow': 'error',
      'import/no-self-import': 'error',
    }
  }
)
