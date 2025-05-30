import React, { useState } from 'react'
import { getStorage, setStorage } from '../utils/storage.js'
export default function CustomReminderForm() {
  const [label, setLabel] = useState('')
  const [time, setTime] = useState('')
    
  
  const handleSubmit = async (e) => {
  e.preventDefault()
  if (!label.trim() || !time) return alert('Please enter label and time')

  // Use storage helpers
  const data = await getStorage({ customReminders: [] })
  const newReminders = [...data.customReminders, { label, time: Number(time) }]
  await setStorage({ customReminders: newReminders })

  alert('Custom reminder saved!')
  setLabel('')
  setTime('')
}

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h2 className="text-md font-medium">Add Custom Reminder</h2>
      <input
        type="text"
        placeholder="Reminder label"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded"
      />
      <input
        type="number"
        min="1"
        placeholder="Minutes"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded"
      />
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        Save Reminder
      </button>
    </form>
  )
}
