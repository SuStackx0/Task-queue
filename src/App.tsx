import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api'
import type { Tag, Task } from './types'
import Rail from './components/Rail'
import Pass from './components/Pass'
import Spindle from './components/Spindle'
import Bin from './components/Bin'
import AddForm from './components/AddForm'
import PaperFilters from './components/PaperFilters'
import ThemeSwitcher from './components/ThemeSwitcher'
import { applyTheme, loadStoredTheme, type Theme } from './themes'

interface NoteFlow {
  taskId: number
  after: null | { kind: 'start' | 'resume'; targetId: number }
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.state === 'active') return -1
    if (b.state === 'active') return 1
    if (a.urgent !== b.urgent) return a.urgent ? -1 : 1
    return a.position - b.position
  })
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => loadStoredTheme())
  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  const [tasks, setTasks] = useState<Task[]>([])
  const [doneToday, setDoneToday] = useState(0)
  const [addOpen, setAddOpen] = useState(false)
  const [noteFlow, setNoteFlow] = useState<NoteFlow | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [resumeRevealId, setResumeRevealId] = useState<number | null>(null)
  const [exitAnim, setExitAnim] = useState<{ taskId: number; kind: 'done' | 'drop' } | null>(null)
  const [focusedId, setFocusedId] = useState<number | null>(null)
  const [armedId, setArmedId] = useState<number | null>(null)
  const [bumpKey, setBumpKey] = useState(0)
  const resumeTimer = useRef<number | null>(null)
  const armTimer = useRef<number | null>(null)

  function clearArmed() {
    if (armTimer.current) window.clearTimeout(armTimer.current)
    setArmedId(null)
  }

  function handleArm(id: number) {
    setArmedId(id)
    if (armTimer.current) window.clearTimeout(armTimer.current)
    armTimer.current = window.setTimeout(() => setArmedId(null), 4000)
  }

  useEffect(() => {
    function clearOnOutsideClick() {
      clearArmed()
    }
    window.addEventListener('click', clearOnOutsideClick)
    return () => window.removeEventListener('click', clearOnOutsideClick)
  }, [])

  const load = useCallback(() => {
    api.list().then(({ tasks, doneToday }) => {
      setTasks(tasks)
      setDoneToday(doneToday)
    })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // re-render periodically so "hung Nd ago" / paper aging stay live
  const [, forceTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 30000)
    return () => clearInterval(t)
  }, [])

  const activeTask = tasks.find((t) => t.state === 'active') || null
  const passTaskId = activeTask?.id ?? resumeRevealId
  const passTask = tasks.find((t) => t.id === passTaskId) || null
  const showingNoteInput = noteFlow !== null && noteFlow.taskId === passTaskId
  const flippedForPass = showingNoteInput || resumeRevealId === passTaskId
  const railTasks = tasks.filter((t) => t.state !== 'active' && t.id !== resumeRevealId)

  function doStart(id: number) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, state: 'active' } : t)))
    api.start(id).catch(() => load())
  }

  function doResumeReveal(id: number) {
    setResumeRevealId(id)
  }

  useEffect(() => {
    if (resumeRevealId == null) return
    resumeTimer.current = window.setTimeout(() => confirmResume(resumeRevealId), 1500)
    return () => {
      if (resumeTimer.current) window.clearTimeout(resumeTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeRevealId])

  function confirmResume(id: number) {
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current)
    setResumeRevealId(null)
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, state: 'active' } : t)))
    api.resume(id).catch(() => load())
  }

  function handleStartRequest(id: number) {
    clearArmed()
    if (noteFlow || resumeRevealId) return
    const target = tasks.find((t) => t.id === id)
    if (!target) return
    if (activeTask && activeTask.id === id) return

    if (target.state === 'paused') {
      if (activeTask) {
        setNoteFlow({ taskId: activeTask.id, after: { kind: 'resume', targetId: id } })
        setNoteDraft('')
      } else {
        doResumeReveal(id)
      }
      return
    }

    if (activeTask) {
      setNoteFlow({ taskId: activeTask.id, after: { kind: 'start', targetId: id } })
      setNoteDraft('')
    } else {
      doStart(id)
    }
  }

  function handleBackClick() {
    if (!activeTask) return
    const revertsTo = activeTask.nextStep ? 'paused' : 'queued'
    setTasks((prev) => prev.map((t) => (t.id === activeTask.id ? { ...t, state: revertsTo } : t)))
    api.back(activeTask.id).catch(() => load())
  }

  function handlePauseClick() {
    if (!activeTask) return
    setNoteFlow({ taskId: activeTask.id, after: null })
    setNoteDraft('')
  }

  function handleCancelNote() {
    if (!noteFlow || noteFlow.after !== null) return
    setNoteFlow(null)
    setNoteDraft('')
  }

  function handleSubmitNote() {
    if (!noteFlow) return
    const note = noteDraft.trim()
    if (!note) return
    const { taskId, after } = noteFlow
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, state: 'paused', nextStep: note, pausedAt: Date.now() } : t))
    )
    setNoteFlow(null)
    setNoteDraft('')
    api.pause(taskId, note).catch(() => load())
    if (after?.kind === 'start') doStart(after.targetId)
    else if (after?.kind === 'resume') doResumeReveal(after.targetId)
  }

  function handleDoneClick() {
    if (!activeTask) return
    setExitAnim({ taskId: activeTask.id, kind: 'done' })
  }

  function handleDropClick() {
    if (!activeTask) return
    setExitAnim({ taskId: activeTask.id, kind: 'drop' })
  }

  function handleExitComplete() {
    if (!exitAnim) return
    const { taskId, kind } = exitAnim
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    setExitAnim(null)
    if (kind === 'done') {
      setDoneToday((n) => n + 1)
      setBumpKey((n) => n + 1)
      api.done(taskId).catch(() => load())
    } else {
      api.drop(taskId).catch(() => load())
    }
  }

  function handleAdd(title: string, tag: Tag, urgent: boolean) {
    setAddOpen(false)
    api.create(title, tag, urgent).then((task) => {
      setTasks((prev) => sortTasks([...prev, task]))
    })
  }

  function handleToggleUrgent(id: number) {
    const target = tasks.find((t) => t.id === id)
    if (!target) return
    const nextUrgent = !target.urgent
    setTasks((prev) => sortTasks(prev.map((t) => (t.id === id ? { ...t, urgent: nextUrgent } : t))))
    api.setUrgent(id, nextUrgent).catch(() => load())
  }

  function handleLocalReorder(orderedIds: number[]) {
    setTasks((prev) => {
      const byId = new Map(prev.map((t) => [t.id, t]))
      const active = prev.filter((t) => t.state === 'active')
      const reordered = orderedIds.map((id) => byId.get(id)!).filter(Boolean)
      return sortTasks([...active, ...reordered])
    })
  }

  function handleReorderCommit(id: number, newPosition: number) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, position: newPosition } : t)))
    api.setPosition(id, newPosition).catch(() => load())
  }

  // keyboard
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      if (e.key === 'Escape') {
        clearArmed()
        handleCancelNote()
        return
      }
      if (e.key === 'n') {
        e.preventDefault()
        setAddOpen(true)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault()
        if (railTasks.length === 0) return
        const idx = railTasks.findIndex((t) => t.id === focusedId)
        let next: number
        if (idx === -1) next = 0
        else next = e.key === 'ArrowLeft' ? Math.max(0, idx - 1) : Math.min(railTasks.length - 1, idx + 1)
        setFocusedId(railTasks[next].id)
      } else if (e.key === 'Enter') {
        if (showingNoteInput) return
        if (resumeRevealId) {
          confirmResume(resumeRevealId)
        } else if (focusedId != null) {
          handleStartRequest(focusedId)
        }
      } else if (e.key === 'p') {
        handlePauseClick()
      } else if (e.key === 'd') {
        handleDoneClick()
      } else if (e.key === 'x') {
        handleDropClick()
      } else if (e.key === 'b') {
        handleBackClick()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [railTasks, focusedId, showingNoteInput, resumeRevealId, activeTask, noteFlow])

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <div className="aurora">
        <div className="auroraMid" />
      </div>
      <PaperFilters />
      <ThemeSwitcher current={theme} onSelect={setTheme} />
      <header
        style={{
          position: 'relative',
          zIndex: 1,
          padding: '28px 32px 0',
        }}
      >
        <div
          style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 800,
            fontSize: '1.6em',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(120deg, var(--neon-cyan), var(--neon-pink) 60%, var(--neon-purple))',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            textShadow: '0 0 40px rgba(178, 75, 255, 0.35)',
          }}
        >
          THE QUEUE
        </div>
        <div style={{ fontSize: '0.78em', color: 'var(--ink-dim)', marginTop: 4, fontWeight: 500 }}>
          press <b style={{ color: 'var(--neon-cyan)' }}>n</b> to add · tap a ticket, tap again to commit
        </div>
      </header>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '18px 32px 0' }}>
          <Rail
            tasks={railTasks}
            focusedId={focusedId}
            armedId={armedId}
            onArm={handleArm}
            onStartRequest={handleStartRequest}
            onToggleUrgent={handleToggleUrgent}
            onReorder={handleReorderCommit}
            onLocalReorder={handleLocalReorder}
          />
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 32px', minHeight: 420 }}>
          <Pass
            task={passTask}
            flipped={flippedForPass}
            showingNoteInput={showingNoteInput}
            noteCancelable={showingNoteInput && noteFlow?.after === null}
            onCancelNote={handleCancelNote}
            noteDraft={noteDraft}
            onNoteDraftChange={setNoteDraft}
            onSubmitNote={handleSubmitNote}
            resumeReveal={resumeRevealId === passTaskId && !showingNoteInput}
            onResumeClick={() => resumeRevealId && confirmResume(resumeRevealId)}
            onBackClick={handleBackClick}
            onPauseClick={handlePauseClick}
            onDoneClick={handleDoneClick}
            onDropClick={handleDropClick}
            exitKind={exitAnim && exitAnim.taskId === passTaskId ? exitAnim.kind : null}
            onExitAnimationComplete={handleExitComplete}
          />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <Spindle count={doneToday} bumpKey={bumpKey} />
            <Bin />
          </div>
        </div>
      </div>

      <AddForm open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAdd} />
    </div>
  )
}
