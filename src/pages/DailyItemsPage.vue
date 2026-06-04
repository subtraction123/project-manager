<template>
  <div>
    <div class="flex items-center justify-between mb-6 px-6 py-4 rounded-lg bg-[#172B4D] text-white">
      <h2 class="text-lg font-semibold">日常记录</h2>
      <button @click="showAddModal = true" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors text-sm font-medium">
        + 创建今日待办
      </button>
    </div>

    <!-- Filter tabs -->
    <div class="flex gap-2 mb-4">
      <button v-for="tab in tabs" :key="tab.key" @click="activeTab = tab.key"
        :class="['px-4 py-2 rounded-full text-sm font-medium transition-colors', activeTab === tab.key ? 'bg-primary text-white' : 'bg-white text-text-secondary border border-border-color hover:border-primary']">
        {{ tab.label }} ({{ tab.count }})
      </button>
    </div>

    <div v-if="dailyStore.loading" class="text-center py-16 text-text-muted">加载中...</div>

    <div v-else-if="filteredGroups.length === 0" class="text-center py-16">
      <EmptyState icon="📝" title="暂无事项" description="点击右上角按钮添加日常待办" />
    </div>

    <div v-else class="space-y-3">
      <div v-for="[date, items] in filteredGroups" :key="date" class="bg-white rounded-lg border border-border-color overflow-hidden">
        <div class="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50" @click="toggleDate(date)">
          <div>
            <div class="font-semibold text-text-primary">{{ formatDate(date) }}</div>
            <div class="text-xs text-text-muted mt-0.5">{{ getWeekday(date) }}</div>
          </div>
          <div class="flex items-center gap-3">
            <span class="text-xs text-text-muted">{{ items.length }} 项待办</span>
            <span class="text-xs text-text-muted">{{ expandedDates.has(date) ? '▼' : '▶' }}</span>
          </div>
        </div>
        <div v-if="expandedDates.has(date)" class="border-t border-border-color">
          <div v-for="item in items" :key="item.id"
            class="flex items-center px-5 py-3 hover:bg-blue-50/30 transition-colors border-b border-gray-50 last:border-0">
            <input type="checkbox" :checked="item.is_completed" @change="dailyStore.toggleComplete(item.id)"
              class="w-[18px] h-[18px] mr-3 accent-primary flex-shrink-0 cursor-pointer">
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-text-primary" :class="{ 'line-through text-text-muted': item.is_completed }">{{ item.title }}</div>
              <div v-if="item.description" class="text-xs text-text-muted mt-0.5">{{ item.description }}</div>
            </div>
            <span class="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 mr-2">{{ item.category }}</span>
            <button v-if="!item.is_converted" @click="openConvert(item)" class="px-2.5 py-1 text-xs bg-blue-50 text-primary rounded hover:bg-blue-100 transition-colors mr-1">
              转化
            </button>
            <span v-else class="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-600 mr-2">{{ item.converted_to_type === 'project' ? '已转项目' : '已转任务' }}</span>
            <button @click="deleteItem(item.id)" class="text-text-muted hover:text-danger transition-colors text-sm">✕</button>
          </div>
        </div>
        <!-- Inline add input -->
        <div class="flex items-center gap-2 px-5 py-3 border-t border-gray-100 bg-gray-50/50">
          <input v-model="inlineInputs[date]" @keyup.enter="addInlineItem(date)"
            class="flex-1 px-3 py-2 border border-border-color rounded-lg text-sm focus:border-primary focus:outline-none bg-white"
            placeholder="+ 添加待办事项">
          <button @click="addInlineItem(date)" :disabled="!inlineInputs[date]?.trim()"
            class="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            添加
          </button>
        </div>
      </div>
    </div>

    <!-- Add Item Modal -->
    <BaseModal v-model="showAddModal" title="创建待办事项" subtitle="记录新的日常事项">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">事项标题</label>
          <input v-model="newItem.title" class="w-full px-3 py-2 border border-border-color rounded-lg text-sm focus:border-primary focus:outline-none" placeholder="输入事项标题...">
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">描述</label>
          <textarea v-model="newItem.description" rows="3" class="w-full px-3 py-2 border border-border-color rounded-lg text-sm focus:border-primary focus:outline-none resize-none" placeholder="输入事项描述..."></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">分类</label>
          <div class="flex gap-2">
            <button v-for="cat in categories" :key="cat" @click="newItem.category = cat"
              :class="['px-3 py-1.5 rounded-full text-xs font-medium transition-colors', newItem.category === cat ? 'bg-primary text-white' : 'bg-gray-100 text-text-secondary hover:bg-gray-200']">
              {{ cat }}
            </button>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">日期</label>
          <input v-model="newItem.record_date" type="date" class="w-full px-3 py-2 border border-border-color rounded-lg text-sm focus:border-primary focus:outline-none">
        </div>
      </div>
      <template #footer>
        <button @click="showAddModal = false" class="px-4 py-2 border border-gray-200 rounded-lg text-sm text-text-secondary hover:bg-gray-50">取消</button>
        <button @click="addItem" :disabled="!newItem.title" class="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed">确认</button>
      </template>
    </BaseModal>

    <!-- Convert Modal - Two Step -->
    <BaseModal v-model="showConvertModal" :title="convertStep === 1 ? '' : ''" :subtitle="convertStep === 1 ? '' : ''" width="sm">
      <!-- Step 1: Select type -->
      <div v-if="convertStep === 1">
        <p class="text-base text-text-secondary mb-6">请选择转化类型：</p>
        <div class="flex gap-4">
          <div @click="selectConvertType('task')"
            class="flex-1 p-6 rounded-xl bg-[#f4f5f7] border-2 border-transparent hover:border-primary/30 hover:bg-blue-50/5 cursor-pointer transition-all text-center">
            <div class="w-14 h-14 bg-gradient-to-br from-[#0052CC] to-[#0077FF] rounded-xl flex items-center justify-center text-2xl mx-auto mb-3 text-white">&#10003;</div>
            <div class="text-base font-semibold text-text-primary mb-1">转化为任务</div>
            <div class="text-xs text-text-secondary">将事项转化为具体任务</div>
          </div>
          <div @click="selectConvertType('project')"
            class="flex-1 p-6 rounded-xl bg-[#f4f5f7] border-2 border-transparent hover:border-primary/30 hover:bg-blue-50/5 cursor-pointer transition-all text-center">
            <div class="w-14 h-14 bg-gradient-to-br from-[#00B894] to-[#00CEC9] rounded-xl flex items-center justify-center text-2xl mx-auto mb-3 text-white">&#128193;</div>
            <div class="text-base font-semibold text-text-primary mb-1">转化为项目</div>
            <div class="text-xs text-text-secondary">将事项转化为项目</div>
          </div>
        </div>
      </div>

      <!-- Step 2: Task form -->
      <div v-if="convertStep === 2 && convertType === 'task'">
        <div class="flex items-center gap-2 mb-5">
          <div class="w-9 h-9 bg-gradient-to-br from-[#0052CC] to-[#0077FF] rounded-lg flex items-center justify-center text-lg text-white">&#10003;</div>
          <div>
            <h4 class="text-base font-semibold">转化为任务</h4>
            <p class="text-xs text-text-secondary">补充任务信息</p>
          </div>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1.5">任务名称</label>
            <input v-model="convertData.name" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc]">
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1.5">任务描述</label>
            <textarea v-model="convertData.description" rows="3" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc] resize-none" placeholder="请输入任务描述..."></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1.5">截止时间</label>
            <input v-model="convertData.due_date" type="date" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc]">
          </div>
        </div>
      </div>

      <!-- Step 2: Project form -->
      <div v-if="convertStep === 2 && convertType === 'project'">
        <div class="flex items-center gap-2 mb-5">
          <div class="w-9 h-9 bg-gradient-to-br from-[#00B894] to-[#00CEC9] rounded-lg flex items-center justify-center text-lg text-white">&#128193;</div>
          <div>
            <h4 class="text-base font-semibold">转化为项目</h4>
            <p class="text-xs text-text-secondary">补充项目信息</p>
          </div>
        </div>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1.5">项目名称 <span class="text-red-500">*</span></label>
            <input v-model="convertData.name" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc]">
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1.5">项目描述</label>
            <textarea v-model="convertData.description" rows="3" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc] resize-none" placeholder="请输入项目描述..."></textarea>
          </div>
          <div class="relative">
            <label class="block text-sm font-medium text-text-primary mb-1.5">父级项目</label>
            <input
              v-model="parentSearchText"
              @focus="parentDropdownOpen = true"
              @input="parentDropdownOpen = true"
              @blur="handleParentBlur"
              placeholder="输入名称搜索项目..."
              class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc]">
            <div v-if="parentDropdownOpen" class="absolute z-10 w-full mt-1 bg-white border border-[#e0e4e8] rounded-lg shadow-lg max-h-48 overflow-y-auto">
              <div @mousedown.prevent="selectParent('', '')" class="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer text-text-muted">无（顶级项目）</div>
              <div v-for="p in filteredParentOptions" :key="p.id" @mousedown.prevent="selectParent(p.id, p.name)" class="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">{{ p.name }}</div>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1.5">预计完成时间 <span class="text-red-500">*</span></label>
            <input v-model="convertData.estimated_end_date" type="date" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc]">
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1.5">开发周期（人天） <span class="text-red-500">*</span></label>
            <input v-model="convertData.development_cycle" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc]" placeholder="如：15人天">
          </div>
        </div>
      </div>

      <template #footer>
        <template v-if="convertStep === 1">
          <button @click="showConvertModal = false" class="px-5 py-2.5 border border-[#e0e4e8] rounded-lg text-sm text-text-secondary hover:bg-gray-50">取消</button>
        </template>
        <template v-else>
          <button @click="backToStep1" class="px-5 py-2.5 border border-[#e0e4e8] rounded-lg text-sm text-text-secondary hover:bg-gray-50">← 返回选择</button>
          <button @click="doConvert" :disabled="!canConvert" class="px-6 py-2.5 bg-gradient-to-br from-[#0052CC] to-[#0077FF] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">确认转化</button>
        </template>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { useDailyItemStore } from '@/stores/daily-item'
import { useProjectStore } from '@/stores/project'
import { useTaskStore } from '@/stores/task'
import { useUIStore } from '@/stores/ui'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import BaseModal from '@/components/shared/BaseModal.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import type { DailyItem } from '@/types'

dayjs.locale('zh-cn')

const route = useRoute()
const dailyStore = useDailyItemStore()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const ui = useUIStore()

const showAddModal = ref(false)
const showConvertModal = ref(false)
const activeTab = ref('all')
const expandedDates = ref(new Set<string>())
const convertStep = ref(1)
const inlineInputs = reactive<Record<string, string>>({})
const convertType = ref<'task' | 'project'>('task')
const convertingItem = ref<DailyItem | null>(null)

const newItem = reactive({ title: '', description: '', category: '工作跟进', record_date: dayjs().format('YYYY-MM-DD') })
const convertData = reactive({ project_id: '', name: '', description: '', estimated_end_date: '', development_cycle: '', due_date: '', parent_id: '' })

const categories = ['工作跟进', '项目跟进']

const parentProjectOptions = computed(() => projectStore.projects.filter(p => p.phase !== '上线'))
const parentSearchText = ref('')
const parentDropdownOpen = ref(false)
const filteredParentOptions = computed(() => {
  const q = parentSearchText.value.toLowerCase().trim()
  if (!q) return parentProjectOptions.value
  return parentProjectOptions.value.filter(p => p.name.toLowerCase().includes(q))
})
function selectParent(id: string, name: string) {
  convertData.parent_id = id
  parentSearchText.value = name
  parentDropdownOpen.value = false
}
function handleParentBlur() {
  setTimeout(() => { parentDropdownOpen.value = false }, 150)
}

const tabs = computed(() => [
  { key: 'all', label: '全部', count: dailyStore.items.length },
  { key: 'incomplete', label: '未完成', count: dailyStore.incompleteItems.length },
  { key: 'unconverted', label: '未转化', count: dailyStore.unconvertedItems.length },
])

const filteredGroups = computed(() => {
  let source = dailyStore.items
  if (activeTab.value === 'incomplete') source = dailyStore.incompleteItems
  else if (activeTab.value === 'unconverted') source = dailyStore.unconvertedItems
  const groups: Record<string, DailyItem[]> = {}
  for (const item of source) {
    if (!groups[item.record_date]) groups[item.record_date] = []
    groups[item.record_date].push(item)
  }
  return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
})

const canConvert = computed(() => {
  if (convertStep.value !== 2) return false
  if (convertType.value === 'task') return !!convertData.name
  return !!convertData.name && !!convertData.estimated_end_date && !!convertData.development_cycle
})

function formatDate(date: string) {
  const d = dayjs(date)
  const today = dayjs()
  if (d.isSame(today, 'day')) return `${d.format('M月D日')} · 今天`
  if (d.isSame(today.subtract(1, 'day'), 'day')) return `${d.format('M月D日')} · 昨天`
  return d.format('M月D日')
}

function getWeekday(date: string) {
  return dayjs(date).format('dddd')
}

function toggleDate(date: string) {
  if (expandedDates.value.has(date)) {
    expandedDates.value.delete(date)
  } else {
    expandedDates.value.add(date)
  }
}

async function addItem() {
  if (!newItem.title) return
  const item = await dailyStore.createItem({ ...newItem })
  expandedDates.value.add(item.record_date)
  newItem.title = ''
  newItem.description = ''
  showAddModal.value = false
  ui.addToast({ type: 'success', message: '事项添加成功' })
}

async function addInlineItem(date: string) {
  const title = (inlineInputs[date] || '').trim()
  if (!title) return
  const item = await dailyStore.createItem({
    title,
    description: '',
    category: '工作跟进',
    record_date: date,
  })
  expandedDates.value.add(item.record_date)
  inlineInputs[date] = ''
  ui.addToast({ type: 'success', message: '事项添加成功' })
}

function openConvert(item: DailyItem) {
  convertingItem.value = item
  convertStep.value = 1
  convertType.value = 'task'
  convertData.project_id = ''
  convertData.name = item.title
  convertData.description = ''
  convertData.estimated_end_date = ''
  convertData.development_cycle = ''
  convertData.due_date = ''
  convertData.parent_id = ''
  parentSearchText.value = ''
  parentDropdownOpen.value = false
  showConvertModal.value = true
}

function selectConvertType(type: 'task' | 'project') {
  convertType.value = type
  convertStep.value = 2
}

function backToStep1() {
  convertStep.value = 1
  convertType.value = 'task'
}

async function doConvert() {
  if (!convertingItem.value) return
  try {
    if (convertType.value === 'task') {
      const task = await taskStore.createTask({
        title: convertData.name,
        description: convertData.description,
        project_id: null,
        status: 'doing',
        due_date: convertData.due_date || null,
      })
      await dailyStore.markConverted(convertingItem.value.id, 'task', task.id)
      ui.addToast({ type: 'success', message: '已转化为任务' })
    } else {
      const project = await projectStore.createProject({
        name: convertData.name,
        description: convertData.description || convertingItem.value.description,
        estimated_end_date: convertData.estimated_end_date,
        development_cycle: convertData.development_cycle,
        parent_id: convertData.parent_id || null,
      })
      await dailyStore.markConverted(convertingItem.value.id, 'project', project.id)
      ui.addToast({ type: 'success', message: '已转化为项目' })
    }
    showConvertModal.value = false
    convertingItem.value = null
  } catch (e: any) {
    console.error('doConvert error:', e)
    const msg = typeof e === 'string' ? e : (e?.message || String(e || '转化失败，请重试'))
    ui.addToast({ type: 'error', message: msg })
  }
}

async function deleteItem(id: string) {
  await dailyStore.deleteItem(id)
  ui.addToast({ type: 'success', message: '已删除' })
}

onMounted(async () => {
  await Promise.all([dailyStore.fetchItems(), projectStore.fetchProjects()])
  if (route.query.filter === 'incomplete') activeTab.value = 'incomplete'
  const today = dayjs().format('YYYY-MM-DD')
  expandedDates.value.add(today)
})
</script>
