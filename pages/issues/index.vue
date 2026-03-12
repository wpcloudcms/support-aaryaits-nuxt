<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { getTickets, createTicket, getMembers, getProjects } = useWordPress()

const tickets = ref<any[]>([])
const members = ref<any[]>([])
const projects = ref<any[]>([])
const loading = ref(true)
const showForm = ref(false)
const selectedTicket = ref<any>(null)
const form = reactive({ title: '', status: 'todo', priority: 'medium', assigned_member: '', project: '' })

onMounted(async () => {
  ;[tickets.value, members.value, projects.value] = await Promise.all([
    getTickets() as Promise<any[]>,
    getMembers() as Promise<any[]>,
    getProjects() as Promise<any[]>,
  ])
  loading.value = false
})

async function submit() {
  await createTicket({
    title: form.title,
    status: 'publish',
    meta_box: { assigned_member: form.assigned_member || '', project: form.project || '' },
    meta: { status: form.status, priority: form.priority },
  })
  tickets.value = await getTickets() as any[]
  showForm.value = false
  Object.assign(form, { title: '', status: 'todo', priority: 'medium', assigned_member: '', project: '' })
}

function onTicketUpdated(updated: any) {
  const idx = tickets.value.findIndex(t => t.id === updated.id)
  if (idx !== -1) tickets.value[idx] = updated
  selectedTicket.value = updated
}

function memberInitial(ticket: any) {
  const id = ticket.meta_box?.assigned_member
  if (!id) return null
  const m = members.value.find(m => String(m.id) === String(id))
  return m ? (m.title?.rendered ?? m.title ?? '?')[0].toUpperCase() : null
}

function memberName(ticket: any) {
  const id = ticket.meta_box?.assigned_member
  if (!id) return null
  const m = members.value.find(m => String(m.id) === String(id))
  return m ? (m.title?.rendered ?? m.title) : null
}

const statusClass: Record<string, string> = {
  todo: 'status-todo', 'in-progress': 'status-in-progress',
  'in-review': 'status-in-review', done: 'status-done', cancelled: 'status-cancelled',
}
const priorityColor: Record<string, string> = {
  urgent: '#ff5e5e', high: '#f0a100', medium: '#0091ff', low: '#888',
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="flex items-center justify-between h-12 px-5 border-b shrink-0" style="border-color: var(--border)">
      <h1 class="text-sm font-semibold" style="color: var(--text-1)">All Tickets</h1>
      <button @click="showForm = true" class="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white" style="background: var(--accent)">
        <Icon name="lucide:plus" class="w-3.5 h-3.5" /> New Ticket
      </button>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div v-if="loading" class="p-8 text-center text-sm" style="color: var(--text-3)">Loading…</div>
      <div
        v-for="ticket in tickets" :key="ticket.id"
        @click="selectedTicket = ticket"
        class="flex items-center gap-3 px-5 py-2.5 border-b text-sm hover:bg-[var(--bg-hover)] cursor-pointer"
        style="border-color: var(--border); color: var(--text-1)"
      >
        <span class="status-icon shrink-0" :class="statusClass[ticket.meta?.status ?? 'todo']" />
        <span class="flex-1 truncate">{{ ticket.title?.rendered ?? ticket.title }}</span>

        <!-- Project tag -->
        <span v-if="ticket.meta_box?.project" class="text-xs px-2 py-0.5 rounded shrink-0 truncate max-w-[100px]"
          style="background: var(--bg-active); color: var(--accent)">
          {{ projects.find(p => String(p.id) === String(ticket.meta_box.project))?.title?.rendered ?? '—' }}
        </span>

        <!-- Assigned member avatar -->
        <div v-if="memberInitial(ticket)"
          class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style="background: var(--accent)" :title="memberName(ticket) ?? ''">
          {{ memberInitial(ticket) }}
        </div>
        <div v-else class="w-5 h-5 rounded-full border shrink-0" style="border-color: var(--border)" />

        <span class="text-xs capitalize px-2 py-0.5 rounded shrink-0"
          :style="{ background: 'var(--bg-hover)', color: priorityColor[ticket.meta?.priority] ?? 'var(--text-2)' }">
          {{ ticket.meta?.priority ?? '—' }}
        </span>
      </div>
      <div v-if="!loading && tickets.length === 0" class="p-8 text-center text-sm" style="color: var(--text-3)">No tickets yet.</div>
    </div>

    <!-- Ticket detail slide-over -->
    <Teleport to="body">
      <TicketDetail
        v-if="selectedTicket"
        :ticket="selectedTicket"
        :members="members"
        :projects="projects"
        @close="selectedTicket = null"
        @updated="onTicketUpdated"
      />
    </Teleport>

    <!-- New Ticket modal -->
    <Teleport to="body">
      <div v-if="showForm" class="fixed inset-0 flex items-center justify-center z-50" style="background: rgba(0,0,0,0.5)">
        <div class="w-full max-w-md rounded-xl border p-6 space-y-4" style="background: var(--bg-card); border-color: var(--border)">
          <h2 class="text-sm font-semibold" style="color: var(--text-1)">New Ticket</h2>
          <form @submit.prevent="submit" class="space-y-3">
            <input v-model="form.title" placeholder="Ticket title" required
              class="w-full px-3 py-2 rounded-lg border text-sm"
              style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)" />
            <div class="flex gap-3">
              <select v-model="form.status" class="flex-1 px-3 py-2 rounded-lg border text-sm" style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)">
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="in-review">In Review</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select v-model="form.priority" class="flex-1 px-3 py-2 rounded-lg border text-sm" style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)">
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
            <select v-model="form.assigned_member" class="w-full px-3 py-2 rounded-lg border text-sm" style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)">
              <option value="">Unassigned</option>
              <option v-for="m in members" :key="m.id" :value="String(m.id)">{{ m.title?.rendered ?? m.title }}</option>
            </select>
            <select v-model="form.project" class="w-full px-3 py-2 rounded-lg border text-sm" style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)">
              <option value="">No project</option>
              <option v-for="p in projects" :key="p.id" :value="String(p.id)">{{ p.title?.rendered ?? p.title }}</option>
            </select>
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
