<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { getTickets, createTicket, getMembers, getProjects, getStatusTerms, getPriorityTerms } = useWordPress()
const { currentUser } = useAuth()

const allTickets = ref<any[]>([])
const members = ref<any[]>([])
const projects = ref<any[]>([])
const statusTerms = ref<{ id: number; name: string; slug: string }[]>([])
const priorityTerms = ref<{ id: number; name: string; slug: string }[]>([])
const loading = ref(true)
const selectedTicket = ref<any>(null)
const showForm = ref(false)
const sortedStatusTerms = computed(() => [...statusTerms.value].sort((a, b) => ['backlog','todo','in-progress','in-review','done','cancelled'].indexOf(a.slug) - ['backlog','todo','in-progress','in-review','done','cancelled'].indexOf(b.slug)))
const sortedPriorityTerms = computed(() => [...priorityTerms.value].sort((a, b) => ['urgent','high','medium','low'].indexOf(a.slug) - ['urgent','high','medium','low'].indexOf(b.slug)))
const form = reactive({ title: '', description: '', status_id: 0, priority_id: 0, assigned_member: '', project: '' })

const route = useRoute()
const router = useRouter()

// Filter tickets assigned to the current logged-in member
const tickets = computed(() => {
  const myMember = members.value.find(m =>
    (m.title?.rendered ?? m.title ?? '').trim() === (currentUser.value?.name ?? '').trim()
  )
  if (!myMember) return []
  return allTickets.value.filter(t => String(t.meta_box?.assigned_member) === String(myMember.id))
})

onMounted(async () => {
  ;[allTickets.value, members.value, projects.value, statusTerms.value, priorityTerms.value] = await Promise.all([
    getTickets().catch(() => []) as Promise<any[]>,
    getMembers().catch(() => []) as Promise<any[]>,
    getProjects().catch(() => []) as Promise<any[]>,
    getStatusTerms().catch(() => []) as Promise<any[]>,
    getPriorityTerms().catch(() => []) as Promise<any[]>,
  ])
  form.status_id = sortedStatusTerms.value[0]?.id ?? 0
  form.priority_id = sortedPriorityTerms.value[0]?.id ?? 0
  loading.value = false

  // Deep-link: auto-open ticket if ?ticket=ID is in URL
  const ticketId = route.query.ticket ? Number(route.query.ticket) : null
  if (ticketId) {
    const found = tickets.value.find((t: any) => t.id === ticketId)
    if (found) selectedTicket.value = found
  }
})

function statusSlug(ticket: any) {
  const id = ticket['ticket-status']?.[0]
  return statusTerms.value.find(t => t.id === id)?.slug ?? ''
}
function prioritySlug(ticket: any) {
  const id = ticket['ticket-priority']?.[0]
  return priorityTerms.value.find(t => t.id === id)?.slug ?? ''
}

async function submit() {
  await createTicket({
    title: form.title,
    content: form.description,
    status: 'publish',
    meta_box: { assigned_member: form.assigned_member || '', project: form.project || '' },
    ...(form.status_id ? { 'ticket-status': [form.status_id] } : {}),
    ...(form.priority_id ? { 'ticket-priority': [form.priority_id] } : {}),
  })
  allTickets.value = await getTickets() as any[]
  showForm.value = false
  Object.assign(form, { title: '', description: '', status_id: sortedStatusTerms.value[0]?.id ?? 0, priority_id: sortedPriorityTerms.value[0]?.id ?? 0, assigned_member: '', project: '' })
}

function onTicketUpdated(updated: any) {
  const idx = allTickets.value.findIndex(t => t.id === updated.id)
  if (idx !== -1) allTickets.value[idx] = updated
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
const statusColor: Record<string, { bg: string; text: string }> = {
  todo:          { bg: '#f0f0f0', text: 'var(--text-2)' },
  'in-progress': { bg: '#fff3e0', text: '#e07b00' },
  'in-review':   { bg: '#e8f0ff', text: '#2563eb' },
  done:          { bg: '#e6f9ee', text: '#2DB35D' },
  cancelled:     { bg: '#fdecea', text: '#e53935' },
}
const priorityColor: Record<string, string> = {
  urgent: '#ff5e5e', high: '#f0a100', medium: '#0091ff', low: 'var(--text-2)',
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="flex items-center justify-between h-12 px-5 border-b shrink-0" style="border-color: var(--border)">
      <h1 class="text-sm font-semibold" style="color: var(--text-1)">My Tickets</h1>
      <button @click="showForm = true" class="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white" style="background: var(--accent)">
        <Icon name="lucide:plus" class="w-3.5 h-3.5" /> New Ticket
      </button>
    </div>

    <!-- Column header -->
    <div class="grid px-5 py-1.5 border-b text-xs font-medium shrink-0"
      style="grid-template-columns: 16px 1fr 110px 80px 110px 120px; gap: 12px; border-color: var(--border); color: var(--text-2)">
      <span />
      <span>Title</span>
      <span>Status</span>
      <span>Priority</span>
      <span>Project</span>
      <span>Assigned</span>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div v-if="loading" class="p-8 text-center text-sm" style="color: var(--text-3)">Loading…</div>
      <div
        v-for="ticket in tickets" :key="ticket.id"
        @click="selectedTicket = ticket; router.replace({ query: { ticket: ticket.id } })"
        class="grid items-center px-5 py-2.5 border-b text-sm hover:bg-[var(--bg-hover)] cursor-pointer"
        style="grid-template-columns: 16px 1fr 110px 80px 110px 120px; gap: 12px; border-color: var(--border); color: var(--text-1)"
      >
        <span class="status-icon shrink-0" :class="statusClass[statusSlug(ticket)]" />
        <span class="truncate flex items-center gap-1.5">
          <span class="shrink-0 text-xs font-mono" style="color: var(--text-3)">#{{ ticket.id }}</span>
          {{ ticket.title?.rendered ?? ticket.title }}
        </span>
        <span class="text-xs font-medium truncate"
          :style="{ color: statusColor[statusSlug(ticket)]?.text ?? 'var(--text-3)' }">
          {{ statusTerms.find(t => t.slug === statusSlug(ticket))?.name ?? '—' }}
        </span>
        <span class="text-xs font-medium truncate"
          :style="{ color: priorityColor[prioritySlug(ticket)] ?? 'var(--text-3)' }">
          {{ priorityTerms.find(t => t.slug === prioritySlug(ticket))?.name ?? '—' }}
        </span>
        <span class="text-xs truncate" style="color: var(--accent)">
          {{ ticket.meta_box?.project ? (projects.find((p: any) => String(p.id) === String(ticket.meta_box.project))?.title?.rendered ?? '—') : '—' }}
        </span>
        <div class="flex items-center gap-1.5 min-w-0">
          <div v-if="memberInitial(ticket)"
            class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style="background: var(--accent)">
            {{ memberInitial(ticket) }}
          </div>
          <div v-else class="w-5 h-5 rounded-full border shrink-0" style="border-color: var(--border)" />
          <span class="text-xs truncate" style="color: var(--text-2)">{{ memberName(ticket) ?? '—' }}</span>
        </div>
      </div>
      <div v-if="!loading && tickets.length === 0" class="p-8 text-center text-sm" style="color: var(--text-3)">
        No tickets assigned to you.
      </div>
    </div>

    <!-- Ticket detail slide-over -->
    <Teleport to="body">
      <TicketDetail
        v-if="selectedTicket"
        :ticket="selectedTicket"
        :members="members"
        :projects="projects"
        :status-terms="statusTerms"
        :priority-terms="priorityTerms"
        @close="selectedTicket = null; router.replace({ query: {} })"
        @updated="onTicketUpdated"
      />
    </Teleport>

    <!-- New Ticket modal -->
    <Teleport to="body">
      <div v-if="showForm" class="fixed inset-0 flex items-center justify-center z-50" style="background: rgba(0,0,0,0.5)">
        <div class="w-full max-w-lg rounded-xl border p-6 space-y-4" style="background: var(--bg-card); border-color: var(--border)">
          <h2 class="text-sm font-semibold" style="color: var(--text-1)">New Ticket</h2>
          <form @submit.prevent="submit" class="space-y-3">
            <input v-model="form.title" placeholder="Ticket title" required
              class="w-full px-3 py-2 rounded-lg border text-sm"
              style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)" />
            <TipTapEditor v-model="form.description" placeholder="Add a description..." />
            <div class="flex gap-3">
              <select v-model.number="form.status_id" class="flex-1 px-3 py-2 rounded-lg border text-sm" style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)">
                <option v-for="t in sortedStatusTerms" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
              <select v-model.number="form.priority_id" class="flex-1 px-3 py-2 rounded-lg border text-sm" style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)">
                <option v-for="t in sortedPriorityTerms" :key="t.id" :value="t.id">{{ t.name }}</option>
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
