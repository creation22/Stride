// Background script to manage alarms and send notifications

// Create or update an alarm with given interval (minutes)
function createAlarm(intervalMinutes) {
  chrome.alarms.create('walkReminder', {
    delayInMinutes: intervalMinutes,
    periodInMinutes: intervalMinutes,
  })
}

// Listen for the alarm and send notification
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'walkReminder') {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: 'Time to Walk!',
      message: 'Take a short walk to refresh yourself.',
      priority: 2,
    })
  }
})

// Listen for messages from popup or content scripts to update alarm
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SET_INTERVAL') {
    createAlarm(message.interval)
    sendResponse({ status: 'Alarm set' })
  }
})
