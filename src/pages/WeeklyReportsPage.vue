<template>
  <div>
    <div class="flex items-center justify-between mb-6 px-6 py-4 rounded-lg bg-[#172B4D] text-white">
      <h2 class="text-lg font-semibold">周报管理</h2>
      <button @click="generateReport" :disabled="reportStore.loading"
        class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors text-sm font-medium disabled:opacity-50">
        {{ reportStore.loading ? '生成中...' : '生成周报' }}
      </button>
    </div>

    <div v-if="reportStore.reports.length === 0" class="text-center py-16">
      <EmptyState icon="📊" title="暂无周报" description="点击「生成周报」按钮自动生成" />
    </div>

    <div v-else class="space-y-4">
      <div v-for="report in reportStore.reports" :key="report.id" class="bg-white rounded-xl border border-border-color p-5 shadow-sm">
        <!-- Header -->
        <div class="flex items-center justify-between mb-3">
          <span class="text-base font-semibold text-text-primary">
            第{{ report.content.week_info.week_number }}周（{{ report.content.week_info.start_date }} ~ {{ report.content.week_info.end_date }}）
          </span>
        </div>

        <!-- Summary -->
        <div class="flex items-center gap-5 mb-4 flex-wrap">
          <div class="text-sm text-text-secondary">
            <span>本周已上线：</span>
            <span class="font-semibold text-success">{{ report.content.launched_projects.length }}个</span>
          </div>
          <div class="text-sm text-text-secondary">
            <span>进行中项目：</span>
            <span class="font-semibold text-primary">{{ report.content.projects.length }}个</span>
          </div>
          <div class="text-sm text-text-secondary">
            <span>已完成节点：</span>
            <span class="font-semibold text-success">{{ allMilestoneCountByStatus(report.content, 'achieved') }}个</span>
          </div>
          <div class="text-sm text-text-secondary">
            <span>已延期节点：</span>
            <span class="font-semibold text-danger">{{ allMilestoneCountByStatus(report.content, 'delayed') }}个</span>
          </div>
          <div class="text-sm text-text-secondary">
            <span>风险：</span>
            <span class="font-semibold text-warning">{{ allRiskTotal(report.content) }}项</span>
          </div>
        </div>

        <!-- Expandable Content -->
        <div v-if="expandedReports.has(report.id)" class="bg-[#f4f5f7] rounded-lg p-4 mb-4">
          <!-- 本周已上线项目 -->
          <h4 class="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-success rounded-sm"></span> 一、本周已上线项目
          </h4>
          <div v-if="report.content.launched_projects.length === 0" class="text-xs text-text-muted mb-4">无</div>
          <div v-else v-for="proj in report.content.launched_projects" :key="proj.project_id" class="mb-3 ml-2">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-medium text-text-primary">{{ proj.project_name }}</span>
              <span class="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-500 font-medium">上线</span>
            </div>
          </div>

          <div class="border-b border-gray-200 my-3"></div>

          <!-- 进行中项目 -->
          <h4 class="text-sm font-semibold text-text-primary mb-3 flex items-center gap-2">
            <span class="w-1.5 h-4 bg-primary rounded-sm"></span> 二、进行中项目
          </h4>
          <div v-if="report.content.projects.length === 0" class="text-xs text-text-muted mb-4">暂无项目</div>
          <div v-else v-for="(proj, pi) in report.content.projects" :key="proj.project_id" class="mb-4 last:mb-0 ml-2">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-sm font-semibold text-text-primary">{{ pi + 1 }}. {{ proj.project_name }}</span>
              <span :class="['text-xs px-2 py-0.5 rounded font-medium', phaseTagClass(proj.phase)]">{{ proj.phase }}</span>
            </div>

            <!-- Milestones -->
            <div class="ml-4 mb-2">
              <p class="text-xs text-text-muted mb-1">节点：</p>
              <div v-if="proj.milestones.length === 0" class="text-xs text-text-muted ml-2">暂无节点</div>
              <div v-for="m in proj.milestones" :key="m.id" class="flex items-center gap-3 text-sm py-1 pl-3 border-l-2 border-gray-200 ml-2 mb-0.5">
                <span class="flex-1 text-text-secondary text-xs">{{ m.name }}</span>
                <span class="text-xs text-text-muted">{{ m.target_date }}</span>
                <span :class="['text-xs px-1.5 py-0.5 rounded font-medium', milestoneStatusClass(m.status)]">
                  {{ milestoneStatusLabel(m.status) }}
                </span>
              </div>
            </div>

            <!-- Risks -->
            <div class="ml-4">
              <p class="text-xs text-text-muted mb-1">风险：</p>
              <div v-if="proj.risks.length === 0" class="text-xs text-text-muted ml-2">无</div>
              <div v-for="r in proj.risks" :key="r.id" class="flex items-center gap-3 text-sm py-1 pl-3 border-l-2 border-red-200 ml-2 mb-0.5">
                <span class="flex-1 text-text-secondary text-xs">{{ r.title }}</span>
                <span :class="['text-xs px-1.5 py-0.5 rounded font-medium', riskLevelClass(r.level)]">{{ r.level }}</span>
                <span class="text-xs text-text-muted">{{ r.status }}</span>
              </div>
            </div>

            <div v-if="pi < report.content.projects.length - 1" class="border-b border-gray-200 mt-3"></div>
          </div>

          <!-- Next Week Plan -->
          <div class="mt-4 pt-3 border-t border-gray-300">
            <h4 class="text-sm font-semibold text-text-primary mb-2">三、下周计划</h4>
            <p v-if="report.content.next_week_plan" class="text-sm text-text-secondary whitespace-pre-wrap">{{ report.content.next_week_plan }}</p>
            <p v-else class="text-xs text-text-muted">暂无</p>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-2">
          <button @click="toggleExpand(report.id)" class="px-3 py-1.5 border border-border-color rounded-lg text-xs text-text-secondary hover:border-primary hover:text-primary transition-colors">
            {{ expandedReports.has(report.id) ? '收起详情' : '查看详情' }}
          </button>
          <button @click="previewReport = report; showPreview = true" class="px-3 py-1.5 border border-border-color rounded-lg text-xs text-text-secondary hover:border-primary hover:text-primary transition-colors">
            预览
          </button>
          <button @click="openEdit(report)" class="px-3 py-1.5 border border-border-color rounded-lg text-xs text-text-secondary hover:border-primary hover:text-primary transition-colors">
            编辑
          </button>
        </div>
      </div>
    </div>

    <!-- Preview Modal -->
    <teleport to="body">
      <div v-if="showPreview && previewReport" class="fixed inset-0 z-50 flex items-center justify-center p-5" @click.self="showPreview = false">
        <div class="absolute inset-0 bg-black/50"></div>
        <div class="relative w-[640px] max-w-[92vw] max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden" style="animation: modalFadeIn 0.2s ease-out;">
          <div class="flex justify-between items-center px-6 py-5 bg-gradient-to-br from-[#722ED1] to-[#9254DE]">
            <h3 class="text-lg font-semibold text-white">周报预览</h3>
            <button @click="showPreview = false" class="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors">×</button>
          </div>
          <div class="p-6 overflow-y-auto max-h-[calc(80vh-80px)] text-sm">
            <!-- 本周已上线 -->
            <p class="font-semibold mb-2">一、本周已上线项目</p>
            <div v-if="previewReport.content.launched_projects.length === 0" class="text-xs text-text-muted mb-3">无</div>
            <div v-else v-for="proj in previewReport.content.launched_projects" :key="proj.project_id" class="mb-3 ml-4">
              <p class="text-xs font-medium">{{ proj.project_name }} <span class="text-xs px-1 py-0.5 rounded bg-green-50 text-green-500">上线</span></p>
            </div>

            <!-- 进行中项目 -->
            <p class="font-semibold mb-2 mt-4">二、进行中项目</p>
            <div v-for="proj in previewReport.content.projects" :key="proj.project_id" class="mb-4 ml-4">
              <p class="text-xs font-medium">{{ proj.project_name }} <span :class="['text-xs px-1.5 py-0.5 rounded', phaseTagClass(proj.phase)]">{{ proj.phase }}</span></p>
              <div class="ml-3 mt-1">
                <p class="text-xs text-text-muted">节点：</p>
                <ul v-if="proj.milestones.length" class="list-disc pl-4 text-xs text-text-secondary">
                  <li v-for="m in proj.milestones" :key="m.id">{{ m.name }} - {{ m.target_date }} [{{ milestoneStatusLabel(m.status) }}]</li>
                </ul>
                <p v-else class="text-xs text-text-muted pl-4">暂无节点</p>
                <p class="text-xs text-text-muted mt-1">风险：</p>
                <ul v-if="proj.risks.length" class="list-disc pl-4 text-xs text-text-secondary">
                  <li v-for="r in proj.risks" :key="r.id">{{ r.title }} [{{ r.level }} - {{ r.status }}]</li>
                </ul>
                <p v-else class="text-xs text-text-muted pl-4">无</p>
              </div>
            </div>

            <div v-if="previewReport.content.next_week_plan" class="mt-4 pt-3 border-t">
              <p class="font-semibold text-xs">三、下周计划：</p>
              <p class="text-xs text-text-secondary whitespace-pre-wrap mt-1">{{ previewReport.content.next_week_plan }}</p>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Edit Modal -->
    <teleport to="body">
      <div v-if="showEdit && editingReport" class="fixed inset-0 z-50 flex items-center justify-center p-5" @click.self="showEdit = false">
        <div class="absolute inset-0 bg-black/50"></div>
        <div class="relative w-[700px] max-w-[92vw] max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-hidden" style="animation: modalFadeIn 0.2s ease-out;">
          <div class="flex justify-between items-center px-6 py-5 bg-gradient-to-br from-[#1890FF] to-[#40A9FF]">
            <h3 class="text-lg font-semibold text-white">编辑周报</h3>
            <button @click="showEdit = false" class="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25 transition-colors">×</button>
          </div>
          <div class="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
            <p class="text-xs text-text-muted mb-4">修改各项目节点和风险内容，或补充下周计划</p>

            <!-- 本周已上线项目 -->
            <div v-if="editingReport.content.launched_projects.length > 0" class="mb-4">
              <p class="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                <span class="w-1 h-4 bg-success rounded-sm"></span> 本周已上线项目
              </p>
              <div v-for="proj in editingReport.content.launched_projects" :key="proj.project_id" class="mb-3 p-3 bg-green-50/50 rounded-lg border border-green-100">
                <p class="text-sm font-medium text-text-primary">{{ proj.project_name }} <span class="text-xs px-1.5 py-0.5 rounded bg-green-50 text-green-500">上线</span></p>
              </div>
            </div>

            <!-- 进行中项目 -->
            <p class="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
              <span class="w-1 h-4 bg-primary rounded-sm"></span> 进行中项目
            </p>
            <div v-for="(proj, pi) in editingReport.content.projects" :key="proj.project_id" class="mb-4 p-3 bg-[#fafbfc] rounded-lg border">
              <p class="text-sm font-semibold text-text-primary mb-2">{{ pi + 1 }}. {{ proj.project_name }} <span :class="['text-xs px-1.5 py-0.5 rounded', phaseTagClass(proj.phase)]">{{ proj.phase }}</span></p>
              <div class="mb-2">
                <label class="block text-xs text-text-muted mb-1">节点（每行一个，格式：节点名 - 日期 - 状态）</label>
                <textarea
                  v-model="editForm.projectMilestones[proj.project_id]"
                  rows="2"
                  class="w-full px-3 py-2 border border-[#e0e4e8] rounded-lg text-xs focus:border-[#1890FF] focus:outline-none resize-none"
                ></textarea>
              </div>
              <div>
                <label class="block text-xs text-text-muted mb-1">风险（每行一个，格式：风险描述 - 等级 - 状态）</label>
                <textarea
                  v-model="editForm.projectRisks[proj.project_id]"
                  rows="2"
                  class="w-full px-3 py-2 border border-[#e0e4e8] rounded-lg text-xs focus:border-[#1890FF] focus:outline-none resize-none"
                ></textarea>
              </div>
            </div>

            <!-- 下周计划 -->
            <div class="mt-4">
              <label class="block text-sm font-medium text-text-primary mb-1.5">下周计划</label>
              <textarea v-model="editForm.nextWeekPlan" rows="4" placeholder="输入下周计划..." class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-[#1890FF] focus:outline-none resize-none"></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-3 px-6 py-4 bg-[#fafbfc] border-t border-[#e0e4e8]">
            <button @click="showEdit = false" class="px-5 py-2.5 border border-[#e0e4e8] rounded-lg text-sm text-text-secondary hover:bg-gray-50">取消</button>
            <button @click="saveEditReport" class="px-6 py-2.5 bg-gradient-to-br from-[#1890FF] to-[#40A9FF] text-white rounded-lg text-sm font-medium hover:opacity-90">保存修改</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useWeeklyReportStore } from '@/stores/weekly-report'
import { useProjectStore } from '@/stores/project'
import { useUIStore } from '@/stores/ui'
import type { WeeklyReport, ReportContent } from '@/types'
import EmptyState from '@/components/shared/EmptyState.vue'

const reportStore = useWeeklyReportStore()
const projectStore = useProjectStore()
const ui = useUIStore()

const expandedReports = ref(new Set<string>())
const showPreview = ref(false)
const previewReport = ref<WeeklyReport | null>(null)
const showEdit = ref(false)
const editingReport = ref<WeeklyReport | null>(null)
const editForm = reactive<{ projectMilestones: Record<string, string>; projectRisks: Record<string, string>; nextWeekPlan: string }>({
  projectMilestones: {},
  projectRisks: {},
  nextWeekPlan: '',
})

function toggleExpand(id: string) {
  if (expandedReports.value.has(id)) {
    expandedReports.value.delete(id)
  } else {
    expandedReports.value.add(id)
  }
}

function allMilestoneCountByStatus(content: ReportContent, status: string): number {
  const all = [...content.launched_projects, ...content.projects]
  return all.reduce((s, p) => s + p.milestones.filter(m => m.status === status).length, 0)
}

function allRiskTotal(content: ReportContent): number {
  const all = [...content.launched_projects, ...content.projects]
  return all.reduce((s, p) => s + p.risks.length, 0)
}

function phaseTagClass(phase: string) {
  const map: Record<string, string> = {
    '需求调研': 'bg-blue-50 text-blue-500',
    '方案设计': 'bg-purple-50 text-purple-500',
    '实施配置': 'bg-cyan-50 text-cyan-500',
    '上线': 'bg-green-50 text-green-500',
  }
  return map[phase] || map['需求调研']
}

function milestoneStatusClass(status: string) {
  const map: Record<string, string> = {
    achieved: 'bg-green-50 text-green-500',
    pending: 'bg-blue-50 text-blue-500',
    delayed: 'bg-red-50 text-red-500',
  }
  return map[status] || 'bg-gray-50 text-gray-500'
}

function milestoneStatusLabel(status: string) {
  const map: Record<string, string> = {
    achieved: '已完成',
    pending: '进行中',
    delayed: '已延期',
  }
  return map[status] || status
}

function riskLevelClass(level: string) {
  const map: Record<string, string> = {
    '高': 'bg-red-50 text-red-500',
    '中': 'bg-amber-50 text-amber-500',
    '低': 'bg-green-50 text-green-500',
  }
  return map[level] || 'bg-gray-50 text-gray-500'
}

async function generateReport() {
  try {
    await projectStore.fetchProjects()
    await reportStore.autoGenerate()
    ui.addToast({ type: 'success', message: '周报生成成功' })
  } catch (e: any) {
    ui.addToast({ type: 'error', message: '生成失败: ' + e.message })
  }
}

function openEdit(report: WeeklyReport) {
  editingReport.value = report
  editForm.projectMilestones = {}
  editForm.projectRisks = {}
  for (const proj of [...report.content.launched_projects, ...report.content.projects]) {
    editForm.projectMilestones[proj.project_id] = proj.milestones
      .map(m => `${m.name} - ${m.target_date} - ${milestoneStatusLabel(m.status)}`)
      .join('\n')
    editForm.projectRisks[proj.project_id] = proj.risks
      .map(r => `${r.title} - ${r.level} - ${r.status}`)
      .join('\n')
  }
  editForm.nextWeekPlan = report.content.next_week_plan || ''
  showEdit.value = true
}

async function saveEditReport() {
  if (!editingReport.value) return
  const content = JSON.parse(JSON.stringify(editingReport.value.content)) as ReportContent
  for (const proj of [...content.launched_projects, ...content.projects]) {
    // Parse milestones
    const mText = editForm.projectMilestones[proj.project_id] || ''
    const mLines = mText.split('\n').filter(l => l.trim())
    proj.milestones = mLines.map(line => {
      const parts = line.split(' - ')
      const name = parts[0]?.trim() || ''
      const targetDate = parts[1]?.trim() || ''
      const label = parts[2]?.trim() || '进行中'
      const labelMap: Record<string, string> = { '已完成': 'achieved', '进行中': 'pending', '已延期': 'delayed' }
      return { id: '', name, description: '', target_date: targetDate, status: labelMap[label] || 'pending' }
    })
    // Parse risks
    const rText = editForm.projectRisks[proj.project_id] || ''
    const rLines = rText.split('\n').filter(l => l.trim())
    proj.risks = rLines.map(line => {
      const parts = line.split(' - ')
      const title = parts[0]?.trim() || ''
      const level = parts[1]?.trim() || '中'
      const status = parts[2]?.trim() || '处理中'
      return { id: '', title, description: '', level, status }
    })
  }
  content.next_week_plan = editForm.nextWeekPlan
  await reportStore.updateReportContent(editingReport.value.id, content)
  showEdit.value = false
  ui.addToast({ type: 'success', message: '周报已更新' })
}

onMounted(async () => {
  await reportStore.fetchReports()
})
</script>
