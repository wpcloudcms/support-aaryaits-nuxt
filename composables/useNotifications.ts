export type AppNotification = {
  type: 'comment' | 'history'
  ticket_id: number
  ticket_title: string
  user: string
  timestamp: string
  iso: string
  body?: string
  changes?: string[]
}

const notifications = ref<AppNotification[]>([])
const unreadCount = ref(0)
let pollTimer: ReturnType<typeof setInterval> | null = null

export function useNotifications() {
  const { getNotifications } = useWordPress()

  async function fetchNotifications() {
    try {
      const data = await getNotifications()
      notifications.value = data

      const lastRead = import.meta.client
        ? (localStorage.getItem('notif_last_read') ?? '')
        : ''

      unreadCount.value = lastRead
        ? data.filter(n => n.iso > lastRead).length
        : data.length
    } catch {
      // silent — user may not have assigned tickets yet
    }
  }

  function markAllRead() {
    if (!import.meta.client) return
    localStorage.setItem('notif_last_read', new Date().toISOString())
    unreadCount.value = 0
  }

  function startPolling() {
    if (pollTimer) return
    fetchNotifications()
    pollTimer = setInterval(fetchNotifications, 20000)
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  return { notifications, unreadCount, fetchNotifications, markAllRead, startPolling, stopPolling }
}
