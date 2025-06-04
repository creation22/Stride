// background.js - Fixed version

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "walkReminder") {
    chrome.storage.sync.get(["sound", "lastWalkDate", "streak"], (data) => {
      // Show notification
      chrome.notifications.create({
        type: "basic",
        iconUrl: "../../public/icons/stride.png", // Fixed: Updated icon path to match manifest
        title: "Time to Walk! 🚶‍♂️",
        message: "Stand up and take a walk. Your body will thank you!",
        priority: 2
      });

      // Play sound if enabled
      if (data.sound && data.sound !== "") {
        // Note: Audio playback in service workers is limited
        // Consider using chrome.tts.speak as an alternative
        try {
          const audio = new Audio(chrome.runtime.getURL(data.sound));
          audio.play().catch(err => {
            console.warn("Sound play error:", err);
            // Fallback to text-to-speech
            chrome.tts.speak("Time to take a walk!", {
              rate: 1.0,
              pitch: 1.0,
              volume: 0.8
            });
          });
        } catch (err) {
          console.warn("Audio creation error:", err);
        }
      }

      // Update streak logic
      const today = new Date().toISOString().split("T")[0];
      const lastWalkDate = data.lastWalkDate || "";
      const currentStreak = data.streak || 0;
      
      // Check if this is a new day
      if (lastWalkDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        
        let newStreak;
        if (lastWalkDate === yesterdayStr) {
          // Consecutive day - increment streak
          newStreak = currentStreak + 1;
        } else if (lastWalkDate === "") {
          // First time - start streak
          newStreak = 1;
        } else {
          // Gap in days - reset streak
          newStreak = 1;
        }
        
        // Save updated streak data
        chrome.storage.sync.set({
          lastWalkDate: today,
          streak: newStreak,
          longestStreak: Math.max(data.longestStreak || 0, newStreak)
        });

        // Show streak achievement notification for milestones
        if (newStreak % 7 === 0 && newStreak > 0) {
          setTimeout(() => {
            chrome.notifications.create({
              type: "basic",
              iconUrl: "../../public/icons/stride.png",
              title: "Streak Achievement! 🔥",
              message: `Congratulations! ${newStreak} days walking streak!`,
              priority: 2
            });
          }, 2000);
        }
      }
    });
  }
});

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  // Open extension popup or a motivational page
  chrome.tabs.create({
    url: chrome.runtime.getURL("src/popup/popup.html")
  });
});

// Install event - set up initial data
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(["streak", "longestStreak"], (data) => {
    if (data.streak === undefined) {
      chrome.storage.sync.set({
        streak: 0,
        longestStreak: 0,
        lastWalkDate: "",
        interval: 30,
        sound: ""
      });
    }
  });
});