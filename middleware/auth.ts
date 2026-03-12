export default defineNuxtRouteMiddleware((to) => {
  if (to.path === '/login') return

  const { isAuthenticated, restoreSession } = useAuth()
  restoreSession()

  if (!isAuthenticated.value) {
    return navigateTo('/login')
  }
})
