<template>
  <div>
    <!-- Dark Page Header -->
    <div class="flex items-center justify-between mb-6 px-6 py-4 rounded-lg bg-[#172B4D] text-white">
      <h2 class="text-lg font-semibold">项目列表</h2>
      <button @click="showCreateModal = true" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors text-sm font-medium">
        + 新建项目
      </button>
    </div>

    <!-- Phase Filter Tabs -->
    <div class="flex gap-2 mb-4 bg-white rounded-lg border border-border-color p-1.5 overflow-x-auto">
      <button v-for="tab in filterTabs" :key="tab.key" @click="filterPhase = tab.key"
        :class="['px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap', filterPhase === tab.key ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-50']">
        {{ tab.label }}
      </button>
    </div>

    <div v-if="projectStore.loading" class="text-center py-16 text-text-muted">加载中...</div>

    <div v-else-if="filteredProjects.length === 0" class="text-center py-16">
      <EmptyState icon="📁" title="暂无项目" description="点击右上角按钮创建新项目，或从日常事项转化" />
    </div>

    <!-- Tree List -->
    <div v-else class="flex flex-col gap-3">
      <div v-for="node in projectTree" :key="node.project.id" class="bg-white rounded-lg border border-border-color overflow-hidden">
        <!-- Parent Row -->
        <div class="flex items-center px-4 py-3.5 hover:bg-gray-50 transition-colors cursor-pointer" @click="$router.push(`/projects/${node.project.id}`)">
          <div class="w-6 flex-shrink-0 text-xs text-text-muted" @click.stop="toggleExpand(node.project.id)">
            {{ node.children.length > 0 ? (expanded.has(node.project.id) ? '▼' : '▶') : '' }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold text-text-primary" :class="{ 'line-through text-text-muted': node.project.phase === '上线' || node.project.status === 'terminated' }">{{ node.project.name }}</div>
            <div class="flex items-center gap-2 mt-1">
              <span v-if="node.project.status === 'terminated'" class="text-xs px-2 py-0.5 rounded font-medium bg-red-50 text-red-500">
                已终止
              </span>
              <span :class="['text-xs px-2 py-0.5 rounded font-medium', phaseTagClass(node.project.phase)]">
                {{ node.project.phase || '需求调研' }}
              </span>
              <span class="text-xs text-text-muted">截止: {{ node.project.estimated_end_date }}</span>
              <span v-if="node.project.development_cycle" class="text-xs text-text-muted">周期: {{ node.project.development_cycle }}</span>
            </div>
          </div>
          <div class="flex items-center gap-3 ml-4 flex-shrink-0">
            <div class="w-28 flex items-center gap-2">
              <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-primary rounded-full transition-all" :style="{ width: getPhaseProgress(node.project) + '%' }"></div>
              </div>
              <span class="text-xs text-text-muted w-8 text-right">{{ getPhaseProgress(node.project) }}%</span>
            </div>
            <button @click.stop="$router.push(`/projects/${node.project.id}`)" class="px-3 py-1.5 border border-border-color rounded-md text-xs text-text-secondary hover:border-primary hover:text-primary transition-colors">
              查看详情
            </button>
            <button v-if="node.project.status !== 'archived'" @click.stop="archiveProject(node.project.id)" class="px-3 py-1.5 border border-border-color rounded-md text-xs text-text-secondary hover:border-warning hover:text-warning transition-colors">
              归档
            </button>
            <button @click.stop="deleteProject(node.project.id)" class="px-3 py-1.5 border border-border-color rounded-md text-xs text-text-secondary hover:border-danger hover:text-danger transition-colors">
              删除
            </button>
          </div>
        </div>

        <!-- Children -->
        <div v-if="node.children.length > 0 && expanded.has(node.project.id)" class="border-t border-border-color bg-gray-50/50">
          <div v-for="child in node.children" :key="child.id"
            class="flex items-center px-4 py-3 pl-10 hover:bg-gray-100 transition-colors cursor-pointer border-b border-gray-100 last:border-0"
            @click="$router.push(`/projects/${child.id}`)">
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-text-primary" :class="{ 'line-through text-text-muted': child.phase === '上线' || child.status === 'terminated' }">{{ child.name }}</div>
              <div class="flex items-center gap-2 mt-1">
                <span v-if="child.status === 'terminated'" class="text-xs px-2 py-0.5 rounded font-medium bg-red-50 text-red-500">
                  已终止
                </span>
                <span :class="['text-xs px-2 py-0.5 rounded font-medium', phaseTagClass(child.phase)]">
                  {{ child.phase || '需求调研' }}
                </span>
                <span class="text-xs text-text-muted">截止: {{ child.estimated_end_date }}</span>
              </div>
            </div>
            <div class="flex items-center gap-3 ml-4 flex-shrink-0">
              <div class="w-28 flex items-center gap-2">
                <div class="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div class="h-full bg-primary rounded-full transition-all" :style="{ width: getPhaseProgress(child) + '%' }"></div>
                </div>
                <span class="text-xs text-text-muted w-8 text-right">{{ getPhaseProgress(child) }}%</span>
              </div>
              <button @click.stop="$router.push(`/projects/${child.id}`)" class="px-3 py-1.5 border border-border-color rounded-md text-xs text-text-secondary hover:border-primary hover:text-primary transition-colors">
                查看详情
              </button>
              <button @click.stop="deleteProject(child.id)" class="px-3 py-1.5 border border-border-color rounded-md text-xs text-text-secondary hover:border-danger hover:text-danger transition-colors">
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Project Modal -->
    <BaseModal v-model="showCreateModal" title="新建项目" subtitle="创建新的项目信息" width="sm">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">项目名称 <span class="text-red-500">*</span></label>
          <input v-model="newProject.name" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc]" placeholder="请输入项目名称...">
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
          <label class="block text-sm font-medium text-text-primary mb-1.5">项目描述</label>
          <textarea v-model="newProject.description" rows="3" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc] resize-none" placeholder="请输入项目描述..."></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-2">项目阶段</label>
          <div class="flex flex-wrap gap-2">
            <div v-for="phase in phases" :key="phase.value"
              @click="newProject.phase = phase.value"
              :class="['inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all select-none', newProject.phase === phase.value ? phase.selectedClass : phase.baseClass]">
              <span class="text-xs font-bold" :class="{ 'hidden': newProject.phase !== phase.value }">✓</span>
              {{ phase.label }}
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1.5">预计完成时间 <span class="text-red-500">*</span></label>
            <input v-model="newProject.estimated_end_date" type="date" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc]">
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1.5">开发周期（人天） <span class="text-red-500">*</span></label>
            <input v-model="newProject.development_cycle" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc]" placeholder="如：15人天">
          </div>
        </div>
      </div>
      <template #footer>
        <button @click="showCreateModal = false" class="px-5 py-2.5 border border-[#e0e4e8] rounded-lg text-sm text-text-secondary hover:bg-gray-50">取消</button>
        <button @click="createProject" :disabled="!newProject.name || !newProject.estimated_end_date || !newProject.development_cycle" class="px-6 py-2.5 bg-gradient-to-br from-[#0052CC] to-[#0077FF] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">确认创建</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import { useUIStore } from '@/stores/ui'
import { useDB } from '@/lib/db'
import BaseModal from '@/components/shared/BaseModal.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import type { Project } from '@/types'

const projectStore = useProjectStore()
const ui = useUIStore()
const route = useRoute()
const { query: dbQuery } = useDB()

const showCreateModal = ref(false)
const filterPhase = ref('all')
const expanded = ref(new Set<string>())
const riskProjectIds = ref(new Set<string>())

const filterTabs = [
  { key: 'all', label: '全部' },
  { key: '需求调研', label: '需求调研' },
  { key: '方案设计', label: '方案设计' },
  { key: '实施配置', label: '实施配置' },
  { key: '上线', label: '上线' },
  { key: 'terminated', label: '已终止' },
  { key: 'archived', label: '已归档' },
]

const phases = [
  { value: '需求调研', label: '需求调研', baseClass: 'bg-blue-50 text-blue-500', selectedClass: 'bg-blue-500 text-white' },
  { value: '方案设计', label: '方案设计', baseClass: 'bg-purple-50 text-purple-500', selectedClass: 'bg-purple-500 text-white' },
  { value: '实施配置', label: '实施配置', baseClass: 'bg-cyan-50 text-cyan-500', selectedClass: 'bg-cyan-500 text-white' },
  { value: '上线', label: '上线', baseClass: 'bg-green-50 text-green-500', selectedClass: 'bg-green-500 text-white' },
]

const filteredProjects = computed(() => {
  if (filterPhase.value === 'risk') return projectStore.projects.filter(p => riskProjectIds.value.has(p.id))
  if (filterPhase.value === 'active') return projectStore.projects.filter(p => p.status === 'active')
  if (filterPhase.value === 'terminated') return projectStore.projects.filter(p => p.status === 'terminated')
  if (filterPhase.value === 'all') return projectStore.projects
  if (filterPhase.value === 'archived') return projectStore.projects.filter(p => p.status === 'archived')
  return projectStore.projects.filter(p => (p.phase || '需求调研') === filterPhase.value)
})

interface TreeNode {
  project: Project
  children: Project[]
}

const projectTree = computed(() => {
  const roots = filteredProjects.value.filter(p => !p.parent_id)
  const children = filteredProjects.value.filter(p => p.parent_id)
  return roots.map(p => ({
    project: p,
    children: children.filter(c => c.parent_id === p.id),
  }))
})

const parentProjectOptions = computed(() => projectStore.projects.filter(p => p.phase !== '上线'))
const parentSearchText = ref('')
const parentDropdownOpen = ref(false)
const filteredParentOptions = computed(() => {
  const q = parentSearchText.value.toLowerCase().trim()
  if (!q) return parentProjectOptions.value
  return parentProjectOptions.value.filter(p => p.name.toLowerCase().includes(q))
})

function selectParent(id: string, name: string) {
  newProject.parent_id = id
  parentSearchText.value = name
  parentDropdownOpen.value = false
}

function handleParentBlur() {
  setTimeout(() => { parentDropdownOpen.value = false }, 150)
}

const newProject = reactive({
  name: '', description: '', estimated_end_date: '', development_cycle: '', phase: '需求调研', parent_id: '',
})

function getPhaseProgress(project: { status?: string; phase?: string }): number {
  if (project.status === 'archived' || project.status === 'terminated') return 100
  const map: Record<string, number> = {
    '需求调研': 10,
    '方案设计': 30,
    '实施配置': 70,
    '上线': 90,
  }
  return map[project.phase || ''] ?? 10
}

function phaseTagClass(phase?: string) {
  const map: Record<string, string> = {
    '需求调研': 'bg-blue-50 text-blue-500',
    '方案设计': 'bg-purple-50 text-purple-500',
    '实施配置': 'bg-cyan-50 text-cyan-500',
    '上线': 'bg-green-50 text-green-500',
  }
  if (phase === 'terminated') return 'bg-red-50 text-red-500'
  return map[phase || ''] || map['需求调研']
}

function toggleExpand(id: string) {
  if (expanded.value.has(id)) {
    expanded.value.delete(id)
  } else {
    expanded.value.add(id)
  }
}

async function createProject() {
  if (!newProject.name || !newProject.estimated_end_date || !newProject.development_cycle) return
  await projectStore.createProject({
    name: newProject.name,
    description: newProject.description,
    estimated_end_date: newProject.estimated_end_date,
    development_cycle: newProject.development_cycle,
    phase: newProject.phase,
    parent_id: newProject.parent_id || null,
  })
  showCreateModal.value = false
  newProject.name = ''
  newProject.description = ''
  newProject.estimated_end_date = ''
  newProject.development_cycle = ''
  newProject.phase = '需求调研'
  newProject.parent_id = ''
  parentSearchText.value = ''
  parentDropdownOpen.value = false
  ui.addToast({ type: 'success', message: '项目创建成功' })
}

async function archiveProject(id: string) {
  await projectStore.archiveProject(id)
  ui.addToast({ type: 'info', message: '项目已归档' })
}

async function deleteProject(id: string) {
  await projectStore.deleteProject(id)
  ui.addToast({ type: 'success', message: '项目已删除' })
}

onMounted(async () => {
  await projectStore.fetchProjects()
  const queryFilter = route.query.filter as string
  if (queryFilter === 'risk') {
    const risks = await dbQuery<{ project_id: string }>(
      `SELECT DISTINCT r.project_id FROM project_risks r
       LEFT JOIN projects p ON r.project_id = p.id
       WHERE r.status != ? AND (p.phase IS NULL OR p.phase != '上线')`,
      ['已解决']
    )
    riskProjectIds.value = new Set(risks.map(r => r.project_id))
    filterPhase.value = 'risk'
  } else if (queryFilter === 'active') {
    filterPhase.value = 'active'
  }
})
</script>
