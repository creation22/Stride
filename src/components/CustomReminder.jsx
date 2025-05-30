import React, { useState, useEffect } from 'react'
import { getStorage, setStorage } from '../utils/storage.js'

export default function CustomReminderForm({ onReminderAdded }) {
  const [label, setLabel] = useState('')
  const [time, setTime] = useState('')
  const [customReminders, setCustomReminders] = useState([])
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadCustomReminders()
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

    if (Number(time) < 1 || Number(time) > 1440) {
      alert('Please enter a time between 1 and 1440 minutes')
      return
    }

    try {
      // Create unique ID for the reminder
      const id = Date.now().toString()
      const newReminder = { 
        id,
        label: label.trim(), 
        time: Number(time),
        created: new Date().toISOString()
      }
      
      const updatedReminders = [...(customReminders || []), newReminder]
      await setStorage({ customReminders: updatedReminders })

      // Try Chrome extension API first
      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage({
          type: 'SET_CUSTOM_REMINDER',
          id: id,
          interval: Number(time),
          label: label.trim()
        })
      } else {
        // Fallback to Web Notifications API
        if ('Notification' in window) {
          // Request permission if needed
          if (Notification.permission !== 'granted') {
            await Notification.requestPermission()
          }
          
          if (Notification.permission === 'granted') {
            // Set up the interval for web notifications
            const intervalId = setInterval(() => {
              new Notification(label.trim(), {
                body: `Time for your ${time}-minute reminder!`,
                icon: '/icons/icon128.png'
              })
            }, Number(time) * 60 * 1000) // Convert minutes to milliseconds
            
            // Store the interval ID with the reminder
            newReminder.webIntervalId = intervalId
          } else {
            alert('Notification permission denied. Reminders will only show as alerts.')
          }
        } else {
          // Fallback to basic alerts if notifications aren't supported
          const intervalId = setInterval(() => {
            alert(`${label.trim()}: Time for your ${time}-minute reminder!`)
          }, Number(time) * 60 * 1000)
          
          // Store the interval ID with the reminder
          newReminder.webIntervalId = intervalId
        }
      }

      // Reset form and refresh list
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
    if (!confirm('Are you sure you want to delete this reminder?')) {
      return
    }

    try {
      const reminderToDelete = customReminders.find(r => r.id === id)
      if (reminderToDelete && reminderToDelete.webIntervalId) {
        clearInterval(reminderToDelete.webIntervalId)
      }

      const updatedReminders = (customReminders || []).filter(r => r.id !== id)
      await setStorage({ customReminders: updatedReminders })
      
      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage({
          type: 'CLEAR_CUSTOM_ALARM',
          id: id
        })
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
        >
          {showForm ? 'Cancel' : '+ Add New'}
        </button>
      </div>

      {/* Show existing reminders */}
      {Array.isArray(customReminders) && customReminders.length > 0 && (
        <div className="space-y-2">
          {customReminders.map((reminder) => (
            <div key={reminder.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <div>
                <div className="font-medium text-sm">{reminder.label}</div>
                <div className="text-xs text-gray-600">Every {reminder.time} minutes</div>
              </div>
              <button
                onClick={() => handleDelete(reminder.id)}
                className="text-red-500 hover:text-red-700 text-sm"
                title="Delete reminder"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new reminder form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-3 p-3 bg-gray-50 rounded">
          <input
            type="text"
            placeholder="Reminder description (e.g., 'Drink water')"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-sm"
            maxLength={50}
          />
          <input
            type="number"
            min="1"
            max="1440"
            placeholder="Minutes between reminders"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded text-sm"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition text-sm"
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