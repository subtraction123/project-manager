<template>
  <div>
    <!-- Dark Page Header -->
    <div class="flex items-center justify-between mb-6 px-6 py-4 rounded-lg bg-[#172B4D] text-white">
      <h2 class="text-lg font-semibold">版本管理</h2>
      <button @click="showCreateVersionModal = true" class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors text-sm font-medium">
        创建版本
      </button>
    </div>

    <!-- Unassigned Projects -->
    <div class="bg-[#f4f5f7] rounded-xl p-5 mb-6">
      <h3 class="text-base font-semibold text-text-primary mb-1">未排期项目</h3>
      <p class="text-xs text-text-secondary mb-4">未分配到任何版本的项目</p>
      <div v-if="unassignedProjectTree.length === 0" class="py-8 text-center text-text-muted text-sm">所有项目都已排期</div>
      <div v-else class="flex flex-col gap-2">
        <div v-for="node in unassignedProjectTree" :key="node.project.id" class="bg-white rounded-lg border border-transparent hover:border-primary/30 transition-colors overflow-hidden">
          <!-- Parent Row -->
          <div class="flex items-center px-4 py-3">
            <div class="w-6 flex-shrink-0 text-xs text-text-muted cursor-pointer" @click="toggleUnassignedExpand(node.project.id)">
              {{ node.children.length > 0 ? (unassignedExpanded.has(node.project.id) ? '▼' : '▶') : '' }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm font-medium text-text-primary">{{ node.project.name }}</div>
              <div class="flex items-center gap-2 mt-1">
                <span :class="['text-xs px-2 py-0.5 rounded font-medium', phaseTagClass(node.project.phase)]">{{ node.project.phase || '需求调研' }}</span>
              </div>
            </div>
            <div class="flex items-center gap-2 ml-4">
              <button @click="$router.push(`/projects/${node.project.id}`)" class="px-3 py-1.5 text-xs border border-border-color rounded text-text-secondary hover:text-primary hover:border-primary transition-colors">
                查看详情
              </button>
              <button @click="openAssignVersion(node.project)" class="px-3 py-1.5 text-xs bg-primary text-white rounded hover:bg-primary-light transition-colors">
                分配版本
              </button>
            </div>
          </div>
          <!-- Children -->
          <div v-if="node.children.length > 0 && unassignedExpanded.has(node.project.id)" class="border-t border-border-color bg-gray-50/50">
            <div v-for="child in node.children" :key="child.id"
              class="flex items-center px-4 py-2.5 pl-10 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-0">
              <div class="flex-1 min-w-0">
                <div class="text-sm font-medium text-text-primary">{{ child.name }}</div>
                <div class="flex items-center gap-2 mt-1">
                  <span :class="['text-xs px-2 py-0.5 rounded font-medium', phaseTagClass(child.phase)]">{{ child.phase || '需求调研' }}</span>
                </div>
              </div>
              <div class="flex items-center gap-2 ml-4">
                <button @click="$router.push(`/projects/${child.id}`)" class="px-3 py-1.5 text-xs border border-border-color rounded text-text-secondary hover:text-primary hover:border-primary transition-colors">
                  查看详情
                </button>
                <button @click="openAssignVersion(child)" class="px-3 py-1.5 text-xs bg-primary text-white rounded hover:bg-primary-light transition-colors">
                  分配版本
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Scheduled Versions -->
    <div>
      <h3 class="text-base font-semibold text-text-primary mb-4">已排期版本</h3>

      <div v-if="scheduledVersions.length === 0" class="py-12 text-center text-text-muted text-sm">暂无版本</div>

      <div v-for="version in scheduledVersions" :key="version.name"
        class="bg-white rounded-lg p-4 mb-3 border border-border-color border-l-4 border-l-primary">
        <div class="flex items-center justify-between mb-3">
          <span class="text-base font-semibold text-text-primary">{{ version.name }}</span>
          <span :class="['px-3 py-1 rounded-full text-xs font-medium', versionStatusClass(version.status)]">
            {{ versionStatusLabel(version.status) }}
          </span>
        </div>
        <div class="text-xs text-text-secondary mb-2">
          <span>发布人: {{ version.publisher || '-' }}</span>
          <span v-if="version.published_at"> · 发布时间: {{ version.published_at.split('T')[0] }}</span>
        </div>

        <div v-if="scheduledExpanded.has(version.name)" class="mb-3 pt-3 border-t border-dashed border-[#e0e4e8]">
          <div v-for="release in version.releases" :key="release.id" class="flex items-center py-2">
            <div class="flex-1 min-w-0">
              <div class="text-sm text-text-primary">{{ release.project_name }}</div>
              <div v-if="version.contents[release.id]?.length" class="mt-1 space-y-0.5">
                <div v-for="c in version.contents[release.id]" :key="c.id" class="text-xs text-text-secondary pl-2 border-l-2 border-primary/20">
                  [{{ contentTypeLabel(c.content_type) }}] {{ c.content }}
                </div>
              </div>
            </div>
            <button @click="cancelProjectVersion(release)" class="px-2 py-1 text-xs border border-border-color rounded text-text-secondary hover:border-danger hover:text-danger transition-colors ml-2">
              取消版本
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <button @click="toggleScheduledExpand(version.name)" class="px-2.5 py-1 text-xs border border-border-color rounded text-text-secondary hover:text-primary hover:border-primary transition-colors">
            {{ scheduledExpanded.has(version.name) ? '收起详情' : '查看详情' }}
          </button>
          <button @click="openEditVersion(version)" class="px-2.5 py-1 text-xs border border-border-color rounded text-text-secondary hover:text-primary hover:border-primary transition-colors">
            编辑
          </button>
          <button v-if="version.status !== 'published'" @click="publishVersion(version)" class="px-2.5 py-1 text-xs bg-success text-white rounded hover:opacity-90 transition-all">
            发布
          </button>
          <button v-if="version.status === 'published'" @click="retractVersion(version)" class="px-2.5 py-1 text-xs bg-warning text-white rounded hover:opacity-90 transition-all">
            撤回
          </button>
          <button @click="deleteVersion(version)" class="px-2.5 py-1 text-xs border border-border-color rounded text-text-secondary hover:border-danger hover:text-danger transition-colors">
            删除
          </button>
        </div>
      </div>
    </div>

    <!-- Modal: Create Version -->
    <BaseModal v-model="showCreateVersionModal" title="创建版本" subtitle="添加新的版本信息" width="sm" headerColor="bg-gradient-to-br from-[#722ED1] to-[#9254DE]">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">版本号</label>
          <input v-model="newRelease.version_name" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-[#722ED1] focus:outline-none bg-[#fafbfc]" placeholder="例如：v1.0.0">
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">发布人</label>
          <input v-model="newRelease.publisher" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-[#722ED1] focus:outline-none bg-[#fafbfc]">
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">描述</label>
          <textarea v-model="newRelease.description" rows="2" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-[#722ED1] focus:outline-none bg-[#fafbfc] resize-none"></textarea>
        </div>
      </div>
      <template #footer>
        <button @click="showCreateVersionModal = false" class="px-5 py-2.5 border border-[#e0e4e8] rounded-lg text-sm text-text-secondary hover:bg-gray-50">取消</button>
        <button @click="createVersion" :disabled="!newRelease.version_name" class="px-6 py-2.5 bg-gradient-to-br from-[#722ED1] to-[#9254DE] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">创建版本</button>
      </template>
    </BaseModal>

    <!-- Modal: Edit Version -->
    <BaseModal v-model="showEditVersionModal" title="编辑版本" subtitle="修改版本信息" width="sm" headerColor="bg-gradient-to-br from-[#722ED1] to-[#9254DE]">
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">版本号</label>
          <input v-model="editVersionForm.version_name" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-[#722ED1] focus:outline-none bg-[#fafbfc]">
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">发布人</label>
          <input v-model="editVersionForm.publisher" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-[#722ED1] focus:outline-none bg-[#fafbfc]">
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">描述</label>
          <textarea v-model="editVersionForm.description" rows="2" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-[#722ED1] focus:outline-none bg-[#fafbfc] resize-none"></textarea>
        </div>
      </div>
      <template #footer>
        <button @click="showEditVersionModal = false" class="px-5 py-2.5 border border-[#e0e4e8] rounded-lg text-sm text-text-secondary hover:bg-gray-50">取消</button>
        <button @click="saveEditVersion" :disabled="!editVersionForm.version_name" class="px-6 py-2.5 bg-gradient-to-br from-[#722ED1] to-[#9254DE] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">保存修改</button>
      </template>
    </BaseModal>

    <!-- Modal: Assign Version -->
    <BaseModal v-model="showAssignModal" title="分配版本" subtitle="选择项目要发布的版本" width="sm" headerColor="bg-gradient-to-br from-[#1890FF] to-[#40A9FF]">
      <div class="space-y-4">
        <div class="p-3 bg-green-50 rounded-lg">
          <span class="text-xs text-success">待分配项目：</span>
          <span class="text-sm font-medium text-text-primary ml-1">{{ assigningProject?.name }}</span>
        </div>
        <div>
          <label class="block text-sm font-medium text-text-primary mb-1.5">选择版本</label>
          <select v-model="assignVersionId" class="w-full px-3 py-2.5 border border-[#e0e4e8] rounded-lg text-sm focus:border-[#1890FF] focus:outline-none bg-[#fafbfc]">
            <option value="">请选择版本</option>
            <option v-for="v in availableVersions" :key="v.id" :value="v.id">{{ v.name }} ({{ versionStatusLabel(v.status) }})</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button @click="showAssignModal = false" class="px-5 py-2.5 border border-[#e0e4e8] rounded-lg text-sm text-text-secondary hover:bg-gray-50">取消</button>
        <button @click="assignVersion" :disabled="!assignVersionId" class="px-6 py-2.5 bg-gradient-to-br from-[#1890FF] to-[#40A9FF] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all">确认分配</button>
      </template>
    </BaseModal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useDB } from '@/lib/db'
import { useProjectStore } from '@/stores/project'
import { useUIStore } from '@/stores/ui'
import type { Project, Release, ReleaseContent, Version } from '@/types'
import BaseModal from '@/components/shared/BaseModal.vue'

const { query, run, generateId, now } = useDB()
const projectStore = useProjectStore()
const ui = useUIStore()

const showCreateVersionModal = ref(false)
const showAssignModal = ref(false)
const showEditVersionModal = ref(false)
const assigningProject = ref<Project | null>(null)
const assignVersionId = ref('')
const editingVersion = ref<Version | null>(null)
const allVersions = ref<Version[]>([])
const allReleases = ref<Release[]>([])
const allContents = ref<Record<string, ReleaseContent[]>>({})

const newRelease = reactive({ version_name: '', publisher: '', description: '' })
const editVersionForm = reactive({ version_name: '', publisher: '', description: '' })

const allProjects = computed(() => projectStore.projects)

const unassignedExpanded = ref(new Set<string>())
const scheduledExpanded = ref(new Set<string>())

function toggleUnassignedExpand(id: string) {
  if (unassignedExpanded.value.has(id)) {
    unassignedExpanded.value.delete(id)
  } else {
    unassignedExpanded.value.add(id)
  }
}

function toggleScheduledExpand(name: string) {
  if (scheduledExpanded.value.has(name)) {
    scheduledExpanded.value.delete(name)
  } else {
    scheduledExpanded.value.add(name)
  }
}

const unassignedProjects = computed(() => {
  const assignedProjectIds = new Set(allReleases.value.map(r => r.project_id))
  return allProjects.value.filter(p => !assignedProjectIds.has(p.id) && p.status === 'active')
})

interface UnassignedTreeNode {
  project: Project
  children: Project[]
}

const unassignedProjectTree = computed(() => {
  const unassigned = unassignedProjects.value
  const roots = unassigned.filter(p => !p.parent_id)
  const children = unassigned.filter(p => p.parent_id)
  const unassignedIds = new Set(unassigned.map(p => p.id))
  return roots.map(p => ({
    project: p,
    children: children.filter(c => c.parent_id === p.id),
  })).concat(
    children.filter(c => !unassignedIds.has(c.parent_id!)).map(c => ({
      project: c,
      children: [],
    }))
  )
})

const scheduledVersions = computed(() => {
  return allVersions.value.map(v => {
    const releases = allReleases.value
      .filter(r => r.version_name === v.name)
      .map(r => {
        const project = allProjects.value.find(p => p.id === r.project_id)
        return { ...r, project_name: project?.name || '未知项目' }
      })
    return {
      ...v,
      releases,
      contents: allContents.value,
    }
  })
})

const availableVersions = computed(() => {
  return allVersions.value.filter(v => v.status !== 'retracted')
})

function phaseTagClass(phase?: string) {
  const map: Record<string, string> = {
    '需求调研': 'bg-blue-50 text-blue-500',
    '方案设计': 'bg-purple-50 text-purple-500',
    '实施配置': 'bg-cyan-50 text-cyan-500',
    '上线': 'bg-green-50 text-green-500',
  }
  return map[phase || ''] || map['需求调研']
}

function versionStatusClass(status: string) {
  const map: Record<string, string> = {
    published: 'bg-green-50 text-green-500',
    draft: 'bg-amber-50 text-amber-500',
    retracted: 'bg-red-50 text-red-500',
  }
  return map[status] || map.draft
}

function versionStatusLabel(status: string) {
  const map: Record<string, string> = {
    published: '已发布',
    draft: '草稿',
    retracted: '已撤回',
  }
  return map[status] || status
}

function contentTypeLabel(type: string) {
  const map: Record<string, string> = { feature: '新增功能', fix: '修复问题', optimize: '优化项' }
  return map[type] || type
}

function openAssignVersion(project: Project) {
  assigningProject.value = project
  assignVersionId.value = ''
  showAssignModal.value = true
}

async function assignVersion() {
  if (!assigningProject.value || !assignVersionId.value) return
  const version = allVersions.value.find(v => v.id === assignVersionId.value)
  if (!version) return

  const id = generateId()
  const ts = now()
  await run(
    `INSERT INTO releases (id, project_id, version_name, status, publisher, description, created_at, updated_at)
     VALUES (?, ?, ?, 'draft', ?, ?, ?, ?)`,
    [id, assigningProject.value.id, version.name, version.publisher, version.description || '', ts, ts]
  )
  await fetchAllReleases()
  showAssignModal.value = false
  assigningProject.value = null
  ui.addToast({ type: 'success', message: '版本分配成功' })
}

async function createVersion() {
  if (!newRelease.version_name) return
  const id = generateId()
  const ts = now()
  await run(
    `INSERT INTO versions (id, name, status, publisher, description, created_at, updated_at)
     VALUES (?, ?, 'draft', ?, ?, ?, ?)`,
    [id, newRelease.version_name, newRelease.publisher, newRelease.description, ts, ts]
  )
  await fetchAllVersions()
  showCreateVersionModal.value = false
  newRelease.version_name = ''
  newRelease.publisher = ''
  newRelease.description = ''
  ui.addToast({ type: 'success', message: '版本创建成功' })
}

async function deleteVersion(version: Version) {
  await run('DELETE FROM releases WHERE version_name = ?', [version.name])
  await run('DELETE FROM versions WHERE id = ?', [version.id])
  await fetchAllData()
  ui.addToast({ type: 'success', message: '版本已删除' })
}

async function publishVersion(version: Version) {
  const ts = now()
  await run(
    'UPDATE versions SET status = ?, published_at = ?, updated_at = ? WHERE id = ?',
    ['published', ts, ts, version.id]
  )
  await run(
    'UPDATE releases SET status = ?, published_at = ?, updated_at = ? WHERE version_name = ?',
    ['published', ts, ts, version.name]
  )
  const projectIds = allReleases.value
    .filter(r => r.version_name === version.name)
    .map(r => r.project_id)
  if (projectIds.length > 0) {
    const placeholders = projectIds.map(() => '?').join(',')
    await run(
      `UPDATE projects SET phase = '上线', updated_at = ? WHERE id IN (${placeholders})`,
      [ts, ...projectIds]
    )
    for (const p of projectStore.projects) {
      if (projectIds.includes(p.id)) p.phase = '上线'
    }
  }
  await fetchAllData()
  ui.addToast({ type: 'success', message: '版本已发布' })
}

function openEditVersion(version: Version) {
  editingVersion.value = version
  editVersionForm.version_name = version.name
  editVersionForm.publisher = version.publisher || ''
  editVersionForm.description = version.description || ''
  showEditVersionModal.value = true
}

async function saveEditVersion() {
  if (!editVersionForm.version_name || !editingVersion.value) return
  const oldName = editingVersion.value.name
  const newName = editVersionForm.version_name
  const ts = now()
  await run(
    'UPDATE versions SET name = ?, publisher = ?, description = ?, updated_at = ? WHERE id = ?',
    [newName, editVersionForm.publisher, editVersionForm.description, ts, editingVersion.value.id]
  )
  if (newName !== oldName) {
    await run(
      'UPDATE releases SET version_name = ? WHERE version_name = ?',
      [newName, oldName]
    )
  }
  showEditVersionModal.value = false
  editingVersion.value = null
  await fetchAllData()
  ui.addToast({ type: 'success', message: '版本已更新' })
}

async function retractVersion(version: Version) {
  const ts = now()
  await run(
    'UPDATE versions SET status = ?, updated_at = ? WHERE id = ?',
    ['retracted', ts, version.id]
  )
  await run(
    'UPDATE releases SET status = ?, updated_at = ? WHERE version_name = ?',
    ['retracted', ts, version.name]
  )
  await fetchAllData()
  ui.addToast({ type: 'info', message: '版本已撤回' })
}

async function cancelProjectVersion(release: Release) {
  await run('DELETE FROM releases WHERE id = ?', [release.id])
  if (allContents.value[release.id]) delete allContents.value[release.id]
  await fetchAllReleases()
  ui.addToast({ type: 'info', message: '已取消版本分配' })
}

async function fetchAllVersions() {
  allVersions.value = await query<Version>('SELECT * FROM versions ORDER BY created_at DESC')
}

async function fetchAllReleases() {
  allReleases.value = await query<Release>('SELECT * FROM releases ORDER BY created_at DESC')
  for (const r of allReleases.value) {
    allContents.value[r.id] = await query<ReleaseContent>(
      'SELECT * FROM release_contents WHERE release_id = ? ORDER BY sort_order ASC',
      [r.id]
    )
  }
}

async function fetchAllData() {
  await Promise.all([fetchAllVersions(), fetchAllReleases()])
}

onMounted(async () => {
  await Promise.all([projectStore.fetchProjects(), fetchAllVersions(), fetchAllReleases()])
})
</script>
