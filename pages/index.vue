<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { currentUser } = useAuth()
const { getIssues } = useWordPress()

const issues = ref<any[]>([])

onMounted(async () => {
  const all = await getIssues() as any[]
  // Filter to current user's assigned issues if possible
  issues.value = all
})

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
    <div class="flex items-center h-12 px-5 border-b shrink-0" style="border-color: var(--border)">
      <h1 class="text-sm font-semibold" style="color: var(--text-1)">My Issues</h1>
    </div>
    <div class="flex-1 overflow-y-auto">
      <div
        v-for="issue in issues"
        :key="issue.id"
        class="flex items-center gap-3 px-5 py-2.5 border-b text-sm hover:bg-[var(--bg-hover)]"
        style="border-color: var(--border); color: var(--text-1)"
      >
        <span class="status-icon" :class="statusClass[issue.meta?.status ?? 'todo']" />
        <span class="flex-1 truncate">{{ issue.title?.rendered ?? issue.title }}</span>
      </div>
    </div>
  </div>
</template>
