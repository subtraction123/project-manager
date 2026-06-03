<template>
  <div class="flex flex-col items-center justify-center py-16 text-text-muted">
    <span class="text-5xl mb-4">{{ icon }}</span>
    <p class="text-lg font-medium mb-2">{{ title }}</p>
    <p v-if="description" class="text-sm">{{ description }}</p>
    <button v-if="actionLabel" @click="$emit('action')" class="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors text-sm">
      {{ actionLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  icon?: string
  title?: string
  description?: string
  actionLabel?: string
}>(), {
  icon: '📭',
  title: '暂无数据',
})

defineEmits(['action'])
</script>
