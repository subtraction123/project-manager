import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDB } from '@/lib/db'
import type { Milestone } from '@/types'

export const useMilestoneStore = defineStore('milestone', () => {
  const milestones = ref<Milestone[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const { query, run, generateId, now } = useDB()

  async function fetchMilestones(projectId: string) {
    loading.value = true
    error.value = null
    try {
      milestones.value = await query<Milestone>(
        'SELECT * FROM milestones WHERE project_id = ? ORDER BY target_date ASC',
        [projectId]
      )
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createMilestone(data: Partial<Milestone>): Promise<Milestone> {
    const id = generateId()
    const ts = now()
    await run(
      `INSERT INTO milestones (id, project_id, name, description, target_date, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.project_id || '',
        data.name || '',
        data.description || '',
        data.target_date || '',
        data.status || 'pending',
        ts,
        ts,
      ]
    )
    const ms: Milestone = {
      id,
      project_id: data.project_id || '',
      name: data.name || '',
      description: data.description || '',
      target_date: data.target_date || '',
      status: (data.status as Milestone['status']) || 'pending',
      created_at: ts,
      updated_at: ts,
    }
    milestones.value.push(ms)
    return ms
  }

  async function updateMilestone(id: string, data: Partial<Milestone>) {
    const sets: string[] = []
    const params: any[] = []
    const fields: (keyof Milestone)[] = ['name', 'description', 'target_date', 'status']
    for (const key of fields) {
      if (data[key] !== undefined) {
        sets.push(`${key} = ?`)
        params.push(data[key])
      }
    }
    if (sets.length === 0) return
    sets.push('updated_at = ?')
    params.push(now())
    params.push(id)
    await run(`UPDATE milestones SET ${sets.join(', ')} WHERE id = ?`, params)
    const idx = milestones.value.findIndex((m) => m.id === id)
    if (idx !== -1) Object.assign(milestones.value[idx], data, { updated_at: params[params.length - 2] })
  }

  async function deleteMilestone(id: string) {
    await run('DELETE FROM milestones WHERE id = ?', [id])
    milestones.value = milestones.value.filter((m) => m.id !== id)
  }

  return { milestones, loading, error, fetchMilestones, createMilestone, updateMilestone, deleteMilestone }
})
