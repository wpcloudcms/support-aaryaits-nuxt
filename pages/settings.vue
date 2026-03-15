<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })

const { currentUser, isAdmin, logout } = useAuth()
const { getUsers, getThemeSettings, saveThemeSettings, uploadSiteLogo, saveSiteSettings } = useWordPress()
const { logoUrl, siteName, sidebarWidth, loadSiteSettings } = useSiteSettings()
const members = ref<any[]>([])

onMounted(async () => {
  members.value = await getUsers() as any[]
  if (isAdmin.value) {
    await loadTheme()
    await loadSiteSettings()
    editSiteName.value = siteName.value
    editSidebarWidth.value = sidebarWidth.value
  }
})

const roleColor: Record<string, string> = {
  administrator: '#4693FF',
  editor: '#2DB35D',
  author: '#f0a100',
  contributor: '#888',
  subscriber: '#888',
}

const wpAdminUrl = useRuntimeConfig().public.wpUrl

// ── Site Identity (admin only) ────────────────────────────────
const editSiteName = ref('Support Aaryaits')
const editSidebarWidth = ref(200)
const logoPreview = ref('')
const logoSaving = ref(false)
const logoSaved = ref(false)

function onLogoChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { logoPreview.value = reader.result as string }
  reader.readAsDataURL(file)
}

async function saveSiteIdentity() {
  logoSaving.value = true
  try {
    if (logoPreview.value) {
      const res = await uploadSiteLogo(logoPreview.value)
      logoUrl.value = res.url
      logoPreview.value = ''
    }
    const w = Math.max(200, Math.min(300, Number(editSidebarWidth.value)))
    await saveSiteSettings({ site_name: editSiteName.value, sidebar_width: w })
    siteName.value = editSiteName.value
    sidebarWidth.value = w
    logoSaved.value = true
    setTimeout(() => logoSaved.value = false, 2500)
  } catch {}
  logoSaving.value = false
}

// ── Theme Customizer (admin only) ─────────────────────────────
const themeDefaults: Record<string, string> = {
  light_accent: '#4693FF', light_accent_hover: '#2f7de0',
  light_bg_app: '#f3f4f6', light_bg_sidebar: '#fafafa', light_bg_card: '#ffffff',
  light_bg_hover: '#ebebeb', light_bg_active: '#e8f0ff',
  light_border: '#e2e2e2',
  light_text_1: '#1c1c1c', light_text_2: '#595959', light_text_3: '#9ba2ae',
  light_success: '#2DB35D',
  dark_accent: '#4693FF', dark_accent_hover: '#2f7de0',
  dark_bg_app: '#111111', dark_bg_sidebar: '#0d0d0d', dark_bg_card: '#1a1a1a',
  dark_bg_hover: '#252525', dark_bg_active: '#0e1e2e',
  dark_border: '#2d2d2d',
  dark_text_1: '#ededed', dark_text_2: '#9ba2ae', dark_text_3: '#505050',
  dark_success: '#2DB35D',
}

const theme = reactive({ ...themeDefaults })
const themeSaving = ref(false)
const themeSaved = ref(false)

const colorFields = [
  { key: 'accent',       label: 'Accent' },
  { key: 'accent_hover', label: 'Accent Hover' },
  { key: 'bg_app',       label: 'App Background' },
  { key: 'bg_sidebar',   label: 'Sidebar Background' },
  { key: 'bg_card',      label: 'Card Background' },
  { key: 'bg_hover',     label: 'Hover Background' },
  { key: 'bg_active',    label: 'Active Background' },
  { key: 'border',       label: 'Border' },
  { key: 'text_1',       label: 'Text Primary' },
  { key: 'text_2',       label: 'Text Secondary' },
  { key: 'text_3',       label: 'Text Muted' },
  { key: 'success',      label: 'Success / Done' },
]

async function loadTheme() {
  const s = await getThemeSettings().catch(() => null)
  if (s) Object.assign(theme, s)
}

async function saveTheme() {
  themeSaving.value = true
  await saveThemeSettings({ ...theme }).catch(() => {})
  themeSaving.value = false
  themeSaved.value = true
  setTimeout(() => themeSaved.value = false, 2500)
  // Apply immediately to current page
  applyThemeLive()
}

function resetTheme() {
  Object.assign(theme, themeDefaults)
}

function applyThemeLive() {
  const css = `:root {
  --bg-app: ${theme.light_bg_app}; --bg-sidebar: ${theme.light_bg_sidebar};
  --bg-card: ${theme.light_bg_card}; --bg-hover: ${theme.light_bg_hover};
  --bg-active: ${theme.light_bg_active}; --border: ${theme.light_border};
  --text-1: ${theme.light_text_1}; --text-2: ${theme.light_text_2};
  --text-3: ${theme.light_text_3}; --accent: ${theme.light_accent};
  --accent-hover: ${theme.light_accent_hover}; --success: ${theme.light_success};
}
html.dark {
  --bg-app: ${theme.dark_bg_app}; --bg-sidebar: ${theme.dark_bg_sidebar};
  --bg-card: ${theme.dark_bg_card}; --bg-hover: ${theme.dark_bg_hover};
  --bg-active: ${theme.dark_bg_active}; --border: ${theme.dark_border};
  --text-1: ${theme.dark_text_1}; --text-2: ${theme.dark_text_2};
  --text-3: ${theme.dark_text_3}; --accent: ${theme.dark_accent};
  --accent-hover: ${theme.dark_accent_hover}; --success: ${theme.dark_success};
}`
  let el = document.getElementById('custom-theme') as HTMLStyleElement | null
  if (!el) { el = document.createElement('style'); el.id = 'custom-theme'; document.head.appendChild(el) }
  el.textContent = css
}
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="flex items-center h-12 px-5 border-b shrink-0" style="border-color: var(--border)">
      <h1 class="text-sm font-semibold" style="color: var(--text-1)">Settings</h1>
    </div>
    <div class="flex-1 overflow-y-auto p-5">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">

        <!-- ── Left column ── -->
        <div class="space-y-6">

          <!-- Profile -->
          <section>
            <h2 class="text-xs font-semibold uppercase tracking-wide mb-3" style="color: var(--text-3)">My Profile</h2>
            <div class="rounded-xl border p-4 flex items-center gap-3" style="background: var(--bg-card); border-color: var(--border)">
              <div class="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style="background: var(--accent)">
                {{ (currentUser?.name ?? '?')[0].toUpperCase() }}
              </div>
              <div>
                <p class="text-sm font-medium" style="color: var(--text-1)">{{ currentUser?.name ?? '—' }}</p>
                <p class="text-xs mt-0.5" style="color: var(--text-2)">{{ currentUser?.email ?? '—' }}</p>
                <p class="text-xs mt-0.5 capitalize" :style="{ color: roleColor[currentUser?.roles?.[0] ?? ''] ?? 'var(--text-3)' }">
                  {{ currentUser?.roles?.[0] ?? '—' }}
                </p>
              </div>
            </div>
          </section>

          <!-- Members -->
          <section>
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-xs font-semibold uppercase tracking-wide" style="color: var(--text-3)">Members</h2>
              <a
                v-if="isAdmin"
                :href="`${wpAdminUrl}/wp-admin/user-new.php`"
                target="_blank"
                class="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg text-white"
                style="background: var(--accent)"
              >
                <Icon name="lucide:plus" class="w-3 h-3" /> Add Member
              </a>
            </div>
            <div class="rounded-xl border divide-y overflow-hidden" style="background: var(--bg-card); border-color: var(--border)">
              <div v-for="m in members" :key="m.id" class="flex items-center gap-3 px-4 py-2.5">
                <div class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                  :style="{ background: roleColor[m.roles?.[0]] ?? 'var(--accent)' }">
                  {{ (m.name ?? '?')[0].toUpperCase() }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-medium truncate" style="color: var(--text-1)">{{ m.name }}</p>
                  <p class="text-xs truncate" style="color: var(--text-3)">{{ m.slug }}</p>
                </div>
                <span class="text-xs capitalize px-2 py-0.5 rounded-full shrink-0"
                  :style="{ background: 'var(--bg-hover)', color: roleColor[m.roles?.[0]] ?? 'var(--text-2)' }">
                  {{ m.roles?.[0] ?? 'member' }}
                </span>
                <a v-if="isAdmin" :href="`${wpAdminUrl}/wp-admin/user-edit.php?user_id=${m.id}`" target="_blank"
                  class="shrink-0 p-1 rounded hover:bg-[var(--bg-hover)]" style="color: var(--text-3)">
                  <Icon name="lucide:pencil" class="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
            <p v-if="!isAdmin" class="text-xs mt-2" style="color: var(--text-3)">
              Only administrators can add or edit members.
            </p>
          </section>

          <!-- Account -->
          <section>
            <h2 class="text-xs font-semibold uppercase tracking-wide mb-3" style="color: var(--text-3)">Account</h2>
            <button @click="logout" class="px-4 py-2 rounded-lg border text-xs" style="border-color: var(--border); color: var(--text-2)">
              Sign out
            </button>
          </section>

        </div>

        <!-- ── Right column (admin only) ── -->
        <div v-if="isAdmin" class="space-y-6">

          <!-- Site Identity -->
          <section>
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-xs font-semibold uppercase tracking-wide" style="color: var(--text-3)">Site Identity</h2>
              <button @click="saveSiteIdentity" :disabled="logoSaving"
                class="text-xs px-3 py-1 rounded-lg text-white disabled:opacity-60"
                :style="logoSaved ? 'background: var(--success)' : 'background: var(--accent)'">
                {{ logoSaving ? 'Saving…' : logoSaved ? 'Saved!' : 'Save' }}
              </button>
            </div>
            <div class="rounded-xl border p-4 space-y-4" style="background: var(--bg-card); border-color: var(--border)">
              <!-- Site Name -->
              <div>
                <label class="text-xs font-medium block mb-1.5" style="color: var(--text-2)">Site Name</label>
                <input v-model="editSiteName" type="text"
                  class="w-full px-3 py-1.5 rounded-lg border text-sm outline-none focus:border-[var(--accent)]"
                  style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)" />
              </div>
              <!-- Sidebar Width -->
              <div>
                <label class="text-xs font-medium block mb-1.5" style="color: var(--text-2)">
                  Sidebar Width
                  <span style="color: var(--text-3)">({{ editSidebarWidth }}px · min 200, max 300)</span>
                </label>
                <div class="flex items-center gap-3">
                  <input v-model.number="editSidebarWidth" type="range" min="200" max="300" step="10"
                    class="flex-1 accent-[var(--accent)]" />
                  <input v-model.number="editSidebarWidth" type="number" min="200" max="300"
                    class="w-20 px-2 py-1 rounded-lg border text-sm text-center outline-none focus:border-[var(--accent)]"
                    style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)" />
                </div>
              </div>
              <!-- Logo Upload -->
              <div>
                <label class="text-xs font-medium block mb-1" style="color: var(--text-2)">Logo</label>
                <p class="text-xs mb-1.5" style="color: var(--text-3)">It should be square and at least 512 by 512 pixels. This will also be set as the WordPress site icon.</p>
                <div class="flex items-center gap-4">
                  <div class="w-24 h-16 rounded-lg border flex items-center justify-center overflow-hidden shrink-0"
                    style="border-color: var(--border); background: var(--bg-app)">
                    <img v-if="logoPreview || logoUrl"
                      :src="logoPreview || logoUrl"
                      alt="logo preview"
                      class="object-contain"
                      style="max-width: 100px; max-height: 80px" />
                    <Icon v-else name="lucide:image" class="w-6 h-6" style="color: var(--text-3)" />
                  </div>
                  <label class="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border cursor-pointer hover:bg-[var(--bg-hover)]"
                    style="border-color: var(--border); color: var(--text-2)">
                    <Icon name="lucide:upload" class="w-3.5 h-3.5" />
                    Choose image
                    <input type="file" accept="image/png,image/jpeg,image/gif,image/webp"
                      class="sr-only" @change="onLogoChange" />
                  </label>
                  <button v-if="logoPreview" @click="logoPreview = ''"
                    class="text-xs px-2 py-1 rounded border"
                    style="border-color: var(--border); color: var(--text-3)">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </section>

          <!-- Theme Colors -->
          <section>
            <div class="flex items-center justify-between mb-3">
              <h2 class="text-xs font-semibold uppercase tracking-wide" style="color: var(--text-3)">Theme Colors</h2>
              <div class="flex items-center gap-2">
                <button @click="resetTheme"
                  class="text-xs px-2.5 py-1 rounded-lg border"
                  style="border-color: var(--border); color: var(--text-2)">
                  Reset
                </button>
                <button @click="saveTheme" :disabled="themeSaving"
                  class="text-xs px-3 py-1 rounded-lg text-white disabled:opacity-60"
                  :style="themeSaved ? 'background: var(--success)' : 'background: var(--accent)'">
                  {{ themeSaving ? 'Saving…' : themeSaved ? 'Saved!' : 'Save Theme' }}
                </button>
              </div>
            </div>

            <div class="rounded-xl border overflow-hidden" style="background: var(--bg-card); border-color: var(--border)">
              <!-- Column headers -->
              <div class="grid grid-cols-3 gap-4 px-4 py-2 border-b text-xs font-semibold"
                style="border-color: var(--border); color: var(--text-3)">
                <span>Color</span>
                <span class="text-center">Light</span>
                <span class="text-center">Dark</span>
              </div>
              <!-- Color rows -->
              <div v-for="field in colorFields" :key="field.key"
                class="grid grid-cols-3 gap-4 items-center px-4 py-2.5 border-b last:border-b-0"
                style="border-color: var(--border)">
                <span class="text-xs" style="color: var(--text-2)">{{ field.label }}</span>
                <!-- Light -->
                <div class="flex items-center gap-2 justify-center">
                  <div class="relative w-7 h-7 rounded-md overflow-hidden border shrink-0 cursor-pointer"
                    style="border-color: var(--border)">
                    <input type="color" :value="(theme as any)['light_' + field.key]"
                      @input="(theme as any)['light_' + field.key] = ($event.target as HTMLInputElement).value"
                      class="absolute -inset-1 w-10 h-10 cursor-pointer opacity-0" />
                    <div class="w-full h-full rounded-md"
                      :style="{ background: (theme as any)['light_' + field.key] }" />
                  </div>
                  <input type="text" :value="(theme as any)['light_' + field.key]"
                    @input="(theme as any)['light_' + field.key] = ($event.target as HTMLInputElement).value"
                    class="w-20 px-1.5 py-0.5 rounded border text-xs font-mono outline-none focus:border-[var(--accent)]"
                    style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)" />
                </div>
                <!-- Dark -->
                <div class="flex items-center gap-2 justify-center">
                  <div class="relative w-7 h-7 rounded-md overflow-hidden border shrink-0 cursor-pointer"
                    style="border-color: var(--border)">
                    <input type="color" :value="(theme as any)['dark_' + field.key]"
                      @input="(theme as any)['dark_' + field.key] = ($event.target as HTMLInputElement).value"
                      class="absolute -inset-1 w-10 h-10 cursor-pointer opacity-0" />
                    <div class="w-full h-full rounded-md"
                      :style="{ background: (theme as any)['dark_' + field.key] }" />
                  </div>
                  <input type="text" :value="(theme as any)['dark_' + field.key]"
                    @input="(theme as any)['dark_' + field.key] = ($event.target as HTMLInputElement).value"
                    class="w-20 px-1.5 py-0.5 rounded border text-xs font-mono outline-none focus:border-[var(--accent)]"
                    style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)" />
                </div>
              </div>
            </div>
            <p class="text-xs mt-2" style="color: var(--text-3)">
              Changes are saved to WordPress and applied instantly to all users.
            </p>
          </section>

        </div>
      </div>
    </div>
  </div>
</template>
