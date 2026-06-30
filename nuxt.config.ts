import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  modules: ['nuxt-auth-utils', '@nuxt/eslint'],
  plugins: ['~/plugins/dsfr.ts'],
  build: {
    transpile: ['@gouvminint/vue-dsfr'],
  },
})
