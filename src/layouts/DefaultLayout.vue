<template>
  <div class="flex h-screen bg-bg-light overflow-hidden">
    <AppSidebar @toggle="ui.toggleSidebar()" />
    <div class="flex-1 flex flex-col overflow-hidden">
      <AppHeader />
      <main class="flex-1 overflow-auto p-6">
        <router-view />
      </main>
    </div>
    <NotificationToast />
  </div>
</template>

<script setup lang="ts">
import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import NotificationToast from '@/components/shared/NotificationToast.vue'
import { useUIStore } from '@/stores/ui'

const ui = useUIStore()
</script>
