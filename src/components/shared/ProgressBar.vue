<template>
  <div class="w-full">
    <div class="flex items-center justify-between mb-1">
      <span v-if="label" class="text-xs text-text-muted">{{ label }}</span>
      <span class="text-sm font-semibold" :class="colorClass">{{ percentage }}%</span>
    </div>
    <div class="h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        class="h-full rounded-full transition-all duration-500"
        :class="barColorClass"
        :style="{ width: percentage + '%' }"
      ></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  percentage: number
  label?: string
  color?: 'primary' | 'success' | 'warning'
}>(), {
  color: 'primary',
})

const colorClass = computed(() => ({
  primary: 'text-primary',
  success: 'text-success',
  warning: 'text-warning',
}[props.color]))

const barColorClass = computed(() => ({
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
}[props.color]))
</script>
