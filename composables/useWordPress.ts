// WordPress REST API composable (replaces useDirectus.ts)

const WP_BASE = () => useRuntimeConfig().public.wpUrl

let token = ''

export function useWordPress() {
  function authHeaders() {
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  function setToken(t: string) {
    token = t
  }

  async function wpFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
    const res = await fetch(`${WP_BASE()}${path}`, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(),
        ...(opts.headers ?? {}),
      },
    })
    if (!res.ok) throw new Error(`WP API error: ${res.status}`)
    return res.json() as Promise<T>
  }

  // Issues (CPT: issue)
  function getIssues(params = '') {
    return wpFetch(`/wp-json/wp/v2/issue?per_page=100&${params}`)
  }
  function getIssue(id: number) {
    return wpFetch(`/wp-json/wp/v2/issue/${id}`)
  }
  function createIssue(data: Record<string, unknown>) {
    return wpFetch('/wp-json/wp/v2/issue', { method: 'POST', body: JSON.stringify(data) })
  }
  function updateIssue(id: number, data: Record<string, unknown>) {
    return wpFetch(`/wp-json/wp/v2/issue/${id}`, { method: 'POST', body: JSON.stringify(data) })
  }
  function deleteIssue(id: number) {
    return wpFetch(`/wp-json/wp/v2/issue/${id}`, { method: 'DELETE' })
  }

  // Projects (CPT: project)
  function getProjects() {
    return wpFetch('/wp-json/wp/v2/project?per_page=100')
  }
  function createProject(data: Record<string, unknown>) {
    return wpFetch('/wp-json/wp/v2/project', { method: 'POST', body: JSON.stringify(data) })
  }

  // Members (WP Users or CPT: member)
  function getMembers() {
    return wpFetch('/wp-json/wp/v2/users?per_page=100')
  }

  return {
    setToken,
    getIssues,
    getIssue,
    createIssue,
    updateIssue,
    deleteIssue,
    getProjects,
    createProject,
    getMembers,
  }
}
