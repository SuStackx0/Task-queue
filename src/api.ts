import type { Tag, Task } from './types'

async function req<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...opts,
    headers: opts?.body ? { 'Content-Type': 'application/json' } : undefined,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    const err = new Error(body.error || `request failed: ${res.status}`) as Error & {
      status?: number
      activeId?: number
    }
    err.status = res.status
    err.activeId = body.activeId
    throw err
  }
  return res.json()
}

export const api = {
  list: () => req<{ tasks: Task[]; expired: Task[]; doneToday: number }>('/api/tasks'),
  create: (title: string, tag: Tag, days: number) =>
    req<Task>('/api/tasks', { method: 'POST', body: JSON.stringify({ title, tag, days }) }),
  start: (id: number) => req<Task>(`/api/tasks/${id}/start`, { method: 'POST' }),
  back: (id: number) => req<Task>(`/api/tasks/${id}/back`, { method: 'POST' }),
  pause: (id: number, nextStep: string) =>
    req<Task>(`/api/tasks/${id}/pause`, {
      method: 'POST',
      body: JSON.stringify({ next_step: nextStep }),
    }),
  resume: (id: number) => req<Task>(`/api/tasks/${id}/resume`, { method: 'POST' }),
  done: (id: number) => req<{ ok: true }>(`/api/tasks/${id}/done`, { method: 'POST' }),
  drop: (id: number) => req<{ ok: true }>(`/api/tasks/${id}/drop`, { method: 'POST' }),
  setPosition: (id: number, position: number) =>
    req<{ ok: true }>(`/api/tasks/${id}/position`, {
      method: 'PATCH',
      body: JSON.stringify({ position }),
    }),
  expire: (id: number) => req<Task>(`/api/tasks/${id}/expire`, { method: 'POST' }),
  restore: (id: number, days: number) =>
    req<Task>(`/api/tasks/${id}/restore`, { method: 'POST', body: JSON.stringify({ days }) }),
  setDays: (id: number, days: number) =>
    req<Task>(`/api/tasks/${id}/days`, { method: 'PATCH', body: JSON.stringify({ days }) }),
}
