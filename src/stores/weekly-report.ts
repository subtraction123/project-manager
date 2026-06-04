import { defineStore } from 'pinia'
import { ref } from 'vue'
import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { useDB } from '@/lib/db'
import type { WeeklyReport, ReportContent, ProjectReportGroup } from '@/types'

dayjs.extend(isoWeek)

export const useWeeklyReportStore = defineStore('weeklyReport', () => {
  const reports = ref<WeeklyReport[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const { query, run, generateId, now } = useDB()

  async function fetchReports() {
    loading.value = true
    error.value = null
    try {
      const rows = await query<any>(
        'SELECT * FROM weekly_reports ORDER BY week_start_date DESC'
      )
      reports.value = rows.map((r: any) => {
        const content = typeof r.content === 'string' ? JSON.parse(r.content) : r.content
        if (!content.projects) {
          content.projects = content.milestones?.map((g: any) => ({
            project_id: '', project_name: g.project_name, phase: '',
            milestones: g.milestones || [],
            risks: [],
          })) || []
        }
        if (!content.launched_projects) {
          content.launched_projects = []
        }
        if (!content.next_week_plan) {
          content.next_week_plan = ''
        }
        return { ...r, content }
      })
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  function getWeekRange(date: Date) {
    const d = dayjs(date)
    const start = d.isoWeekday(1).format('YYYY-MM-DD')
    const end = d.isoWeekday(7).format('YYYY-MM-DD')
    return { start, end }
  }

  async function autoGenerate(date?: Date): Promise<WeeklyReport> {
    const { start, end } = getWeekRange(date || new Date())
    const d = dayjs(start)
    const weekNumber = d.isoWeek()
    const year = d.year()

    const existing = await query<any>(
      'SELECT id FROM weekly_reports WHERE week_start_date = ? AND week_end_date = ?',
      [start, end]
    )

    const projects = await query<any>(
      `SELECT * FROM projects WHERE (status != 'archived' AND status != 'terminated') OR status IS NULL ORDER BY created_at DESC`,
    )

    const allMilestones = await query<any>(
      `SELECT m.* FROM milestones m ORDER BY m.target_date ASC`,
    )

    const allRisks = await query<any>(
      `SELECT r.* FROM project_risks r WHERE r.status != '已关闭' ORDER BY r.recorded_date DESC`,
    )

    function buildProjectGroup(p: any): ProjectReportGroup {
      const pMilestones = allMilestones
        .filter((m: any) => m.project_id === p.id)
        .map((m: any) => ({
          id: m.id, name: m.name, description: m.description || '',
          target_date: m.target_date, status: m.status,
        }))
      const pRisks = allRisks
        .filter((r: any) => r.project_id === p.id)
        .map((r: any) => ({
          id: r.id, title: r.title, description: r.description || '',
          level: r.level, status: r.status,
        }))
      return {
        project_id: p.id,
        project_name: p.name,
        phase: p.phase || '需求调研',
        milestones: pMilestones,
        risks: pRisks,
      }
    }

    const launchedProjects: ProjectReportGroup[] = projects
      .filter((p: any) => p.phase === '上线')
      .map(buildProjectGroup)

    const activeProjects: ProjectReportGroup[] = projects
      .filter((p: any) => p.phase !== '上线')
      .map(buildProjectGroup)

    const content: ReportContent = {
      week_info: { week_number: weekNumber, year, start_date: start, end_date: end },
      launched_projects: launchedProjects,
      projects: activeProjects,
      next_week_plan: '',
    }

    const contentJson = JSON.stringify(content)

    if (existing.length > 0) {
      const ts = now()
      await run(
        'UPDATE weekly_reports SET content = ?, updated_at = ? WHERE id = ?',
        [contentJson, ts, existing[0].id]
      )
      const idx = reports.value.findIndex((r) => r.id === existing[0].id)
      if (idx !== -1) {
        reports.value[idx] = { ...reports.value[idx], content, updated_at: ts }
      }
      return reports.value[idx!]
    } else {
      const id = generateId()
      const ts = now()
      await run(
        `INSERT INTO weekly_reports (id, week_start_date, week_end_date, content, status, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'draft', ?, ?)`,
        [id, start, end, contentJson, ts, ts]
      )
      const report: WeeklyReport = {
        id,
        week_start_date: start,
        week_end_date: end,
        content,
        status: 'draft',
        created_at: ts,
        updated_at: ts,
      }
      reports.value.unshift(report)
      return report
    }
  }

  async function updateReportContent(id: string, content: ReportContent) {
    const contentJson = JSON.stringify(content)
    const ts = now()
    await run(
      'UPDATE weekly_reports SET content = ?, updated_at = ? WHERE id = ?',
      [contentJson, ts, id]
    )
    const idx = reports.value.findIndex((r) => r.id === id)
    if (idx !== -1) {
      reports.value[idx] = { ...reports.value[idx], content, updated_at: ts }
    }
  }

  async function publishReport(id: string) {
    const ts = now()
    await run(
      'UPDATE weekly_reports SET status = ?, updated_at = ? WHERE id = ?',
      ['published', ts, id]
    )
    const idx = reports.value.findIndex((r) => r.id === id)
    if (idx !== -1) {
      reports.value[idx] = { ...reports.value[idx], status: 'published', updated_at: ts }
    }
  }

  async function deleteReport(id: string) {
    await run('DELETE FROM weekly_reports WHERE id = ?', [id])
    reports.value = reports.value.filter((r) => r.id !== id)
  }

  return { reports, loading, error, fetchReports, getWeekRange, autoGenerate, updateReportContent, publishReport, deleteReport }
})
