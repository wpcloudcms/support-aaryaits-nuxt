// ── Directus collection types ──────────────────────────────────

export interface DirectusUser {
  id: string
  first_name: string
  last_name: string
  email: string
  avatar?: string
  role: string
  avatar_color?: string
}

export interface Issue {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'in-review' | 'done' | 'cancelled'
  priority: 'urgent' | 'high' | 'medium' | 'low'
  assignee?: DirectusUser | string
  project?: Project | string
  labels?: IssueLabel[]
  date_created: string
  date_updated?: string
}

export interface Project {
  id: string
  name: string
  description?: string
  color: string
  progress: number
  members?: ProjectMember[]
  date_created: string
}

export interface ProjectMember {
  id: string
  project_id: string
  directus_users_id: DirectusUser | string
}

export interface IssueLabel {
  id: string
  issue_id: string
  label: string
}

export interface Cycle {
  id: string
  name: string
  start_date: string
  end_date: string
  status: 'active' | 'completed' | 'upcoming'
}

// ── UI types ───────────────────────────────────────────────────

export type StatusType = Issue['status']
export type PriorityType = Issue['priority']

export interface StatusConfig {
  label: string
  cls: string
}

export interface PriorityConfig {
  label: string
  icon: string
  color: string
}

export interface FilterState {
  status: StatusType[]
  priority: PriorityType[]
  assignee: string[]
}

// ── Directus schema ────────────────────────────────────────────
export interface Schema {
  issues: Issue[]
  projects: Project[]
  project_members: ProjectMember[]
  issue_labels: IssueLabel[]
  cycles: Cycle[]
}
