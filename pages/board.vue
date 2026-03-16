<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { getTickets } = useWordPress()
const issues = ref<any[]>([])

onMounted(async () => {
  issues.value = await getTickets() as any[]
})

const COLUMNS = [
  { key: 'todo',        label: 'Todo' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'in-review',   label: 'In Review' },
  { key: 'done',        label: 'Done' },
]

function byStatus(status: string) {
  return issues.value.filter(i => (i.status ?? 'todo') === status)
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="flex items-center h-12 px-5 border-b shrink-0" style="border-color: var(--border)">
      <h1 class="text-sm font-semibold" style="color: var(--text-1)">Board</h1>
    </div>
    <div class="flex-1 flex gap-4 p-5 overflow-x-auto">
      <div
        v-for="col in COLUMNS"
        :key="col.key"
        class="flex flex-col gap-2 min-w-[220px] flex-shrink-0"
      >
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-semibold uppercase tracking-wide" style="color: var(--text-2)">{{ col.label }}</span>
          <span class="text-xs px-1.5 py-0.5 rounded-full" style="background: var(--bg-hover); color: var(--text-3)">{{ byStatus(col.key).length }}</span>
        </div>
        <div
          v-for="issue in byStatus(col.key)"
          :key="issue.id"
          class="p-3 rounded-lg border text-xs cursor-pointer hover:border-[var(--accent)]"
          style="background: var(--bg-card); border-color: var(--border); color: var(--text-1)"
        >
          {{ issue.title }}
        </div>
        <div v-if="byStatus(col.key).length === 0" class="text-xs text-center py-4" style="color: var(--text-3)">Empty</div>
      </div>
    </div>
  </div>
</template>
