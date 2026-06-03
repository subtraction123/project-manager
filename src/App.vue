<template>
  <div v-if="initError" class="flex items-center justify-center h-screen bg-red-50">
    <div class="text-center">
      <h1 class="text-xl font-bold text-red-600 mb-2">应用初始化失败</h1>
      <p class="text-sm text-red-500 mb-4">{{ initError }}</p>
      <button @click="retry" class="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-light">
        重试
      </button>
    </div>
  </div>
  <div v-else-if="!ready" class="flex items-center justify-center h-screen bg-bg-light">
    <div class="text-center">
      <div class="text-3xl mb-3">⏳</div>
      <p class="text-sm text-text-muted">正在初始化...</p>
    </div>
  </div>
  <router-view v-else />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDB } from '@/lib/db'

const db = useDB()
const initError = ref<string | null>(null)
const ready = ref(false)

async function init() {
  initError.value = null
  ready.value = false
  try {
    await db.init()
    console.log('Database initialized successfully')
    ready.value = true
  } catch (e: any) {
    console.error('Database init failed:', e)
    initError.value = e.message || String(e)
  }
}

function retry() {
  init()
}

onMounted(() => {
  init()
})
</script>
