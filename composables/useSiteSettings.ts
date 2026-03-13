const logoUrl = ref('')
const siteName = ref('Support Aaryaits')
const sidebarWidth = ref(240)

export function useSiteSettings() {
  const config = useRuntimeConfig()

  async function loadSiteSettings() {
    if (!import.meta.client) return
    try {
      const res = await fetch(`${config.public.wpUrl}/wp-json/support/v1/site-settings`)
      if (res.ok) {
        const s = await res.json()
        if (s.site_name) siteName.value = s.site_name
        logoUrl.value = s.logo_url ?? ''
        if (s.sidebar_width) sidebarWidth.value = Math.max(240, Math.min(320, Number(s.sidebar_width)))
      }
    } catch {}
  }

  return { logoUrl, siteName, sidebarWidth, loadSiteSettings }
}
