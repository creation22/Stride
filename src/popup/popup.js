// popup.js

document.addEventListener('DOMContentLoaded', () => {
  const intervalInput = document.getElementById('interval');
  const soundSelect = document.getElementById('sound-select');
  const startBtn = document.getElementById('start-btn');
  const stopBtn = document.getElementById('stop-btn');
  const streakCount = document.getElementById('streak-count');

  const SOUND_OPTIONS = [
  { name: "Wolves", src: "../../public/sounds/wolves_pack.wav." },
  { name: "Technology", src: "../../public/sounds/technologyfuturistichum.wav" },
  { name: "Natural", src: "../../public/sounds/natural_ambience.wav" },
  { name: "Rooster", src: "../../public/sounds/rooster.wav" },
  { name: "Birds", src: "../../public/sounds/littlebird.wav" },
  { name: "Bells", src: "../../public/sounds/happybell.wav" },
  { name: "Electronic", src: "../../public/sounds/electronicpowerup.wav" },
  { name: "Dog Bark", src: "../../public/sounds/dogbark.wav" },
  { name: "classical alarms", src: "../../public/sounds/classicalarms.wav" },
  { name: "Army Crowd", src: "../../public/sounds/army_crowd.wav" },
  ];

  SOUND_OPTIONS.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.src;
    option.textContent = opt.name;
    soundSelect.appendChild(option);
  });

  chrome.storage.sync.get(["interval", "sound", "streak"], (data) => {
    if (data.interval) intervalInput.value = data.interval;
    if (data.sound) soundSelect.value = data.sound;
    if (data.streak) streakCount.textContent = data.streak;
  });

  startBtn.addEventListener('click', () => {
    const minutes = parseInt(intervalInput.value);
    const sound = soundSelect.value;
    if (!minutes || minutes < 1) return alert("Enter valid minutes");

    chrome.storage.sync.set({ interval: minutes, sound });

    chrome.alarms.create("walkReminder", {
      delayInMinutes: minutes,
      periodInMinutes: minutes
    });
    alert("Reminder started!");
  });

  stopBtn.addEventListener('click', () => {
    chrome.alarms.clear("walkReminder", () => {
      alert("Reminder stopped.");
    });
  });
});
