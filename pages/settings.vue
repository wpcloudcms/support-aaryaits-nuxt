<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { currentUser, isAdmin, logout } = useAuth()
const { getUsers } = useWordPress()
const members = ref<any[]>([])

onMounted(async () => {
  members.value = await getUsers() as any[]
})

const roleColor: Record<string, string> = {
  administrator: '#5e6ad2',
  editor: '#26c281',
  author: '#f0a100',
  contributor: '#888',
  subscriber: '#888',
}

const wpAdminUrl = useRuntimeConfig().public.wpUrl
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="flex items-center h-12 px-5 border-b shrink-0" style="border-color: var(--border)">
      <h1 class="text-sm font-semibold" style="color: var(--text-1)">Settings</h1>
    </div>
    <div class="flex-1 overflow-y-auto p-5 max-w-lg space-y-6">

      <!-- Profile -->
      <section>
        <h2 class="text-xs font-semibold uppercase tracking-wide mb-3" style="color: var(--text-3)">My Profile</h2>
        <div class="rounded-xl border p-4 flex items-center gap-3" style="background: var(--bg-card); border-color: var(--border)">
          <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style="background: var(--accent)">
            {{ (currentUser?.name ?? '?')[0].toUpperCase() }}
          </div>
          <div>
            <p class="text-sm font-medium" style="color: var(--text-1)">{{ currentUser?.name ?? '—' }}</p>
            <p class="text-xs mt-0.5" style="color: var(--text-2)">{{ currentUser?.email ?? '—' }}</p>
            <p class="text-xs mt-0.5 capitalize" :style="{ color: roleColor[currentUser?.roles?.[0] ?? ''] ?? 'var(--text-3)' }">
              {{ currentUser?.roles?.[0] ?? '—' }}
            </p>
          </div>
        </div>
      </section>

      <!-- Members -->
      <section>
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-xs font-semibold uppercase tracking-wide" style="color: var(--text-3)">Members</h2>
          <a
            v-if="isAdmin"
            :href="`${wpAdminUrl}/wp-admin/user-new.php`"
            target="_blank"
            class="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg text-white"
            style="background: var(--accent)"
          >
            <Icon name="lucide:plus" class="w-3 h-3" /> Add Member
          </a>
        </div>
        <div class="rounded-xl border divide-y overflow-hidden" style="background: var(--bg-card); border-color: var(--border)">
          <div v-for="m in members" :key="m.id" class="flex items-center gap-3 px-4 py-2.5">
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              :style="{ background: roleColor[m.roles?.[0]] ?? 'var(--accent)' }">
              {{ (m.name ?? '?')[0].toUpperCase() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium truncate" style="color: var(--text-1)">{{ m.name }}</p>
              <p class="text-xs truncate" style="color: var(--text-3)">{{ m.slug }}</p>
            </div>
            <span class="text-xs capitalize px-2 py-0.5 rounded-full shrink-0"
              :style="{ background: 'var(--bg-hover)', color: roleColor[m.roles?.[0]] ?? 'var(--text-2)' }">
              {{ m.roles?.[0] ?? 'member' }}
            </span>
            <a v-if="isAdmin" :href="`${wpAdminUrl}/wp-admin/user-edit.php?user_id=${m.id}`" target="_blank"
              class="shrink-0 p-1 rounded hover:bg-[var(--bg-hover)]" style="color: var(--text-3)">
              <Icon name="lucide:pencil" class="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
        <p v-if="!isAdmin" class="text-xs mt-2" style="color: var(--text-3)">
          Only administrators can add or edit members.
        </p>
      </section>

      <!-- Sign out -->
      <section>
        <h2 class="text-xs font-semibold uppercase tracking-wide mb-3" style="color: var(--text-3)">Account</h2>
        <button @click="logout" class="px-4 py-2 rounded-lg border text-xs" style="border-color: var(--border); color: var(--text-2)">
          Sign out
        </button>
      </section>

    </div>
  </div>
</template>
