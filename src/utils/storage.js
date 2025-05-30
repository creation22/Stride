export const getStorage = (keys) => {
  return new Promise((resolve) => {
    chrome.storage.sync.get(keys, (result) => {
      resolve(result)
    })
  })
}

export const setStorage = (items) => {
  return new Promise((resolve) => {
    chrome.storage.sync.set(items, () => {
      resolve()
    })
  })
}
