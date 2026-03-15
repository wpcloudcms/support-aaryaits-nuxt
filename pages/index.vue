<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { getTickets, getMembers, getProjects, getStatusTerms, getPriorityTerms } = useWordPress()
const { currentUser } = useAuth()

const allTickets = ref<any[]>([])
const members = ref<any[]>([])
const projects = ref<any[]>([])
const statusTerms = ref<{ id: number; name: string; slug: string }[]>([])
const priorityTerms = ref<{ id: number; name: string; slug: string }[]>([])
const loading = ref(true)
const selectedTicket = ref<any>(null)

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
    <div class="flex items-center h-12 px-5 border-b shrink-0" style="border-color: var(--border)">
      <h1 class="text-sm font-semibold" style="color: var(--text-1)">My Tickets</h1>
    </div>

    <!-- Column header -->
    <div class="grid px-5 py-1.5 border-b text-xs font-medium shrink-0"
      style="grid-template-columns: 16px 1fr 110px 80px 110px 20px; gap: 12px; border-color: var(--border); color: var(--text-2)">
      <span />
      <span>Title</span>
      <span>Status</span>
      <span>Priority</span>
      <span>Project</span>
      <span />
    </div>

    <div class="flex-1 overflow-y-auto">
      <div v-if="loading" class="p-8 text-center text-sm" style="color: var(--text-3)">Loading…</div>
      <div
        v-for="ticket in tickets" :key="ticket.id"
        @click="selectedTicket = ticket; router.replace({ query: { ticket: ticket.id } })"
        class="grid items-center px-5 py-2.5 border-b text-sm hover:bg-[var(--bg-hover)] cursor-pointer"
        style="grid-template-columns: 16px 1fr 110px 80px 110px 20px; gap: 12px; border-color: var(--border); color: var(--text-1)"
      >
        <span class="status-icon shrink-0" :class="statusClass[statusSlug(ticket)]" />
        <span class="truncate">{{ ticket.title?.rendered ?? ticket.title }}</span>
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
        <div v-if="memberInitial(ticket)"
          class="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style="background: var(--accent)" :title="memberName(ticket) ?? ''">
          {{ memberInitial(ticket) }}
        </div>
        <div v-else class="w-5 h-5 rounded-full border" style="border-color: var(--border)" />
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
  </div>
</template>
