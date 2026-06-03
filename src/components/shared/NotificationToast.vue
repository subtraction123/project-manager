<template>
  <div class="fixed top-4 right-4 z-50 flex flex-col gap-2">
    <div
      v-for="toast in ui.toasts"
      :key="toast.id"
      :class="[
        'px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-slide-in',
        toast.type === 'success' ? 'bg-success' :
        toast.type === 'error' ? 'bg-danger' : 'bg-primary',
      ]"
    >
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUIStore } from '@/stores/ui'
const ui = useUIStore()
</script>

<style scoped>
.animate-slide-in {
  animation: slideIn 0.3s ease-out;
}
@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
</style>
