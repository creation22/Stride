import React, { useState, useEffect, useRef } from 'react'
import CustomReminderForm from '../components/CustomReminder.jsx'
import StreakCalendar from '../components/StreakCalender.jsx'
import { getStorage, setStorage } from '../utils/storage.js'

export default function App() {
  const [activeTab, setActiveTab] = useState('reminder') // 'reminder', 'streak', 'stats'
  const [interval, setInterval] = useState('')
  const [currentStreak, setCurrentStreak] = useState(0)
  const [todayWalks, setTodayWalks] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const debounceTimer = useRef(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load saved interval and current streak
      const data = await getStorage({ 
        walkInterval: 30,
        currentStreak: 0,
        streaks: {}
      })
      
      if (data.walkInterval) setInterval(data.walkInterval.toString())
      setCurrentStreak(data.currentStreak || 0)
      
      // Get today's walk count
      const today = new Date().toISOString().slice(0, 10)
      const todayCount = (data.streaks && typeof data.streaks === 'object' && data.streaks[today]) || 0
      setTodayWalks(todayCount)
      
      setIsLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setIsLoading(false)
      // Set default values on error
      setInterval('30')
      setCurrentStreak(0)
      setTodayWalks(0)
    }
  }

  const handleIntervalChange = (eOrValue) => {
    const value = typeof eOrValue === 'object' ? eOrValue.target.value : eOrValue
    setInterval(value)

    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    debounceTimer.current = setTimeout(async () => {
      if (value && Number(value) > 0) {
        try {
          // Save interval
          await setStorage({ walkInterval: Number(value) })

          // Send message to background to update alarm
          if (chrome?.runtime?.sendMessage) {
            chrome.runtime.sendMessage({ 
              type: 'SET_INTERVAL', 
              interval: Number(value) 
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.error('Chrome runtime error:', chrome.runtime.lastError)
              } else if (response && response.status) {
                console.log(response.status)
              }
            })
          }
        } catch (error) {
          console.error('Error setting interval:', error)
        }
      }
    }, 500) // debounce 500ms
  }

  const handleManualWalkComplete = () => {
    if (chrome?.runtime?.sendMessage) {
      chrome.runtime.sendMessage({ type: 'MANUAL_WALK_COMPLETE' }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Chrome runtime error:', chrome.runtime.lastError)
        } else if (response && response.status === 'Streak updated') {
          // Refresh data to show updated counts
          loadData()
        }
      })
    } else {
      // Fallback for development/testing
      alert('Walk completed! (Extension APIs not available in this context)')
    }
  }

  const presetIntervals = [15, 30, 45, 60, 90, 120]

  if (isLoading) {
    return (
      <div className="w-80 p-4 bg-white rounded-md shadow-lg font-sans">
        <div className="flex items-center justify-center h-32">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-white rounded-md shadow-lg font-sans">
      {/* Header with tabs */}
      <div className="bg-gradient-to-r from-blue-500 to-green-500 text-white p-4 rounded-t-md">
        <h1 className="text-lg font-bold text-center mb-2">Stride</h1>
        <div className="flex justify-center space-x-1">
          {[
            { id: 'reminder', label: '⏰', title: 'Reminders' },
            { id: 'streak', label: '📅', title: 'Calendar' },
            { id: 'stats', label: '📊', title: 'Stats' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 rounded text-sm transition ${
                activeTab === tab.id 
                  ? 'bg-white text-blue-600' 
                  : 'bg-blue-400 hover:bg-blue-300 text-white'
              }`}
              title={tab.title}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {activeTab === 'reminder' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-md font-semibold mb-3">Walk Reminder Interval</h2>
              
              {/* Preset buttons */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {presetIntervals.map(minutes => (
                  <button
                    key={minutes}
                    onClick={() => {
                      setInterval(minutes.toString())
                      handleIntervalChange(minutes.toString())
                    }}
                    className={`p-2 text-sm rounded border transition ${
                      interval === minutes.toString()
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-gray-300'
                    }`}
                  >
                    {minutes}m
                  </button>
                ))}
              </div>

              {/* Custom input */}
              <input
                type="number"
                min="1"
                max="1440"
                placeholder="Custom minutes"
                className="w-full p-2 border border-gray-300 rounded"
                value={interval}
                onChange={handleIntervalChange}
              />
            </div>

            <CustomReminderForm onReminderAdded={loadData} />
            
            {/* Manual completion button */}
            <button
              onClick={handleManualWalkComplete}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
            >
              ✅ I Just Walked!
            </button>
          </div>
        )}

        {activeTab === 'streak' && (
          <StreakCalendar />
        )}

        {activeTab === 'stats' && (
          <div className="space-y-4">
            <h2 className="text-md font-semibold mb-3">Your Progress</h2>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{currentStreak}</div>
                <div className="text-sm text-gray-600">Day Streak</div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{todayWalks}</div>
                <div className="text-sm text-gray-600">Today's Walks</div>
              </div>
            </div>

            <div className="bg-yellow-50 p-3 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-2">💡 Tips</h3>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Take short 5-10 minute walks</li>
                <li>• Try to walk outside when possible</li>
                <li>• Use stairs instead of elevators</li>
                <li>• Walk during phone calls</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <div className="text-center text-xs text-gray-500">
          Stay healthy, stay active! 🚶‍♂️
        </div>
      </div>
    </div>
  )
}
