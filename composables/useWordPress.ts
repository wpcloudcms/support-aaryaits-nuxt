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

  const getIssues = (params = '') => wpFetch(`/wp-json/wp/v2/issue?per_page=100&${params}`)
  const getIssue = (id: number) => wpFetch(`/wp-json/wp/v2/issue/${id}`)
  const createIssue = (data: Record<string, unknown>) => wpFetch('/wp-json/wp/v2/issue', { method: 'POST', body: JSON.stringify(data) })
  const updateIssue = (id: number, data: Record<string, unknown>) => wpFetch(`/wp-json/wp/v2/issue/${id}`, { method: 'POST', body: JSON.stringify(data) })
  const deleteIssue = (id: number) => wpFetch(`/wp-json/wp/v2/issue/${id}`, { method: 'DELETE' })
  const getProjects = () => wpFetch('/wp-json/wp/v2/project?per_page=100')
  const createProject = (data: Record<string, unknown>) => wpFetch('/wp-json/wp/v2/project', { method: 'POST', body: JSON.stringify(data) })
  const getMembers = () => wpFetch('/wp-json/wp/v2/users?per_page=100')

  return { setToken, getIssues, getIssue, createIssue, updateIssue, deleteIssue, getProjects, createProject, getMembers }
}
