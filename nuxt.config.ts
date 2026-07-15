import { defineNuxtConfig } from 'nuxt/config'

// En-têtes de sécurité HTTP appliqués à toutes les routes (défense en profondeur).
// Voir docs/SECURITY_PLAN.md pour la justification de chaque directive.
const securityHeaders = {
  // Empêche le rendu du site dans une iframe (protection clickjacking).
  'X-Frame-Options': 'DENY',
  // Interdit au navigateur de « deviner » le type MIME (protection MIME-sniffing).
  'X-Content-Type-Options': 'nosniff',
  // Ne fuite pas l'URL complète (avec paramètres) vers les sites tiers.
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Coupe l'accès aux API sensibles du navigateur non utilisées par l'app.
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  // Force HTTPS pendant 2 ans (ignoré par les navigateurs sur du HTTP simple).
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  // Content-Security-Policy : n'autorise que les ressources du domaine.
  // 'unsafe-inline' reste nécessaire pour le payload d'hydratation Nuxt et les
  // styles DSFR ; piste d'amélioration = migrer vers des nonces (cf. SECURITY_PLAN).
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
}

export default defineNuxtConfig({
  modules: ['nuxt-auth-utils', '@nuxt/eslint'],
  plugins: ['~/plugins/dsfr.ts'],
  build: {
    transpile: ['@gouvminint/vue-dsfr'],
  },

  // Applique les en-têtes de sécurité à toutes les réponses HTTP.
  routeRules: {
    '/**': { headers: securityHeaders },
  },

  // Durcissement de la session nuxt-auth-utils.
  // Rappel : le cookie de session est déjà httpOnly + secure (prod) + sameSite=lax
  // par défaut ; on rend l'expiration explicite (7 jours) plutôt que « session ».
  runtimeConfig: {
    session: {
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      cookie: {
        sameSite: 'lax',
      },
    },
  },
})
