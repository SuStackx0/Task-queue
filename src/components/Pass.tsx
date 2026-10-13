import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { Task } from '../types'
import Ticket from './Ticket'
import styles from './Pass.module.css'

interface PassProps {
  task: Task | null
  flipped: boolean
  showingNoteInput: boolean
  noteCancelable: boolean
  onCancelNote: () => void
  noteDraft: string
  onNoteDraftChange: (v: string) => void
  onSubmitNote: () => void
  resumeReveal: boolean
  onResumeClick: () => void
  onBackClick: () => void
  onPauseClick: () => void
  onDoneClick: () => void
  onDropClick: () => void
  exitKind: 'done' | 'drop' | null
  onExitAnimationComplete: () => void
}

const DONE_TARGET = { x: 520, y: -30, rotate: 18, scale: 0.75, opacity: 0 }
const DROP_TARGET = { x: 60, y: 260, rotate: 120, scale: 0.3, opacity: 0, filter: 'blur(1px)' }
const SETTLE = { opacity: 1, scale: 1, rotate: [-14, 10, -4, 0], y: 0, x: 0, filter: 'blur(0px)' }

export default function Pass({
  task,
  flipped,
  showingNoteInput,
  noteCancelable,
  onCancelNote,
  noteDraft,
  onNoteDraftChange,
  onSubmitNote,
  resumeReveal,
  onResumeClick,
  onBackClick,
  onPauseClick,
  onDoneClick,
  onDropClick,
  exitKind,
  onExitAnimationComplete,
}: PassProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showingNoteInput) inputRef.current?.focus()
  }, [showingNoteInput])

  return (
    <div className={styles.pass}>
      {!task && <div className={styles.emptyPass}>The pass is clear. Start a ticket from the rail.</div>}
      <AnimatePresence>
        {task && (
          <motion.div
            key={task.id}
            className={styles.ticketWrap}
            layoutId={`ticket-wrap-${task.id}`}
            initial={{ opacity: 0, scale: 0.6, rotate: -14, y: -60 }}
            animate={exitKind === 'done' ? DONE_TARGET : exitKind === 'drop' ? DROP_TARGET : SETTLE}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
            transition={
              exitKind === 'done'
                ? { duration: 0.45, ease: [0.3, 0, 0.6, 1] }
                : exitKind === 'drop'
                ? { duration: 0.6, ease: 'easeIn' }
                : { type: 'spring', stiffness: 220, damping: 22 }
            }
            onAnimationComplete={() => {
              if (exitKind) onExitAnimationComplete()
            }}
            onClick={resumeReveal ? onResumeClick : undefined}
          >
            <Ticket task={task} flipped={flipped} size="pass" />

            {showingNoteInput && (
              <div className={styles.noteOverlay}>
                <div className={styles.noteHint}>
                  next step — required to pause{noteCancelable ? ' · esc to cancel' : ' (forced: another ticket is starting)'}
                </div>
                <input
                  ref={inputRef}
                  className={styles.noteInput}
                  value={noteDraft}
                  placeholder="scribble your next step…"
                  onChange={(e) => onNoteDraftChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && noteDraft.trim()) onSubmitNote()
                    if (e.key === 'Escape' && noteCancelable) onCancelNote()
                  }}
                />
              </div>
            )}

            {!showingNoteInput && !resumeReveal && !exitKind && (
              <>
                <button className={styles.backBtn} onClick={onBackClick} title="undo starting this ticket">
                  ← back
                </button>
                <div className={styles.controls}>
                  <button className={`${styles.btn} ${styles.btnPause}`} onClick={onPauseClick}>
                    pause (p)
                  </button>
                  <button className={`${styles.btn} ${styles.btnDone}`} onClick={onDoneClick}>
                    done (d)
                  </button>
                  <button className={`${styles.btn} ${styles.btnDrop}`} onClick={onDropClick}>
                    drop (x)
                  </button>
                </div>
              </>
            )}

            {resumeReveal && (
              <div className={styles.noteHint} style={{ position: 'absolute', bottom: -28, left: 0 }}>
                click to resume
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
