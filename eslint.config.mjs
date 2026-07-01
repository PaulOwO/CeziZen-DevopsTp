import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    // Code existant non typé — warn au lieu de bloquer
    '@typescript-eslint/no-explicit-any': 'warn',
    // Variables non utilisées — warn au lieu de bloquer
    '@typescript-eslint/no-unused-vars': 'warn',
  },
})
