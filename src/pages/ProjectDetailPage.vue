<template>
  <div v-if="project">
    <!-- Dark Page Header -->
    <div class="flex items-center justify-between mb-6 px-6 py-4 rounded-lg bg-[#172B4D] text-white">
      <div class="flex items-center gap-3">
        <button @click="$router.push('/projects')" class="px-3 py-1.5 bg-white border border-border-color rounded-lg text-xs text-text-secondary hover:text-primary hover:border-primary transition-colors">
          ← 返回项目列表
        </button>
        <h2 class="text-lg font-semibold">{{ project.name }}</h2>
      </div>
      <button @click="toggleEditMode" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors text-sm font-medium">
        {{ editingInfo ? '取消编辑' : '编辑项目' }}
      </button>
    </div>

    <!-- Project Info Section Card -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 mb-5 overflow-hidden">
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[#fafbfc]">
        <h3 class="text-sm font-semibold text-text-primary">项目基本信息</h3>
      </div>

      <!-- View Mode -->
      <div v-if="!editingInfo" class="divide-y divide-gray-50">
        <div class="flex px-5 py-3">
          <div class="w-24 text-sm text-text-muted font-medium flex-shrink-0">项目名称</div>
          <div class="flex-1 text-sm text-text-primary">{{ project.name }}</div>
        </div>
        <div class="flex px-5 py-3">
          <div class="w-24 text-sm text-text-muted font-medium flex-shrink-0">项目描述</div>
          <div class="flex-1 text-sm text-text-primary">{{ project.description || '-' }}</div>
        </div>
        <div class="flex px-5 py-3">
          <div class="w-24 text-sm text-text-muted font-medium flex-shrink-0">预计完成</div>
          <div class="flex-1 text-sm text-text-primary">{{ project.estimated_end_date || '-' }}</div>
        </div>
        <div class="flex px-5 py-3">
          <div class="w-24 text-sm text-text-muted font-medium flex-shrink-0">开发周期（人天）</div>
          <div class="flex-1 text-sm text-text-primary">{{ project.development_cycle || '-' }}</div>
        </div>
        <div class="flex px-5 py-3">
          <div class="w-24 text-sm text-text-muted font-medium flex-shrink-0">优先级</div>
          <div class="flex-1 text-sm text-text-primary">{{ priorityLabel(project.priority) }}</div>
        </div>
        <div class="flex px-5 py-3">
          <div class="w-24 text-sm text-text-muted font-medium flex-shrink-0">当前阶段</div>
          <div class="flex-1">
            <span :class="['inline-flex items-center gap-1 px-4 py-1.5 rounded-full text-sm font-medium', phaseSelectedClass(project.phase)]">
              <span class="text-xs font-bold">✓</span>
              {{ project.phase || '需求调研' }}
            </span>
          </div>
        </div>
        <div v-if="parentProject" class="flex px-5 py-3">
          <div class="w-24 text-sm text-text-muted font-medium flex-shrink-0">父级项目</div>
          <div class="flex-1 text-sm">
            <router-link :to="`/projects/${parentProject.id}`" class="text-primary hover:underline">{{ parentProject.name }}</router-link>
          </div>
        </div>
        <div v-if="childProjects.length > 0" class="flex px-5 py-3">
          <div class="w-24 text-sm text-text-muted font-medium flex-shrink-0">子项目</div>
          <div class="flex-1 text-sm flex flex-wrap gap-1">
            <router-link v-for="c in childProjects" :key="c.id" :to="`/projects/${c.id}`" class="text-primary hover:underline">{{ c.name }}</router-link>
            <span v-if="childProjects.length === 0" class="text-text-muted">-</span>
          </div>
        </div>
      </div>

      <!-- Edit Mode -->
      <div v-else class="p-5 space-y-4">
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">项目名称</label>
          <input v-model="editForm.name" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc]">
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">项目描述</label>
          <textarea v-model="editForm.description" rows="3" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc] resize-none"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">预计完成时间</label>
          <input v-model="editForm.estimated_end_date" type="date" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc]">
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">开发周期（人天）</label>
          <input v-model="editForm.development_cycle" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc]" placeholder="如：15人天">
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">优先级</label>
          <select v-model="editForm.priority" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc]">
            <option value="low">低</option>
            <option value="medium">中</option>
            <option value="high">高</option>
          </select>
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
            <div v-for="p in filteredAvailableParents" :key="p.id" @mousedown.prevent="selectParent(p.id, p.name)" class="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">{{ p.name }}</div>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-2">当前阶段</label>
          <div class="flex flex-wrap gap-3">
            <div v-for="phase in phases" :key="phase.value"
              @click="editForm.phase = phase.value"
              :class="['inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all select-none', editForm.phase === phase.value ? phase.selectedClass : phase.baseClass]">
              <span class="text-xs font-bold" :class="{ 'hidden': editForm.phase !== phase.value }">✓</span>
              {{ phase.label }}
            </div>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-2">项目状态</label>
          <select v-model="editForm.status" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc]">
            <option value="active">进行中</option>
            <option value="terminated">已终止</option>
            <option value="archived">已归档</option>
          </select>
        </div>
        <div class="flex justify-end gap-3 pt-3 border-t border-gray-100">
          <button @click="toggleEditMode" class="px-4 py-2 border border-[#e0e4e8] rounded-lg text-sm text-text-secondary hover:bg-gray-50">取消</button>
          <button @click="saveProjectInfo" class="px-4 py-2 bg-gradient-to-br from-[#0052CC] to-[#0077FF] text-white rounded-lg text-sm font-medium hover:opacity-90">保存</button>
        </div>
      </div>
    </div>

    <!-- Project Nodes Section Card -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 mb-5 overflow-hidden">
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[#fafbfc]">
        <h3 class="text-sm font-semibold text-text-primary">项目节点信息</h3>
        <button @click="editingMilestone = null; showMilestoneModal = true" class="px-3 py-1.5 bg-primary text-white rounded-md text-xs font-medium hover:bg-primary-light transition-colors">
          + 新增节点
        </button>
      </div>
      <div class="p-3">
        <div v-if="milestoneStore.milestones.length === 0" class="py-10 text-center text-text-muted text-sm">暂无节点</div>
        <div v-for="m in milestoneStore.milestones" :key="m.id" class="bg-[#fafbfc] rounded-lg p-3 mb-2 border border-[#e0e4e8] last:mb-0">
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-sm font-semibold text-text-primary">{{ m.name }}</span>
              <span :class="['px-2 py-0.5 rounded text-xs font-medium', m.status === 'achieved' ? 'bg-green-50 text-green-500' : m.status === 'delayed' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500']">
                {{ m.status === 'achieved' ? '已完成' : m.status === 'delayed' ? '已延期' : '进行中' }}
              </span>
            </div>
            <div class="flex items-center gap-1">
              <button @click="editMilestone(m)" class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-200 text-sm transition-colors">✏️</button>
              <button @click="deleteMilestone(m.id)" class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-200 text-sm transition-colors">🗑️</button>
            </div>
          </div>
          <div class="text-xs text-text-secondary space-y-1">
            <div v-if="m.description">节点任务：{{ m.description }}</div>
            <div>目标日期：{{ m.target_date }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Risk Management Section Card -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 mb-5 overflow-hidden">
      <div class="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-[#fafbfc]">
        <h3 class="text-sm font-semibold text-text-primary">项目风险信息</h3>
        <button @click="showRiskModal = true" class="px-3 py-1.5 bg-primary text-white rounded-md text-xs font-medium hover:bg-primary-light transition-colors">
          + 新增风险
        </button>
      </div>
      <div class="p-3">
        <div v-if="risks.length === 0" class="py-10 text-center text-text-muted text-sm">暂无风险</div>
        <div v-for="risk in risks" :key="risk.id"
          :class="['rounded-lg p-4 mb-3 last:mb-0', risk.level === '高' ? 'bg-red-50 border border-red-200' : risk.level === '中' ? 'bg-orange-50 border border-orange-200' : 'bg-amber-50 border border-amber-200']">
          <div class="flex items-center justify-between mb-2">
            <span :class="['text-sm font-semibold', risk.level === '高' ? 'text-red-500' : risk.level === '中' ? 'text-orange-500' : 'text-amber-500']">
              {{ risk.title }}
            </span>
            <span :class="['px-2 py-0.5 rounded text-xs font-medium', risk.level === '高' ? 'bg-red-200 text-red-500' : risk.level === '中' ? 'bg-orange-200 text-orange-500' : 'bg-amber-200 text-amber-500']">
              {{ risk.level }}风险
            </span>
          </div>
          <div v-if="risk.description" class="text-xs text-text-secondary mb-2">{{ risk.description }}</div>
          <div v-if="risk.strategy" class="text-xs text-text-secondary mb-2">跟进策略：{{ risk.strategy }}</div>
          <div class="flex items-center gap-4 text-xs text-text-muted mb-2">
            <span>记录时间：{{ risk.recorded_date }}</span>
            <span>处理状态：{{ risk.status }}</span>
          </div>
          <div class="flex items-center gap-1">
            <button @click="editRisk(risk)" class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-200/50 text-sm transition-colors">✏️</button>
            <button @click="deleteRisk(risk.id)" class="w-7 h-7 flex items-center justify-center rounded-md hover:bg-gray-200/50 text-sm transition-colors">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Add/Edit Milestone -->
    <BaseModal v-model="showMilestoneModal" :title="editingMilestone ? '编辑节点' : '新增节点'" :subtitle="editingMilestone ? '修改项目节点信息' : '添加项目节点信息'" width="sm">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">节点名称 <span class="text-red-500">*</span></label>
          <input v-model="milestoneForm.name" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc]" placeholder="请输入节点名称...">
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">节点任务</label>
          <textarea v-model="milestoneForm.description" rows="3" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc] resize-none" placeholder="请输入节点任务..."></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">目标日期 <span class="text-red-500">*</span></label>
          <input v-model="milestoneForm.target_date" type="date" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc]">
        </div>
        <div v-if="editingMilestone">
          <label class="block text-sm font-medium text-text-primary mb-1.5">节点状态</label>
          <select v-model="milestoneForm.status" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-primary focus:outline-none bg-[#fafbfc]">
            <option value="pending">进行中</option>
            <option value="achieved">已完成</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button @click="closeMilestoneModal" class="px-5 py-2.5 border border-[#e0e4e8] rounded-lg text-sm text-text-secondary hover:bg-gray-50">取消</button>
        <button @click="saveMilestone" :disabled="!milestoneForm.name || !milestoneForm.target_date" class="px-6 py-2.5 bg-gradient-to-br from-[#0052CC] to-[#0077FF] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">{{ editingMilestone ? '确认修改' : '确认添加' }}</button>
      </template>
    </BaseModal>

    <!-- Modal: Add/Edit Risk -->
    <BaseModal v-model="showRiskModal" :title="editingRisk ? '编辑风险' : '新增风险'" :subtitle="editingRisk ? '修改项目风险信息' : '添加项目风险信息'" width="sm" headerColor="bg-gradient-to-br from-[#FF4D4F] to-[#FF7875]">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">风险项</label>
          <input v-model="riskForm.title" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-[#FF4D4F] focus:outline-none bg-[#fafbfc]" placeholder="请输入风险项名称...">
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">风险描述</label>
          <textarea v-model="riskForm.description" rows="2" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-[#FF4D4F] focus:outline-none bg-[#fafbfc] resize-none" placeholder="请输入风险描述..."></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">跟进策略</label>
          <textarea v-model="riskForm.strategy" rows="2" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-[#FF4D4F] focus:outline-none bg-[#fafbfc] resize-none" placeholder="请输入跟进策略..."></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-2">风险级别</label>
          <div class="flex gap-3">
            <div v-for="level in ['高', '中', '低']" :key="level"
              @click="riskForm.level = level"
              :class="['inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all select-none', riskForm.level === level ? (level === '高' ? 'bg-red-500 text-white' : level === '中' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white') : (level === '高' ? 'bg-red-50 text-red-500' : level === '中' ? 'bg-orange-50 text-orange-500' : 'bg-green-50 text-green-500')]">
              <span class="text-xs font-bold" :class="{ 'hidden': riskForm.level !== level }">✓</span>
              {{ level }}风险
            </div>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">处理状态</label>
          <select v-model="riskForm.status" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-[#FF4D4F] focus:outline-none bg-[#fafbfc]">
            <option value="处理中">处理中</option>
            <option value="已解决">已解决</option>
            <option value="待评估">待评估</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button @click="closeRiskModal" class="px-5 py-2.5 border border-[#e0e4e8] rounded-lg text-sm text-text-secondary hover:bg-gray-50">取消</button>
        <button @click="saveRisk" :disabled="!riskForm.title" class="px-6 py-2.5 bg-gradient-to-br from-[#FF4D4F] to-[#FF7875] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">确认{{ editingRisk ? '修改' : '添加' }}</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useDB } from '@/lib/db'
import { useProjectStore } from '@/stores/project'
import { useMilestoneStore } from '@/stores/milestone'
import { useUIStore } from '@/stores/ui'
import type { Milestone, ProjectRisk, Project } from '@/types'
import BaseModal from '@/components/shared/BaseModal.vue'

const route = useRoute()
const { query, run, generateId, now } = useDB()
const projectStore = useProjectStore()
const milestoneStore = useMilestoneStore()
const ui = useUIStore()

const editingInfo = ref(false)
const showMilestoneModal = ref(false)
const showRiskModal = ref(false)
const editingRisk = ref<ProjectRisk | null>(null)
const risks = ref<ProjectRisk[]>([])

const projectId = computed(() => route.params.id as string)
const project = computed(() => projectStore.getById(projectId.value))

const phases = [
  { value: '待排期', label: '待排期', baseClass: 'bg-gray-50 text-gray-500', selectedClass: 'bg-gray-500 text-white' },
  { value: '需求调研', label: '需求调研', baseClass: 'bg-blue-50 text-blue-500', selectedClass: 'bg-blue-500 text-white' },
  { value: '方案设计', label: '方案设计', baseClass: 'bg-purple-50 text-purple-500', selectedClass: 'bg-purple-500 text-white' },
  { value: '实施配置', label: '实施配置', baseClass: 'bg-cyan-50 text-cyan-500', selectedClass: 'bg-cyan-500 text-white' },
  { value: '上线', label: '上线', baseClass: 'bg-green-50 text-green-500', selectedClass: 'bg-green-500 text-white' },
]

const parentProject = computed(() => {
  if (!project.value?.parent_id) return null
  return projectStore.getById(project.value.parent_id)
})

const childProjects = computed(() => {
  return projectStore.projects.filter(p => p.parent_id === projectId.value)
})

const editForm = reactive({ name: '', description: '', estimated_end_date: '', development_cycle: '', phase: '', parent_id: '', priority: 'medium' as Project['priority'], status: 'active' as Project['status'] })

const availableParents = computed(() => {
  return projectStore.projects.filter(p => p.id !== projectId.value && p.phase !== '上线')
})
const parentSearchText = ref('')
const parentDropdownOpen = ref(false)
const filteredAvailableParents = computed(() => {
  const q = parentSearchText.value.toLowerCase().trim()
  if (!q) return availableParents.value
  return availableParents.value.filter(p => p.name.toLowerCase().includes(q))
})

function selectParent(id: string, name: string) {
  editForm.parent_id = id
  parentSearchText.value = name
  parentDropdownOpen.value = false
}

function handleParentBlur() {
  setTimeout(() => { parentDropdownOpen.value = false }, 150)
}

const editingMilestone = ref<Milestone | null>(null)
const milestoneForm = reactive({ name: '', description: '', target_date: '', status: 'pending' as string })
const riskForm = reactive({ title: '', description: '', strategy: '', level: '中', status: '处理中' })

function phaseSelectedClass(phase?: string) {
  const p = phases.find(p => p.value === phase)
  return p ? p.selectedClass : phases[0].selectedClass
}

function priorityLabel(p?: string) {
  const map: Record<string, string> = { high: '高', medium: '中', low: '低' }
  return map[p || ''] || '中'
}

function toggleEditMode() {
  if (editingInfo.value) {
    editingInfo.value = false
  } else {
    if (project.value) {
      editForm.name = project.value.name
      editForm.description = project.value.description
      editForm.estimated_end_date = project.value.estimated_end_date
      editForm.development_cycle = project.value.development_cycle
      editForm.phase = project.value.phase || '需求调研'
      editForm.parent_id = project.value.parent_id || ''
      editForm.priority = (project.value.priority as Project['priority']) || 'medium'
      editForm.status = (project.value.status as Project['status']) || 'active'
      parentSearchText.value = ''
    }
    editingInfo.value = true
  }
}

async function saveProjectInfo() {
  if (!project.value) return
  await projectStore.updateProject(projectId.value, { ...editForm, parent_id: editForm.parent_id || null })
  editingInfo.value = false
  ui.addToast({ type: 'success', message: '项目更新成功' })
}

function closeMilestoneModal() {
  showMilestoneModal.value = false
  editingMilestone.value = null
  milestoneForm.name = ''
  milestoneForm.description = ''
  milestoneForm.target_date = ''
  milestoneForm.status = 'pending'
}

async function saveMilestone() {
  if (!milestoneForm.name || !milestoneForm.target_date) return
  if (editingMilestone.value) {
    await milestoneStore.updateMilestone(editingMilestone.value.id, {
      name: milestoneForm.name,
      description: milestoneForm.description,
      target_date: milestoneForm.target_date,
      status: milestoneForm.status as Milestone['status'],
    })
    ui.addToast({ type: 'success', message: '节点更新成功' })
  } else {
    await milestoneStore.createMilestone({ ...milestoneForm, project_id: projectId.value, status: milestoneForm.status as Milestone['status'] })
    ui.addToast({ type: 'success', message: '节点添加成功' })
  }
  closeMilestoneModal()
}

function editMilestone(m: Milestone) {
  editingMilestone.value = m
  milestoneForm.name = m.name
  milestoneForm.description = m.description
  milestoneForm.target_date = m.target_date
  milestoneForm.status = m.status
  showMilestoneModal.value = true
}

async function deleteMilestone(id: string) {
  await milestoneStore.deleteMilestone(id)
  ui.addToast({ type: 'success', message: '节点已删除' })
}

function closeRiskModal() {
  showRiskModal.value = false
  editingRisk.value = null
  riskForm.title = ''
  riskForm.description = ''
  riskForm.strategy = ''
  riskForm.level = '中'
  riskForm.status = '处理中'
}

function editRisk(risk: ProjectRisk) {
  editingRisk.value = risk
  riskForm.title = risk.title
  riskForm.description = risk.description
  riskForm.strategy = risk.strategy
  riskForm.level = risk.level
  riskForm.status = risk.status
  showRiskModal.value = true
}

async function saveRisk() {
  if (!riskForm.title) return
  const ts = now()
  if (editingRisk.value) {
    await run(
      `UPDATE project_risks SET title=?, description=?, strategy=?, level=?, status=?, updated_at=? WHERE id=?`,
      [riskForm.title, riskForm.description, riskForm.strategy, riskForm.level, riskForm.status, ts, editingRisk.value.id]
    )
    ui.addToast({ type: 'success', message: '风险更新成功' })
  } else {
    const id = generateId()
    await run(
      `INSERT INTO project_risks (id, project_id, title, description, strategy, level, status, recorded_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, projectId.value, riskForm.title, riskForm.description, riskForm.strategy, riskForm.level, riskForm.status, new Date().toISOString().split('T')[0], ts, ts]
    )
    ui.addToast({ type: 'success', message: '风险添加成功' })
  }
  closeRiskModal()
  await fetchRisks()
}

async function deleteRisk(id: string) {
  await run('DELETE FROM project_risks WHERE id = ?', [id])
  await fetchRisks()
  ui.addToast({ type: 'success', message: '风险已删除' })
}

async function fetchRisks() {
  risks.value = await query<ProjectRisk>(
    'SELECT * FROM project_risks WHERE project_id = ? ORDER BY created_at DESC',
    [projectId.value]
  )
}

onMounted(async () => {
  await Promise.all([
    projectStore.fetchProjects(),
    milestoneStore.fetchMilestones(projectId.value),
  ])
  await fetchRisks()
})
</script>
