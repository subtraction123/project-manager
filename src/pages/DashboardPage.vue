<template>
  <div>
    <!-- Dark Page Header -->
    <div class="flex items-center justify-between mb-6 px-6 py-4 rounded-lg bg-[#172B4D] text-white">
      <h2 class="text-lg font-semibold">项目管理工具</h2>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      <router-link to="/daily-items?filter=incomplete" class="bg-white rounded-xl p-5 border border-border-color text-center shadow-sm block hover:border-primary hover:shadow-md transition-all cursor-pointer">
        <div class="text-3xl font-bold text-primary">{{ dailyCount }}</div>
        <div class="text-sm text-text-secondary mt-1">今日事项</div>
      </router-link>
      <router-link to="/tasks?status=doing" class="bg-white rounded-xl p-5 border border-border-color text-center shadow-sm block hover:border-primary hover:shadow-md transition-all cursor-pointer">
        <div class="text-3xl font-bold text-primary">{{ doingCount }}</div>
        <div class="text-sm text-text-secondary mt-1">进行中任务</div>
      </router-link>
      <router-link to="/projects?filter=active" class="bg-white rounded-xl p-5 border border-border-color text-center shadow-sm block hover:border-primary hover:shadow-md transition-all cursor-pointer">
        <div class="text-3xl font-bold text-primary">{{ activeProjectCount }}</div>
        <div class="text-sm text-text-secondary mt-1">进行中项目</div>
      </router-link>
      <router-link to="/projects?filter=risk" class="bg-white rounded-xl p-5 border border-border-color text-center shadow-sm block hover:border-primary hover:shadow-md transition-all cursor-pointer">
        <div class="text-3xl font-bold text-primary">{{ riskCount }}</div>
        <div class="text-sm text-text-secondary mt-1">风险项目数</div>
      </router-link>
      <router-link to="/version" class="bg-white rounded-xl p-5 border border-border-color text-center shadow-sm block hover:border-primary hover:shadow-md transition-all cursor-pointer">
        <div class="text-3xl font-bold text-primary">{{ draftReleaseCount }}</div>
        <div class="text-sm text-text-secondary mt-1">待发布版本</div>
      </router-link>
    </div>

    <!-- Project Gantt Chart -->
    <div class="bg-[#f4f5f7] rounded-xl p-5 mb-6">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-base font-semibold text-text-primary">项目时间甘特图</h3>
        <div class="flex gap-1 bg-white rounded-lg border border-border-color p-0.5">
          <button @click="ganttView = 'week'"
            :class="['px-3 py-1.5 rounded-md text-xs font-medium transition-colors', ganttView === 'week' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-50']">
            周视图
          </button>
          <button @click="ganttView = 'month'"
            :class="['px-3 py-1.5 rounded-md text-xs font-medium transition-colors', ganttView === 'month' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-50']">
            月视图
          </button>
        </div>
      </div>

      <!-- Time axis -->
      <div class="flex mb-3" style="padding-left: 200px;">
        <div v-for="w in ganttColumns" :key="w.label"
          :class="['flex-1 text-center text-xs py-2 border-b-2', w.isCurrent ? 'text-text-primary font-semibold border-primary' : 'text-text-secondary border-border-color']">
          {{ w.label }}
        </div>
      </div>

      <!-- Project Gantt rows -->
      <div v-if="activeProjects.length === 0" class="text-center py-6 text-text-muted text-sm">暂无进行中的项目</div>
      <div v-for="project in activeProjects.slice(0, 6)" :key="project.id" class="flex items-center mb-3">
        <div style="width: 200px;" class="pr-3">
          <div class="text-sm font-medium text-text-primary truncate">{{ project.name }}</div>
          <div :class="['text-xs mt-0.5', phaseColorClass(project.phase)]">{{ project.phase || '需求调研' }}</div>
        </div>
        <div class="flex-1 flex relative h-8 bg-white/50 rounded-md">
          <div v-if="getProjectBar(project)" :style="getProjectBar(project)!.style"
            class="absolute h-full rounded-md bg-gradient-to-r from-slate-400 to-cyan-500 flex items-center justify-end pr-2">
            <span class="text-white text-xs font-medium">截止: {{ formatShortDate(project.estimated_end_date) }}</span>
          </div>
          <!-- Today marker -->
          <div v-if="getTodayPosition() !== null" :style="{ left: getTodayPosition() + '%' }"
            class="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10">
            <div class="absolute -top-1 -left-1 w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="flex gap-6 pt-4 border-t border-border-color flex-wrap">
        <div class="flex items-center gap-2 text-xs text-text-secondary">
          <div class="w-4 h-4 rounded bg-gradient-to-r from-slate-400 to-cyan-500"></div>
          进行中
        </div>
        <div class="flex items-center gap-2 text-xs text-text-secondary">
          <div class="w-4 h-4 rounded bg-green-400"></div>
          正常进行
        </div>
        <div class="flex items-center gap-2 text-xs text-text-secondary">
          <div class="w-4 h-4 rounded bg-amber-400"></div>
          临近截止
        </div>
        <div class="flex items-center gap-2 text-xs text-text-secondary">
          <div class="w-0.5 h-4 bg-blue-500"></div>
          当前时间
        </div>
        <div class="flex items-center gap-2 text-xs ml-auto">
          <span class="text-blue-500">● 需求调研</span>
          <span class="text-purple-500">● 方案设计</span>
          <span class="text-cyan-500">● 实施配置</span>
          <span class="text-green-500">● 上线</span>
        </div>
      </div>
    </div>

    <!-- Task Gantt Chart -->
    <div class="bg-[#f4f5f7] rounded-xl p-5 mb-6">
      <div class="flex items-center justify-between mb-5">
        <h3 class="text-base font-semibold text-text-primary">任务时间甘特图</h3>
        <div class="flex gap-1 bg-white rounded-lg border border-border-color p-0.5">
          <button @click="taskGanttView = 'week'"
            :class="['px-3 py-1.5 rounded-md text-xs font-medium transition-colors', taskGanttView === 'week' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-50']">
            周视图
          </button>
          <button @click="taskGanttView = 'month'"
            :class="['px-3 py-1.5 rounded-md text-xs font-medium transition-colors', taskGanttView === 'month' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-gray-50']">
            月视图
          </button>
        </div>
      </div>

      <!-- Time axis -->
      <div class="flex mb-3" style="padding-left: 200px;">
        <div v-for="w in taskGanttColumns" :key="w.label"
          :class="['flex-1 text-center text-xs py-2 border-b-2', w.isCurrent ? 'text-text-primary font-semibold border-primary' : 'text-text-secondary border-border-color']">
          {{ w.label }}
        </div>
      </div>

      <!-- Task Gantt rows -->
      <div v-for="task in activeTasks.slice(0, 8)" :key="task.id" class="flex items-center mb-3">
        <div style="width: 200px;" class="pr-3">
          <div class="text-sm font-medium text-text-primary truncate">{{ task.title }}</div>
          <div class="text-xs text-text-muted mt-0.5">{{ task.project_name || '未归类' }}</div>
        </div>
        <div class="flex-1 flex relative h-8 bg-white/50 rounded-md">
          <div v-if="getTaskBar(task)" :style="getTaskBar(task)!.style"
            :class="['absolute h-full rounded-md flex items-center justify-end pr-2', getTaskBar(task)!.color]">
            <span class="text-white text-xs font-medium">{{ task.due_date ? '截止: ' + formatShortDate(task.due_date) : '' }}</span>
          </div>
          <!-- Today marker -->
          <div v-if="getTodayPosition() !== null" :style="{ left: getTodayPosition() + '%' }"
            class="absolute top-0 bottom-0 w-0.5 bg-blue-500 z-10">
            <div class="absolute -top-1 -left-1 w-2.5 h-2.5 bg-blue-500 rounded-full"></div>
          </div>
        </div>
      </div>

      <div v-if="activeTasks.length === 0" class="text-center py-6 text-text-muted text-sm">暂无进行中的任务</div>

      <!-- Legend -->
      <div class="flex gap-6 pt-4 border-t border-border-color flex-wrap">
        <div class="flex items-center gap-2 text-xs text-text-secondary">
          <div class="w-4 h-4 rounded bg-gradient-to-r from-blue-400 to-blue-500"></div>
          进行中
        </div>
        <div class="flex items-center gap-2 text-xs text-text-secondary">
          <div class="w-4 h-4 rounded bg-gradient-to-r from-amber-400 to-orange-400"></div>
          临近截止
        </div>
        <div class="flex items-center gap-2 text-xs text-text-secondary">
          <div class="w-0.5 h-4 bg-blue-500"></div>
          当前时间
        </div>
      </div>
    </div>


    <!-- Recent Activity -->
    <div class="bg-white rounded-xl p-5 border border-border-color shadow-sm">
      <h3 class="text-base font-semibold text-text-primary mb-4">最近动态</h3>
      <div v-if="recentActivity.length === 0" class="py-6 text-center text-text-muted text-sm">暂无动态</div>
      <div v-else class="space-y-0">
        <div v-for="(activity, i) in recentActivity" :key="i"
          class="flex items-center justify-between py-3 border-b border-border-color last:border-b-0 text-sm">
          <span class="text-text-secondary">• {{ activity.text }}</span>
          <span class="text-xs text-text-muted flex-shrink-0 ml-4">{{ formatActivityTime(activity.time) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useDB } from '@/lib/db'
import { useDailyItemStore } from '@/stores/daily-item'
import { useProjectStore } from '@/stores/project'
import { useTaskStore } from '@/stores/task'
import { useReleaseStore } from '@/stores/release'
import type { Project } from '@/types'
import dayjs from 'dayjs'

const { query } = useDB()
const dailyStore = useDailyItemStore()
const projectStore = useProjectStore()
const taskStore = useTaskStore()
const releaseStore = useReleaseStore()

const ganttView = ref<'week' | 'month'>('week')
const taskGanttView = ref<'week' | 'month'>('week')

const dailyCount = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  return dailyStore.items.filter(i => i.record_date === today && !i.is_completed).length
})
const doingCount = computed(() => taskStore.tasks.filter(t => t.status === 'doing').length)
const activeProjectCount = computed(() => projectStore.projects.filter(p => p.status === 'active').length)
const riskCount = ref(0)
const draftReleaseCount = computed(() => releaseStore.releases.filter(r => r.status === 'draft').length)
const activeProjects = computed(() => projectStore.projects.filter(p => p.status === 'active' && !p.parent_id))
const activeTasks = computed(() => taskStore.tasks.filter(t => t.status === 'doing' && t.due_date))

// Project Gantt chart
const ganttColumns = computed(() => {
  const today = dayjs()
  const cols: { label: string; isCurrent: boolean }[] = []
  if (ganttView.value === 'week') {
    for (let i = -2; i <= 3; i++) {
      const start = today.add(i, 'week').startOf('week').add(1, 'day')
      const end = start.add(6, 'day')
      cols.push({ label: `${start.format('M.D')}-${end.format('M.D')}`, isCurrent: i === 0 })
    }
  } else {
    for (let i = -1; i <= 4; i++) {
      const m = today.add(i, 'month')
      cols.push({ label: m.format('YYYY.M'), isCurrent: i === 0 })
    }
  }
  return cols
})

function getGanttRange() {
  const today = dayjs()
  if (ganttView.value === 'week') {
    const start = today.add(-2, 'week').startOf('week').add(1, 'day')
    const end = today.add(3, 'week').endOf('week').add(1, 'day')
    return { start, end, totalDays: end.diff(start, 'day') }
  } else {
    const start = today.add(-1, 'month').startOf('month')
    const end = today.add(5, 'month').endOf('month')
    return { start, end, totalDays: end.diff(start, 'day') }
  }
}

function getProjectBar(project: Project) {
  const { start, totalDays } = getGanttRange()
  const projStart = project.start_date ? dayjs(project.start_date) : dayjs(project.created_at)
  const projEnd = dayjs(project.estimated_end_date)

  const left = Math.max(0, projStart.diff(start, 'day') / totalDays * 100)
  const right = Math.min(100, projEnd.diff(start, 'day') / totalDays * 100)
  if (right <= 0 || left >= 100) return null

  return { style: { left: left + '%', width: Math.max(5, right - left) + '%' } }
}

function getTodayPosition() {
  const { start, totalDays } = getGanttRange()
  const today = dayjs()
  const pos = today.diff(start, 'day') / totalDays * 100
  if (pos < 0 || pos > 100) return null
  return pos
}

// Task Gantt chart
const taskGanttColumns = computed(() => {
  const today = dayjs()
  const cols: { label: string; isCurrent: boolean }[] = []
  if (taskGanttView.value === 'week') {
    for (let i = -2; i <= 3; i++) {
      const start = today.add(i, 'week').startOf('week').add(1, 'day')
      const end = start.add(6, 'day')
      cols.push({ label: `${start.format('M.D')}-${end.format('M.D')}`, isCurrent: i === 0 })
    }
  } else {
    for (let i = -1; i <= 4; i++) {
      const m = today.add(i, 'month')
      cols.push({ label: m.format('YYYY.M'), isCurrent: i === 0 })
    }
  }
  return cols
})

function getTaskGanttRange() {
  const today = dayjs()
  if (taskGanttView.value === 'week') {
    const start = today.add(-2, 'week').startOf('week').add(1, 'day')
    const end = today.add(3, 'week').endOf('week').add(1, 'day')
    return { start, end, totalDays: end.diff(start, 'day') }
  } else {
    const start = today.add(-1, 'month').startOf('month')
    const end = today.add(5, 'month').endOf('month')
    return { start, end, totalDays: end.diff(start, 'day') }
  }
}

function getTaskBar(task: any) {
  const { start, totalDays } = getTaskGanttRange()
  const taskStart = dayjs()
  const taskEnd = task.due_date ? dayjs(task.due_date) : dayjs().add(7, 'day')

  const left = Math.max(0, taskStart.diff(start, 'day') / totalDays * 100)
  const right = Math.min(100, taskEnd.diff(start, 'day') / totalDays * 100)
  if (right <= 0 || left >= 100) return null

  const daysUntilDue = taskEnd.diff(dayjs(), 'day')
  const nearDeadline = daysUntilDue >= 0 && daysUntilDue <= 3
  const color = nearDeadline
    ? 'bg-gradient-to-r from-amber-400 to-orange-400'
    : 'bg-gradient-to-r from-blue-400 to-blue-500'

  return { style: { left: left + '%', width: Math.max(5, right - left) + '%' }, color }
}

function formatShortDate(date: string) {
  return dayjs(date).format('M.D')
}

function phaseColorClass(phase?: string) {
  const map: Record<string, string> = {
    '需求调研': 'text-blue-500',
    '方案设计': 'text-purple-500',
    '实施配置': 'text-cyan-500',
    '上线': 'text-green-500',
  }
  return map[phase || ''] || 'text-blue-500'
}

const recentActivity = computed(() => {
  interface Activity { time: string; text: string }
  const items: Activity[] = []

  for (const d of dailyStore.items.slice(0, 5)) {
    items.push({
      time: d.created_at,
      text: `创建了日常事项「${d.title}」${d.is_completed ? '(已完成)' : ''}`,
    })
  }

  for (const t of taskStore.tasks) {
    if (t.status === 'done' && t.completed_at) {
      items.push({ time: t.completed_at, text: `完成了任务「${t.title}」` })
    }
    items.push({ time: t.created_at, text: `创建了任务「${t.title}」(${t.status === 'doing' ? '进行中' : t.status === 'done' ? '已完成' : '待办'})` })
  }

  for (const p of projectStore.projects) {
    items.push({
      time: p.created_at,
      text: `创建了项目「${p.name}」(${p.phase || '需求调研'})`,
    })
  }

  items.sort((a, b) => b.time.localeCompare(a.time))
  return items.slice(0, 10)
})

function formatActivityTime(isoTime: string): string {
  const d = dayjs(isoTime)
  const now = dayjs()
  if (d.isSame(now, 'day')) return d.format('HH:mm')
  if (d.isSame(now.subtract(1, 'day'), 'day')) return '昨天 ' + d.format('HH:mm')
  if (d.isSame(now, 'year')) return d.format('M.D HH:mm')
  return d.format('YYYY.M.D')
}

onMounted(async () => {
  await Promise.all([
    dailyStore.fetchItems(),
    projectStore.fetchProjects(),
    taskStore.fetchTasks(),
  ])
  try {
    const risks = await query<any>(
      `SELECT COUNT(*) as cnt FROM project_risks r
       LEFT JOIN projects p ON r.project_id = p.id
       WHERE r.status != ? AND (p.phase IS NULL OR p.phase != '上线')`,
      ['已解决']
    )
    riskCount.value = risks[0]?.cnt || 0
  } catch { riskCount.value = 0 }
})
</script>
