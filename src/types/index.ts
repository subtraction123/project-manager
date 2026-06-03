export interface DailyItem {
  id: string
  title: string
  description: string
  category: string
  record_date: string
  is_completed: boolean
  is_converted: boolean
  converted_to_type: string | null
  converted_to_id: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description: string
  estimated_end_date: string
  development_cycle: string
  start_date: string | null
  phase: string
  parent_id: string | null
  status: 'active' | 'archived'
  created_at: string
  updated_at: string
}

export interface ProjectRisk {
  id: string
  project_id: string
  title: string
  description: string
  strategy: string
  level: string
  status: string
  recorded_date: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  description: string
  status: 'pending' | 'doing' | 'done'
  priority: 'low' | 'medium' | 'high'
  assignee: string
  due_date: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
  // Joined field
  project_name?: string
}

export interface Milestone {
  id: string
  project_id: string
  name: string
  description: string
  target_date: string
  status: 'pending' | 'achieved' | 'delayed'
  created_at: string
  updated_at: string
}

export interface Release {
  id: string
  project_id: string
  version_name: string
  status: 'draft' | 'published' | 'retracted'
  publisher: string
  description: string
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface ReleaseContent {
  id: string
  release_id: string
  task_id: string | null
  content_type: 'feature' | 'fix' | 'optimize'
  content: string
  sort_order: number
  created_at: string
}

export interface Version {
  id: string
  name: string
  status: 'draft' | 'published' | 'retracted'
  publisher: string
  description: string
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface WeeklyReport {
  id: string
  week_start_date: string
  week_end_date: string
  content: ReportContent
  status: 'draft' | 'published'
  created_at: string
  updated_at: string
}

export interface ReportContent {
  week_info: {
    week_number: number
    year: number
    start_date: string
    end_date: string
  }
  launched_projects: ProjectReportGroup[]
  projects: ProjectReportGroup[]
  next_week_plan: string
}

export interface ProjectReportGroup {
  project_id: string
  project_name: string
  phase: string
  milestones: Array<{ id: string; name: string; description: string; target_date: string; status: string }>
  risks: Array<{ id: string; title: string; description: string; level: string; status: string }>
}

export type ContentType = 'feature' | 'fix' | 'optimize'
export type TaskStatus = 'pending' | 'doing' | 'done'
export type Priority = 'low' | 'medium' | 'high'
export type MilestoneStatus = 'pending' | 'achieved' | 'delayed'
export type ReleaseStatus = 'draft' | 'published' | 'retracted'
export type ReportStatus = 'draft' | 'published'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}
