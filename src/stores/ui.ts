import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Toast } from '@/types'

export const useUIStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(false)
  const globalLoading = ref(false)
  const toasts = ref<Toast[]>([])

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function addToast(toast: Omit<Toast, 'id'>) {
    const id = Date.now().toString()
    toasts.value.push({ ...toast, id })
    setTimeout(() => removeToast(id), 3000)
  }

  function removeToast(id: string) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function setLoading(loading: boolean) {
    globalLoading.value = loading
  }

  return { sidebarCollapsed, globalLoading, toasts, toggleSidebar, addToast, removeToast, setLoading }
})
