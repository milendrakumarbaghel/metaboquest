import { useEffect, useState } from 'react'
import './QuizTimer.css'

export default function QuizTimer({ onExpire }: { onExpire?: () => void }) {
  const [seconds, setSeconds] = useState(60)

  useEffect(() => {
    const deadline = Date.now() + 60_000
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000))
      setSeconds(remaining)
      if (remaining === 0) {
        window.clearInterval(interval)
        onExpire?.()
      }
    }, 1000)
    return () => window.clearInterval(interval)
  }, [onExpire])

  return <><div className={`quiz-timer${seconds === 0 ? ' quiz-timer-expired' : ''}`}>
    <span>Time left</span>
    <strong role="timer" aria-label="Time remaining" aria-live="off">{seconds}s</strong>
  </div>
    {seconds === 0 && <div className="quiz-time-ended" role="alert">
      <strong>Time’s up! Your quiz time has ended.</strong>
      <p>This round is over. Answers are locked. Use Exit quiz to leave.</p>
    </div>}
  </>
}
