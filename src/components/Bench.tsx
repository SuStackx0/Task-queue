import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { Task } from '../types'
import Tube from './Tube'
import styles from './Bench.module.css'

interface BenchProps {
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

const DONE_TARGET = { x: 460, y: -20, rotate: 14, scale: 0.7, opacity: 0 }
const DROP_TARGET = { x: 180, y: 300, rotate: 70, scale: 0.4, opacity: 0 }
const SETTLE = { opacity: 1, scale: 1, rotate: [-10, 6, -2, 0], y: 0, x: 0 }

const SHARDS = Array.from({ length: 8 }, (_, i) => ({
  angle: (i / 8) * 360,
  dist: 50 + (i % 3) * 20,
  rotate: (i * 53) % 360,
}))

export default function Bench({
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
}: BenchProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showingNoteInput) inputRef.current?.focus()
  }, [showingNoteInput])

  return (
    <div className={styles.bench}>
      {!task && <div className={styles.emptyBench}>The bench is clear. Pull a tube up from the rack.</div>}
      <div className={styles.spotlight} />
      <div className={styles.caustics} />
      <AnimatePresence>
        {task && (
          <motion.div
            key={task.id}
            className={styles.tubeWrap}
            layoutId={`tube-wrap-${task.id}`}
            initial={{ opacity: 0, scale: 0.6, rotate: -10, y: 60 }}
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
            {!showingNoteInput && !resumeReveal && !exitKind && (
              <div className={styles.clamp}>
                <div className={styles.clampArm} />
                <div className={styles.clampArm} />
              </div>
            )}
            <Tube task={task} flipped={flipped} size="bench" />

            {exitKind && (
              <motion.div
                className={styles.glitchFlash}
                initial={{ opacity: 0.9 }}
                animate={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              />
            )}

            {exitKind === 'drop' &&
              SHARDS.map((s, i) => (
                <motion.div
                  key={i}
                  className={styles.shard}
                  style={{ left: '45%', top: '50%' }}
                  initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
                  animate={{
                    x: Math.cos((s.angle * Math.PI) / 180) * s.dist,
                    y: Math.sin((s.angle * Math.PI) / 180) * s.dist + 60,
                    opacity: 0,
                    rotate: s.rotate,
                  }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                />
              ))}

            {showingNoteInput && (
              <div className={styles.noteOverlay}>
                <div className={styles.noteHint}>
                  next step — required to pause{noteCancelable ? ' · esc to cancel' : ' (forced: another tube is starting)'}
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
                <button className={styles.backBtn} onClick={onBackClick} title="undo starting this tube">
                  ← back
                </button>
                <div className={styles.controls}>
                  <button className={styles.btn} onClick={onPauseClick}>
                    pause (p)
                  </button>
                  <button className={styles.btn} onClick={onDoneClick}>
                    done (d)
                  </button>
                  <button className={styles.btn} onClick={onDropClick}>
                    drop (x)
                  </button>
                </div>
              </>
            )}

            {resumeReveal && (
              <div className={styles.noteHint} style={{ position: 'absolute', bottom: -24, left: 0 }}>
                click to resume
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
