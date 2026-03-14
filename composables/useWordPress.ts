// WordPress REST API composable

const WP_BASE = () => useRuntimeConfig().public.wpUrl as string
let token = ''

export function useWordPress() {
  function setToken(t: string) { token = t }

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

  // Tickets (CPT: ticket)
  const getTickets = (params = '') => wpFetch(`/wp-json/wp/v2/ticket?per_page=100&${params}`)
  const getTicket = (id: number) => wpFetch(`/wp-json/wp/v2/ticket/${id}`)
  const createTicket = (data: Record<string, unknown>) => wpFetch('/wp-json/wp/v2/ticket', { method: 'POST', body: JSON.stringify(data) })
  const updateTicket = (id: number, data: Record<string, unknown>) => wpFetch(`/wp-json/wp/v2/ticket/${id}`, { method: 'POST', body: JSON.stringify(data) })
  const deleteTicket = (id: number) => wpFetch(`/wp-json/wp/v2/ticket/${id}`, { method: 'DELETE' })

  // Ticket taxonomy terms
  const getStatusTerms = () => wpFetch<{ id: number; name: string; slug: string }[]>('/wp-json/wp/v2/ticket-status?per_page=100')
  const getPriorityTerms = () => wpFetch<{ id: number; name: string; slug: string }[]>('/wp-json/wp/v2/ticket-priority?per_page=100')

  // Projects (CPT: project)
  const getProjects = (params = '') => wpFetch(`/wp-json/wp/v2/project?per_page=100&${params}`)
  const getProject = (id: number) => wpFetch(`/wp-json/wp/v2/project/${id}`)
  const createProject = (data: Record<string, unknown>) => wpFetch('/wp-json/wp/v2/project', { method: 'POST', body: JSON.stringify(data) })
  const updateProject = (id: number, data: Record<string, unknown>) => wpFetch(`/wp-json/wp/v2/project/${id}`, { method: 'POST', body: JSON.stringify(data) })

  // Customers (CPT: customer)
  const getCustomers = (params = '') => wpFetch(`/wp-json/wp/v2/customer?per_page=100&${params}`)
  const getCustomer = (id: number) => wpFetch(`/wp-json/wp/v2/customer/${id}`)
  const createCustomer = (data: Record<string, unknown>) => wpFetch('/wp-json/wp/v2/customer', { method: 'POST', body: JSON.stringify(data) })

  // Members (CPT: member)
  const getMembers = () => wpFetch('/wp-json/wp/v2/member?per_page=100')
  const createMember = (data: Record<string, unknown>) => wpFetch('/wp-json/wp/v2/member', { method: 'POST', body: JSON.stringify(data) })
  const updateMember = (id: number, data: Record<string, unknown>) => wpFetch(`/wp-json/wp/v2/member/${id}`, { method: 'POST', body: JSON.stringify(data) })

  // WP Users (for member dropdown)
  const getUsers = () => wpFetch('/wp-json/wp/v2/users?per_page=100&context=edit')

  // Ticket history — .md files in wp-content/uploads/tickets-history/
  const getHistory = (id: number) =>
    wpFetch<{ timestamp: string; iso: string; user: string; changes: string[] }[]>(`/wp-json/support/v1/history/${id}`)
  const saveHistory = (id: number, data: { changes: string[]; user: string; ticketTitle: string }) =>
    wpFetch<{ ok: boolean }>(`/wp-json/support/v1/history/${id}`, { method: 'POST', body: JSON.stringify(data) })

  // Ticket comments — .md files in wp-content/uploads/tickets-comments/
  const getComments = (id: number) =>
    wpFetch<{ timestamp: string; iso: string; user: string; body: string }[]>(`/wp-json/support/v1/comments/${id}`)
  const addComment = (id: number, data: { body: string; user: string; ticketTitle: string }) =>
    wpFetch<{ ok: boolean }>(`/wp-json/support/v1/comments/${id}`, { method: 'POST', body: JSON.stringify(data) })

  // Notifications — activity on tickets assigned to current user
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

  // Web Push
  const getVapidKey = () =>
    wpFetch<{ key: string }>('/wp-json/support/v1/push/vapid-key').then(r => r.key)
  const subscribePush = (sub: { endpoint: string; keys: { p256dh: string; auth: string } }) =>
    wpFetch<{ ok: boolean }>('/wp-json/support/v1/push/subscribe', { method: 'POST', body: JSON.stringify(sub) })
  const unsubscribePush = (endpoint: string) =>
    wpFetch<{ ok: boolean }>('/wp-json/support/v1/push/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint }) })

  // Theme settings
  const getThemeSettings = () =>
    wpFetch<Record<string, string>>('/wp-json/support/v1/theme-settings')
  const saveThemeSettings = (settings: Record<string, string>) =>
    wpFetch<{ ok: boolean; settings: Record<string, string> }>('/wp-json/support/v1/theme-settings', { method: 'POST', body: JSON.stringify(settings) })

  // Site settings (logo + name)
  const getSiteSettings = () =>
    wpFetch<{ site_name: string; logo_url: string }>('/wp-json/support/v1/site-settings')
  const saveSiteSettings = (settings: { site_name?: string; logo_url?: string }) =>
    wpFetch<{ ok: boolean; settings: { site_name: string; logo_url: string } }>('/wp-json/support/v1/site-settings', { method: 'POST', body: JSON.stringify(settings) })
  const uploadSiteLogo = (data: string) =>
    wpFetch<{ ok: boolean; url: string }>('/wp-json/support/v1/site-logo', { method: 'POST', body: JSON.stringify({ data }) })

  // Per-ticket notification subscription
  const getTicketNotifyStatus = (id: number) =>
    wpFetch<{ subscribed: boolean }>(`/wp-json/support/v1/ticket-notify/${id}`)
  const subscribeTicketNotify = (id: number) =>
    wpFetch<{ ok: boolean; subscribed: boolean }>(`/wp-json/support/v1/ticket-notify/${id}`, { method: 'POST' })
  const unsubscribeTicketNotify = (id: number) =>
    wpFetch<{ ok: boolean; subscribed: boolean }>(`/wp-json/support/v1/ticket-notify/${id}`, { method: 'DELETE' })

  return {
    setToken,
    getTickets, getTicket, createTicket, updateTicket, deleteTicket,
    getStatusTerms, getPriorityTerms,
    getProjects, getProject, createProject, updateProject,
    getCustomers, getCustomer, createCustomer,
    getMembers, createMember, updateMember,
    getUsers,
    getHistory, saveHistory,
    getComments, addComment,
    getNotifications,
    getVapidKey, subscribePush, unsubscribePush,
    getTicketNotifyStatus, subscribeTicketNotify, unsubscribeTicketNotify,
    getThemeSettings, saveThemeSettings,
    getSiteSettings, saveSiteSettings, uploadSiteLogo,
  }
}
