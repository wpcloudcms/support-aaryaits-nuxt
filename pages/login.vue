<script setup lang="ts">
definePageMeta({ layout: false })

const { login, isAuthenticated } = useAuth()
const { logoUrl, siteName, loadSiteSettings } = useSiteSettings()
const form = reactive({ username: '', password: '' })
const error = ref('')
const loading = ref(false)

if (isAuthenticated.value) await navigateTo('/')
onMounted(() => loadSiteSettings())

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await login(form.username, form.password)
    await navigateTo('/')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Login failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center" style="background: var(--bg-app)">
    <div class="w-full max-w-sm p-8 rounded-xl border" style="background: var(--bg-card); border-color: var(--border)">
      <div class="mb-8 text-center">
        <div class="flex items-center justify-center gap-2 mb-1">
          <img v-if="logoUrl" :src="logoUrl" alt="logo"
            class="object-contain shrink-0"
            style="max-width: 40px; max-height: 32px" />
          <span class="text-2xl font-bold" style="color: var(--text-1)">{{ siteName }}</span>
        </div>
        <div class="text-sm" style="color: var(--text-2)">Sign in to your workspace</div>
      </div>

      <form @submit.prevent="submit" class="space-y-4">
        <div>
          <label class="block text-xs font-medium mb-1.5" style="color: var(--text-2)">Username</label>
          <input
            v-model="form.username"
            type="text"
            required
            autocomplete="username"
            class="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-[var(--accent)]"
            style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)"
          />
        </div>
        <div>
          <label class="block text-xs font-medium mb-1.5" style="color: var(--text-2)">Password</label>
          <input
            v-model="form.password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:border-[var(--accent)]"
            style="background: var(--bg-app); border-color: var(--border); color: var(--text-1)"
          />
        </div>

        <p v-if="error" class="text-xs text-red-500">{{ error }}</p>

        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-60"
          style="background: var(--accent)"
        >
          {{ loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>
    </div>
  </div>
</template>
