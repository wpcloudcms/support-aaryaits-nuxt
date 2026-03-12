<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { getCustomers, createCustomer } = useWordPress()
const customers = ref<any[]>([])
const loading = ref(true)
const showForm = ref(false)
const form = reactive({ title: '' })

onMounted(async () => {
  customers.value = await getCustomers() as any[]
  loading.value = false
})

async function submit() {
  await createCustomer({ title: form.title, status: 'publish' })
  customers.value = await getCustomers() as any[]
  showForm.value = false
  form.title = ''
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="flex items-center justify-between h-12 px-5 border-b shrink-0" style="border-color: var(--border)">
      <h1 class="text-sm font-semibold" style="color: var(--text-1)">Customers</h1>
      <button @click="showForm = true" class="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-white" style="background: var(--accent)">
        <Icon name="lucide:plus" class="w-3.5 h-3.5" /> New Customer
      </button>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div v-if="loading" class="p-8 text-center text-sm" style="color: var(--text-3)">Loading…</div>
      <div
        v-for="c in customers" :key="c.id"
        class="flex items-center gap-3 px-5 py-3 border-b text-sm hover:bg-[var(--bg-hover)] cursor-pointer"
        style="border-color: var(--border); color: var(--text-1)"
      >
        <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style="background: var(--accent)">
          {{ (c.title?.rendered ?? c.title ?? '?')[0].toUpperCase() }}
        </div>
        <div>
          <p class="font-medium">{{ c.title?.rendered ?? c.title }}</p>
          <p class="text-xs mt-0.5" style="color: var(--text-3)">
            {{ c.meta_box?.['customer-projects_to']?.length ?? 0 }} projects ·
            {{ c.meta_box?.['customer-tickets_to']?.length ?? 0 }} tickets
          </p>
        </div>
      </div>
      <div v-if="!loading && customers.length === 0" class="p-8 text-center text-sm" style="color: var(--text-3)">No customers yet.</div>
    </div>

    <Teleport to="body">
      <div v-if="showForm" class="fixed inset-0 flex items-center justify-center z-50" style="background: rgba(0,0,0,0.5)">
        <div class="w-full max-w-md rounded-xl border p-6 space-y-4" style="background: var(--bg-card); border-color: var(--border)">
          <h2 class="text-sm font-semibold" style="color: var(--text-1)">New Customer</h2>
          <form @submit.prevent="submit" class="space-y-3">
            <input v-model="form.title" placeholder="Customer name" required class="w-full px-3 py-2 rounded-lg border text-sm" style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)" />
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
