import React, { useEffect, useState } from 'react'

const DAYS = 28 // Show 4 weeks

// Utility: generate an array of dates starting from today backwards
function generateDates() {
  const dates = []
  const today = new Date()
  for (let i = 0; i < DAYS; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    dates.push(d)
  }
  return dates.reverse() // oldest first
}

export default function StreakCalendar() {
  const [streaks, setStreaks] = useState({}) // { 'YYYY-MM-DD': count }
  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => {
    // Load streak data from chrome.storage on mount
    chrome.storage.sync.get({ streaks: {} }, ({ streaks }) => {
      setStreaks(streaks)
    })
  }, [])

  const dates = generateDates()

  const getColor = (count) => {
    if (!count) return 'bg-gray-200'
    if (count >= 4) return 'bg-green-800'
    if (count === 3) return 'bg-green-600'
    if (count === 2) return 'bg-green-400'
    return 'bg-green-200'
  }

  const handleClick = (date) => {
    const key = date.toISOString().slice(0, 10)
    alert(`Streak count for ${key}: ${streaks[key] || 0}`)
  }

  return (
    <div>
      <h2 className="mb-2 font-semibold text-center">Your Streaks (Last 4 weeks)</h2>
      <div className="grid grid-cols-7 gap-1">
        {dates.map((date) => {
          const key = date.toISOString().slice(0, 10)
          const count = streaks[key] || 0
          return (
            <div
              key={key}
              onClick={() => handleClick(date)}
              className={`w-6 h-6 rounded cursor-pointer ${getColor(count)}`}
              title={`${key}: ${count} streak(s)`}
            />
          )
        })}
      </div>
    </div>
  )
}
