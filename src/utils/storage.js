export const getStorage = (keys) => {
  // Check if running in Chrome extension environment
  if (typeof chrome === 'undefined' || !chrome.storage?.sync) {
    console.warn('Chrome storage API not available, using fallback');
    // Return the default keys object when Chrome storage is unavailable
    return Promise.resolve(keys);
  }

  return new Promise((resolve) => {
    chrome.storage.sync.get(keys, (result) => {
      // Deep merge the result with the default keys to ensure all properties exist
      const mergedResult = { ...keys };
      
      // Only override defaults with actual values from storage
      for (const key in result) {
        if (result[key] !== undefined && result[key] !== null) {
          mergedResult[key] = result[key];
        }
      }
      
      resolve(mergedResult);
    });
  });
};

export const setStorage = (items) => {
  // Check if running in Chrome extension environment
  if (typeof chrome === 'undefined' || !chrome.storage?.sync) {
    console.warn('Chrome storage API not available, storage operation skipped');
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    chrome.storage.sync.set(items, () => {
      resolve();
    });
  });
};