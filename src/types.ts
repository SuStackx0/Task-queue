export type Tag = 'work' | 'study' | 'task'
export type TaskState = 'queued' | 'active' | 'paused' | 'done' | 'dropped' | 'expired'

export interface Task {
  id: number
  title: string
  tag: Tag
  state: TaskState
  nextStep: string | null
  createdAt: number
  updatedAt: number
  pausedAt: number | null
  doneAt: number | null
  position: number
  daysTotal: number | null
  expiresAt: number | null
  expiredAt: number | null
}
