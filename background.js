// 監聽安裝事件
chrome.runtime.onInstalled.addListener(function() {
  console.log('LINE Rich Menu Tool 已安裝');
});

// 處理訊息
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action === "fetchRichMenus") {
      // 從儲存中取出Channel Token
      chrome.storage.sync.get(['channelToken'], function(result) {
        if (result.channelToken) {
          fetchRichMenus(result.channelToken)
            .then(data => sendResponse({success: true, data: data}))
            .catch(error => sendResponse({success: false, error: error.message}));
        } else {
          sendResponse({success: false, error: "未設定Channel Access Token"});
        }
      });
      return true; // 表示會非同步回應
    }
  }
);

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "fetchData") {
    fetch(request.url, {
      method: request.method || 'GET',
      headers: request.headers || {},
      body: request.body ? JSON.stringify(request.body) : undefined
    })
    .then(response => response.json())
    .then(data => {
      sendResponse({success: true, data: data});
    })
    .catch(error => {
      sendResponse({success: false, error: error.message});
    });
    return true; // 保持發送通道開啟，允許異步回應
  }
});

// 取得Rich Menu列表
async function fetchRichMenus(token) {
  try {
    const response = await fetch('https://api.line.me/v2/bot/richmenu/list', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API錯誤 ${response.status}: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('取得Rich Menu列表失敗:', error);
    throw error;
  }
}
