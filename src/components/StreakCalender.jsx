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
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load streak data from chrome.storage on mount
    if (chrome?.storage?.sync) {
      chrome.storage.sync.get({ streaks: {} }, ({ streaks }) => {
        setStreaks(streaks)
        setIsLoading(false)
      })
    } else {
      // Fallback for development/testing
      setIsLoading(false)
    }
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
    const count = streaks[key] || 0
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
    const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    alert(`${dayName}, ${monthDay}: ${count} walk${count !== 1 ? 's' : ''}`)
  }

  const getDayLabel = (date) => {
    const day = date.getDate()
    return day
  }

  if (isLoading) {
    return (
      <div className="text-center py-4">
        <div className="text-gray-500">Loading calendar...</div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-3 font-semibold text-center">Your Streaks (Last 4 weeks)</h2>
      
      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div key={index} className="text-xs text-gray-500 text-center font-medium">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {dates.map((date) => {
          const key = date.toISOString().slice(0, 10)
          const count = streaks[key] || 0
          const dayLabel = getDayLabel(date)
          const isToday = key === new Date().toISOString().slice(0, 10)
          
          return (
            <div
              key={key}
              onClick={() => handleClick(date)}
              className={`w-8 h-8 rounded cursor-pointer flex items-center justify-center text-xs font-medium transition-all hover:scale-110 ${getColor(count)} ${
                isToday ? 'ring-2 ring-blue-500' : ''
              }`}
              title={`${key}: ${count} walk${count !== 1 ? 's' : ''}`}
            >
              {dayLabel}
            </div>
          )
        })}
      </div>
      
      {/* Legend */}
      <div className="mt-3 flex items-center justify-center space-x-2 text-xs text-gray-600">
        <span>Less</span>
        <div className="flex space-x-1">
          <div className="w-3 h-3 bg-gray-200 rounded"></div>
          <div className="w-3 h-3 bg-green-200 rounded"></div>
          <div className="w-3 h-3 bg-green-400 rounded"></div>
          <div className="w-3 h-3 bg-green-600 rounded"></div>
          <div className="w-3 h-3 bg-green-800 rounded"></div>
        </div>
        <span>More</span>
      </div>
    </div>
  )
}