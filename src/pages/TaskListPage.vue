<template>
  <div>
    <div class="flex items-center justify-between mb-6 px-6 py-4 rounded-lg bg-[#172B4D] text-white">
      <h2 class="text-lg font-semibold">任务列表</h2>
      <button @click="showCreateModal = true" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors text-sm font-medium">
        + 新建任务
      </button>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap gap-3 mb-4">
      <select v-model="filterStatus" class="px-3 py-2 border border-border-color rounded-lg text-sm focus:border-primary focus:outline-none bg-white">
        <option value="">全部状态</option>
        <option value="pending">待办</option>
        <option value="doing">进行中</option>
        <option value="done">已完成</option>
      </select>
      <select v-model="filterProject" class="px-3 py-2 border border-border-color rounded-lg text-sm focus:border-primary focus:outline-none bg-white">
        <option value="">全部项目</option>
        <option v-for="p in projectStore.projects" :key="p.id" :value="p.id">{{ p.name }}</option>
      </select>
      <select v-model="filterPriority" class="px-3 py-2 border border-border-color rounded-lg text-sm focus:border-primary focus:outline-none bg-white">
        <option value="">全部优先级</option>
        <option value="high">高</option>
        <option value="medium">中</option>
        <option value="low">低</option>
      </select>
    </div>

    <div v-if="taskStore.loading" class="text-center py-16 text-text-muted">加载中...</div>

    <div v-else-if="filteredTasks.length === 0" class="text-center py-16">
      <EmptyState icon="✅" title="暂无任务" description="创建项目后可以添加任务" />
    </div>

    <div v-else class="space-y-2">
      <div v-for="task in filteredTasks" :key="task.id"
        :class="['bg-white rounded-lg border p-4 flex items-center transition-colors hover:border-primary cursor-pointer', task.status === 'done' ? 'opacity-60 border-l-4 border-l-success' : task.status === 'doing' ? 'border-l-4 border-l-primary' : 'border-l-4 border-l-warning']"
        @click="openDetail(task)">
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1.5">
            <span class="text-sm font-medium text-text-primary" :class="{ 'line-through text-text-muted': task.status === 'done' }">{{ task.title }}</span>
            <StatusBadge :status="task.status" type="task" />
            <PriorityBadge :priority="task.priority" />
          </div>
          <div class="flex items-center gap-3 text-xs text-text-muted">
            <span v-if="task.project_name">{{ task.project_name }}</span>
            <span v-if="task.assignee">负责人: {{ task.assignee }}</span>
            <span v-if="task.due_date">截止: {{ task.due_date }}</span>
          </div>
        </div>
        <div class="flex items-center gap-2 ml-4">
          <select :value="task.status" @change="changeStatus(task, ($event.target as HTMLSelectElement).value as TaskStatus)" @click.stop
            class="px-2 py-1 border border-border-color rounded text-xs focus:border-primary focus:outline-none bg-white">
            <option value="doing">进行中</option>
            <option value="done">已完成</option>
          </select>
          <button @click.stop="deleteTask(task.id)" class="text-text-muted hover:text-danger transition-colors text-sm">✕</button>
        </div>
      </div>
    </div>

    <!-- Create Task Modal -->
    <BaseModal v-model="showCreateModal" title="新建任务" subtitle="创建一个新的任务">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">任务标题 <span class="text-red-500">*</span></label>
          <input v-model="newTask.title" class="w-full px-3 py-2 border border-border-color rounded-lg text-sm focus:border-primary focus:outline-none" placeholder="输入任务标题">
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">所属项目 <span class="text-red-500">*</span></label>
          <select v-model="newTask.project_id" class="w-full px-3 py-2 border border-border-color rounded-lg text-sm focus:border-primary focus:outline-none">
            <option value="">请选择项目</option>
            <option v-for="p in projectStore.activeProjects" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1.5">优先级</label>
            <select v-model="newTask.priority" class="w-full px-3 py-2 border border-border-color rounded-lg text-sm focus:border-primary focus:outline-none">
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1.5">负责人</label>
            <input v-model="newTask.assignee" class="w-full px-3 py-2 border border-border-color rounded-lg text-sm focus:border-primary focus:outline-none" placeholder="输入负责人">
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">截止日期</label>
          <input v-model="newTask.due_date" type="date" class="w-full px-3 py-2 border border-border-color rounded-lg text-sm focus:border-primary focus:outline-none">
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">描述</label>
          <textarea v-model="newTask.description" rows="2" class="w-full px-3 py-2 border border-border-color rounded-lg text-sm focus:border-primary focus:outline-none resize-none"></textarea>
        </div>
      </div>
      <template #footer>
        <button @click="showCreateModal = false" class="px-4 py-2 border border-gray-200 rounded-lg text-sm text-text-secondary hover:bg-gray-50">取消</button>
        <button @click="createTask" :disabled="!newTask.title || !newTask.project_id" class="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed">确认</button>
      </template>
    </BaseModal>

    <!-- Task Detail Modal -->
    <teleport to="body">
      <div v-if="detailTask" class="fixed inset-0 z-50 flex items-center justify-center" @click.self="detailTask = null">
        <div class="absolute inset-0 bg-black/50"></div>
        <div class="relative w-[480px] max-w-[92vw] bg-white rounded-2xl shadow-2xl overflow-hidden" style="animation: modalFadeIn 0.2s ease-out;">
          <!-- Gradient Header -->
          <div class="flex justify-between items-start px-6 pb-10 pt-6 bg-gradient-to-br from-[#0052CC] to-[#0077FF]">
            <div>
              <h3 class="text-lg font-semibold text-white">任务详情</h3>
              <p class="text-sm text-white/80 mt-1">查看和编辑任务信息</p>
            </div>
            <button @click="detailTask = null" class="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors">×</button>
          </div>
          <!-- Form -->
          <div class="px-6 pb-6 -mt-5 bg-white rounded-t-2xl relative">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-text-primary mb-1.5">任务名称</label>
                <input v-model="detailForm.title" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc]">
              </div>
              <div>
                <label class="block text-sm font-medium text-text-primary mb-1.5">任务描述</label>
                <textarea v-model="detailForm.description" rows="4" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc] resize-none" placeholder="请输入任务描述..."></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-text-primary mb-1.5">截止时间</label>
                <input v-model="detailForm.due_date" type="date" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc]">
              </div>
            </div>
          </div>
          <!-- Footer -->
          <div class="flex justify-end gap-3 px-6 py-4 bg-[#fafbfc] border-t border-[#e0e4e8]">
            <button @click="detailTask = null" class="px-5 py-2.5 border border-[#e0e4e8] rounded-lg text-sm text-text-secondary hover:bg-gray-50">取消</button>
            <button @click="saveTaskDetail" class="px-6 py-2.5 bg-gradient-to-br from-[#0052CC] to-[#0077FF] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all">保存修改</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTaskStore } from '@/stores/task'
import { useProjectStore } from '@/stores/project'
import { useUIStore } from '@/stores/ui'
import type { TaskStatus, Task } from '@/types'
import BaseModal from '@/components/shared/BaseModal.vue'
import StatusBadge from '@/components/shared/StatusBadge.vue'
import PriorityBadge from '@/components/shared/PriorityBadge.vue'
import EmptyState from '@/components/shared/EmptyState.vue'

const taskStore = useTaskStore()
const projectStore = useProjectStore()
const ui = useUIStore()
const route = useRoute()

const showCreateModal = ref(false)
const filterStatus = ref((route.query.status as string) || '')
const filterProject = ref('')
const filterPriority = ref('')
const detailTask = ref<Task | null>(null)

const newTask = reactive({
  title: '', description: '', project_id: '', priority: 'medium' as string, assignee: '', due_date: '',
})
const detailForm = reactive({
  title: '', description: '', due_date: '',
})

const filteredTasks = computed(() => {
  return taskStore.tasks.filter(t => {
    if (filterStatus.value && t.status !== filterStatus.value) return false
    if (filterProject.value && t.project_id !== filterProject.value) return false
    if (filterPriority.value && t.priority !== filterPriority.value) return false
    return true
  })
})

async function changeStatus(task: Task, newStatus: TaskStatus) {
  await taskStore.transitionStatus(task.id, newStatus)
  ui.addToast({ type: 'success', message: '状态已更新' })
}

async function createTask() {
  if (!newTask.title || !newTask.project_id) return
  await taskStore.createTask({ ...newTask, priority: newTask.priority as Task['priority'] })
  showCreateModal.value = false
  newTask.title = ''
  newTask.description = ''
  newTask.project_id = ''
  ui.addToast({ type: 'success', message: '任务创建成功' })
}

async function deleteTask(id: string) {
  await taskStore.deleteTask(id)
  ui.addToast({ type: 'success', message: '任务已删除' })
}

function openDetail(task: Task) {
  detailTask.value = task
  detailForm.title = task.title
  detailForm.description = task.description
  detailForm.due_date = task.due_date || ''
}

async function saveTaskDetail() {
  if (!detailTask.value) return
  await taskStore.updateTask(detailTask.value.id, {
    title: detailForm.title,
    description: detailForm.description,
    due_date: detailForm.due_date || null,
  })
  detailTask.value = null
  ui.addToast({ type: 'success', message: '任务已更新' })
}

onMounted(async () => {
  await Promise.all([taskStore.fetchTasks(), projectStore.fetchProjects()])
})
</script>
