<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { getProjects, updateProject, createProject, getTickets, getStatusTerms, getPriorityTerms, uploadImage } = useWordPress()
const { isAdmin, currentUser } = useAuth()
const canCreate = computed(() => isAdmin.value || currentUser.value?.roles?.includes('editor'))

const projects = ref<any[]>([])
const allTickets = ref<any[]>([])
const statusTerms = ref<{ id: number; name: string; slug: string }[]>([])
const priorityTerms = ref<{ id: number; name: string; slug: string }[]>([])
const showForm = ref(false)
const selectedProject = ref<any>(null)
const form = reactive({ name: '', description: '', logoPreview: '' })

// URL edit form for selected project
const urlForm = reactive({ live_url: '', live_admin_url: '', dev_url: '', dev_admin_url: '' })
const urlSaving = ref(false)
const urlSaved = ref(false)

// Logo upload for selected project
const logoPreview = ref('')
const logoSaving = ref(false)

onMounted(async () => {
  ;[projects.value, allTickets.value, statusTerms.value, priorityTerms.value] = await Promise.all([
    getProjects() as Promise<any[]>,
    getTickets() as Promise<any[]>,
    getStatusTerms() as Promise<any[]>,
    getPriorityTerms() as Promise<any[]>,
  ])
})

function openProject(p: any) {
  selectedProject.value = p
  logoPreview.value = ''
  Object.assign(urlForm, {
    live_url:       p.meta?.live_url       ?? '',
    live_admin_url: p.meta?.live_admin_url ?? '',
    dev_url:        p.meta?.dev_url        ?? '',
    dev_admin_url:  p.meta?.dev_admin_url  ?? '',
  })
}

function closeProject() { selectedProject.value = null }

function onLogoChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { logoPreview.value = reader.result as string }
  reader.readAsDataURL(file)
}

async function saveLogo() {
  if (!selectedProject.value || !logoPreview.value) return
  logoSaving.value = true
  try {
    const res = await uploadImage(logoPreview.value)
    const logo = res.url
    await updateProject(selectedProject.value.id, { meta: { logo } })
    const idx = projects.value.findIndex(p => p.id === selectedProject.value.id)
    if (idx !== -1) projects.value[idx] = { ...projects.value[idx], meta: { ...projects.value[idx].meta, logo } }
    selectedProject.value = { ...selectedProject.value, meta: { ...selectedProject.value.meta, logo } }
    logoPreview.value = ''
  } catch {}
  logoSaving.value = false
}

async function saveUrls() {
  if (!selectedProject.value) return
  urlSaving.value = true
  await updateProject(selectedProject.value.id, { meta: { ...urlForm } }).catch(() => {})
  // Update local cache
  const idx = projects.value.findIndex(p => p.id === selectedProject.value.id)
  if (idx !== -1) projects.value[idx] = { ...projects.value[idx], meta: { ...projects.value[idx].meta, ...urlForm } }
  selectedProject.value = { ...selectedProject.value, meta: { ...selectedProject.value.meta, ...urlForm } }
  urlSaved.value = true
  setTimeout(() => urlSaved.value = false, 2500)
  urlSaving.value = false
}

function onNewLogoChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { form.logoPreview = reader.result as string }
  reader.readAsDataURL(file)
}

const projectTickets = computed(() => {
  if (!selectedProject.value) return []
  return allTickets.value.filter(t => String(t.projectId) === String(selectedProject.value.id))
})

function statusSlug(ticket: any) {
  return ticket.status ?? ''
}
function statusName(ticket: any) {
  return statusTerms.value.find(t => t.slug === ticket.status)?.name ?? '—'
}
function priorityName(ticket: any) {
  return priorityTerms.value.find(t => t.slug === ticket.priority)?.name ?? '—'
}
function formatDate(d: string) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

const statusColor: Record<string, string> = {
  todo: 'var(--text-2)', 'in-progress': '#e07b00', 'in-review': '#2563eb', done: '#2DB35D', cancelled: '#e53935',
}
const priorityColor: Record<string, string> = {
  urgent: '#ff5e5e', high: '#f0a100', medium: '#0091ff', low: 'var(--text-2)',
}
const statusClass: Record<string, string> = {
  todo: 'status-todo', 'in-progress': 'status-in-progress', 'in-review': 'status-in-review',
  done: 'status-done', cancelled: 'status-cancelled',
}

async function submit() {
  let logo = ''
  if (form.logoPreview) {
    const res = await uploadImage(form.logoPreview).catch(() => null)
    if (res) logo = res.url
  }
  await createProject({
    title: form.name,
    status: 'publish',
    meta: { description: form.description, ...(logo ? { logo } : {}) },
  })
  projects.value = await getProjects() as any[]
  showForm.value = false
  Object.assign(form, { name: '', description: '', logoPreview: '' })
}
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
        @click="openProject(p)"
        class="rounded-xl border p-4 cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
        style="background: var(--bg-card); border-color: var(--border)"
      >
        <div class="flex items-center gap-2.5 mb-2">
          <div class="w-8 h-8 rounded-lg border shrink-0 flex items-center justify-center overflow-hidden"
            style="border-color: var(--border); background: var(--bg-app)">
            <img v-if="p.meta?.logo" :src="p.meta.logo" class="w-full h-full object-contain" />
            <Icon v-else name="lucide:folder" class="w-4 h-4" style="color: var(--text-3)" />
          </div>
          <span class="font-medium text-sm truncate" style="color: var(--text-1)">{{ p.title }}</span>
        </div>
        <p class="text-xs" style="color: var(--text-2)">{{ p.meta?.description || 'No description' }}</p>
      </div>
    </div>

    <!-- Project Detail slide-over -->
    <Teleport to="body">
      <template v-if="selectedProject">
        <div class="fixed inset-0 z-40 bg-black/30" @click="closeProject" />
        <div class="fixed right-0 top-0 h-full w-full max-w-2xl z-50 flex flex-col shadow-2xl overflow-hidden"
          style="background: var(--bg-card); border-left: 1px solid var(--border)">

          <!-- Header -->
          <div class="flex items-center justify-between px-5 h-12 border-b shrink-0" style="border-color: var(--border)">
            <div class="flex items-center gap-2.5">
              <div class="w-7 h-7 rounded-lg border shrink-0 flex items-center justify-center overflow-hidden"
                style="border-color: var(--border); background: var(--bg-app)">
                <img v-if="logoPreview || selectedProject.meta?.logo" :src="logoPreview || selectedProject.meta.logo" class="w-full h-full object-contain" />
                <Icon v-else name="lucide:folder" class="w-4 h-4" style="color: var(--text-3)" />
              </div>
              <span class="text-sm font-semibold truncate" style="color: var(--text-1)">{{ selectedProject.title }}</span>
            </div>
            <button @click="closeProject" class="p-1 rounded hover:bg-[var(--bg-hover)]" style="color: var(--text-3)">
              <Icon name="lucide:x" class="w-4 h-4" />
            </button>
          </div>

          <div class="flex-1 overflow-y-auto">

            <!-- Logo section -->
            <div v-if="canCreate" class="px-5 py-4 border-b flex items-center gap-4" style="border-color: var(--border)">
              <div class="w-14 h-14 rounded-xl border shrink-0 flex items-center justify-center overflow-hidden"
                style="border-color: var(--border); background: var(--bg-app)">
                <img v-if="logoPreview || selectedProject.meta?.logo" :src="logoPreview || selectedProject.meta.logo" class="w-full h-full object-contain" />
                <Icon v-else name="lucide:image" class="w-6 h-6" style="color: var(--text-3)" />
              </div>
              <div class="flex flex-col gap-2">
                <label class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border cursor-pointer hover:bg-[var(--bg-hover)]"
                  style="border-color: var(--border); color: var(--text-2)">
                  <Icon name="lucide:upload" class="w-3.5 h-3.5" /> Choose Logo
                  <input type="file" accept="image/*" class="sr-only" @change="onLogoChange" />
                </label>
                <button v-if="logoPreview" @click="saveLogo" :disabled="logoSaving"
                  class="text-xs px-3 py-1.5 rounded-lg text-white disabled:opacity-60"
                  style="background: var(--accent)">
                  {{ logoSaving ? 'Saving…' : 'Save Logo' }}
                </button>
              </div>
            </div>

            <!-- URLs section -->
            <div class="px-5 py-4 border-b" style="border-color: var(--border)">
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-semibold uppercase tracking-wide" style="color: var(--text-3)">Site URLs</span>
                <button v-if="canCreate" @click="saveUrls" :disabled="urlSaving"
                  class="text-xs px-3 py-1 rounded-lg text-white disabled:opacity-60"
                  :style="urlSaved ? 'background: var(--success)' : 'background: var(--accent)'">
                  {{ urlSaving ? 'Saving…' : urlSaved ? 'Saved!' : 'Save' }}
                </button>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div v-for="field in [
                  { key: 'live_url',       label: 'Live Site URL' },
                  { key: 'live_admin_url', label: 'Live Admin URL' },
                  { key: 'dev_url',        label: 'Dev URL' },
                  { key: 'dev_admin_url',  label: 'Dev Admin URL' },
                ]" :key="field.key">
                  <label class="text-xs font-medium block mb-1" style="color: var(--text-2)">{{ field.label }}</label>
                  <div v-if="canCreate" class="flex items-center gap-1.5">
                    <input v-model="(urlForm as any)[field.key]" type="url" :placeholder="`https://`"
                      class="flex-1 px-2.5 py-1.5 rounded-lg border text-xs outline-none focus:border-[var(--accent)]"
                      style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)" />
                    <a v-if="(urlForm as any)[field.key]" :href="(urlForm as any)[field.key]" target="_blank"
                      class="p-1.5 rounded hover:bg-[var(--bg-hover)]" style="color: var(--accent)">
                      <Icon name="lucide:external-link" class="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <div v-else>
                    <a v-if="selectedProject.meta?.[field.key]"
                      :href="selectedProject.meta[field.key]" target="_blank"
                      class="text-xs hover:underline truncate block" style="color: var(--accent)">
                      {{ selectedProject.meta[field.key] }}
                    </a>
                    <span v-else class="text-xs" style="color: var(--text-3)">—</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Related tickets -->
            <div class="px-5 py-4">
              <span class="text-xs font-semibold uppercase tracking-wide" style="color: var(--text-3)">
                Related Tickets ({{ projectTickets.length }})
              </span>

              <div v-if="projectTickets.length === 0" class="mt-4 text-xs text-center py-6" style="color: var(--text-3)">
                No tickets linked to this project.
              </div>

              <template v-else>
                <!-- Column headers -->
                <div class="grid mt-3 px-2 py-1.5 text-xs font-medium rounded"
                  style="grid-template-columns: 16px 1fr 90px 70px 100px 100px; gap: 10px; color: var(--text-3); background: var(--bg-hover)">
                  <span />
                  <span>Title</span>
                  <span>Status</span>
                  <span>Priority</span>
                  <span>Date Started</span>
                  <span>Completed</span>
                </div>

                <div v-for="ticket in projectTickets" :key="ticket.id"
                  class="grid items-center px-2 py-2 border-b text-xs"
                  style="grid-template-columns: 16px 1fr 90px 70px 100px 100px; gap: 10px; border-color: var(--border)">
                  <!-- Status icon -->
                  <span class="status-icon shrink-0" :class="statusClass[statusSlug(ticket)]" />
                  <!-- Title + ID -->
                  <span class="truncate flex items-center gap-1">
                    <span class="shrink-0 font-mono" style="color: var(--text-3)">#{{ ticket.id }}</span>
                    <span style="color: var(--text-1)">{{ ticket.title }}</span>
                  </span>
                  <!-- Status -->
                  <span class="font-medium truncate" :style="{ color: statusColor[statusSlug(ticket)] ?? 'var(--text-3)' }">
                    {{ statusName(ticket) }}
                  </span>
                  <!-- Priority -->
                  <span class="font-medium truncate" :style="{ color: priorityColor[ticket.priority ?? ''] ?? 'var(--text-3)' }">
                    {{ priorityName(ticket) }}
                  </span>
                  <!-- Date Started -->
                  <span style="color: var(--text-2)">
                    {{ ticket.dateStarted ? formatDate(ticket.dateStarted) : formatDate(ticket.date) }}
                  </span>
                  <!-- Completed -->
                  <span :style="{ color: ticket.dateCompleted ? '#2DB35D' : 'var(--text-3)' }">
                    {{ ticket.dateCompleted ? formatDate(ticket.dateCompleted) : (statusSlug(ticket) === 'done' ? formatDate(ticket.modified) : '—') }}
                  </span>
                </div>
              </template>
            </div>
          </div>
        </div>
      </template>
    </Teleport>

    <!-- New Project modal -->
    <Teleport to="body">
      <div v-if="showForm" class="fixed inset-0 flex items-center justify-center z-50" style="background: rgba(0,0,0,0.5)">
        <div class="w-full max-w-md rounded-xl border p-6 space-y-4" style="background: var(--bg-card); border-color: var(--border)">
          <h2 class="text-sm font-semibold" style="color: var(--text-1)">New Project</h2>
          <form @submit.prevent="submit" class="space-y-3">
            <input v-model="form.name" placeholder="Project name" required class="w-full px-3 py-2 rounded-lg border text-sm" style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)" />
            <textarea v-model="form.description" placeholder="Description (optional)" rows="2" class="w-full px-3 py-2 rounded-lg border text-sm resize-none" style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)" />
            <!-- Logo upload -->
            <div class="flex items-center gap-3">
              <div class="w-12 h-12 rounded-lg border flex items-center justify-center overflow-hidden shrink-0"
                style="border-color: var(--border); background: var(--bg-app)">
                <img v-if="form.logoPreview" :src="form.logoPreview" class="w-full h-full object-contain" />
                <Icon v-else name="lucide:image" class="w-5 h-5" style="color: var(--text-3)" />
              </div>
              <label class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border cursor-pointer hover:bg-[var(--bg-hover)]"
                style="border-color: var(--border); color: var(--text-2)">
                <Icon name="lucide:upload" class="w-3.5 h-3.5" /> Logo
                <input type="file" accept="image/*" class="sr-only" @change="onNewLogoChange" />
              </label>
              <button v-if="form.logoPreview" type="button" @click="form.logoPreview = ''"
                class="text-xs px-2 py-1 rounded border" style="border-color: var(--border); color: var(--text-3)">Remove</button>
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
