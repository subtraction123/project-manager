import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useDB } from '@/lib/db'
import type { DailyItem } from '@/types'

export const useDailyItemStore = defineStore('dailyItem', () => {
  const items = ref<DailyItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const { query, run, generateId, now } = useDB()

  const groupedByDate = computed(() => {
    const groups: Record<string, DailyItem[]> = {}
    for (const item of items.value) {
      const date = item.record_date
      if (!groups[date]) groups[date] = []
      groups[date].push(item)
    }
    const sorted = Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
    return sorted
  })

  const unconvertedItems = computed(() =>
    items.value.filter((i) => !i.is_converted)
  )

  const incompleteItems = computed(() =>
    items.value.filter((i) => !i.is_completed)
  )

  async function fetchItems() {
    loading.value = true
    error.value = null
    try {
      items.value = await query<DailyItem>(
        'SELECT * FROM daily_items ORDER BY record_date DESC, created_at DESC'
      )
    } catch (e: any) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  async function createItem(data: Partial<DailyItem>): Promise<DailyItem> {
    const id = generateId()
    const ts = now()
    await run(
      `INSERT INTO daily_items (id, title, description, category, record_date, is_converted, is_completed, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, 0, ?, ?)`,
      [
        id,
        data.title || '',
        data.description || '',
        data.category || '工作跟进',
        data.record_date || new Date().toISOString().split('T')[0],
        ts,
        ts,
      ]
    )
    const newItem: DailyItem = {
      id,
      title: data.title || '',
      description: data.description || '',
      category: data.category || '工作跟进',
      record_date: data.record_date || new Date().toISOString().split('T')[0],
      is_completed: false,
      is_converted: false,
      converted_to_type: null,
      converted_to_id: null,
      created_at: ts,
      updated_at: ts,
    }
    items.value.unshift(newItem)
    return newItem
  }

  async function updateItem(id: string, data: Partial<DailyItem>) {
    const sets: string[] = []
    const params: any[] = []
    for (const key of ['title', 'description', 'category', 'record_date', 'is_completed'] as const) {
      if (data[key] !== undefined) {
        sets.push(`${key} = ?`)
        params.push(data[key])
      }
    }
    if (sets.length === 0) return
    sets.push('updated_at = ?')
    params.push(now())
    params.push(id)
    await run(`UPDATE daily_items SET ${sets.join(', ')} WHERE id = ?`, params)
    const idx = items.value.findIndex((i) => i.id === id)
    if (idx !== -1) Object.assign(items.value[idx], data, { updated_at: params[params.length - 2] })
  }

  async function deleteItem(id: string) {
    await run('DELETE FROM daily_items WHERE id = ?', [id])
    items.value = items.value.filter((i) => i.id !== id)
  }

  async function markConverted(id: string, type: string, targetId: string) {
    await run(
      'UPDATE daily_items SET is_converted = 1, converted_to_type = ?, converted_to_id = ?, updated_at = ? WHERE id = ?',
      [type, targetId, now(), id]
    )
    const item = items.value.find((i) => i.id === id)
    if (item) {
      item.is_converted = true
      item.converted_to_type = type
      item.converted_to_id = targetId
    }
  }

  async function toggleComplete(id: string) {
    const item = items.value.find(i => i.id === id)
    if (item) {
      const newVal = !item.is_completed
      await updateItem(id, { is_completed: newVal })
    }
  }

  return { items, loading, error, groupedByDate, unconvertedItems, incompleteItems, fetchItems, createItem, updateItem, deleteItem, markConverted, toggleComplete }
})
