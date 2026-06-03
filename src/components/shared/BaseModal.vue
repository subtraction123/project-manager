<template>
  <teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="close">
      <div class="absolute inset-0 bg-black/50"></div>
      <div :class="['relative bg-white rounded-2xl shadow-2xl overflow-hidden', widthClass]" style="animation: modalFadeIn 0.2s ease-out;">
        <!-- Gradient Header -->
        <div v-if="title" :class="['flex justify-between items-start px-6 pb-10 pt-6', headerClass]">
          <div>
            <h3 class="text-lg font-semibold text-white">{{ title }}</h3>
            <p v-if="subtitle" class="text-sm text-white/80 mt-1">{{ subtitle }}</p>
          </div>
          <button @click="close" class="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors flex-shrink-0 ml-3">
            ×
          </button>
        </div>
        <!-- Form area - overlaps header -->
        <div :class="title ? 'px-6 pb-6 -mt-5 bg-white rounded-t-2xl relative' : 'p-6'">
          <slot />
        </div>
        <!-- Footer -->
        <div v-if="$slots.footer" class="flex justify-end gap-3 px-6 py-4 bg-[#fafbfc] border-t border-[#e0e4e8]">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: boolean
  title?: string
  subtitle?: string
  width?: 'sm' | 'md' | 'lg'
  headerColor?: string
}>(), {
  width: 'md',
  headerColor: 'bg-gradient-to-br from-[#0052CC] to-[#0077FF]',
})

const emit = defineEmits(['update:modelValue'])

const widthClass = {
  sm: 'w-[380px] max-w-[92vw]',
  md: 'w-[480px] max-w-[92vw]',
  lg: 'w-[640px] max-w-[92vw]',
}[props.width]

const headerClass = props.headerColor

function close() {
  emit('update:modelValue', false)
}
</script>
