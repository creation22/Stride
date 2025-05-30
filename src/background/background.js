// Full-proof background script for Stride Chrome Extension

// Create or update a walk reminder alarm
function createAlarm(intervalMinutes) {
  if (!intervalMinutes || isNaN(intervalMinutes)) return;
  chrome.alarms.clear('walkReminder', () => {
    chrome.alarms.create('walkReminder', {
      delayInMinutes: intervalMinutes,
      periodInMinutes: intervalMinutes,
    });
    console.log(`Walk reminder alarm set for every ${intervalMinutes} minutes.`);
  });
}

// Create a custom reminder alarm
function createCustomAlarm(id, intervalMinutes, label) {
  if (!id || !intervalMinutes || isNaN(intervalMinutes)) return;
  chrome.alarms.create(`custom_${id}`, {
    delayInMinutes: intervalMinutes,
    periodInMinutes: intervalMinutes,
  });
  console.log(`Custom reminder '${label}' alarm set every ${intervalMinutes} minutes.`);
}

// Show a notification with safe defaults
function showNotification({ title, message, buttons = [], isSnoozed = false }) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon128.png'),
    title,
    message,
    priority: 2,
    buttons,
    requireInteraction: false,
  }, (notificationId) => {
    if (chrome.runtime.lastError) {
      console.error('Notification error:', chrome.runtime.lastError.message);
    } else {
      console.log('Notification shown:', notificationId);
    }
  });
}

// Alarm listener
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'walkReminder' || alarm.name === 'walkReminderSnooze') {
    chrome.storage.sync.get(['currentStreak'], (result) => {
      const streak = result.currentStreak || 0;
      const messages = [
        'Time to take a refreshing walk! 🚶‍♂️',
        'Your body needs a movement break! 💪',
        'Step away and step outside! 🌟',
        `Keep your ${streak}-day streak going! 🔥`,
      ];

      const message = alarm.name === 'walkReminderSnooze'
        ? 'Time for that walk now! 🚶‍♂️'
        : messages[Math.floor(Math.random() * messages.length)];

      showNotification({
        title: alarm.name === 'walkReminderSnooze' ? 'Stride Reminder (Snoozed)' : 'Stride Reminder',
        message,
        buttons: [
          { title: 'Done Walking' },
          { title: 'Snooze 5 min' },
        ]
      });
    });
  } else if (alarm.name.startsWith('custom_')) {
    const id = alarm.name.replace('custom_', '');
    chrome.storage.sync.get(['customReminders'], (result) => {
      const customReminders = result.customReminders || [];
      const reminder = customReminders.find(r => r.id === id);
      if (reminder) {
        showNotification({
          title: 'Custom Reminder',
          message: reminder.label,
        });
      }
    });
  }
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    updateStreak();
    chrome.notifications.clear(notificationId);
  } else if (buttonIndex === 1) {
    chrome.alarms.create('walkReminderSnooze', {
      delayInMinutes: 5
    });
    chrome.notifications.clear(notificationId);
  }
});

// Update streak based on walk completion
function updateStreak() {
  const today = new Date().toISOString().slice(0, 10);
  chrome.storage.sync.get(['streaks', 'lastWalkDate', 'currentStreak'], (result) => {
    const streaks = result.streaks || {};
    const lastWalkDate = result.lastWalkDate;
    const currentStreak = result.currentStreak || 0;

    // Increase walk count for today
    streaks[today] = (streaks[today] || 0) + 1;

    let newCurrentStreak = currentStreak;
    if (lastWalkDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().slice(0, 10);

      if (lastWalkDate === yesterdayStr) {
        newCurrentStreak++;
      } else {
        newCurrentStreak = 1;
      }
    }

    chrome.storage.sync.set({
      streaks,
      lastWalkDate: today,
      currentStreak: newCurrentStreak
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error updating streak:', chrome.runtime.lastError);
      } else {
        console.log(`Streak updated to ${newCurrentStreak}`);
        if (newCurrentStreak > currentStreak && newCurrentStreak % 7 === 0) {
          showNotification({
            title: '🎉 Milestone Achievement!',
            message: `${newCurrentStreak}-day streak! You're amazing!`
          });
        }
      }
    });
  });
}

// Listen for popup messages
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
      return true;

    case 'CLEAR_CUSTOM_ALARM':
      chrome.alarms.clear(`custom_${message.id}`, () => {
        sendResponse({ status: 'Custom alarm cleared' });
      });
      return true;

    default:
      sendResponse({ status: 'Unknown message type' });
  }
});

// Initial setup on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(['walkInterval'], (result) => {
    if (!result.walkInterval) {
      chrome.storage.sync.set({
        walkInterval: 30,
        currentStreak: 0,
        streaks: {},
        customReminders: []
      }, () => {
        console.log('Default settings initialized.');
      });
    }
  });

  // Optional test notification on install
  showNotification({
    title: 'Stride Installed 🎉',
    message: 'You’ll get walk reminders automatically!'
  });
});
