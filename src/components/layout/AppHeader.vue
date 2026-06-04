<template>
  <header class="flex items-center justify-between h-16 px-6 bg-white border-b border-border-color shadow-sm">
    <div class="flex items-center gap-4">
      <button
        @click="ui.toggleSidebar()"
        class="text-text-secondary hover:text-primary transition-colors"
      >
        <span class="text-xl">☰</span>
      </button>
      <h1 class="text-lg font-semibold text-text-primary">{{ pageTitle }}</h1>
    </div>
    <div class="flex items-center gap-3">
      <span class="text-sm text-text-muted">{{ today }}</span>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import dayjs from 'dayjs'

const route = useRoute()
const ui = useUIStore()

const pageTitle = computed(() => (route.meta.title as string) || 'Mbrains')
const today = computed(() => dayjs().format('YYYY年MM月DD日 dddd'))
</script>
