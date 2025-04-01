// 當頁面載入完成時執行
document.addEventListener('DOMContentLoaded', function() {
  // 檢查是否在Rich Menu相關頁面
  if (window.location.href.includes('messaging-api/rich-menus') || 
      window.location.href.includes('messaging-api/try-rich-menu')) {
    
    // 新增使用我們的工具的按鈕
    addToolButton();
  }
});

// 新增工具按鈕
function addToolButton() {
  // 尋找適合的位置插入按鈕
  const contentContainer = document.querySelector('.content__default');
  
  if (contentContainer) {
    // 創建工具按鈕元素
    const toolButton = document.createElement('div');
    toolButton.className = 'line-richmenu-tool-button';
    toolButton.innerHTML = `
      <a href="#" class="btn" style="
        display: inline-block;
        padding: 10px 20px;
        margin: 20px 0;
        background-color: #06C755;
        color: white;
        border-radius: 4px;
        text-decoration: none;
        font-weight: bold;
        text-align: center;
      ">使用 LINE Rich Menu 工具</a>
    `;
    
    // 插入到頁面中
    contentContainer.insertBefore(toolButton, contentContainer.firstChild);
    
    // 添加點擊事件
    toolButton.querySelector('a').addEventListener('click', function(e) {
      e.preventDefault();
      chrome.runtime.sendMessage({action: "openPopup"});
    });
  }
}
