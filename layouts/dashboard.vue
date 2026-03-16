<script setup lang="ts">
const { currentUser, isAdmin, logout } = useAuth()
const { logoUrl, siteName, sidebarWidth, loadSiteSettings } = useSiteSettings()
const route = useRoute()
const collapsed = ref(false)
const dark = ref(false)
const showUserMenu = ref(false)

function toggleDark() {
  dark.value = !dark.value
  document.documentElement.classList.toggle('dark', dark.value)
}

const navItems = [
  { label: 'My Tickets',  icon: 'lucide:user',             to: '/' },
  { label: 'All Tickets', icon: 'lucide:ticket',           to: '/issues' },
  { label: 'Board',       icon: 'lucide:layout-dashboard', to: '/board' },
  { label: 'Projects',    icon: 'lucide:folder',           to: '/projects' },
  { label: 'Customers',   icon: 'lucide:building-2',       to: '/customers' },
  { label: 'Members',     icon: 'lucide:users',            to: '/members' },
]

// ── Notifications ─────────────────────────────────────────────
const { notifications, unreadCount, markAllRead, startPolling, stopPolling } = useNotifications()
const showNotifPanel = ref(false)

onMounted(() => { startPolling(); loadSiteSettings() })
onUnmounted(() => stopPolling())

function openNotifPanel() {
  showNotifPanel.value = true
  markAllRead()
}

// ── Push Notifications ────────────────────────────────────────
const { isSupported: pushSupported, isSubscribed, permission, init: initPush, subscribe: subscribePushNotif } = usePushNotifications()

onMounted(() => initPush())

async function handleBellClick() {
  if (!isSubscribed.value && pushSupported && permission.value !== 'denied') {
    await subscribePushNotif()
  }
  openNotifPanel()
}

function userInitial(name: string) {
  return (name || '?')[0].toUpperCase()
}
</script>

<template>
  <div class="flex h-screen overflow-hidden" style="background: var(--bg-app)">
    <!-- Sidebar -->
    <aside
      class="flex flex-col border-r transition-all duration-200 shrink-0"
      :style="collapsed
        ? 'width:48px; background: var(--bg-sidebar); border-color: var(--border)'
        : `width:${sidebarWidth}px; background: var(--bg-sidebar); border-color: var(--border)`"
    >
      <!-- Logo row -->
      <div class="flex items-center h-12 px-3 border-b shrink-0 gap-2" style="border-color: var(--border)">
        <template v-if="!collapsed">
          <img v-if="logoUrl" :src="logoUrl" alt="logo"
            class="object-contain shrink-0"
            style="max-width: 100px; max-height: 32px" />
          <span class="font-bold text-sm flex-1 truncate" style="color: var(--text-1)">{{ siteName }}</span>
        </template>
        <button @click="collapsed = !collapsed" class="p-1 rounded hover:bg-[var(--bg-hover)] shrink-0 ml-auto" style="color: var(--text-3)">
          <Icon :name="collapsed ? 'lucide:chevron-right' : 'lucide:chevron-left'" class="w-4 h-4" />
        </button>
      </div>

      <!-- Nav -->
      <nav class="flex-1 py-2 space-y-0.5 px-1 overflow-y-auto">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2.5 px-2 py-1.5 rounded text-xs font-medium transition-colors"
          :class="route.path === item.to
            ? 'text-[var(--accent)]'
            : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--bg-hover)]'"
          :style="route.path === item.to ? 'background: var(--bg-active)' : ''"
        >
          <Icon :name="item.icon" class="w-4 h-4 shrink-0" />
          <span v-if="!collapsed" class="truncate">{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <!-- Footer: Settings at bottom — Admins only -->
      <div v-if="isAdmin" class="px-1 pb-2 border-t pt-2 shrink-0" style="border-color: var(--border)">
        <NuxtLink
          to="/settings"
          class="flex items-center gap-2.5 px-2 py-1.5 rounded text-xs font-medium transition-colors"
          :class="route.path === '/settings'
            ? 'text-[var(--accent)]'
            : 'text-[var(--text-2)] hover:text-[var(--text-1)] hover:bg-[var(--bg-hover)]'"
          :style="route.path === '/settings' ? 'background: var(--bg-active)' : ''"
        >
          <Icon name="lucide:settings" class="w-4 h-4 shrink-0" />
          <span v-if="!collapsed">Settings</span>
        </NuxtLink>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden">

      <!-- Top bar -->
      <div class="flex items-center justify-end gap-2 h-10 px-4 border-b shrink-0"
        style="background: var(--bg-sidebar); border-color: var(--border)">

        <!-- Dark mode toggle -->
        <button @click="toggleDark"
          class="p-1.5 rounded hover:bg-[var(--bg-hover)]"
          :title="dark ? 'Switch to light mode' : 'Switch to dark mode'"
          style="color: var(--text-2)">
          <Icon :name="dark ? 'lucide:sun' : 'lucide:moon'" class="w-4 h-4" />
        </button>

        <!-- Notification bell -->
        <div class="relative">
          <button @click="handleBellClick"
            class="relative p-1.5 rounded hover:bg-[var(--bg-hover)]"
            :title="permission === 'denied' ? 'Notifications blocked in browser' : !isSubscribed ? 'Click to enable push notifications' : 'Notifications'"
            style="color: var(--text-2)">
            <Icon :name="permission === 'denied' ? 'lucide:bell-off' : 'lucide:bell'" class="w-4 h-4" />
            <!-- Unread badge -->
            <span v-if="unreadCount > 0"
              class="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white"
              style="background: var(--accent); font-size: 9px; font-weight: 700">
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
            <!-- Not subscribed dot -->
            <span v-else-if="pushSupported && !isSubscribed && permission !== 'denied'"
              class="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
              style="background: var(--accent)" />
          </button>
        </div>

        <!-- User avatar + dropdown -->
        <div class="relative">
          <button
            @click="showUserMenu = !showUserMenu"
            class="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-[var(--bg-hover)]"
          >
            <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style="background: var(--accent)">
              {{ userInitial(currentUser?.name ?? '') }}
            </div>
            <span class="text-xs hidden sm:block" style="color: var(--text-2)">{{ currentUser?.name }}</span>
            <Icon name="lucide:chevron-down" class="w-3 h-3 hidden sm:block" style="color: var(--text-3)" />
          </button>

          <!-- Dropdown -->
          <div v-if="showUserMenu"
            class="absolute right-0 top-full mt-1 w-36 rounded-lg border shadow-lg z-50 overflow-hidden"
            style="background: var(--bg-card); border-color: var(--border)">
            <button @click="logout(); showUserMenu = false"
              class="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-[var(--bg-hover)]"
              style="color: var(--text-2)">
              <Icon name="lucide:log-out" class="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
          <!-- Click outside to close -->
          <div v-if="showUserMenu" class="fixed inset-0 z-40" @click="showUserMenu = false" />
        </div>
      </div>

      <!-- Page content -->
      <div class="flex-1 overflow-hidden flex flex-col">
        <slot />
      </div>
    </div>

    <!-- Notification panel (slide-over from right) -->
    <Teleport to="body">
      <template v-if="showNotifPanel">
        <div class="fixed inset-0 z-40 bg-black/30" @click="showNotifPanel = false" />
        <div class="fixed right-0 top-0 h-full w-full max-w-sm z-50 flex flex-col shadow-2xl"
          style="background: var(--bg-card); border-left: 1px solid var(--border)">

          <!-- Header -->
          <div class="flex items-center justify-between px-4 h-12 border-b shrink-0"
            style="border-color: var(--border)">
            <span class="text-sm font-semibold" style="color: var(--text-1)">Notifications</span>
            <button @click="showNotifPanel = false" class="p-1 rounded hover:bg-[var(--bg-hover)]"
              style="color: var(--text-3)">
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>

          <!-- List -->
          <div class="flex-1 overflow-y-auto">
            <div v-if="notifications.length === 0"
              class="p-8 text-center text-sm" style="color: var(--text-3)">
              No notifications yet.
            </div>
            <div v-for="(n, i) in notifications" :key="i"
              class="px-4 py-3 border-b text-xs"
              style="border-color: var(--border)">
              <!-- Comment notification -->
              <template v-if="n.type === 'comment'">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <div class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style="background: var(--accent)">
                    {{ userInitial(n.user) }}
                  </div>
                  <span class="font-medium" style="color: var(--text-1)">{{ n.user }}</span>
                  <span style="color: var(--text-3)">commented on</span>
                  <span class="font-medium truncate" style="color: var(--accent)">{{ n.ticket_title }}</span>
                  <NuxtLink :to="`/issues?ticket=${n.ticket_id}`" @click="showNotifPanel = false"
                    class="shrink-0 px-1.5 py-0.5 rounded text-xs font-mono font-medium hover:opacity-80"
                    style="background: var(--bg-hover); color: var(--text-2)">#{{ n.ticket_id }}</NuxtLink>
                </div>
                <p class="ml-7 line-clamp-2" style="color: var(--text-2)">{{ n.body }}</p>
              </template>

              <!-- History notification -->
              <template v-else>
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <div class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                    style="background: var(--accent)">
                    {{ userInitial(n.user) }}
                  </div>
                  <span class="font-medium" style="color: var(--text-1)">{{ n.user }}</span>
                  <span style="color: var(--text-3)">updated</span>
                  <span class="font-medium truncate" style="color: var(--accent)">{{ n.ticket_title }}</span>
                  <NuxtLink :to="`/issues?ticket=${n.ticket_id}`" @click="showNotifPanel = false"
                    class="shrink-0 px-1.5 py-0.5 rounded text-xs font-mono font-medium hover:opacity-80"
                    style="background: var(--bg-hover); color: var(--text-2)">#{{ n.ticket_id }}</NuxtLink>
                </div>
                <ul class="ml-7 space-y-0.5">
                  <li v-for="(c, j) in n.changes" :key="j" style="color: var(--text-2)">· {{ c }}</li>
                </ul>
              </template>

              <p class="mt-1 ml-7" style="color: var(--text-3)">{{ n.timestamp }}</p>
            </div>
          </div>
        </div>
      </template>
    </Teleport>
  </div>
</template>
