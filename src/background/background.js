// Enhanced background script with better streak tracking and notifications

// Create or update an alarm with given interval (minutes)
function createAlarm(intervalMinutes) {
  chrome.alarms.clear('walkReminder', () => {
    chrome.alarms.create('walkReminder', {
      delayInMinutes: intervalMinutes,
      periodInMinutes: intervalMinutes,
    });
  });
}

// Create custom reminder alarms
function createCustomAlarm(id, intervalMinutes, label) {
  chrome.alarms.create(`custom_${id}`, {
    delayInMinutes: intervalMinutes,
    periodInMinutes: intervalMinutes,
  });
}

// Listen for alarms and send appropriate notifications
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'walkReminder') {
    // Get current streak to personalize message
    chrome.storage.sync.get(['currentStreak'], (result) => {
      const streak = result.currentStreak || 0;
      const messages = [
        'Time to take a refreshing walk! 🚶‍♂️',
        'Your body needs a movement break! 💪',
        'Step away and step outside! 🌟',
        `Keep your ${streak}-day streak going! 🔥`,
      ];
      
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Stride Reminder',
        message: messages[Math.floor(Math.random() * messages.length)],
        priority: 2,
        buttons: [
          { title: 'Done Walking' },
          { title: 'Snooze 5 min' }
        ]
      });
    });
  } else if (alarm.name.startsWith('custom_')) {
    // Handle custom reminders
    const id = alarm.name.replace('custom_', '');
    chrome.storage.sync.get(['customReminders'], (result) => {
      const customReminders = result.customReminders || [];
      const reminder = customReminders.find(r => r.id === id);
      
      if (reminder) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'Custom Reminder',
          message: reminder.label,
          priority: 2,
        });
      }
    });
  } else if (alarm.name === 'walkReminderSnooze') {
    // Handle snooze alarm
    chrome.storage.sync.get(['currentStreak'], (result) => {
      const streak = result.currentStreak || 0;
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Stride Reminder (Snoozed)',
        message: 'Time for that walk now! 🚶‍♂️',
        priority: 2,
        buttons: [
          { title: 'Done Walking' },
          { title: 'Snooze 5 min' }
        ]
      });
    });
  }
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    // "Done Walking" clicked - update streak
    updateStreak();
    chrome.notifications.clear(notificationId);
  } else if (buttonIndex === 1) {
    // "Snooze 5 min" clicked
    chrome.alarms.create('walkReminderSnooze', {
      delayInMinutes: 5
    });
    chrome.notifications.clear(notificationId);
  }
});

// Update daily streak
function updateStreak() {
  const today = new Date().toISOString().slice(0, 10);
  
  chrome.storage.sync.get(['streaks', 'lastWalkDate', 'currentStreak'], (result) => {
    const streaks = result.streaks || {};
    const lastWalkDate = result.lastWalkDate;
    const currentStreak = result.currentStreak || 0;
    
    // Increment today's count
    streaks[today] = (streaks[today] || 0) + 1;
    
    // Update current streak if it's a new day
    let newCurrentStreak = currentStreak;
    if (lastWalkDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);
      
      if (lastWalkDate === yesterdayStr) {
        // Continuing streak
        newCurrentStreak++;
      } else if (!lastWalkDate || lastWalkDate < yesterdayStr) {
        // New streak starts
        newCurrentStreak = 1;
      }
    }
    
    // Save updated data
    chrome.storage.sync.set({
      streaks,
      lastWalkDate: today,
      currentStreak: newCurrentStreak
    });
    
    // Show celebration for milestones
    if (newCurrentStreak > currentStreak && newCurrentStreak % 7 === 0) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: '🎉 Milestone Achievement!',
        message: `${newCurrentStreak} days streak! You're amazing!`,
        priority: 2,
      });
    }
  });
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'SET_INTERVAL':
      createAlarm(message.interval);
      sendResponse({ status: 'Walk reminder alarm set' });
      break;
      
    case 'SET_CUSTOM_REMINDER':
      createCustomAlarm(message.id, message.interval, message.label);
      sendResponse({ status: 'Custom reminder set' });
      break;
      
    case 'MANUAL_WALK_COMPLETE':
      updateStreak();
      sendResponse({ status: 'Streak updated' });
      break;
      
    case 'GET_CURRENT_STREAK':
      chrome.storage.sync.get(['currentStreak'], (result) => {
        sendResponse({ currentStreak: result.currentStreak || 0 });
      });
      return true; // Keep message channel open for async response
      
    case 'CLEAR_CUSTOM_ALARM':
      chrome.alarms.clear(`custom_${message.id}`, () => {
        sendResponse({ status: 'Custom alarm cleared' });
      });
      return true;
      
    default:
      sendResponse({ status: 'Unknown message type' });
  }
});

// Initialize on installation
chrome.runtime.onInstalled.addListener(() => {
  // Set default values
  chrome.storage.sync.get(['walkInterval'], (result) => {
    if (!result.walkInterval) {
      chrome.storage.sync.set({
        walkInterval: 30, // Default 30 minutes
        currentStreak: 0,
        streaks: {},
        customReminders: []
      });
    }
  });
});