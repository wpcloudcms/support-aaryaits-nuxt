<script setup lang="ts">
interface Term { id: number; name: string; slug: string }
const props = defineProps<{ ticket: any; members: any[]; projects: any[]; statusTerms: Term[]; priorityTerms: Term[] }>()
const emit = defineEmits<{ close: []; updated: [ticket: any] }>()

const { updateTicket, getHistory, saveHistory, getComments, addComment, getTicketNotifyStatus, subscribeTicketNotify, unsubscribeTicketNotify } = useWordPress()
const { currentUser } = useAuth()
const { isSubscribed: pushSubscribed, isSupported: pushSupported, subscribe: subscribePush } = usePushNotifications()

const form = reactive({
  title: '',
  status_id: 0,
  priority_id: 0,
  assigned_member: '',
  project: '',
  content: '',
})

// Snapshot for change detection
const snapshot = reactive({ title: '', status_id: 0, priority_id: 0, assigned_member: '', project: '' })

// ── Per-ticket notification subscription ─────────────────────
const ticketSubscribed = ref(false)
const ticketNotifyLoading = ref(false)

async function loadNotifyStatus() {
  if (!props.ticket?.id) return
  const res = await getTicketNotifyStatus(props.ticket.id).catch(() => null)
  if (res) ticketSubscribed.value = res.subscribed
}

async function toggleTicketNotify() {
  if (ticketNotifyLoading.value) return
  // Ensure browser push is subscribed first
  if (pushSupported && !pushSubscribed.value) {
    await subscribePush()
    if (!pushSubscribed.value) return // permission denied
  }
  ticketNotifyLoading.value = true
  if (ticketSubscribed.value) {
    await unsubscribeTicketNotify(props.ticket.id).catch(() => {})
    ticketSubscribed.value = false
  } else {
    await subscribeTicketNotify(props.ticket.id).catch(() => {})
    ticketSubscribed.value = true
  }
  ticketNotifyLoading.value = false
}

watch(() => props.ticket, (t) => {
  if (!t) return
  form.title = t.title?.rendered ?? t.title ?? ''
  form.status_id = t['ticket-status']?.[0] ?? props.statusTerms[0]?.id ?? 0
  form.priority_id = t['ticket-priority']?.[0] ?? props.priorityTerms[0]?.id ?? 0
  form.assigned_member = t.meta_box?.assigned_member ?? ''
  form.project = t.meta_box?.project ?? ''
  form.content = t.content?.raw ?? ''
  Object.assign(snapshot, {
    title: form.title, status_id: form.status_id, priority_id: form.priority_id,
    assigned_member: form.assigned_member, project: form.project,
  })
  loadHistory()
  loadComments()
  loadNotifyStatus()
}, { immediate: true })

// ── Save ticket ──────────────────────────────────────────────
const saving = ref(false)

function detectChanges() {
  const changes: string[] = []
  if (form.title !== snapshot.title)
    changes.push(`Title: "${snapshot.title}" → "${form.title}"`)
  if (form.status_id !== snapshot.status_id) {
    const oldName = props.statusTerms.find(t => t.id === snapshot.status_id)?.name ?? snapshot.status_id
    const newName = props.statusTerms.find(t => t.id === form.status_id)?.name ?? form.status_id
    changes.push(`Status: ${oldName} → ${newName}`)
  }
  if (form.priority_id !== snapshot.priority_id) {
    const oldName = props.priorityTerms.find(t => t.id === snapshot.priority_id)?.name ?? snapshot.priority_id
    const newName = props.priorityTerms.find(t => t.id === form.priority_id)?.name ?? form.priority_id
    changes.push(`Priority: ${oldName} → ${newName}`)
  }

  const oldMember = props.members.find(m => String(m.id) === String(snapshot.assigned_member))
  const newMember = props.members.find(m => String(m.id) === String(form.assigned_member))
  if (form.assigned_member !== snapshot.assigned_member)
    changes.push(`Assigned: ${oldMember ? (oldMember.title?.rendered ?? oldMember.title) : 'Unassigned'} → ${newMember ? (newMember.title?.rendered ?? newMember.title) : 'Unassigned'}`)

  const oldProject = props.projects.find(p => String(p.id) === String(snapshot.project))
  const newProject = props.projects.find(p => String(p.id) === String(form.project))
  if (form.project !== snapshot.project)
    changes.push(`Project: ${oldProject ? (oldProject.title?.rendered ?? oldProject.title) : 'None'} → ${newProject ? (newProject.title?.rendered ?? newProject.title) : 'None'}`)

  return changes
}

async function save() {
  const changes = detectChanges()
  saving.value = true
  const updated = await updateTicket(props.ticket.id, {
    title: form.title,
    content: form.content,
    meta_box: { assigned_member: form.assigned_member, project: form.project },
    ...(form.status_id ? { 'ticket-status': [form.status_id] } : {}),
    ...(form.priority_id ? { 'ticket-priority': [form.priority_id] } : {}),
  })
  saving.value = false
  emit('updated', updated)

  if (changes.length > 0) {
    await saveHistory(props.ticket.id, {
      changes,
      user: currentUser.value?.name || 'Unknown',
      ticketTitle: form.title,
    }).catch(() => {})
    await loadHistory()
  }

  Object.assign(snapshot, {
    title: form.title, status_id: form.status_id, priority_id: form.priority_id,
    assigned_member: form.assigned_member, project: form.project,
  })
}

// ── Comments ─────────────────────────────────────────────────
const comments = ref<{ timestamp: string; user: string; body: string }[]>([])
const commentInput = ref('')
const submittingComment = ref(false)

async function loadComments() {
  comments.value = await getComments(props.ticket.id).catch(() => [])
}

async function submitComment() {
  const text = commentInput.value.trim()
  if (!text) return
  submittingComment.value = true
  await addComment(props.ticket.id, {
    body: text,
    user: currentUser.value?.name || 'Unknown',
    ticketTitle: form.title,
  }).catch(() => {})
  commentInput.value = ''
  await loadComments()
  submittingComment.value = false
}

// ── History ───────────────────────────────────────────────────
const history = ref<{ timestamp: string; user: string; changes: string[] }[]>([])
const historyLoading = ref(false)

async function loadHistory() {
  historyLoading.value = true
  history.value = await getHistory(props.ticket.id).catch(() => [])
  historyLoading.value = false
}

onMounted(() => {
  loadHistory()
  loadComments()
  const timer = setInterval(() => {
    loadHistory()
    loadComments()
  }, 20000)
  onUnmounted(() => clearInterval(timer))
})

// ── Helpers ───────────────────────────────────────────────────
function formatIST(dateStr: string) {
  return new Date(dateStr).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }) + ' IST'
}

async function saveAndClose() {
  await save()
  emit('close')
}

function userInitial(name: string) {
  return (name || '?')[0].toUpperCase()
}
</script>

<template>
  <!-- Backdrop -->
  <div class="fixed inset-0 z-40 bg-black/40" @click="emit('close')" />

  <!-- Slide-over panel -->
  <div class="fixed right-0 top-0 h-full w-full max-w-lg z-50 flex flex-col shadow-2xl overflow-hidden"
    style="background: var(--bg-card); border-left: 1px solid var(--border)">

    <!-- Header -->
    <div class="flex items-center justify-between px-5 h-12 border-b shrink-0" style="border-color: var(--border)">
      <span class="text-xs font-medium" style="color: var(--text-3)">Ticket #{{ ticket.id }}</span>
      <div class="flex items-center gap-2">
        <!-- Per-ticket notification toggle -->
        <button @click="toggleTicketNotify" :disabled="ticketNotifyLoading"
          class="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors disabled:opacity-50"
          :style="ticketSubscribed
            ? 'border-color: var(--accent); background: var(--bg-active); color: var(--accent)'
            : 'border-color: var(--border); color: var(--text-3)'"
          :title="ticketSubscribed ? 'Remove notification for this ticket' : 'Subscribe to notifications for this ticket'">
          <Icon :name="ticketSubscribed ? 'lucide:bell-ring' : 'lucide:bell-plus'" class="w-3.5 h-3.5" />
          <span>{{ ticketSubscribed ? 'Unsubscribe' : 'Subscribe' }}</span>
        </button>
        <button @click="saveAndClose" :disabled="saving"
          class="px-3 py-1 rounded text-xs font-medium border disabled:opacity-60"
          style="border-color: var(--accent); color: var(--accent)">
          {{ saving ? 'Saving…' : 'Save & Close' }}
        </button>
        <button @click="save" :disabled="saving"
          class="px-3 py-1 rounded text-xs font-medium text-white disabled:opacity-60"
          style="background: var(--accent)">
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
        <button @click="emit('close')" class="p-1 rounded hover:bg-[var(--bg-hover)]" style="color: var(--text-3)">
          <Icon name="lucide:x" class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- Body -->
    <div class="flex-1 overflow-y-auto p-5 space-y-5">

      <!-- Title -->
      <input v-model="form.title"
        class="w-full text-base font-semibold bg-transparent border-b pb-2 outline-none focus:border-[var(--accent)]"
        style="border-color: var(--border); color: var(--text-1)" />

      <!-- Status + Priority -->
      <div class="flex gap-3">
        <div class="flex-1">
          <p class="text-xs mb-1.5" style="color: var(--text-3)">Status</p>
          <select v-model.number="form.status_id" class="w-full px-3 py-1.5 rounded-lg border text-xs"
            style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)">
            <option v-for="t in statusTerms" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
        <div class="flex-1">
          <p class="text-xs mb-1.5" style="color: var(--text-3)">Priority</p>
          <select v-model.number="form.priority_id" class="w-full px-3 py-1.5 rounded-lg border text-xs"
            style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)">
            <option v-for="t in priorityTerms" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
      </div>

      <!-- Assignee -->
      <div>
        <p class="text-xs mb-1.5" style="color: var(--text-3)">Assigned Member</p>
        <select v-model="form.assigned_member" class="w-full px-3 py-1.5 rounded-lg border text-xs"
          style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)">
          <option value="">Unassigned</option>
          <option v-for="m in members" :key="m.id" :value="String(m.id)">
            {{ m.title?.rendered ?? m.title }}
          </option>
        </select>
      </div>

      <!-- Project -->
      <div>
        <p class="text-xs mb-1.5" style="color: var(--text-3)">Project</p>
        <select v-model="form.project" class="w-full px-3 py-1.5 rounded-lg border text-xs"
          style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)">
          <option value="">No project</option>
          <option v-for="p in projects" :key="p.id" :value="String(p.id)">
            {{ p.title?.rendered ?? p.title }}
          </option>
        </select>
      </div>

      <!-- Description -->
      <div>
        <p class="text-xs mb-1.5" style="color: var(--text-3)">Description</p>
        <TipTapEditor v-model="form.content" placeholder="Add a description…" />
      </div>

      <!-- Comments -->
      <div class="border-t pt-4" style="border-color: var(--border)">
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs font-medium" style="color: var(--text-3)">Comments</p>
          <button @click="loadComments" class="flex items-center gap-1 text-xs px-2 py-0.5 rounded hover:bg-[var(--bg-hover)]" style="color: var(--text-3)">
            <Icon name="lucide:refresh-cw" class="w-3 h-3" /> Refresh
          </button>
        </div>

        <!-- Comment list -->
        <div v-if="comments.length > 0" class="space-y-3 mb-4">
          <div v-for="(c, i) in comments" :key="i" class="flex gap-2.5">
            <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 mt-0.5"
              style="background: var(--accent)">
              {{ userInitial(c.user) }}
            </div>
            <div class="flex-1 rounded-lg p-2.5 text-xs" style="background: var(--bg-app)">
              <div class="flex items-center justify-between mb-1">
                <span class="font-medium" style="color: var(--text-1)">{{ c.user }}</span>
                <span style="color: var(--text-3)">{{ c.timestamp }}</span>
              </div>
              <p style="color: var(--text-2); white-space: pre-wrap">{{ c.body }}</p>
            </div>
          </div>
        </div>
        <p v-else class="text-xs mb-4" style="color: var(--text-3)">No comments yet.</p>

        <!-- Add comment input -->
        <div class="flex flex-col gap-2">
          <textarea v-model="commentInput" rows="3" placeholder="Your comment…"
            class="w-full px-3 py-2 rounded-lg border text-xs resize-none outline-none focus:border-[var(--accent)]"
            style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)"
            @keydown.ctrl.enter="submitComment" />
          <div class="flex justify-end">
            <button @click="submitComment" :disabled="submittingComment || !commentInput.trim()"
              class="px-3 py-1.5 rounded text-xs font-medium text-white disabled:opacity-50"
              style="background: var(--accent)">
              {{ submittingComment ? 'Posting…' : 'Add Comment' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Meta info -->
      <div class="pt-2 space-y-1.5 border-t" style="border-color: var(--border)">
        <div class="flex justify-between text-xs">
          <span style="color: var(--text-3)">Created</span>
          <span style="color: var(--text-2)">{{ formatIST(ticket.date) }}</span>
        </div>
        <div class="flex justify-between text-xs">
          <span style="color: var(--text-3)">Modified</span>
          <span style="color: var(--text-2)">{{ formatIST(ticket.modified) }}</span>
        </div>
      </div>

      <!-- Change History -->
      <div class="pt-2 border-t" style="border-color: var(--border)">
        <div class="flex items-center justify-between mb-3">
          <p class="text-xs font-medium" style="color: var(--text-3)">Change History</p>
          <button @click="loadHistory" class="flex items-center gap-1 text-xs px-2 py-0.5 rounded hover:bg-[var(--bg-hover)]" style="color: var(--text-3)">
            <Icon name="lucide:refresh-cw" class="w-3 h-3" /> Refresh
          </button>
        </div>
        <p v-if="historyLoading" class="text-xs" style="color: var(--text-3)">Loading…</p>
        <p v-else-if="history.length === 0" class="text-xs" style="color: var(--text-3)">No history yet.</p>
        <div v-else class="space-y-3">
          <div v-for="(entry, i) in history" :key="i"
            class="rounded-lg p-3 text-xs"
            style="background: var(--bg-app)">
            <div class="flex items-center justify-between mb-1">
              <span class="font-medium" style="color: var(--text-1)">{{ entry.user }}</span>
              <span style="color: var(--text-3)">{{ entry.timestamp }}</span>
            </div>
            <ul class="space-y-0.5">
              <li v-for="(change, j) in entry.changes" :key="j" style="color: var(--text-2)">· {{ change }}</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
