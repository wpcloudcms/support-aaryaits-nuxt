<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { getProjects, createProject } = useWordPress()
const { isAdmin, currentUser } = useAuth()
const canCreate = computed(() => isAdmin.value || currentUser.value?.roles?.includes('editor'))
const projects = ref<any[]>([])
const showForm = ref(false)
const form = reactive({ name: '', description: '', color: '#5e6ad2' })

onMounted(async () => {
  projects.value = await getProjects() as any[]
})

async function submit() {
  await createProject({
    title: form.name,
    status: 'publish',
    meta: { description: form.description, color: form.color },
  })
  projects.value = await getProjects() as any[]
  showForm.value = false
  Object.assign(form, { name: '', description: '', color: '#5e6ad2' })
}

const COLORS = ['#5e6ad2','#26c281','#f0a100','#ff5e5e','#0091ff','#a855f7']
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="flex items-center justify-between h-12 px-5 border-b shrink-0" style="border-color: var(--border)">
      <h1 class="text-sm font-semibold" style="color: var(--text-1)">Projects</h1>
      <button v-if="canCreate" @click="showForm = true" class="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white" style="background: var(--accent)">
        <Icon name="lucide:plus" class="w-3.5 h-3.5" /> New Project
      </button>
    </div>

    <div class="flex-1 overflow-y-auto p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 content-start">
      <div
        v-for="p in projects"
        :key="p.id"
        class="rounded-xl border p-4"
        style="background: var(--bg-card); border-color: var(--border)"
      >
        <div class="flex items-center gap-2 mb-2">
          <span class="w-3 h-3 rounded-full shrink-0" :style="{ background: p.meta?.color ?? '#5e6ad2' }" />
          <span class="font-medium text-sm truncate" style="color: var(--text-1)">{{ p.title?.rendered ?? p.title }}</span>
        </div>
        <p class="text-xs" style="color: var(--text-2)">{{ p.meta?.description || 'No description' }}</p>
      </div>
    </div>

    <!-- New Project modal -->
    <Teleport to="body">
      <div v-if="showForm" class="fixed inset-0 flex items-center justify-center z-50" style="background: rgba(0,0,0,0.5)">
        <div class="w-full max-w-md rounded-xl border p-6 space-y-4" style="background: var(--bg-card); border-color: var(--border)">
          <h2 class="text-sm font-semibold" style="color: var(--text-1)">New Project</h2>
          <form @submit.prevent="submit" class="space-y-3">
            <input v-model="form.name" placeholder="Project name" required class="w-full px-3 py-2 rounded-lg border text-sm" style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)" />
            <textarea v-model="form.description" placeholder="Description (optional)" rows="2" class="w-full px-3 py-2 rounded-lg border text-sm resize-none" style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)" />
            <div class="flex gap-2">
              <button
                v-for="c in COLORS" :key="c" type="button"
                @click="form.color = c"
                class="w-6 h-6 rounded-full border-2 transition-all"
                :style="{ background: c, borderColor: form.color === c ? 'var(--text-1)' : 'transparent' }"
              />
            </div>
            <div class="flex justify-end gap-2 pt-1">
              <button type="button" @click="showForm = false" class="px-4 py-1.5 rounded-lg border text-xs" style="border-color: var(--border); color: var(--text-2)">Cancel</button>
              <button type="submit" class="px-4 py-1.5 rounded-lg text-xs text-white" style="background: var(--accent)">Create</button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
