import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { THEMES, type Theme } from '../themes'
import styles from './ThemeSwitcher.module.css'

interface ThemeSwitcherProps {
  current: Theme
  onSelect: (theme: Theme) => void
}

export default function ThemeSwitcher({ current, onSelect }: ThemeSwitcherProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className={styles.wrap}>
      <button
        className={styles.toggle}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        title="change theme"
        aria-label="change theme"
      >
        <span
          className={styles.toggleDot}
          style={{ background: `conic-gradient(${current.swatch.join(', ')}, ${current.swatch[0]})` }}
        />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className={styles.panel}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.label}>theme</div>
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`${styles.option} ${current.id === t.id ? styles.optionActive : ''}`}
                onClick={() => {
                  onSelect(t)
                  setOpen(false)
                }}
              >
                <span className={styles.swatches}>
                  {t.swatch.map((c, i) => (
                    <span key={i} className={styles.swatchDot} style={{ background: c }} />
                  ))}
                </span>
                {t.name}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
