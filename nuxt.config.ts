export default defineNuxtConfig({
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
  ],

  // Cloudflare Pages deployment
  nitro: {
    preset: 'cloudflare-pages',
  },

  // Runtime config — public values safe for browser
  runtimeConfig: {
    public: {
      wpUrl:  process.env.NUXT_PUBLIC_WP_URL  || 'https://your-wordpress.com',
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'https://aaryaits-api.wpcloudcms.workers.dev',
    },
  },

  // SPA mode for auth-gated dashboard
  ssr: false,

  // Global CSS
  css: ['~/assets/css/main.css'],

  // Auto-import composables & components
  components: true,

  typescript: {
    strict: true,
  },

  compatibilityDate: '2024-11-01',
})
