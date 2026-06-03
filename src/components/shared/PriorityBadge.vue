<template>
  <span :class="['inline-flex items-center px-2 py-0.5 rounded text-xs font-medium', badgeClass]">
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  priority: string
}>()

const badgeClass = computed(() => ({
  high: 'bg-red-100 text-red-600',
  medium: 'bg-orange-100 text-orange-600',
  low: 'bg-green-100 text-green-600',
}[props.priority] || 'bg-gray-100 text-gray-600'))

const label = computed(() => ({
  high: '高',
  medium: '中',
  low: '低',
}[props.priority] || props.priority))
</script>
