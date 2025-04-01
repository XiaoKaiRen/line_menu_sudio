document.addEventListener('DOMContentLoaded', function() {
  // 元素參考
  const createRichMenuBtn = document.getElementById('create-richmenu');
  const viewRichMenuBtn = document.getElementById('view-richmenu');
  const channelTokenInput = document.getElementById('channel-token');
  const saveSettingsBtn = document.getElementById('save-settings');
  
  // 載入已儲存的設定
  chrome.storage.sync.get(['channelToken'], function(result) {
    if (result.channelToken) {
      channelTokenInput.value = result.channelToken;
    }
  });
  
  // 儲存設定
  saveSettingsBtn.addEventListener('click', function() {
    const channelToken = channelTokenInput.value.trim();
    
    chrome.storage.sync.set({
      channelToken: channelToken
    }, function() {
      // 顯示儲存成功的訊息
      saveSettingsBtn.textContent = '已儲存!';
      setTimeout(() => {
        saveSettingsBtn.textContent = '儲存設定';
      }, 2000);
    });
  });
  
  // 導向建立Rich Menu頁面
  createRichMenuBtn.addEventListener('click', function() {
    chrome.tabs.create({ url: chrome.runtime.getURL('richMenuEditor.html') });
  });
  
  // 導向查看Rich Menu頁面
  viewRichMenuBtn.addEventListener('click', function() {
    chrome.tabs.create({ url: chrome.runtime.getURL('richMenuViewer.html') });
  });
});
