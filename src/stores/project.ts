import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useDB } from '@/lib/db'
import type { Project } from '@/types'

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const { query, run, generateId, now } = useDB()

  const activeProjects = computed(() => projects.value.filter((p) => p.status === 'active'))

  async function fetchProjects() {
    loading.value = true
    error.value = null
    try {
      projects.value = await query<Project>(
        'SELECT * FROM projects ORDER BY created_at DESC'
      )
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  function getById(id: string): Project | undefined {
    return projects.value.find((p) => p.id === id)
  }

  async function createProject(data: Partial<Project>): Promise<Project> {
    const id = generateId()
    const ts = now()
    await run(
      `INSERT INTO projects (id, name, description, estimated_end_date, development_cycle, start_date, phase, parent_id, priority, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.name || '',
        data.description || '',
        data.estimated_end_date || '',
        data.development_cycle || '',
        data.start_date || null,
        data.phase || '需求调研',
        data.parent_id || null,
        data.priority || 'medium',
        data.status || 'active',
        ts,
        ts,
      ]
    )
    const proj: Project = {
      id,
      name: data.name || '',
      description: data.description || '',
      estimated_end_date: data.estimated_end_date || '',
      development_cycle: data.development_cycle || '',
      start_date: data.start_date || null,
      phase: data.phase || '需求调研',
      parent_id: data.parent_id || null,
      priority: (data.priority as Project['priority']) || 'medium',
      status: (data.status as Project['status']) || 'active',
      created_at: ts,
      updated_at: ts,
    }
    projects.value.unshift(proj)
    return proj
  }

  async function updateProject(id: string, data: Partial<Project>) {
    const sets: string[] = []
    const params: any[] = []
    const fields: (keyof Project)[] = ['name', 'description', 'estimated_end_date', 'development_cycle', 'start_date', 'phase', 'parent_id', 'priority', 'status']
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
    await run(`UPDATE projects SET ${sets.join(', ')} WHERE id = ?`, params)
    const idx = projects.value.findIndex((p) => p.id === id)
    if (idx !== -1) Object.assign(projects.value[idx], data, { updated_at: params[params.length - 2] })
  }

  async function archiveProject(id: string) {
    await updateProject(id, { status: 'archived' })
    const children = projects.value.filter(p => p.parent_id === id)
    for (const child of children) {
      await archiveProject(child.id)
    }
  }

  async function deleteProject(id: string) {
    const children = projects.value.filter(p => p.parent_id === id)
    for (const child of children) {
      await deleteProject(child.id)
    }
    await run('DELETE FROM projects WHERE id = ?', [id])
    projects.value = projects.value.filter((p) => p.id !== id)
  }

  async function getProgress(id: string): Promise<number> {
    const tasks = await query<{ status: string }>(
      'SELECT status FROM tasks WHERE project_id = ?',
      [id]
    )
    if (tasks.length === 0) return 0
    const done = tasks.filter((t) => t.status === 'done').length
    return Math.round((done / tasks.length) * 100)
  }

  return { projects, loading, error, activeProjects, fetchProjects, getById, createProject, updateProject, archiveProject, deleteProject, getProgress }
})
