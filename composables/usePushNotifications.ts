function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(b64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

const isSubscribed = ref(false)
const permission = ref<NotificationPermission>('default')

export function usePushNotifications() {
  const { getVapidKey, subscribePush, unsubscribePush } = useWordPress()

  const isSupported = import.meta.client
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && 'Notification' in window

  async function init() {
    if (!isSupported) return
    permission.value = Notification.permission
    if (permission.value === 'granted') {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      isSubscribed.value = !!sub
    }
  }

  async function subscribe() {
    if (!isSupported) return
    const perm = await Notification.requestPermission()
    permission.value = perm
    if (perm !== 'granted') return

    const vapidKey = await getVapidKey()
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    })
    const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
    await subscribePush(json)
    isSubscribed.value = true
  }

  async function unsubscribe() {
    if (!isSupported) return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await unsubscribePush(sub.endpoint).catch(() => {})
      await sub.unsubscribe()
    }
    isSubscribed.value = false
  }

  return { isSupported, isSubscribed, permission, init, subscribe, unsubscribe }
}
