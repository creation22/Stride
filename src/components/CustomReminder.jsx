import React, { useState, useEffect } from 'react'
import { getStorage, setStorage } from '../utils/storage.js'

export default function CustomReminderForm({ onReminderAdded }) {
  const [label, setLabel] = useState('')
  const [time, setTime] = useState('')
  const [customReminders, setCustomReminders] = useState([])
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadCustomReminders()
    return () => {
      // Clear any fallback setIntervals if needed in the future
    }
  }, [])

  const loadCustomReminders = async () => {
    try {
      const data = await getStorage({ customReminders: [] })
      setCustomReminders(Array.isArray(data.customReminders) ? data.customReminders : [])
    } catch (error) {
      console.error('Error loading custom reminders:', error)
      setCustomReminders([])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!label.trim() || !time) {
      alert('Please enter both label and time')
      return
    }

    const parsedTime = Number(time)
    if (isNaN(parsedTime) || parsedTime < 1 || parsedTime > 1440) {
      alert('Please enter a time between 1 and 1440 minutes')
      return
    }

    if (customReminders.length >= 10) {
      alert('You can only add up to 10 custom reminders.')
      return
    }

    const isDuplicate = customReminders.some(
      (r) => r.label.trim().toLowerCase() === label.trim().toLowerCase() && r.time === parsedTime
    )
    if (isDuplicate) {
      alert('A reminder with the same label and time already exists.')
      return
    }

    try {
      const id = Date.now().toString()
      const newReminder = {
        id,
        label: label.trim(),
        time: parsedTime,
        created: new Date().toISOString()
      }

      const updatedReminders = [...customReminders, newReminder]
      await setStorage({ customReminders: updatedReminders })

      // Chrome extension messaging
      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage(
          {
            type: 'SET_CUSTOM_REMINDER',
            id,
            interval: parsedTime,
            label: label.trim()
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error('SendMessage error:', chrome.runtime.lastError)
            }
          }
        )
      } else if ('Notification' in window) {
        // Web Notifications fallback
        if (Notification.permission !== 'granted') {
          await Notification.requestPermission()
        }

        if (Notification.permission === 'granted') {
          const intervalId = setInterval(() => {
            new Notification(label.trim(), {
              body: `Time for your ${parsedTime}-minute reminder!`,
              icon: chrome.runtime?.getURL?.('icons/icon128.png') || '/icons/icon128.png'
            })
          }, parsedTime * 60 * 1000)
          newReminder.webIntervalId = intervalId
        } else {
          alert('Notification permission denied. Reminders will only show as alerts.')
        }
      } else {
        // Alert fallback
        const intervalId = setInterval(() => {
          alert(`${label.trim()}: Time for your ${parsedTime}-minute reminder!`)
        }, parsedTime * 60 * 1000)
        newReminder.webIntervalId = intervalId
      }

      setLabel('')
      setTime('')
      setShowForm(false)
      setCustomReminders(updatedReminders)

      if (onReminderAdded) {
        onReminderAdded()
      }

      alert('Custom reminder saved successfully!')
    } catch (error) {
      console.error('Error saving custom reminder:', error)
      alert('Error saving reminder. Please try again.')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this reminder?')) return

    try {
      const reminderToDelete = customReminders.find((r) => r.id === id)
      if (reminderToDelete?.webIntervalId) {
        clearInterval(reminderToDelete.webIntervalId)
      }

      const updatedReminders = customReminders.filter((r) => r.id !== id)
      await setStorage({ customReminders: updatedReminders })

      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage(
          {
            type: 'CLEAR_CUSTOM_ALARM',
            id
          },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error('ClearMessage error:', chrome.runtime.lastError)
            }
          }
        )
      }

      setCustomReminders(updatedReminders)
      alert('Reminder deleted successfully!')
    } catch (error) {
      console.error('Error deleting reminder:', error)
      alert('Error deleting reminder. Please try again.')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="text-md font-medium">Custom Reminders</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm text-blue-600 hover:underline"
          aria-label={showForm ? 'Cancel reminder form' : 'Add new custom reminder'}
        >
          {showForm ? 'Cancel' : '+ Add New'}
        </button>
      </div>

      {Array.isArray(customReminders) && customReminders.length > 0 && (
        <div className="space-y-2">
          {customReminders.map((reminder) => (
            <div
              key={reminder.id}
              className="flex justify-between items-center p-2 bg-gray-50 rounded"
            >
              <div>
                <div className="font-medium text-sm">{reminder.label}</div>
                <div className="text-xs text-gray-600">Every {reminder.time} minutes</div>
              </div>
              <button
                onClick={() => handleDelete(reminder.id)}
                className="text-red-500 hover:text-red-700 text-sm"
                title="Delete reminder"
                aria-label={`Delete reminder ${reminder.label}`}
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 p-3 bg-gray-50 rounded">
          <input
            type="text"
            placeholder="Reminder description (e.g., 'Drink water')"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-sm"
            maxLength={50}
            required
          />
          <input
            type="number"
            min="1"
            max="1440"
            placeholder="Minutes between reminders"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            onKeyDown={(e) => {
              if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete') {
                e.preventDefault()
              }
            }}
            className="w-full p-2 border border-gray-300 rounded text-sm"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition text-sm"
            aria-label="Save custom reminder"
          >
            Save Custom Reminder
          </button>
        </form>
      )}

      {(!Array.isArray(customReminders) || customReminders.length === 0) && !showForm && (
        <div className="text-center text-gray-500 text-sm py-2">
          No custom reminders yet. Click "Add New" to create one!
        </div>
      )}
    </div>
  )
}
