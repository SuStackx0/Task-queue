import { MAX_DAYS } from '../utils/tube'
import styles from './DaySlider.module.css'

interface DaySliderProps {
  days: number
  onDaysChange: (n: number) => void
  label?: string
}

export default function DaySlider({ days, onDaysChange, label }: DaySliderProps) {
  return (
    <div className={styles.wrap}>
      <div className={styles.body}>
        {label && <div className={styles.row}>{label}</div>}
        <div className={styles.row}>
          <span>
            upper bound: <b>{days}</b> day{days === 1 ? '' : 's'}
          </span>
          <span>{Math.round((days / MAX_DAYS) * 100)}% full</span>
        </div>
        <input
          type="range"
          className={styles.range}
          min={1}
          max={MAX_DAYS}
          step={1}
          value={days}
          onChange={(e) => onDaysChange(Number(e.target.value))}
        />
        <div className={styles.preview}>
          <div className={styles.previewFill} style={{ width: `${(days / MAX_DAYS) * 100}%` }} />
        </div>
      </div>
    </div>
  )
}
