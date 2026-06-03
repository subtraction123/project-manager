<template>
  <span :class="['inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium', badgeClass]">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  status: string
  type?: 'task' | 'milestone' | 'release' | 'report'
}>()

const badgeClass = computed(() => {
  const map: Record<string, string> = {
    pending: 'bg-orange-100 text-orange-600',
    doing: 'bg-blue-100 text-blue-600',
    done: 'bg-green-100 text-green-600',
    achieved: 'bg-green-100 text-green-600',
    delayed: 'bg-red-100 text-red-600',
    draft: 'bg-yellow-100 text-yellow-700',
    published: 'bg-green-100 text-green-600',
    retracted: 'bg-red-100 text-red-600',
    active: 'bg-blue-100 text-blue-600',
    archived: 'bg-gray-100 text-gray-500',
  }
  return map[props.status] || 'bg-gray-100 text-gray-600'
})

const label = computed(() => {
  const map: Record<string, string> = {
    pending: '待办',
    doing: '进行中',
    done: '已完成',
    achieved: '已完成',
    delayed: '已延期',
    draft: '草稿',
    published: '已发布',
    retracted: '已撤回',
    active: '进行中',
    archived: '已归档',
  }
  return map[props.status] || props.status
})
</script>
