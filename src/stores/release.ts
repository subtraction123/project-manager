import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useDB } from '@/lib/db'
import type { Release, ReleaseContent } from '@/types'

export const useReleaseStore = defineStore('release', () => {
  const releases = ref<Release[]>([])
  const contents = ref<Record<string, ReleaseContent[]>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)

  const { query, run, generateId, now } = useDB()

  async function fetchReleases(projectId: string) {
    loading.value = true
    error.value = null
    try {
      releases.value = await query<Release>(
        'SELECT * FROM releases WHERE project_id = ? ORDER BY created_at DESC',
        [projectId]
      )
      for (const r of releases.value) {
        contents.value[r.id] = await query<ReleaseContent>(
          'SELECT * FROM release_contents WHERE release_id = ? ORDER BY sort_order ASC',
          [r.id]
        )
      }
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createRelease(data: Partial<Release>, selectedTaskIds: string[]): Promise<Release> {
    const id = generateId()
    const ts = now()
    await run(
      `INSERT INTO releases (id, project_id, version_name, status, publisher, description, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        data.project_id || '',
        data.version_name || '',
        data.status || 'draft',
        data.publisher || '',
        data.description || '',
        ts,
        ts,
      ]
    )
    const release: Release = {
      id,
      project_id: data.project_id || '',
      version_name: data.version_name || '',
      status: (data.status as Release['status']) || 'draft',
      publisher: data.publisher || '',
      description: data.description || '',
      published_at: null,
      created_at: ts,
      updated_at: ts,
    }
    releases.value.unshift(release)
    contents.value[id] = await autoGenerateContents(id, selectedTaskIds)
    return release
  }

  async function autoGenerateContents(releaseId: string, taskIds: string[]): Promise<ReleaseContent[]> {
    if (!taskIds.length) return []
    const idList = taskIds.map(id => `'${id}'`).join(',')
    const tasks = await query<{ id: string; title: string }>(
      `SELECT id, title FROM tasks WHERE id IN (${idList})`
    )

    const groups: Record<string, string[]> = { feature: [], fix: [], optimize: [] }
    for (const t of tasks) {
      const title = t.title.toLowerCase()
      if (title.includes('fix') || title.includes('bug') || title.includes('修复')) {
        groups.fix.push(t.id)
      } else if (title.includes('optimize') || title.includes('refactor') || title.includes('优化')) {
        groups.optimize.push(t.id)
      } else {
        groups.feature.push(t.id)
      }
    }

    const results: ReleaseContent[] = []
    let order = 0
    for (const type of ['feature', 'fix', 'optimize'] as const) {
      for (const taskId of groups[type]) {
        const task = tasks.find((t) => t.id === taskId)
        if (!task) continue
        const cid = generateId()
        const ts = now()
        await run(
          `INSERT INTO release_contents (id, release_id, task_id, content_type, content, sort_order, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [cid, releaseId, taskId, type, task.title, order, ts]
        )
        results.push({ id: cid, release_id: releaseId, task_id: taskId, content_type: type, content: task.title, sort_order: order, created_at: ts })
        order++
      }
    }
    return results
  }

  async function publishRelease(id: string) {
    const ts = now()
    await run(
      'UPDATE releases SET status = ?, published_at = ?, updated_at = ? WHERE id = ?',
      ['published', ts, ts, id]
    )
    const r = releases.value.find((r) => r.id === id)
    if (r) {
      r.status = 'published'
      r.published_at = ts
    }
  }

  async function retractRelease(id: string) {
    const ts = now()
    await run(
      'UPDATE releases SET status = ?, updated_at = ? WHERE id = ?',
      ['retracted', ts, id]
    )
    const r = releases.value.find((r) => r.id === id)
    if (r) {
      r.status = 'retracted'
    }
  }

  async function deleteRelease(id: string) {
    await run('DELETE FROM releases WHERE id = ?', [id])
    releases.value = releases.value.filter((r) => r.id !== id)
    delete contents.value[id]
  }

  async function addReleaseContent(releaseId: string, content: Partial<ReleaseContent>): Promise<ReleaseContent> {
    const cid = generateId()
    const ts = now()
    const sortOrder = (contents.value[releaseId] || []).length
    await run(
      `INSERT INTO release_contents (id, release_id, task_id, content_type, content, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        cid,
        releaseId,
        content.task_id || null,
        content.content_type || 'feature',
        content.content || '',
        sortOrder,
        ts,
      ]
    )
    const item: ReleaseContent = {
      id: cid,
      release_id: releaseId,
      task_id: content.task_id || null,
      content_type: (content.content_type as ReleaseContent['content_type']) || 'feature',
      content: content.content || '',
      sort_order: sortOrder,
      created_at: ts,
    }
    if (!contents.value[releaseId]) contents.value[releaseId] = []
    contents.value[releaseId].push(item)
    return item
  }

  async function updateReleaseContent(contentId: string, data: Partial<ReleaseContent>) {
    await run(
      'UPDATE release_contents SET content_type = ?, content = ? WHERE id = ?',
      [data.content_type, data.content, contentId]
    )
  }

  async function deleteReleaseContent(contentId: string, releaseId: string) {
    await run('DELETE FROM release_contents WHERE id = ?', [contentId])
    if (contents.value[releaseId]) {
      contents.value[releaseId] = contents.value[releaseId].filter((c) => c.id !== contentId)
    }
  }

  return {
    releases, contents, loading, error,
    fetchReleases, createRelease, publishRelease, retractRelease, deleteRelease,
    addReleaseContent, updateReleaseContent, deleteReleaseContent,
  }
})
