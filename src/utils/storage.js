export const getStorage = (keys) => {
  if (typeof chrome === 'undefined' || !chrome.storage?.sync) {
    console.warn('Chrome storage API not available, using fallback');
    return Promise.resolve(keys);
  }

  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        console.error('Chrome storage get error:', chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
        return;
      }
      const mergedResult = { ...keys };
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
  if (typeof chrome === 'undefined' || !chrome.storage?.sync) {
    console.warn('Chrome storage API not available, storage operation skipped');
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    chrome.storage.sync.set(items, () => {
      if (chrome.runtime.lastError) {
        console.error('Chrome storage set error:', chrome.runtime.lastError);
        reject(chrome.runtime.lastError);
        return;
      }
      resolve();
    });
  });
};
