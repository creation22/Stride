import React, { useState, useEffect } from 'react'
import CustomReminderForm from '../components/CustomReminderForm.jsx'
import StreakCalendar from '../components/StreakCalendar.jsx'
import { getStorage, setStorage } from '../utils/storage.js'

export default function App() {
  const [showStreak, setShowStreak] = useState(false)
  const [interval, setInterval] = useState('')

  useEffect(() => {
    // Load saved interval on mount
    async function loadInterval() {
      const data = await getStorage({ walkInterval: '' })
      if (data.walkInterval) setInterval(data.walkInterval.toString())
    }
    loadInterval()
  }, [])

  const handleIntervalChange = async (e) => {
    const value = e.target.value
    setInterval(value)

    if (value && Number(value) > 0) {
      // Save interval
      await setStorage({ walkInterval: Number(value) })

      // Send message to background to update alarm
      chrome.runtime.sendMessage({ type: 'SET_INTERVAL', interval: Number(value) })
    }
  }

  return (
    <div className="w-80 p-4 bg-white rounded-md shadow-lg font-sans">
      <header className="flex justify-between items-center mb-4">
        <button
          onClick={() => setShowStreak(!showStreak)}
          className="text-sm text-blue-600 hover:underline"
        >
          {showStreak ? 'Hide Streak' : 'Show Streak'}
        </button>
        <a
          href="https://www.buymeacoffee.com/yourusername"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-yellow-600 hover:underline"
        >
          ☕ Buy Me Coffee
        </a>
      </header>

      {!showStreak ? (
        <>
          <h1 className="text-lg font-semibold mb-3">Set Walk Reminder</h1>
          <div className="mb-4">
            <input
              type="number"
              min="1"
              placeholder="Minutes between walks"
              className="w-full p-2 border border-gray-300 rounded"
              value={interval}
              onChange={handleIntervalChange}
            />
          </div>
          <CustomReminderForm />
        </>
      ) : (
        <StreakCalendar />
      )}
    </div>
  )
}
