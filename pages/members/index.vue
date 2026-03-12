<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { getMembers, createMember, getUsers } = useWordPress()
const { isAdmin } = useAuth()

const members = ref<any[]>([])
const users = ref<any[]>([])
const showForm = ref(false)
const form = reactive({ name: '', wp_user: '', position: '', avatar_color: '#5e6ad2' })

onMounted(async () => {
  ;[members.value, users.value] = await Promise.all([
    getMembers() as Promise<any[]>,
    getUsers() as Promise<any[]>,
  ])
})

async function submit() {
  await createMember({
    title: form.name,
    status: 'publish',
    meta_box: { wp_user: form.wp_user, position: form.position, avatar_color: form.avatar_color },
  })
  members.value = await getMembers() as any[]
  showForm.value = false
  Object.assign(form, { name: '', wp_user: '', position: '', avatar_color: '#5e6ad2' })
}

const COLORS = ['#5e6ad2', '#26c281', '#f0a100', '#ff5e5e', '#0091ff', '#a855f7']
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="flex items-center justify-between h-12 px-5 border-b shrink-0" style="border-color: var(--border)">
      <h1 class="text-sm font-semibold" style="color: var(--text-1)">Members</h1>
      <button v-if="isAdmin" @click="showForm = true"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white"
        style="background: var(--accent)">
        <Icon name="lucide:plus" class="w-3.5 h-3.5" /> Add Member
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 content-start">
      <div
        v-for="m in members" :key="m.id"
        class="rounded-xl border p-4 flex items-center gap-3"
        style="background: var(--bg-card); border-color: var(--border)"
      >
        <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
          :style="{ background: m.meta_box?.avatar_color || '#5e6ad2' }">
          {{ (m.title?.rendered ?? m.title ?? '?')[0].toUpperCase() }}
        </div>
        <div class="min-w-0">
          <p class="text-sm font-medium truncate" style="color: var(--text-1)">{{ m.title?.rendered ?? m.title }}</p>
          <p class="text-xs mt-0.5 truncate" style="color: var(--text-3)">{{ m.meta_box?.position || 'Member' }}</p>
        </div>
      </div>
      <div v-if="members.length === 0" class="col-span-3 p-8 text-center text-sm" style="color: var(--text-3)">No members yet. Add your first member.</div>
    </div>

    <!-- Add Member modal (admin only) -->
    <Teleport to="body">
      <div v-if="showForm" class="fixed inset-0 flex items-center justify-center z-50" style="background: rgba(0,0,0,0.5)">
        <div class="w-full max-w-md rounded-xl border p-6 space-y-4" style="background: var(--bg-card); border-color: var(--border)">
          <h2 class="text-sm font-semibold" style="color: var(--text-1)">Add Member</h2>
          <form @submit.prevent="submit" class="space-y-3">
            <input v-model="form.name" placeholder="Display name" required
              class="w-full px-3 py-2 rounded-lg border text-sm"
              style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)" />

            <!-- Link to WP user -->
            <select v-model="form.wp_user" class="w-full px-3 py-2 rounded-lg border text-sm" style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)">
              <option value="">Link to WordPress user (optional)</option>
              <option v-for="u in users" :key="u.id" :value="String(u.id)">{{ u.name }} ({{ u.roles?.[0] }})</option>
            </select>

            <input v-model="form.position" placeholder="Role/Position (e.g. Developer)"
              class="w-full px-3 py-2 rounded-lg border text-sm"
              style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)" />

            <!-- Avatar color -->
            <div>
              <p class="text-xs mb-2" style="color: var(--text-2)">Avatar color</p>
              <div class="flex gap-2">
                <button v-for="c in COLORS" :key="c" type="button" @click="form.avatar_color = c"
                  class="w-6 h-6 rounded-full border-2 transition-all"
                  :style="{ background: c, borderColor: form.avatar_color === c ? 'var(--text-1)' : 'transparent' }" />
              </div>
            </div>

            <div class="flex justify-end gap-2 pt-1">
              <button type="button" @click="showForm = false" class="px-4 py-1.5 rounded-lg border text-xs" style="border-color: var(--border); color: var(--text-2)">Cancel</button>
              <button type="submit" class="px-4 py-1.5 rounded-lg text-xs text-white" style="background: var(--accent)">Add</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
