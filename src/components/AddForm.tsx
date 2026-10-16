import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import type { Tag } from '../types'
import styles from './AddForm.module.css'

interface AddFormProps {
  open: boolean
  onClose: () => void
  onSubmit: (title: string, tag: Tag) => void
}

const TAGS: Tag[] = ['work', 'study', 'task']

export default function AddForm({ open, onClose, onSubmit }: AddFormProps) {
  const [title, setTitle] = useState('')
  const [tag, setTag] = useState<Tag>('work')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTitle('')
      setTag('work')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  function submit() {
    if (!title.trim()) return
    onSubmit(title.trim(), tag)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, y: -24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            <label className={styles.label}>new tube</label>
            <input
              ref={inputRef}
              className={styles.titleInput}
              placeholder="what are you starting?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit()
                if (e.key === 'Escape') onClose()
              }}
            />
            <div className={styles.tagRow}>
              {TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`${styles.tagBtn} ${tag === t ? styles.active : ''}`}
                  onClick={() => setTag(t)}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className={styles.actions}>
              <button className={styles.btn} onClick={onClose}>
                cancel
              </button>
              <button className={`${styles.btn} ${styles.btnPrimary}`} disabled={!title.trim()} onClick={submit}>
                dispense →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
