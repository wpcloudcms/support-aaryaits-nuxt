const logoUrl = ref('')
const siteName = ref('Support Aaryaits')
const loginSubtitle = ref('Sign in to your workspace')
const sidebarWidth = ref(200)

export function useSiteSettings() {
  const config = useRuntimeConfig()

  async function loadSiteSettings() {
    if (!import.meta.client) return
    try {
      const res = await fetch(`${config.public.wpUrl}/wp-json/support/v1/site-settings`)
      if (res.ok) {
        const s = await res.json()
        if (s.site_name) siteName.value = s.site_name
        if (s.login_subtitle !== undefined) loginSubtitle.value = s.login_subtitle
        logoUrl.value = s.logo_url ?? ''
        if (s.sidebar_width) sidebarWidth.value = Math.max(200, Math.min(300, Number(s.sidebar_width)))
      }
    } catch {}
  }

  return { logoUrl, siteName, loginSubtitle, sidebarWidth, loadSiteSettings }
}
