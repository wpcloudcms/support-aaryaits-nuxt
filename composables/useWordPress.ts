/**
 * API composable
 *
 * Split:
 *  - wpFetch  → WordPress REST API  (auth, comments, history, notifications, push, theme/site settings)
 *  - apiFetch → Node.js Workers API (tickets, members, projects, settings R/W, upload)
 */

const WP_BASE  = () => useRuntimeConfig().public.wpUrl  as string
const API_BASE = () => useRuntimeConfig().public.apiUrl as string

let token = ''

export function useWordPress() {
  function setToken(t: string) { token = t }

  // ── WordPress REST fetch ────────────────────────────────────
  async function wpFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers as Record<string, string> ?? {}),
    }
    const res = await fetch(`${WP_BASE()}${path}`, { ...opts, headers })
    if (!res.ok) throw new Error(`WP API error: ${res.status}`)
    return res.json() as Promise<T>
  }

  // ── Node.js Workers API fetch ───────────────────────────────
  async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers as Record<string, string> ?? {}),
    }
    const res = await fetch(`${API_BASE()}${path}`, { ...opts, headers })
    if (!res.ok) throw new Error(`API error: ${res.status}`)
    return res.json() as Promise<T>
  }

  // ── TICKETS — Node.js API (direct MySQL) ───────────────────
  const getTickets  = ()                                    => apiFetch<any[]>('/api/tickets')
  const getTicket   = (id: number)                          => apiFetch<any>(`/api/tickets/${id}`)
  const createTicket = (data: Record<string, unknown>)      => wpFetch('/wp-json/wp/v2/ticket', { method: 'POST', body: JSON.stringify(data) })
  const updateTicket = (id: number, data: Record<string, unknown>) => wpFetch(`/wp-json/wp/v2/ticket/${id}`, { method: 'POST', body: JSON.stringify(data) })
  const deleteTicket = (id: number)                         => wpFetch(`/wp-json/wp/v2/ticket/${id}`, { method: 'DELETE' })

  // ── TICKET TAXONOMY TERMS — WP REST ────────────────────────
  const getStatusTerms   = () => wpFetch<{ id: number; name: string; slug: string }[]>('/wp-json/wp/v2/ticket-status?per_page=100')
  const getPriorityTerms = () => wpFetch<{ id: number; name: string; slug: string }[]>('/wp-json/wp/v2/ticket-priority?per_page=100')

  // ── MEMBERS — Node.js API ──────────────────────────────────
  const getMembers     = ()                                    => apiFetch<any[]>('/api/members')
  const createMember   = (data: Record<string, unknown>)       => wpFetch('/wp-json/wp/v2/member', { method: 'POST', body: JSON.stringify(data) })
  const updateMember   = (id: number, data: Record<string, unknown>) => wpFetch(`/wp-json/wp/v2/member/${id}`, { method: 'POST', body: JSON.stringify(data) })

  // ── PROJECTS — Node.js API ─────────────────────────────────
  const getProjects    = ()                                    => apiFetch<any[]>('/api/projects')
  const getProject     = (id: number)                          => apiFetch<any>(`/api/projects/${id}`)
  const createProject  = (data: Record<string, unknown>)       => wpFetch('/wp-json/wp/v2/project', { method: 'POST', body: JSON.stringify(data) })
  const updateProject  = (id: number, data: Record<string, unknown>) => wpFetch(`/wp-json/wp/v2/project/${id}`, { method: 'POST', body: JSON.stringify(data) })

  // ── CUSTOMERS — WP REST (keep for now) ─────────────────────
  const getCustomers   = (params = '') => wpFetch(`/wp-json/wp/v2/customer?per_page=100&${params}`)
  const getCustomer    = (id: number)  => wpFetch(`/wp-json/wp/v2/customer/${id}`)
  const createCustomer = (data: Record<string, unknown>) => wpFetch('/wp-json/wp/v2/customer', { method: 'POST', body: JSON.stringify(data) })

  // ── WP USERS ───────────────────────────────────────────────
  const getUsers = () => wpFetch('/wp-json/wp/v2/users?per_page=100&context=edit')

  // ── HISTORY — WP REST (.md files, keep as-is) ──────────────
  const getHistory  = (id: number) =>
    wpFetch<{ timestamp: string; iso: string; user: string; changes: string[] }[]>(`/wp-json/support/v1/history/${id}`)
  const saveHistory = (id: number, data: { changes: string[]; user: string; ticketTitle: string }) =>
    wpFetch<{ ok: boolean }>(`/wp-json/support/v1/history/${id}`, { method: 'POST', body: JSON.stringify(data) })

  // ── COMMENTS — WP REST (.md files, keep as-is) ─────────────
  const getComments = (id: number) =>
    wpFetch<{ timestamp: string; iso: string; user: string; body: string }[]>(`/wp-json/support/v1/comments/${id}`)
  const addComment  = (id: number, data: { body: string; user: string; ticketTitle: string }) =>
    wpFetch<{ ok: boolean }>(`/wp-json/support/v1/comments/${id}`, { method: 'POST', body: JSON.stringify(data) })

  // ── NOTIFICATIONS — WP REST (keep as-is) ───────────────────
  const getNotifications = () =>
    wpFetch<{
      type: 'comment' | 'history'
      ticket_id: number
      ticket_title: string
      user: string
      timestamp: string
      iso: string
      body?: string
      changes?: string[]
    }[]>('/wp-json/support/v1/notifications')

  // ── WEB PUSH — WP REST ─────────────────────────────────────
  const getVapidKey      = () => wpFetch<{ key: string }>('/wp-json/support/v1/push/vapid-key').then(r => r.key)
  const subscribePush    = (sub: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
    wpFetch<{ ok: boolean }>('/wp-json/support/v1/push/subscribe', { method: 'POST', body: JSON.stringify(sub) })
  const unsubscribePush  = (endpoint: string) =>
    wpFetch<{ ok: boolean }>('/wp-json/support/v1/push/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint }) })

  // ── TICKET NOTIFY — WP REST ────────────────────────────────
  const getTicketNotifyStatus  = (id: number) => wpFetch<{ subscribed: boolean }>(`/wp-json/support/v1/ticket-notify/${id}`)
  const subscribeTicketNotify  = (id: number) => wpFetch<{ ok: boolean; subscribed: boolean }>(`/wp-json/support/v1/ticket-notify/${id}`, { method: 'POST' })
  const unsubscribeTicketNotify = (id: number) => wpFetch<{ ok: boolean; subscribed: boolean }>(`/wp-json/support/v1/ticket-notify/${id}`, { method: 'DELETE' })

  // ── THEME SETTINGS — WP REST ───────────────────────────────
  const getThemeSettings  = () => wpFetch<Record<string, string>>('/wp-json/support/v1/theme-settings')
  const saveThemeSettings = (settings: Record<string, string>) =>
    wpFetch<{ ok: boolean; settings: Record<string, string> }>('/wp-json/support/v1/theme-settings', { method: 'POST', body: JSON.stringify(settings) })

  // ── SITE SETTINGS — Node.js API (reads wp_options directly) ─
  const getSiteSettings  = () => apiFetch<Record<string, string>>('/api/settings')
  const saveSiteSettings = (settings: Record<string, string>) =>
    apiFetch<{ ok: boolean }>('/api/settings', { method: 'POST', body: JSON.stringify(settings) })

  // ── UPLOAD — Node.js API (R2 via Workers binding) ──────────
  const uploadImage = async (data: string, folder = 'uploads'): Promise<{ ok: boolean; url: string }> => {
    // Convert base64 data URL → Blob → FormData
    const [meta, b64] = data.split(',')
    const mime = meta.match(/:(.*?);/)?.[1] ?? 'image/png'
    const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
    const blob  = new Blob([bytes], { type: mime })
    const form  = new FormData()
    form.append('file', blob, `upload.${mime.split('/')[1]}`)
    const res = await fetch(`${API_BASE()}/api/upload?folder=${folder}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })
    const json = await res.json() as { url: string; key: string }
    return { ok: true, url: json.url }
  }

  // Site logo — still uses WP REST (WP media library)
  const uploadSiteLogo = (data: string) =>
    wpFetch<{ ok: boolean; url: string }>('/wp-json/support/v1/site-logo', { method: 'POST', body: JSON.stringify({ data }) })

  return {
    setToken,
    // Tickets
    getTickets, getTicket, createTicket, updateTicket, deleteTicket,
    getStatusTerms, getPriorityTerms,
    // Projects
    getProjects, getProject, createProject, updateProject,
    // Customers
    getCustomers, getCustomer, createCustomer,
    // Members
    getMembers, createMember, updateMember,
    getUsers,
    // History + Comments (WP REST / .md files)
    getHistory, saveHistory,
    getComments, addComment,
    // Notifications (WP REST)
    getNotifications,
    // Push (WP REST)
    getVapidKey, subscribePush, unsubscribePush,
    getTicketNotifyStatus, subscribeTicketNotify, unsubscribeTicketNotify,
    // Settings
    getThemeSettings, saveThemeSettings,
    getSiteSettings, saveSiteSettings,
    // Upload
    uploadSiteLogo, uploadImage,
  }
}
