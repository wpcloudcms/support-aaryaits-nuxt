// WordPress JWT auth (requires JWT Authentication for WP REST API plugin)
import { useWordPress } from './useWordPress'

const isAuthenticated = ref(false)
const currentUser = ref<{ id: number; name: string; email: string; roles: string[] } | null>(null)

const isAdmin = computed(() => currentUser.value?.roles?.includes('administrator') ?? false)

export function useAuth() {
  const { setToken } = useWordPress()
  const config = useRuntimeConfig()

  async function fetchMe(token: string) {
    const res = await fetch(`${config.public.wpUrl}/wp-json/wp/v2/users/me?context=edit`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) {
      const me = await res.json()
      currentUser.value = {
        id: me.id,
        name: me.name,
        email: me.email ?? '',
        roles: me.roles ?? [],
      }
    }
  }

  async function login(username: string, password: string) {
    const res = await fetch(`${config.public.wpUrl}/wp-json/jwt-auth/v1/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) throw new Error('Invalid credentials')
    const data = await res.json()
    setToken(data.token)
    if (import.meta.client) localStorage.setItem('wp_token', data.token)
    isAuthenticated.value = true
    await fetchMe(data.token)
  }

  function logout() {
    setToken('')
    if (import.meta.client) localStorage.removeItem('wp_token')
    isAuthenticated.value = false
    currentUser.value = null
    return navigateTo('/login')
  }

  async function restoreSession() {
    if (!import.meta.client) return
    const saved = localStorage.getItem('wp_token')
    if (saved) {
      setToken(saved)
      isAuthenticated.value = true
      await fetchMe(saved).catch(() => {})
    }
  }

  return { isAuthenticated, currentUser, isAdmin, login, logout, restoreSession }
}
