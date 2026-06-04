import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useDB } from '@/lib/db'
import type { Task } from '@/types'

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const { query, run, generateId, now } = useDB()

  const byProject = computed(() => {
    const map: Record<string, Task[]> = {}
    for (const t of tasks.value) {
      const key = t.project_id || '__unassigned__'
      if (!map[key]) map[key] = []
      map[key].push(t)
    }
    return map
  })

  async function fetchTasks(projectId?: string) {
    loading.value = true
    error.value = null
    try {
      if (projectId) {
        tasks.value = await query<Task>(
          `SELECT t.*, p.name as project_name FROM tasks t
           LEFT JOIN projects p ON t.project_id = p.id
           WHERE t.project_id = ?
           ORDER BY t.created_at DESC`,
          [projectId]
        )
      } else {
        tasks.value = await query<Task>(
          `SELECT t.*, p.name as project_name FROM tasks t
           LEFT JOIN projects p ON t.project_id = p.id
           ORDER BY t.created_at DESC`
        )
      }
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  function getTasksByProject(projectId: string): Task[] {
    return tasks.value.filter((t) => t.project_id === projectId)
  }

  async function createTask(data: Partial<Task>): Promise<Task> {
    const id = generateId()
    const ts = now()
    await run(
      `INSERT INTO tasks (id, project_id, title, description, status, priority, assignee, due_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.project_id || null,
        data.title || '',
        data.description || '',
        data.status || 'pending',
        data.priority || 'medium',
        data.assignee || '',
        data.due_date || null,
        ts,
        ts,
      ]
    )
    const task: Task = {
      id,
      project_id: data.project_id || null,
      title: data.title || '',
      description: data.description || '',
      status: (data.status as Task['status']) || 'pending',
      priority: (data.priority as Task['priority']) || 'medium',
      assignee: data.assignee || '',
      due_date: data.due_date || null,
      completed_at: null,
      created_at: ts,
      updated_at: ts,
    }
    tasks.value.unshift(task)
    return task
  }

  async function updateTask(id: string, data: Partial<Task>) {
    const sets: string[] = []
    const params: any[] = []
    const fields: (keyof Task)[] = ['title', 'description', 'status', 'priority', 'assignee', 'due_date', 'completed_at', 'project_id']
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
    await run(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`, params)
    const idx = tasks.value.findIndex((t) => t.id === id)
    if (idx !== -1) Object.assign(tasks.value[idx], data, { updated_at: params[params.length - 2] })
  }

  async function transitionStatus(id: string, newStatus: Task['status']) {
    const data: Partial<Task> = { status: newStatus }
    if (newStatus === 'done') {
      data.completed_at = now()
    } else {
      data.completed_at = null
    }
    await updateTask(id, data)
  }

  async function deleteTask(id: string) {
    await run('DELETE FROM tasks WHERE id = ?', [id])
    tasks.value = tasks.value.filter((t) => t.id !== id)
  }

  async function getUnassignedTasks(projectId: string): Promise<Task[]> {
    return await query<Task>(
      `SELECT t.*, p.name as project_name FROM tasks t
       LEFT JOIN projects p ON t.project_id = p.id
       WHERE t.project_id = ?
       AND t.id NOT IN (SELECT DISTINCT task_id FROM release_contents WHERE task_id IS NOT NULL)
       ORDER BY t.created_at DESC`,
      [projectId]
    )
  }

  return { tasks, loading, error, byProject, fetchTasks, getTasksByProject, createTask, updateTask, transitionStatus, deleteTask, getUnassignedTasks }
})
