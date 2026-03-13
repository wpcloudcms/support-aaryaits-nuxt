<script setup lang="ts">
useHead({ title: 'Support Aaryaits' })

function applyTheme(s: Record<string, string>) {
  if (!s || !Object.keys(s).length) return
  const css = `:root {
  --bg-app: ${s.light_bg_app};
  --bg-sidebar: ${s.light_bg_sidebar};
  --bg-card: ${s.light_bg_card};
  --bg-hover: ${s.light_bg_hover};
  --bg-active: ${s.light_bg_active};
  --border: ${s.light_border};
  --text-1: ${s.light_text_1};
  --text-2: ${s.light_text_2};
  --text-3: ${s.light_text_3};
  --accent: ${s.light_accent};
  --accent-hover: ${s.light_accent_hover};
  --success: ${s.light_success};
}
html.dark {
  --bg-app: ${s.dark_bg_app};
  --bg-sidebar: ${s.dark_bg_sidebar};
  --bg-card: ${s.dark_bg_card};
  --bg-hover: ${s.dark_bg_hover};
  --bg-active: ${s.dark_bg_active};
  --border: ${s.dark_border};
  --text-1: ${s.dark_text_1};
  --text-2: ${s.dark_text_2};
  --text-3: ${s.dark_text_3};
  --accent: ${s.dark_accent};
  --accent-hover: ${s.dark_accent_hover};
  --success: ${s.dark_success};
}`
  let el = document.getElementById('custom-theme') as HTMLStyleElement | null
  if (!el) {
    el = document.createElement('style')
    el.id = 'custom-theme'
    document.head.appendChild(el)
  }
  el.textContent = css
}

if (import.meta.client) {
  const config = useRuntimeConfig()
  fetch(`${config.public.wpUrl}/wp-json/support/v1/theme-settings`)
    .then(r => r.ok ? r.json() : null)
    .then(s => { if (s) applyTheme(s) })
    .catch(() => {})

  const { loadSiteSettings } = useSiteSettings()
  loadSiteSettings()
}
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
