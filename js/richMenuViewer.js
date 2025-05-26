document.addEventListener('DOMContentLoaded', function() {
  const refreshButton = document.getElementById('refresh-richmenu');
  const backButton = document.getElementById('back-to-home');
  const clearDefaultButton = document.getElementById('clear-default-richmenu');
  const loadingSection = document.getElementById('loading');
  const richMenuList = document.getElementById('richmenu-list');
  const noRichMenuSection = document.getElementById('no-richmenu');
  
  // 上傳對話框相關元素
  const uploadDialog = document.getElementById('upload-dialog');
  const imageFile = document.getElementById('image-file');
  const imagePreview = document.getElementById('image-preview');
  const imageInfo = document.getElementById('image-info');
  const uploadButton = document.getElementById('upload-button');
  const cancelUploadButton = document.getElementById('cancel-upload');
  
  // 用戶ID輸入對話框相關元素
  const linkUserDialog = document.createElement('div');
  linkUserDialog.id = 'link-user-dialog';
  linkUserDialog.className = 'upload-dialog';
  linkUserDialog.style.display = 'none';
  linkUserDialog.innerHTML = `
    <div class="upload-dialog-content">
      <h3>綁定 Rich Menu 給特定用戶</h3>
      <div class="link-user-info" id="link-user-info"></div>
      <div class="upload-form">
        <label for="user-id-input">用戶 ID (userId):</label>
        <input type="text" id="user-id-input" placeholder="U1234567890abcdef...">
        <p class="hint">提示: 用戶 ID 可在 Webhook 事件的 source 物件中找到，非 LINE ID</p>
        <div class="button-group">
          <button id="link-user-button" class="btn btn-primary">綁定</button>
          <button id="cancel-link-user" class="btn btn-secondary">取消</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(linkUserDialog);
  
  // 詳細設定對話框
  const detailsDialog = document.createElement('div');
  detailsDialog.id = 'details-dialog';
  detailsDialog.className = 'upload-dialog';
  detailsDialog.style.display = 'none';
  detailsDialog.innerHTML = `
    <div class="upload-dialog-content details-content">
      <h3>Rich Menu 詳細設定</h3>
      <div id="details-content"></div>
      <div class="button-group">
        <button id="close-details" class="btn btn-secondary">關閉</button>
      </div>
    </div>
  `;
  document.body.appendChild(detailsDialog);
  
  // 關閉詳細設定對話框按鈕
  const closeDetailsButton = document.getElementById('close-details');
  closeDetailsButton.addEventListener('click', function() {
    detailsDialog.style.display = 'none';
  });
  
  const userIdInput = document.getElementById('user-id-input');
  const linkUserButton = document.getElementById('link-user-button');
  const cancelLinkUserButton = document.getElementById('cancel-link-user');
  const linkUserInfo = document.getElementById('link-user-info');
  
  // 當前選中的Rich Menu ID
  let currentRichMenuId = null;
  let currentRichMenuName = null;
  
  // 載入Rich Menu列表
  function loadRichMenus() {
    showLoading(true);
    
    chrome.runtime.sendMessage({action: "fetchRichMenus"}, function(response) {
      showLoading(false);
      
      if (response.success) {
        displayRichMenus(response.data);
      } else {
        alert('取得Rich Menu列表失敗: ' + response.error);
      }
    });
  }
  
  // 顯示或隱藏載入提示
  function showLoading(show) {
    if (show) {
      loadingSection.style.display = 'block';
      richMenuList.style.display = 'none';
      noRichMenuSection.style.display = 'none';
    } else {
      loadingSection.style.display = 'none';
    }
  }
  
  // 顯示Rich Menu列表
  function displayRichMenus(data) {
    if (!data.richmenus || data.richmenus.length === 0) {
      richMenuList.style.display = 'none';
      noRichMenuSection.style.display = 'block';
      return;
    }
    
    richMenuList.style.display = 'grid';
    noRichMenuSection.style.display = 'none';
    richMenuList.innerHTML = '';
    
    // 設定最大顯示寬度，可根據需要調整
    const maxDisplayWidth = 280; // 卡片最大寬度
    
    data.richmenus.forEach(menu => {
      const li = document.createElement('li');
      li.className = 'richmenu-card';
      
      // 計算比例尺寸
      const aspectRatio = menu.size.width / menu.size.height;
      const displayWidth = Math.min(maxDisplayWidth, menu.size.width);
      const displayHeight = displayWidth / aspectRatio;
      
      // 檢查此Rich Menu是否為預設選單
      checkIfDefault(menu.richMenuId).then(isDefault => {
        // 檢查是否已上傳圖片
        checkIfImageUploaded(menu.richMenuId).then(hasImage => {
          li.innerHTML = `
            <div class="richmenu-image-container" style="width: ${displayWidth}px; height: ${displayHeight}px; position: relative;">
              <img id="img-${menu.richMenuId}" alt="${menu.name}" class="richmenu-image" style="width: 100%; height: 100%; object-fit: contain;">
              <canvas id="canvas-${menu.richMenuId}" class="richmenu-canvas" style="position:absolute;top:0;left:0;pointer-events:none;width:100%;height:100%;"></canvas>
              <div id="loading-${menu.richMenuId}" class="image-loading">載入圖片中...</div>
              ${!hasImage ? '<div class="no-image-overlay" style="position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);color:white;display:flex;justify-content:center;align-items:center;font-weight:bold;">尚未上傳圖片</div>' : ''}
            </div>
            <div class="richmenu-info">
              <h3 class="richmenu-title">${menu.name}</h3>
              <p class="richmenu-id">ID: ${menu.richMenuId}</p>
              <p class="richmenu-size">尺寸: ${menu.size.width}x${menu.size.height}</p>
              ${isDefault ? '<span class="default-badge">預設選單</span>' : ''}
            </div>
            <div class="richmenu-actions">
              <button class="btn btn-small view-details-btn" data-id="${menu.richMenuId}">檢視設定</button>
              <button class="btn btn-small set-default-btn" data-id="${menu.richMenuId}" ${!hasImage ? 'disabled title="請先上傳圖片"' : ''}>設為預設</button>
              <button class="btn btn-small btn-link-user" data-id="${menu.richMenuId}" data-name="${menu.name}" ${!hasImage ? 'disabled title="請先上傳圖片"' : ''}>綁定給用戶</button>
              ${!hasImage ? 
                `<button class="btn btn-small btn-upload" data-id="${menu.richMenuId}">上傳圖片</button>` : 
                `<button class="btn btn-small" disabled title="已上傳圖片，無法更換">上傳圖片</button>`
              }
              <button class="btn btn-small btn-delete" data-id="${menu.richMenuId}" style="background-color: #ff3b30; color: white;">
                <span style="margin-right: 3px;">⚠️</span>刪除
              </button>
            </div>
          `;
          
          richMenuList.appendChild(li);
          
          // 將menu數據保存為自定義屬性，以便繪製區域時使用
          li.dataset.menu = JSON.stringify(menu);
          
          // 載入Rich Menu圖片
          if (hasImage) {
            loadRichMenuImage(menu.richMenuId, menu);
          } else {
            // 如果沒有圖片，顯示預設圖片
            const imgElement = document.getElementById(`img-${menu.richMenuId}`);
            const loadingElement = document.getElementById(`loading-${menu.richMenuId}`);
            imgElement.src = 'images/no-image.png';
            loadingElement.style.display = 'none';
          }
          
          // 綁定按鈕事件
          const viewDetailsBtn = li.querySelector('.view-details-btn');
          const setDefaultBtn = li.querySelector('.set-default-btn');
          const deleteBtn = li.querySelector('.btn-delete');
          const uploadBtn = li.querySelector('.btn-upload');
          const linkUserBtn = li.querySelector('.btn-link-user');
          
          viewDetailsBtn.addEventListener('click', function() {
            showDetailsDialog(menu);
          });
          
          setDefaultBtn.addEventListener('click', function() {
            setDefaultRichMenu(menu.richMenuId);
          });
          
          deleteBtn.addEventListener('click', function() {
            deleteRichMenu(menu.richMenuId, menu.name);
          });
          
          if (uploadBtn) {
            uploadBtn.addEventListener('click', function() {
              showUploadDialog(menu.richMenuId, menu);
            });
          }
          
          if (linkUserBtn) {
            linkUserBtn.addEventListener('click', function() {
              showLinkUserDialog(menu.richMenuId, menu.name);
            });
          }
        });
      });
    });
  }
  
  // 顯示Rich Menu詳細設定對話框
  function showDetailsDialog(menu) {
    const detailsContent = document.getElementById('details-content');
    
    // 設置基本資訊
    let html = `
      <div class="details-section">
        <h4>基本資訊</h4>
        <table class="details-table">
          <tr>
            <td>名稱:</td>
            <td>${menu.name}</td>
          </tr>
          <tr>
            <td>Rich Menu ID:</td>
            <td><span class="mono-text">${menu.richMenuId}</span></td>
          </tr>
          <tr>
            <td>聊天欄文字:</td>
            <td>${menu.chatBarText}</td>
          </tr>
          <tr>
            <td>尺寸:</td>
            <td>${menu.size.width} x ${menu.size.height} 像素</td>
          </tr>
          <tr>
            <td>預設顯示:</td>
            <td>${menu.selected ? '是' : '否'}</td>
          </tr>
        </table>
      </div>
      
      <div class="details-section">
        <h4>區域設定 (${menu.areas.length} 個區域)</h4>
    `;
    
    // 加入每個區域的資訊
    menu.areas.forEach((area, index) => {
      html += `
        <div class="area-details">
          <h5>區域 ${index + 1}</h5>
          <table class="details-table">
            <tr>
              <td>位置:</td>
              <td>X: ${area.bounds.x}, Y: ${area.bounds.y}</td>
            </tr>
            <tr>
              <td>尺寸:</td>
              <td>${area.bounds.width} x ${area.bounds.height} 像素</td>
            </tr>
            <tr>
              <td>動作類型:</td>
              <td>${getActionTypeDisplay(area.action.type)}</td>
            </tr>
            ${getActionDetailsHtml(area.action)}
          </table>
        </div>
      `;
    });
    
    html += `</div>`;
    
    // 加入JSON形式的完整設定
    html += `
      <div class="details-section">
        <h4>JSON 格式設定</h4>
        <pre class="json-code">${JSON.stringify(menu, null, 2)}</pre>
      </div>
    `;
    
    detailsContent.innerHTML = html;
    detailsDialog.style.display = 'flex';
    
    // 設置樣式
    const style = document.createElement('style');
    style.textContent = `
      .details-content {
        width: 80%;
        max-width: 800px;
        max-height: 80vh;
        overflow-y: auto;
      }
      .details-section {
        margin-bottom: 20px;
      }
      .details-section h4 {
        margin-top: 0;
        border-bottom: 1px solid #ddd;
        padding-bottom: 5px;
      }
      .details-table {
        width: 100%;
        border-collapse: collapse;
      }
      .details-table td {
        padding: 5px;
        border-bottom: 1px solid #eee;
      }
      .details-table td:first-child {
        width: 120px;
        font-weight: bold;
      }
      .area-details {
        background: #f5f5f5;
        padding: 10px;
        margin-bottom: 10px;
        border-radius: 5px;
      }
      .area-details h5 {
        margin-top: 0;
        margin-bottom: 10px;
      }
      .json-code {
        background-color: #f0f0f0;
        padding: 10px;
        border-radius: 5px;
        overflow-x: auto;
        font-family: monospace;
        font-size: 12px;
        white-space: pre-wrap;
      }
      .mono-text {
        font-family: monospace;
        background-color: #f0f0f0;
        padding: 2px 4px;
        border-radius: 3px;
      }
    `;
    document.head.appendChild(style);
  }
  
  // 獲取動作類型顯示名稱
  function getActionTypeDisplay(actionType) {
    switch(actionType) {
      case 'message': return '發送訊息';
      case 'uri': return '開啟網址';
      case 'postback': return '回傳資料';
      case 'datetimepicker': return '日期時間選擇器';
      case 'richmenuswitch': return 'Rich Menu 切換';
      case 'camera': return '相機';
      case 'cameraRoll': return '相簿';
      case 'location': return '位置';
      default: return actionType;
    }
  }
  
  // 獲取動作詳細資訊的 HTML
  function getActionDetailsHtml(action) {
    let html = '';
    
    switch(action.type) {
      case 'message':
        html = `
          <tr>
            <td>訊息文字:</td>
            <td>${action.text}</td>
          </tr>
        `;
        break;
      case 'uri':
        html = `
          <tr>
            <td>網址:</td>
            <td><a href="${action.uri}" target="_blank">${action.uri}</a></td>
          </tr>
        `;
        break;
      case 'postback':
        html = `
          <tr>
            <td>資料:</td>
            <td>${action.data}</td>
          </tr>
        `;
        if (action.displayText) {
          html += `
            <tr>
              <td>顯示文字:</td>
              <td>${action.displayText}</td>
            </tr>
          `;
        }
        break;
      case 'datetimepicker':
        html = `
          <tr>
            <td>資料:</td>
            <td>${action.data}</td>
          </tr>
          <tr>
            <td>模式:</td>
            <td>${getDateTimePickerModeText(action.mode)}</td>
          </tr>
        `;
        break;
      case 'richmenuswitch':
        html = `
          <tr>
            <td>目標 Rich Menu:</td>
            <td>${action.richMenuAliasId}</td>
          </tr>
          <tr>
            <td>資料:</td>
            <td>${action.data}</td>
          </tr>
        `;
        break;
      default:
        html = `
          <tr>
            <td>動作資料:</td>
            <td><pre>${JSON.stringify(action, null, 2)}</pre></td>
          </tr>
        `;
    }
    
    return html;
  }
  
  // 獲取日期時間選擇器模式文字
  function getDateTimePickerModeText(mode) {
    switch(mode) {
      case 'date': return '日期';
      case 'time': return '時間';
      case 'datetime': return '日期時間';
      default: return mode;
    }
  }
  
  // 載入Rich Menu圖片
  function loadRichMenuImage(richMenuId, menuData) {
    const imgElement = document.getElementById(`img-${richMenuId}`);
    const canvasElement = document.getElementById(`canvas-${richMenuId}`);
    const loadingElement = document.getElementById(`loading-${richMenuId}`);
    
    chrome.storage.sync.get(['channelToken'], async function(result) {
      if (!result.channelToken) {
        imgElement.src = 'images/no-image.png'; // 預設圖片
        loadingElement.style.display = 'none';
        return;
      }
      
      try {
        const response = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${result.channelToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`API錯誤 ${response.status}`);
        }
        
        // 將圖片轉換為blob URL
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        
        // 設置圖片來源並隱藏載入提示
        imgElement.src = imageUrl;
        loadingElement.style.display = 'none';
        
        // 圖片載入完成後繪製區域
        imgElement.onload = function() {
          if (menuData && menuData.areas) {
            drawAreas(imgElement, canvasElement, menuData);
          }
        };
      } catch (error) {
        console.error('載入Rich Menu圖片失敗:', error);
        imgElement.src = 'images/error-image.png'; // 錯誤圖片
        loadingElement.style.display = 'none';
      }
    });
  }
  
  // 在Canvas上繪製區域
  function drawAreas(imgElement, canvasElement, menuData) {
    // 設置Canvas大小與圖片相同
    canvasElement.width = imgElement.clientWidth;
    canvasElement.height = imgElement.clientHeight;
    
    // 設置Canvas的樣式位置以便覆蓋在圖片上
    canvasElement.style.position = 'absolute';
    canvasElement.style.top = '0';
    canvasElement.style.left = '0';
    canvasElement.style.width = '100%';
    canvasElement.style.height = '100%';
    
    const ctx = canvasElement.getContext('2d');
    const imgWidth = imgElement.clientWidth;
    const imgHeight = imgElement.clientHeight;
    
    // 計算縮放比例
    const scaleX = imgWidth / menuData.size.width;
    const scaleY = imgHeight / menuData.size.height;
    
    // 清除Canvas
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // 繪製每個區域
    menuData.areas.forEach((area, index) => {
      const x = area.bounds.x * scaleX;
      const y = area.bounds.y * scaleY;
      const width = area.bounds.width * scaleX;
      const height = area.bounds.height * scaleY;
      
      // 區域邊框顏色
      ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.lineWidth = 2;
      
      // 繪製矩形
      ctx.strokeRect(x, y, width, height);
      
      // 添加區域編號 - 調整字體大小以適應縮放
      const fontSize = Math.max(10, Math.min(12, width / 10));
      ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.font = `${fontSize}px Arial`;
      ctx.fillText(`區域 ${index + 1}`, x + 5, y + 15);
    });
  }
  
  // 檢查Rich Menu是否為預設選單
  async function checkIfDefault(richMenuId) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['channelToken'], async function(result) {
        if (!result.channelToken) {
          resolve(false);
          return;
        }
        
        try {
          const response = await fetch('https://api.line.me/v2/bot/user/all/richmenu', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${result.channelToken}`
            }
          });
          
          if (response.status === 404) {
            // 沒有預設 Rich Menu
            resolve(false);
            return;
          } else if (response.status === 403) {
            // Rich Menu 被其他 channel 擁有
            console.warn('預設 Rich Menu 由其他 channel 設定');
            resolve(false);
            return;
          } else if (!response.ok) {
            console.error('檢查預設Rich Menu失敗:', await response.text());
            resolve(false);
            return;
          }
          
          const data = await response.json();
          resolve(data.richMenuId === richMenuId);
        } catch (error) {
          console.error('檢查預設Rich Menu失敗:', error);
          resolve(false);
        }
      });
    });
  }
  
  // 設定為預設Rich Menu
  function setDefaultRichMenu(richMenuId) {
    if (!confirm('確定要將此Rich Menu設為預設選單嗎?')) {
      return;
    }
    
    chrome.storage.sync.get(['channelToken'], async function(result) {
      if (!result.channelToken) {
        alert('請先在插件設定中設定您的Channel Access Token');
        return;
      }
      
      try {
        const response = await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${result.channelToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`API錯誤 ${response.status}: ${await response.text()}`);
        }
        
        alert('已設定為預設Rich Menu');
        loadRichMenus(); // 重新載入列表
      } catch (error) {
        console.error('設定預設Rich Menu失敗:', error);
        alert('設定預設Rich Menu失敗: ' + error.message);
      }
    });
  }

  // 顯示綁定用戶對話框
  function showLinkUserDialog(richMenuId, menuName) {
    currentRichMenuId = richMenuId;
    currentRichMenuName = menuName;
    
    // 重置對話框
    userIdInput.value = '';
    linkUserInfo.innerHTML = `
      <p><strong>Rich Menu 資訊</strong></p>
      <p>名稱: ${menuName}</p>
      <p>ID: ${richMenuId}</p>
    `;
    
    // 顯示對話框
    linkUserDialog.style.display = 'flex';
  }
  
  // 綁定 Rich Menu 到特定用戶
  function linkRichMenuToUser(richMenuId, userId) {
    if (!richMenuId || !userId) {
      alert('Rich Menu ID 和用戶 ID 不能為空');
      return;
    }
    
    chrome.storage.sync.get(['channelToken'], async function(result) {
      if (!result.channelToken) {
        alert('請先在插件設定中設定您的Channel Access Token');
        return;
      }
      
      // 顯示處理中提示
      linkUserButton.disabled = true;
      linkUserButton.textContent = '處理中...';
      
      try {
        const response = await fetch(`https://api.line.me/v2/bot/user/${userId}/richmenu/${richMenuId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${result.channelToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`API錯誤 ${response.status}: ${await response.text()}`);
        }
        
        alert(`已成功將 Rich Menu "${currentRichMenuName}" 綁定給用戶 ${userId}`);
        linkUserDialog.style.display = 'none';
      } catch (error) {
        console.error('綁定 Rich Menu 失敗:', error);
        alert('綁定 Rich Menu 失敗: ' + error.message);
      } finally {
        linkUserButton.disabled = false;
        linkUserButton.textContent = '綁定';
      }
    });
  }
  
  // 綁定用戶按鈕事件
  linkUserButton.addEventListener('click', function() {
    const userId = userIdInput.value.trim();
    
    if (!userId) {
      alert('請輸入用戶 ID');
      return;
    }
    
    // 檢查用戶 ID 格式是否正確
    if (!/^U[a-f0-9]{32}$/.test(userId)) {
      if (confirm('用戶 ID 格式似乎不符合標準的 LINE 用戶 ID 格式（以 U 開頭加上 32 字元的十六進位數字），是否仍要繼續？')) {
        linkRichMenuToUser(currentRichMenuId, userId);
      }
    } else {
      linkRichMenuToUser(currentRichMenuId, userId);
    }
  });
  
  // 取消綁定用戶按鈕事件
  cancelLinkUserButton.addEventListener('click', function() {
    linkUserDialog.style.display = 'none';
    currentRichMenuId = null;
    currentRichMenuName = null;
  });
  
  // 刪除Rich Menu - 加強確認流程
  function deleteRichMenu(richMenuId, menuName) {
    // 第一階段確認
    if (!confirm(`警告：您即將刪除 Rich Menu "${menuName}"。\n\n此操作無法撤銷，刪除後將永久損失。\n是否繼續?`)) {
      return;
    }
    
    // 第二階段確認 - 要求輸入特定文字
    const confirmText = "DELETE";
    const userInput = prompt(`請輸入 "${confirmText}" 以確認刪除操作：`);
    
    if (userInput !== confirmText) {
      alert('刪除操作已取消。');
      return;
    }
    
    // 顯示倒數計時確認對話框
    let countdown = 5;
    const countdownDialog = document.createElement('div');
    countdownDialog.style.position = 'fixed';
    countdownDialog.style.top = '50%';
    countdownDialog.style.left = '50%';
    countdownDialog.style.transform = 'translate(-50%, -50%)';
    countdownDialog.style.backgroundColor = '#fff';
    countdownDialog.style.padding = '20px';
    countdownDialog.style.borderRadius = '5px';
    countdownDialog.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    countdownDialog.style.zIndex = '1000';
    countdownDialog.style.textAlign = 'center';
    
    countdownDialog.innerHTML = `
      <h3 style="color:#ff3b30;margin-top:0;">最終刪除確認</h3>
      <p>Rich Menu "${menuName}" 將在 <span id="countdown">${countdown}</span> 秒後刪除</p>
      <div>
        <button id="cancel-delete" style="margin-right:10px;padding:8px 16px;background:#f2f2f2;border:none;border-radius:4px;cursor:pointer;">取消</button>
        <button id="confirm-delete" style="padding:8px 16px;background:#ff3b30;color:white;border:none;border-radius:4px;cursor:pointer;">立即刪除</button>
      </div>
    `;
    
    document.body.appendChild(countdownDialog);
    
    // 倒數計時
    const countdownInterval = setInterval(() => {
      countdown--;
      document.getElementById('countdown').textContent = countdown;
      
      if (countdown <= 0) {
        clearInterval(countdownInterval);
        document.body.removeChild(countdownDialog);
        executeDelete(richMenuId);
      }
    }, 1000);
    
    // 取消按鈕事件
    document.getElementById('cancel-delete').addEventListener('click', () => {
      clearInterval(countdownInterval);
      document.body.removeChild(countdownDialog);
      alert('刪除操作已取消。');
    });
    
    // 立即刪除按鈕事件
    document.getElementById('confirm-delete').addEventListener('click', () => {
      clearInterval(countdownInterval);
      document.body.removeChild(countdownDialog);
      executeDelete(richMenuId);
    });
  }
  
  // 執行實際的刪除操作
  function executeDelete(richMenuId) {
    chrome.storage.sync.get(['channelToken'], async function(result) {
      if (!result.channelToken) {
        alert('請先在插件設定中設定您的Channel Access Token');
        return;
      }
      
      try {
        const response = await fetch(`https://api.line.me/v2/bot/richmenu/${richMenuId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${result.channelToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`API錯誤 ${response.status}: ${await response.text()}`);
        }
        
        alert('Rich Menu 已成功刪除');
        loadRichMenus(); // 重新載入列表
      } catch (error) {
        console.error('刪除Rich Menu失敗:', error);
        alert('刪除Rich Menu失敗: ' + error.message);
      }
    });
  }

  // 清除預設Rich Menu
  function clearDefaultRichMenu() {
    if (!confirm('確定要清除預設Rich Menu嗎？所有用戶將不再看到預設Rich Menu。')) {
      return;
    }
    
    chrome.storage.sync.get(['channelToken'], async function(result) {
      if (!result.channelToken) {
        alert('請先在插件設定中設定您的Channel Access Token');
        return;
      }
      
      try {
        const response = await fetch('https://api.line.me/v2/bot/user/all/richmenu', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${result.channelToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`API錯誤 ${response.status}: ${await response.text()}`);
        }
        
        alert('預設Rich Menu已清除');
        loadRichMenus(); // 重新載入列表
      } catch (error) {
        console.error('清除預設Rich Menu失敗:', error);
        alert('清除預設Rich Menu失敗: ' + error.message);
      }
    });
  }

  // 返回首頁
  function goBackToHome() {
    window.location.href = 'popup.html';
  }
  
  // 檢查是否已上傳圖片
  async function checkIfImageUploaded(richMenuId) {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['channelToken'], async function(result) {
        if (!result.channelToken) {
          resolve(false);
          return;
        }
        
        try {
          const response = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${result.channelToken}`
            }
          });
          
          if (response.status === 404) {
            // 無圖片
            resolve(false);
          } else if (response.ok) {
            // 有圖片
            resolve(true);
          } else {
            console.error('檢查Rich Menu圖片失敗:', await response.text());
            resolve(false);
          }
        } catch (error) {
          console.error('檢查Rich Menu圖片失敗:', error);
          resolve(false);
        }
      });
    });
  }
  
  // 顯示上傳對話框
  function showUploadDialog(richMenuId, menuData) {
    currentRichMenuId = richMenuId;
    
    // 重置對話框
    imageFile.value = '';
    imagePreview.style.display = 'none';
    imageInfo.innerHTML = '';
    uploadButton.disabled = true;
    
    // 添加Rich Menu資訊
    const richMenuInfo = document.createElement('div');
    richMenuInfo.innerHTML = `
      <p><strong>Rich Menu 資訊</strong></p>
      <p>名稱: ${menuData.name}</p>
      <p>尺寸: ${menuData.size.width}x${menuData.size.height}</p>
      <p>ID: ${richMenuId}</p>
    `;
    imageInfo.appendChild(richMenuInfo);
    
    // 顯示對話框
    uploadDialog.style.display = 'flex';
  }

  // 處理圖片預覽與驗證
  imageFile.addEventListener('change', function() {
    const file = this.files[0];
    if (!file) {
      imagePreview.style.display = 'none';
      uploadButton.disabled = true;
      return;
    }
    
    // 檢查檔案大小
    if (file.size > 1024 * 1024) { // 1MB
      alert('圖片大小不能超過1MB');
      this.value = '';
      imagePreview.style.display = 'none';
      uploadButton.disabled = true;
      return;
    }
    
    // 檢查檔案類型
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      alert('圖片格式必須為JPEG或PNG');
      this.value = '';
      imagePreview.style.display = 'none';
      uploadButton.disabled = true;
      return;
    }
    
    // 預覽圖片
    const reader = new FileReader();
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        // 檢查圖片尺寸符合要求
        const width = this.width;
        const height = this.height;
        const aspectRatio = width / height;
        
        const sizeInfo = document.createElement('div');
        sizeInfo.innerHTML = `
          <p><strong>圖片資訊</strong></p>
          <p>尺寸: ${width}x${height}像素</p>
          <p>長寬比: ${aspectRatio.toFixed(2)}</p>
          <p>大小: ${(file.size / 1024).toFixed(2)}KB</p>
        `;
        
        // 移除之前的圖片資訊
        const existingInfo = imageInfo.querySelector('.image-validation');
        if (existingInfo) {
          imageInfo.removeChild(existingInfo);
        }
        
        // 驗證圖片符合LINE規格
        const validation = document.createElement('div');
        validation.className = 'image-validation';
        
        let isValid = true;
        let errorMessage = '';
        
        if (width < 800 || width > 2500) {
          isValid = false;
          errorMessage += '寬度必須在800到2500像素之間<br>';
        }
        
        if (height < 250) {
          isValid = false;
          errorMessage += '高度必須大於250像素<br>';
        }
        
        if (aspectRatio < 1.45) {
          isValid = false;
          errorMessage += '長寬比(寬/高)必須大於1.45<br>';
        }
        
        if (isValid) {
          validation.innerHTML = '<p style="color:green;font-weight:bold;">✓ 圖片符合LINE規格</p>';
          uploadButton.disabled = false;
        } else {
          validation.innerHTML = `
            <p style="color:red;font-weight:bold;">✗ 圖片不符合LINE規格</p>
            <p style="color:red;">${errorMessage}</p>
          `;
          uploadButton.disabled = true;
        }
        
        imageInfo.appendChild(sizeInfo);
        imageInfo.appendChild(validation);
        
        // 顯示圖片預覽
        imagePreview.src = e.target.result;
        imagePreview.style.display = 'block';
      };
      
      img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
  });
  
  // 上傳圖片事件
  uploadButton.addEventListener('click', function() {
    const file = imageFile.files[0];
    if (!file || !currentRichMenuId) {
      alert('請選擇圖片檔案');
      return;
    }
    
    chrome.storage.sync.get(['channelToken'], async function(result) {
      if (!result.channelToken) {
        alert('請先在插件設定中設定您的Channel Access Token');
        return;
      }
      
      // 顯示上傳中提示
      uploadButton.disabled = true;
      uploadButton.textContent = '上傳中...';
      
      try {
        // 上傳圖片到LINE API
        const reader = new FileReader();
        reader.onload = async function(e) {
          try {
            const response = await fetch(`https://api-data.line.me/v2/bot/richmenu/${currentRichMenuId}/content`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${result.channelToken}`,
                'Content-Type': file.type
              },
              body: new Blob([new Uint8Array(e.target.result)], {type: file.type})
            });
            
            if (!response.ok) {
              throw new Error(`API錯誤 ${response.status}: ${await response.text()}`);
            }
            
            alert('Rich Menu 圖片上傳成功');
            uploadDialog.style.display = 'none';
            loadRichMenus(); // 重新載入列表
          } catch (error) {
            console.error('上傳圖片失敗:', error);
            alert('上傳圖片失敗: ' + error.message);
            uploadButton.disabled = false;
            uploadButton.textContent = '上傳圖片';
          }
        };
        
        reader.readAsArrayBuffer(file);
      } catch (error) {
        console.error('處理圖片失敗:', error);
        alert('處理圖片失敗: ' + error.message);
        uploadButton.disabled = false;
        uploadButton.textContent = '上傳圖片';
      }
    });
  });
  
  // 取消上傳按鈕事件
  cancelUploadButton.addEventListener('click', function() {
    uploadDialog.style.display = 'none';
    currentRichMenuId = null;
  });

  // 绑定事件監聽器
  refreshButton.addEventListener('click', loadRichMenus);
  backButton.addEventListener('click', goBackToHome);
  clearDefaultButton.addEventListener('click', clearDefaultRichMenu);

  // 模擬後端API呼叫
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "fetchRichMenuDataComplete") {
      if (request.success) {
        displayRichMenus(request.data);
      } else {
        alert('取得Rich Menu列表失敗: ' + request.error);
      }
    }
  });

  // 頁面加載時自動獲取Rich Menu列表
  loadRichMenus();
});

// 當視窗大小變化時，重新繪製區域
window.addEventListener('resize', function() {
  const richMenuCards = document.querySelectorAll('.richmenu-card');
  
  richMenuCards.forEach(card => {
    const menuData = JSON.parse(card.dataset.menu);
    const richMenuId = menuData.richMenuId;
    const imgElement = document.getElementById(`img-${richMenuId}`);
    const canvasElement = document.getElementById(`canvas-${richMenuId}`);
    
    if (imgElement && canvasElement && imgElement.complete) {
      drawAreas(imgElement, canvasElement, menuData);
    }
  });
});
