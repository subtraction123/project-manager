<template>
  <BaseModal :model-value="modelValue" @update:model-value="close" title="确认操作" header-color="bg-danger" width="sm">
    <p class="text-text-secondary text-sm">{{ message }}</p>
    <template #footer>
      <button @click="close" class="px-4 py-2 border border-gray-200 rounded-lg text-sm text-text-secondary hover:bg-gray-50 transition-colors">
        取消
      </button>
      <button @click="confirm" class="px-4 py-2 bg-danger text-white rounded-lg text-sm hover:opacity-90 transition-colors">
        确认
      </button>
    </template>
  </BaseModal>
</template>

<script setup lang="ts">
import BaseModal from './BaseModal.vue'

defineProps<{
  modelValue: boolean
  message: string
}>()

const emit = defineEmits(['update:modelValue', 'confirm'])

function close() {
  emit('update:modelValue', false)
}

function confirm() {
  emit('confirm')
  close()
}
</script>
