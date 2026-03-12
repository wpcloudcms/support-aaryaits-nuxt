<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { currentUser, logout } = useAuth()
const { getMembers } = useWordPress()
const members = ref<any[]>([])

onMounted(async () => {
  members.value = await getMembers() as any[]
})
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="flex items-center h-12 px-5 border-b shrink-0" style="border-color: var(--border)">
      <h1 class="text-sm font-semibold" style="color: var(--text-1)">Settings</h1>
    </div>
    <div class="flex-1 overflow-y-auto p-5 max-w-lg space-y-6">

      <!-- Profile -->
      <section>
        <h2 class="text-xs font-semibold uppercase tracking-wide mb-3" style="color: var(--text-3)">Profile</h2>
        <div class="rounded-xl border p-4" style="background: var(--bg-card); border-color: var(--border)">
          <p class="text-sm font-medium" style="color: var(--text-1)">{{ currentUser?.name ?? '—' }}</p>
          <p class="text-xs mt-0.5" style="color: var(--text-2)">{{ currentUser?.email ?? '—' }}</p>
        </div>
      </section>

      <!-- Members -->
      <section>
        <h2 class="text-xs font-semibold uppercase tracking-wide mb-3" style="color: var(--text-3)">Members</h2>
        <div class="rounded-xl border divide-y" style="background: var(--bg-card); border-color: var(--border)">
          <div
            v-for="m in members"
            :key="m.id"
            class="flex items-center gap-3 px-4 py-2.5"
          >
            <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style="background: var(--accent)">
              {{ (m.name ?? '?')[0].toUpperCase() }}
            </div>
            <div>
              <p class="text-xs font-medium" style="color: var(--text-1)">{{ m.name }}</p>
              <p class="text-xs" style="color: var(--text-3)">{{ m.roles?.[0] ?? 'member' }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Danger -->
      <section>
        <h2 class="text-xs font-semibold uppercase tracking-wide mb-3" style="color: var(--text-3)">Account</h2>
        <button @click="logout" class="px-4 py-2 rounded-lg border text-xs" style="border-color: var(--border); color: var(--text-2)">
          Sign out
        </button>
      </section>
    </div>
  </div>
</template>
