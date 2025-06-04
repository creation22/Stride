// background.js

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "walkReminder") {
    chrome.storage.sync.get(["sound", "lastWalkDate", "streak"], (data) => {
      // Show notification
      chrome.notifications.create({
        type: "basic",
        iconUrl: "../../public/icons/icon128.png",
        title: "Time to Walk!",
        message: "Stand up and take a walk. Stay healthy!",
        priority: 2
      });

      // Play sound
      if (data.sound) {
        const audio = new Audio(data.sound);
        audio.play().catch(err => console.warn("Sound play error:", err));
      }

      // Update streak if not already counted today
      const today = new Date().toISOString().split("T")[0];
      if (data.lastWalkDate !== today) {
        const newStreak = (data.streak || 0) + 1;
        chrome.storage.sync.set({
          lastWalkDate: today,
          streak: newStreak
        });
      }
    });
  }
});
