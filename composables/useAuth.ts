// WordPress JWT auth (requires JWT Authentication for WP REST API plugin)
import { useWordPress } from './useWordPress'

const isAuthenticated = ref(false)
const currentUser = ref<{ id: number; name: string; email: string } | null>(null)

export function useAuth() {
  const { setToken } = useWordPress()
  const config = useRuntimeConfig()

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
    currentUser.value = { id: data.user_id, name: data.user_display_name, email: data.user_email }
    isAuthenticated.value = true
  }

  function logout() {
    setToken('')
    if (import.meta.client) localStorage.removeItem('wp_token')
    isAuthenticated.value = false
    currentUser.value = null
    return navigateTo('/login')
  }

  function restoreSession() {
    if (!import.meta.client) return
    const saved = localStorage.getItem('wp_token')
    if (saved) {
      setToken(saved)
      isAuthenticated.value = true
    }
  }

  return { isAuthenticated, currentUser, login, logout, restoreSession }
}
