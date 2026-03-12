<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { getTickets, createTicket } = useWordPress()

const tickets = ref<any[]>([])
const loading = ref(true)
const showForm = ref(false)
const form = reactive({ title: '', status: 'todo', priority: 'medium' })

onMounted(async () => {
  tickets.value = await getTickets() as any[]
  loading.value = false
})

async function submit() {
  await createTicket({ title: form.title, status: 'publish', meta: { status: form.status, priority: form.priority } })
  tickets.value = await getTickets() as any[]
  showForm.value = false
  Object.assign(form, { title: '', status: 'todo', priority: 'medium' })
}

const statusClass: Record<string, string> = {
  todo: 'status-todo', 'in-progress': 'status-in-progress',
  'in-review': 'status-in-review', done: 'status-done', cancelled: 'status-cancelled',
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
        class="flex items-center gap-3 px-5 py-2.5 border-b text-sm hover:bg-[var(--bg-hover)] cursor-pointer"
        style="border-color: var(--border); color: var(--text-1)"
      >
        <span class="status-icon" :class="statusClass[ticket.meta?.status ?? 'todo']" />
        <span class="flex-1 truncate">{{ ticket.title?.rendered ?? ticket.title }}</span>
        <span class="text-xs capitalize px-2 py-0.5 rounded" style="background: var(--bg-hover); color: var(--text-2)">{{ ticket.meta?.priority ?? '—' }}</span>
      </div>
      <div v-if="!loading && tickets.length === 0" class="p-8 text-center text-sm" style="color: var(--text-3)">No tickets yet.</div>
    </div>

    <Teleport to="body">
      <div v-if="showForm" class="fixed inset-0 flex items-center justify-center z-50" style="background: rgba(0,0,0,0.5)">
        <div class="w-full max-w-md rounded-xl border p-6 space-y-4" style="background: var(--bg-card); border-color: var(--border)">
          <h2 class="text-sm font-semibold" style="color: var(--text-1)">New Ticket</h2>
          <form @submit.prevent="submit" class="space-y-3">
            <input v-model="form.title" placeholder="Ticket title" required class="w-full px-3 py-2 rounded-lg border text-sm" style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)" />
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
