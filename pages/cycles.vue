<script setup lang="ts">
definePageMeta({ layout: 'dashboard', middleware: 'auth' })
// Cycles are a future feature — placeholder page
</script>

<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="flex items-center h-12 px-5 border-b shrink-0" style="border-color: var(--border)">
      <h1 class="text-sm font-semibold" style="color: var(--text-1)">Cycles</h1>
    </div>
    <div class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <Icon name="lucide:refresh-cw" class="w-10 h-10 mb-3 mx-auto" style="color: var(--text-3)" />
        <p class="text-sm font-medium" style="color: var(--text-2)">Cycles coming soon</p>
        <p class="text-xs mt-1" style="color: var(--text-3)">Plan sprints and track progress here.</p>
      </div>
    </div>
  </div>
</template>
