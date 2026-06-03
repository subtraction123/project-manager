<template>
  <aside :class="['bg-bg-sidebar text-white flex flex-col transition-all duration-300', collapsed ? 'w-16' : 'w-56']">
    <div class="flex items-center h-16 px-4 border-b border-white/10">
      <span v-if="!collapsed" class="text-lg font-bold whitespace-nowrap">项目管理工具</span>
      <span v-else class="text-lg font-bold">PM</span>
    </div>
    <nav class="flex-1 py-4">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        :class="[
          'flex items-center px-4 py-3 mx-2 rounded-lg mb-1 transition-colors',
          isActive(item.path) ? 'bg-primary text-white' : 'text-gray-300 hover:bg-white/10',
        ]"
      >
        <span class="text-xl w-8 text-center">{{ item.icon }}</span>
        <span v-if="!collapsed" class="ml-3 text-sm font-medium">{{ item.label }}</span>
      </router-link>
    </nav>
    <div class="p-4 border-t border-white/10">
      <button
        @click="$emit('toggle')"
        class="w-full flex items-center justify-center text-gray-400 hover:text-white transition-colors"
      >
        <span class="text-lg">{{ collapsed ? '▶' : '◀' }}</span>
      </button>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import { computed } from 'vue'

const route = useRoute()
const ui = useUIStore()

const collapsed = computed(() => ui.sidebarCollapsed)

defineEmits(['toggle'])

const navItems = [
  { path: '/', label: '仪表盘', icon: '📊' },
  { path: '/daily-items', label: '日常记录', icon: '📝' },
  { path: '/tasks', label: '任务列表', icon: '✅' },
  { path: '/projects', label: '项目列表', icon: '📁' },
  { path: '/version', label: '版本管理', icon: '🔖' },
  { path: '/reports', label: '周报管理', icon: '📋' },
]

function isActive(path: string) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>
