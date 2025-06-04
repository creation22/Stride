// popup.js - Fixed version

document.addEventListener('DOMContentLoaded', () => {
  const intervalInput = document.getElementById('interval');
  const soundSelect = document.getElementById('sound-select');
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');
  const streakCount = document.getElementById('streak-count');

  // Fixed: Removed extra dot in Wolves sound path
  const SOUND_OPTIONS = [
    { name: "Wolves", src: "../../public/sounds/wolves_pack.wav" },
    { name: "Technology", src: "../../public/sounds/technologyfuturistichum.wav" },
    { name: "Natural", src: "../../public/sounds/natural_ambience.wav" },
    { name: "Rooster", src: "../../public/sounds/rooster.wav" },
    { name: "Birds", src: "../../public/sounds/littlebird.wav" },
    { name: "Bells", src: "../../public/sounds/happybell.wav" },
    { name: "Electronic", src: "../../public/sounds/electronicpowerup.wav" },
    { name: "Dog Bark", src: "../../public/sounds/dogbark.wav" },
    { name: "Classical Alarms", src: "../../public/sounds/classicalarms.wav" },
    { name: "Army Crowd", src: "../../public/sounds/army_crowd.wav" },
  ];

  // Populate sound options
  SOUND_OPTIONS.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.src;
    option.textContent = opt.name;
    soundSelect.appendChild(option);
  });

  // Load saved settings
  chrome.storage.sync.get(["interval", "sound", "streak"], (data) => {
    if (data.interval) intervalInput.value = data.interval;
    if (data.sound) soundSelect.value = data.sound;
    if (data.streak) streakCount.textContent = data.streak;
  });

  // Start reminder
  startBtn.addEventListener('click', () => {
    const minutes = parseInt(intervalInput.value);
    const sound = soundSelect.value;
    
    // Validation
    if (!minutes || minutes < 1) {
      alert("Please enter a valid number of minutes (minimum 1)");
      return;
    }

    if (minutes > 480) { // 8 hours max
      alert("Maximum interval is 480 minutes (8 hours)");
      return;
    }

    // Save settings
    chrome.storage.sync.set({ interval: minutes, sound }, () => {
      // Create alarm
      chrome.alarms.create("walkReminder", {
        delayInMinutes: minutes,
        periodInMinutes: minutes
      });
      
      alert(`Reminder started! You'll be reminded every ${minutes} minutes.`);
    });
  });

  // Stop reminder
  stopBtn.addEventListener('click', () => {
    chrome.alarms.clear("walkReminder", (wasCleared) => {
      if (wasCleared) {
        alert("Reminder stopped successfully.");
      } else {
        alert("No active reminder to stop.");
      }
    });
  });

  // Check if reminder is currently active
  chrome.alarms.get("walkReminder", (alarm) => {
    if (alarm) {
      // Update UI to show active state
      startBtn.textContent = "Update Reminder";
      startBtn.style.background = "linear-gradient(45deg, #ff9800, #f57c00)";
    }
  });
});