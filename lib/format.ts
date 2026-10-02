export function formatTime(ms: number): string {
  const totalCs = Math.max(0, Math.round(ms / 10))
  const cs = totalCs % 100
  const totalSec = Math.floor(totalCs / 100)
  const sec = totalSec % 60
  const min = Math.floor(totalSec / 60)
  const fraction = String(cs).padStart(2, '0')
  if (min > 0) return `${min}:${String(sec).padStart(2, '0')}.${fraction}`
  return `${sec}.${fraction}`
}
