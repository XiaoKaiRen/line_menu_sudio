// 替代直接fetch調用
function fetchFromAPI(url, options = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({
      action: "fetchData",
      url: url,
      method: options.method || 'GET',
      headers: options.headers || {},
      body: options.body || null
    }, response => {
      if (response && response.success) {
        resolve(response.data);
      } else {
        reject(new Error(response ? response.error : "Unknown error"));
      }
    });
  });
}

// 使用新的函數替換直接的fetch調用
// 例如：
// 原本: fetch('https://api.line.me/v2/bot/richmenu/...')
// 改為: fetchFromAPI('https://api.line.me/v2/bot/richmenu/...')
