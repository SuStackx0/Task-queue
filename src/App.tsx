import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api'
import type { Tag, Task } from './types'
import Rack from './components/Rack'
import Bench from './components/Bench'
import CryoBox from './components/CryoBox'
import Drain from './components/Drain'
import AddForm from './components/AddForm'
import Dustbin from './components/Dustbin'
import { computeCumulativeMs, ownRemainingMs } from './utils/tube'

interface NoteFlow {
  taskId: number
  after: null | { kind: 'start' | 'resume'; targetId: number }
}

function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.state === 'active') return -1
    if (b.state === 'active') return 1
    return a.position - b.position
  })
}

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [expired, setExpired] = useState<Task[]>([])
  const [doneToday, setDoneToday] = useState(0)
  const [addOpen, setAddOpen] = useState(false)
  const [noteFlow, setNoteFlow] = useState<NoteFlow | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  const [resumeRevealId, setResumeRevealId] = useState<number | null>(null)
  const [exitAnim, setExitAnim] = useState<{ taskId: number; kind: 'done' | 'drop' } | null>(null)
  const [expiringId, setExpiringId] = useState<number | null>(null)
  const [focusedId, setFocusedId] = useState<number | null>(null)
  const [armedId, setArmedId] = useState<number | null>(null)
  const [justAddedId, setJustAddedId] = useState<number | null>(null)
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
    api.list().then(({ tasks, expired, doneToday }) => {
      setTasks(tasks)
      setExpired(expired)
      setDoneToday(doneToday)
    })
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // Ticks every second so a countdown tube's liquid visibly drains in real
  // time (not in daily steps) and so "hung Nd ago" stays live. Also the
  // trigger point for noticing a tube's countdown just hit zero.
  const [, forceTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (expiringId != null) return
    const now = Date.now()
    const due = tasks.find(
      (t) =>
        (t.state === 'queued' || t.state === 'paused') &&
        t.daysTotal != null &&
        t.expiresAt != null &&
        t.expiresAt <= now
    )
    if (due) setExpiringId(due.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  })

  const activeTask = tasks.find((t) => t.state === 'active') || null
  const benchTaskId = activeTask?.id ?? resumeRevealId
  const benchTask = tasks.find((t) => t.id === benchTaskId) || null
  const showingNoteInput = noteFlow !== null && noteFlow.taskId === benchTaskId
  const flippedForBench = showingNoteInput || resumeRevealId === benchTaskId
  const rackTasks = tasks.filter((t) => t.state !== 'active' && t.id !== resumeRevealId)
  // The active tube (if it carries its own estimate) still occupies time
  // ahead of the whole rack, so it seeds the queue's cumulative chain.
  const aheadMs = activeTask?.daysTotal != null && activeTask.expiresAt != null ? ownRemainingMs(activeTask.expiresAt) : 0
  const cumulativeMs = computeCumulativeMs(rackTasks, aheadMs)

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

  function handleAdd(title: string, tag: Tag, days: number) {
    setAddOpen(false)
    api.create(title, tag, days).then((task) => {
      setTasks((prev) => sortTasks([...prev, task]))
      setJustAddedId(task.id)
      window.setTimeout(() => setJustAddedId((cur) => (cur === task.id ? null : cur)), 900)
    })
  }

  function handleExpireComplete(id: number) {
    setTasks((prev) => {
      const found = prev.find((t) => t.id === id)
      if (found) {
        setExpired((e) => [{ ...found, state: 'expired', expiredAt: Date.now() }, ...e])
      }
      return prev.filter((t) => t.id !== id)
    })
    setExpiringId(null)
    api.expire(id).catch(() => load())
  }

  function handleRestore(id: number, days: number) {
    const t = Date.now()
    const found = expired.find((task) => task.id === id)
    setExpired((prev) => prev.filter((task) => task.id !== id))
    if (found) {
      const restored: Task = {
        ...found,
        state: 'queued',
        daysTotal: days,
        expiresAt: t + days * 86400000,
        createdAt: t,
        nextStep: null,
        pausedAt: null,
        expiredAt: null,
      }
      setTasks((prev) => sortTasks([...prev, restored]))
    }
    api.restore(id, days).catch(() => load())
  }

  function handleExtend(id: number, addDays: number) {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id && t.daysTotal != null && t.expiresAt != null
          ? { ...t, daysTotal: t.daysTotal + addDays, expiresAt: t.expiresAt + addDays * 86400000 }
          : t
      )
    )
    api.extend(id, addDays).catch(() => load())
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
        if (rackTasks.length === 0) return
        const idx = rackTasks.findIndex((t) => t.id === focusedId)
        let next: number
        if (idx === -1) next = 0
        else next = e.key === 'ArrowLeft' ? Math.max(0, idx - 1) : Math.min(rackTasks.length - 1, idx + 1)
        setFocusedId(rackTasks[next].id)
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
  }, [rackTasks, focusedId, showingNoteInput, resumeRevealId, activeTask, noteFlow])

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <Dustbin expired={expired} onRestore={handleRestore} />
      <header style={{ padding: '26px 32px 0' }}>
        <div
          style={{
            fontFamily: "'Space Mono', monospace",
            fontWeight: 700,
            fontSize: '1.4em',
            letterSpacing: '0.02em',
            color: 'var(--ink)',
          }}
        >
          THE RACK
        </div>
        <div style={{ fontSize: '0.78em', color: 'var(--ink-dim)', marginTop: 4 }}>
          press <b style={{ color: 'var(--ink)' }}>n</b> to add · tap a tube, tap again to commit
        </div>
      </header>

      <div style={{ padding: '18px 32px 0' }}>
        <Rack
          tasks={rackTasks}
          focusedId={focusedId}
          armedId={armedId}
          justAddedId={justAddedId}
          expiringId={expiringId}
          cumulativeMs={cumulativeMs}
          onArm={handleArm}
          onStartRequest={handleStartRequest}
          onReorder={handleReorderCommit}
          onLocalReorder={handleLocalReorder}
          onExpireComplete={handleExpireComplete}
          onExtend={handleExtend}
        />
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 32px', minHeight: 420 }}>
        <Bench
          task={benchTask}
          flipped={flippedForBench}
          showingNoteInput={showingNoteInput}
          noteCancelable={showingNoteInput && noteFlow?.after === null}
          onCancelNote={handleCancelNote}
          noteDraft={noteDraft}
          onNoteDraftChange={setNoteDraft}
          onSubmitNote={handleSubmitNote}
          resumeReveal={resumeRevealId === benchTaskId && !showingNoteInput}
          onResumeClick={() => resumeRevealId && confirmResume(resumeRevealId)}
          onBackClick={handleBackClick}
          onPauseClick={handlePauseClick}
          onDoneClick={handleDoneClick}
          onDropClick={handleDropClick}
          onExtend={handleExtend}
          exitKind={exitAnim && exitAnim.taskId === benchTaskId ? exitAnim.kind : null}
          onExitAnimationComplete={handleExitComplete}
        />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <CryoBox count={doneToday} bumpKey={bumpKey} />
          <Drain />
        </div>
      </div>

      <AddForm open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAdd} />
    </div>
  )
}
