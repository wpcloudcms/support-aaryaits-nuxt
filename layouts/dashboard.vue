<script setup lang="ts">
const { currentUser, logout } = useAuth()
const route = useRoute()
const collapsed = ref(false)
const dark = ref(false)

function toggleDark() {
  dark.value = !dark.value
  document.documentElement.classList.toggle('dark', dark.value)
}

const navItems = [
  { label: 'My Tickets',  icon: 'lucide:user',             to: '/' },
  { label: 'All Tickets', icon: 'lucide:ticket',           to: '/issues' },
  { label: 'Board',       icon: 'lucide:layout-dashboard', to: '/board' },
  { label: 'Projects',    icon: 'lucide:folder',           to: '/projects' },
  { label: 'Customers',   icon: 'lucide:users',            to: '/customers' },
  { label: 'Settings',    icon: 'lucide:settings',         to: '/settings' },
]
</script>

<template>
  <div class="flex h-screen overflow-hidden" style="background: var(--bg-app)">
    <!-- Sidebar -->
    <aside
      class="flex flex-col border-r transition-all duration-200 shrink-0"
      :class="collapsed ? 'w-12' : 'w-52'"
      style="background: var(--bg-sidebar); border-color: var(--border)"
    >
      <!-- Logo row -->
      <div class="flex items-center h-12 px-3 border-b shrink-0" style="border-color: var(--border)">
        <span v-if="!collapsed" class="font-bold text-sm flex-1" style="color: var(--text-1)">Support Aaryaits</span>
        <button @click="collapsed = !collapsed" class="p-1 rounded hover:bg-[var(--bg-hover)]" style="color: var(--text-3)">
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

      <!-- Footer -->
      <div class="px-1 pb-2 space-y-0.5 border-t pt-2 shrink-0" style="border-color: var(--border)">
        <button @click="toggleDark" class="flex items-center gap-2.5 w-full px-2 py-1.5 rounded text-xs hover:bg-[var(--bg-hover)]" style="color: var(--text-2)">
          <Icon :name="dark ? 'lucide:sun' : 'lucide:moon'" class="w-4 h-4 shrink-0" />
          <span v-if="!collapsed">{{ dark ? 'Light mode' : 'Dark mode' }}</span>
        </button>
        <button @click="logout" class="flex items-center gap-2.5 w-full px-2 py-1.5 rounded text-xs hover:bg-[var(--bg-hover)]" style="color: var(--text-2)">
          <Icon name="lucide:log-out" class="w-4 h-4 shrink-0" />
          <span v-if="!collapsed">Sign out</span>
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <slot />
    </div>
  </div>
</template>
