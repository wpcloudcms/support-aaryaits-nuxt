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

  // Projects (CPT: project)
  const getProjects = (params = '') => wpFetch(`/wp-json/wp/v2/project?per_page=100&${params}`)
  const getProject = (id: number) => wpFetch(`/wp-json/wp/v2/project/${id}`)
  const createProject = (data: Record<string, unknown>) => wpFetch('/wp-json/wp/v2/project', { method: 'POST', body: JSON.stringify(data) })
  const updateProject = (id: number, data: Record<string, unknown>) => wpFetch(`/wp-json/wp/v2/project/${id}`, { method: 'POST', body: JSON.stringify(data) })

  // Customers (CPT: customer)
  const getCustomers = (params = '') => wpFetch(`/wp-json/wp/v2/customer?per_page=100&${params}`)
  const getCustomer = (id: number) => wpFetch(`/wp-json/wp/v2/customer/${id}`)
  const createCustomer = (data: Record<string, unknown>) => wpFetch('/wp-json/wp/v2/customer', { method: 'POST', body: JSON.stringify(data) })

  // WP Users (members/team)
  const getUsers = () => wpFetch('/wp-json/wp/v2/users?per_page=100')

  return {
    setToken,
    getTickets, getTicket, createTicket, updateTicket, deleteTicket,
    getProjects, getProject, createProject, updateProject,
    getCustomers, getCustomer, createCustomer,
    getUsers,
  }
}
