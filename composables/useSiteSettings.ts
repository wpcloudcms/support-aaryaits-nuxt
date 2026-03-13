const logoUrl = ref('')
const siteName = ref('Support Aaryaits')

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
      }
    } catch {}
  }

  return { logoUrl, siteName, loadSiteSettings }
}
