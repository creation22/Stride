// storage.js

const Storage = {
  get: (keys) => {
    return new Promise((resolve) => {
      chrome.storage.sync.get(keys, (result) => {
        resolve(result);
      });
    });
  },

  set: (items) => {
    return new Promise((resolve) => {
      chrome.storage.sync.set(items, () => {
        resolve();
      });
    });
  }
};

export default Storage;
