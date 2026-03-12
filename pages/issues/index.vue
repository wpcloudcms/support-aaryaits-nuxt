<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { getIssues, createIssue, updateIssue, deleteIssue } = useWordPress()

const issues = ref<any[]>([])
const loading = ref(true)
const showForm = ref(false)
const form = reactive({ title: '', status: 'todo', priority: 'medium', project: '' })

onMounted(async () => {
  issues.value = await getIssues() as any[]
  loading.value = false
})

async function submit() {
  await createIssue({
    title: form.title,
    status: 'publish',
    meta: { status: form.status, priority: form.priority },
  })
  issues.value = await getIssues() as any[]
  showForm.value = false
  Object.assign(form, { title: '', status: 'todo', priority: 'medium' })
}

const statusClass: Record<string, string> = {
  todo: 'status-todo',
  'in-progress': 'status-in-progress',
  'in-review': 'status-in-review',
  done: 'status-done',
  cancelled: 'status-cancelled',
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Topbar -->
    <div class="flex items-center justify-between h-12 px-5 border-b shrink-0" style="border-color: var(--border)">
      <h1 class="text-sm font-semibold" style="color: var(--text-1)">All Issues</h1>
      <button @click="showForm = true" class="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white" style="background: var(--accent)">
        <Icon name="lucide:plus" class="w-3.5 h-3.5" /> New Issue
      </button>
    </div>

    <!-- Issue list -->
    <div class="flex-1 overflow-y-auto">
      <div v-if="loading" class="p-8 text-center text-sm" style="color: var(--text-3)">Loading…</div>
      <div
        v-for="issue in issues"
        :key="issue.id"
        class="flex items-center gap-3 px-5 py-2.5 border-b text-sm hover:bg-[var(--bg-hover)] cursor-pointer"
        style="border-color: var(--border); color: var(--text-1)"
      >
        <span class="status-icon" :class="statusClass[issue.meta?.status ?? 'todo']" />
        <span class="flex-1 truncate">{{ issue.title?.rendered ?? issue.title }}</span>
        <span class="text-xs capitalize px-2 py-0.5 rounded" style="background: var(--bg-hover); color: var(--text-2)">
          {{ issue.meta?.priority ?? '—' }}
        </span>
      </div>
      <div v-if="!loading && issues.length === 0" class="p-8 text-center text-sm" style="color: var(--text-3)">No issues yet.</div>
    </div>

    <!-- New Issue modal -->
    <Teleport to="body">
      <div v-if="showForm" class="fixed inset-0 flex items-center justify-center z-50" style="background: rgba(0,0,0,0.5)">
        <div class="w-full max-w-md rounded-xl border p-6 space-y-4" style="background: var(--bg-card); border-color: var(--border)">
          <h2 class="text-sm font-semibold" style="color: var(--text-1)">New Issue</h2>
          <form @submit.prevent="submit" class="space-y-3">
            <input v-model="form.title" placeholder="Issue title" required class="w-full px-3 py-2 rounded-lg border text-sm" style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)" />
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
