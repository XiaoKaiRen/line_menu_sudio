document.addEventListener('DOMContentLoaded', function() {
  // 初始化變數
  let richMenuData = {
    size: {
      width: 2500,
      height: 1686
    },
    selected: true,
    name: "",
    chatBarText: "",
    areas: []
  };
  
  let selectedAreaIndex = -1;
  let canvas = document.getElementById('richmenu-canvas');
  let ctx = canvas.getContext('2d');
  let menuImage = null;
  
  // 新增變數 - 控制編輯模式和拖拉狀態
  let editMode = 'select'; // 'select', 'create', 'move', 'resize'
  let isDrawing = false;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;
  let dragOffsetX = 0;
  let dragOffsetY = 0;
  let resizeHandle = null;
  
  // 調整Canvas大小以適應視窗
  function adjustCanvasDisplay() {
    const container = document.querySelector('.canvas-container');
    const containerWidth = container.clientWidth;
    const canvasAspectRatio = canvas.width / canvas.height;
    
    // 設置Canvas的CSS寬度來適應容器
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    
    // 保存縮放比例供後續使用 - 確保是整數
    canvas.scaleFactor = Math.round(canvas.width / canvas.clientWidth);
    
    drawCanvas();
  }
  
  // 頁面載入和視窗大小變化時調整Canvas
  window.addEventListener('resize', adjustCanvasDisplay);
  adjustCanvasDisplay();
  
  // Tab 切換功能
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.getAttribute('data-tab');
      
      // 更新標籤狀態
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // 更新內容狀態
      tabContents.forEach(content => content.classList.remove('active'));
      document.getElementById(`${tabId}-tab`).classList.add('active');
      
      // 如果切換到預覽頁面，則更新預覽
      if (tabId === 'preview') {
        updatePreview();
      }
    });
  });
  
  // 監聽圖片上傳
  document.getElementById('menu-image').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        menuImage = new Image();
        menuImage.onload = function() {
          // 繪製圖片到畫布
          drawCanvas();
          adjustCanvasDisplay();
        };
        menuImage.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
  
  // 監聽尺寸變更
  document.getElementById('menu-width').addEventListener('change', function(e) {
    richMenuData.size.width = parseInt(e.target.value);
    canvas.width = richMenuData.size.width;
    drawCanvas();
    adjustCanvasDisplay();
  });
  
  document.getElementById('menu-height').addEventListener('change', function(e) {
    richMenuData.size.height = parseInt(e.target.value);
    canvas.height = richMenuData.size.height;
    drawCanvas();
    adjustCanvasDisplay();
  });
  
  // 監聽表單變更
  document.getElementById('richmenu-name').addEventListener('input', function(e) {
    richMenuData.name = e.target.value;
    updateJsonEditor(); // 更新 JSON 編輯器
  });
  
  document.getElementById('chat-bar-text').addEventListener('input', function(e) {
    richMenuData.chatBarText = e.target.value;
    updateJsonEditor(); // 更新 JSON 編輯器
  });
  
  // JSON 編輯器相關功能
  const jsonEditor = document.getElementById('richmenu-json');
  const jsonValidationMessage = document.getElementById('json-validation-message');
  
  // 初始化 JSON 編輯器內容
  updateJsonEditor();
  
  // 匯入 JSON 按鈕
  document.getElementById('import-json').addEventListener('click', function() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
          jsonEditor.value = event.target.result;
          // 嘗試驗證並應用 JSON
          validateAndApplyJson();
        };
        reader.readAsText(file);
      }
    });
    
    input.click();
  });
  
  // 匯出 JSON 按鈕
  document.getElementById('export-json').addEventListener('click', function() {
    const jsonString = JSON.stringify(richMenuData, null, 2);
    const blob = new Blob([jsonString], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `richmenu-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
  
  // 套用 JSON 按鈕
  document.getElementById('apply-json').addEventListener('click', function() {
    validateAndApplyJson();
  });
  
  // JSON 編輯器內容變更
  jsonEditor.addEventListener('input', function() {
    // 重置驗證訊息
    jsonValidationMessage.textContent = '';
    jsonValidationMessage.className = '';
  });
  
  // 更新 JSON 編輯器內容
  function updateJsonEditor() {
    // 避免因表單更新而觸發 updateFormFromJson
    if (document.activeElement !== jsonEditor) {
      jsonEditor.value = JSON.stringify(richMenuData, null, 2);
    }
  }
  
  // 驗證並應用 JSON
  function validateAndApplyJson() {
    try {
      const jsonValue = jsonEditor.value.trim();
      if (!jsonValue) {
        throw new Error('JSON 不能為空');
      }
      
      const parsedJson = JSON.parse(jsonValue);
      
      // 驗證 JSON 結構
      if (!parsedJson.size || !parsedJson.size.width || !parsedJson.size.height) {
        throw new Error('JSON 必須包含 size.width 和 size.height');
      }
      
      // 驗證需要的字段
      if (parsedJson.name === undefined) {
        throw new Error('缺少 name 字段');
      }
      if (parsedJson.chatBarText === undefined) {
        throw new Error('缺少 chatBarText 字段');
      }
      
      // 深度複製以避免參考問題
      richMenuData = JSON.parse(JSON.stringify(parsedJson));
      
      // 確保 areas 存在
      if (!richMenuData.areas) {
        richMenuData.areas = [];
      }
      
      // 更新表單
      updateFormFromJson();
      
      // 重新繪製 Canvas
      drawCanvas();
      
      // 顯示成功訊息
      jsonValidationMessage.textContent = '✓ JSON 已成功套用';
      jsonValidationMessage.className = 'success';
      
      // 如果有圖片，更新畫布大小
      if (menuImage) {
        canvas.width = richMenuData.size.width;
        canvas.height = richMenuData.size.height;
        adjustCanvasDisplay();
      }
      
      // 如果有區域，更新區域屬性面板
      if (selectedAreaIndex >= 0 && selectedAreaIndex < richMenuData.areas.length) {
        updateAreaProperties();
      } else if (richMenuData.areas.length > 0) {
        selectedAreaIndex = 0;
        updateAreaProperties();
      }
      
    } catch (error) {
      console.error('JSON 解析錯誤:', error);
      jsonValidationMessage.textContent = '✗ ' + error.message;
      jsonValidationMessage.className = 'error';
    }
  }
  
  // 從 JSON 更新表單
  function updateFormFromJson() {
    document.getElementById('richmenu-name').value = richMenuData.name || '';
    document.getElementById('chat-bar-text').value = richMenuData.chatBarText || '';
    
    // 更新尺寸選擇
    const widthSelect = document.getElementById('menu-width');
    const heightSelect = document.getElementById('menu-height');
    
    // 尋找最接近的寬度選項
    let widthFound = false;
    for (let i = 0; i < widthSelect.options.length; i++) {
      if (parseInt(widthSelect.options[i].value) === richMenuData.size.width) {
        widthSelect.selectedIndex = i;
        widthFound = true;
        break;
      }
    }
    
    // 如果沒有找到匹配的寬度選項，添加一個新選項
    if (!widthFound) {
      const option = document.createElement('option');
      option.value = richMenuData.size.width;
      option.text = `${richMenuData.size.width}px (自定義)`;
      widthSelect.add(option);
      widthSelect.value = richMenuData.size.width;
    }
    
    // 尋找最接近的高度選項
    let heightFound = false;
    for (let i = 0; i < heightSelect.options.length; i++) {
      if (parseInt(heightSelect.options[i].value) === richMenuData.size.height) {
        heightSelect.selectedIndex = i;
        heightFound = true;
        break;
      }
    }
    
    // 如果沒有找到匹配的高度選項，添加一個新選項
    if (!heightFound) {
      const option = document.createElement('option');
      option.value = richMenuData.size.height;
      option.text = `${richMenuData.size.height}px (自定義)`;
      heightSelect.add(option);
      heightSelect.value = richMenuData.size.height;
    }
    
    // 更新畫布大小
    canvas.width = richMenuData.size.width;
    canvas.height = richMenuData.size.height;
  }
  
  // 下一步按鈕
  document.getElementById('next-to-areas').addEventListener('click', function() {
    tabs[1].click(); // 切換到區域設定頁籤
  });
  
  document.getElementById('next-to-preview').addEventListener('click', function() {
    tabs[2].click(); // 切換到預覽頁籤
  });
  
  // 新增區域按鈕
  document.getElementById('add-area').addEventListener('click', function() {
    const newArea = {
      bounds: {
        x: 0,
        y: 0,
        width: 833,
        height: 843
      },
      action: {
        type: "message",
        text: "新按鈕"
      }
    };
    
    richMenuData.areas.push(newArea);
    selectedAreaIndex = richMenuData.areas.length - 1;
    drawCanvas();
    updateAreaProperties();
  });
  
  // 刪除區域按鈕
  document.getElementById('delete-area').addEventListener('click', function() {
    if (selectedAreaIndex >= 0) {
      richMenuData.areas.splice(selectedAreaIndex, 1);
      selectedAreaIndex = -1;
      drawCanvas();
      updateAreaProperties();
    }
  });
  
  // 區域編輯模式按鈕
  document.getElementById('mode-select').addEventListener('click', function() {
    editMode = 'select';
    updateEditModeButtons();
  });
  
  document.getElementById('mode-create').addEventListener('click', function() {
    editMode = 'create';
    updateEditModeButtons();
  });
  
  // 畫布點擊事件 (選擇區域)
  canvas.addEventListener('click', function(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    // 檢查是否點擊了某個區域
    let found = false;
    for (let i = richMenuData.areas.length - 1; i >= 0; i--) {
      const area = richMenuData.areas[i];
      if (x >= area.bounds.x && 
          x <= area.bounds.x + area.bounds.width &&
          y >= area.bounds.y && 
          y <= area.bounds.y + area.bounds.height) {
        selectedAreaIndex = i;
        found = true;
        break;
      }
    }
    
    if (!found) {
      selectedAreaIndex = -1;
    }
    
    drawCanvas();
    updateAreaProperties();
  });
  
  // 新增確保整數的輔助函數
  function ensureInt(value) {
    return Math.round(value);
  }
  
  // 添加新的畫布事件處理 - 鼠標按下
  canvas.addEventListener('mousedown', function(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = ensureInt((e.clientX - rect.left) * scaleX);
    const y = ensureInt((e.clientY - rect.top) * scaleY);
    
    if (editMode === 'create') {
      // 開始繪製新區域
      isDrawing = true;
      startX = x;
      startY = y;
      currentX = x;
      currentY = y;
    } else if (editMode === 'select') {
      // 檢查是否點擊了某個區域或調整控制點
      checkForAreaOrHandle(x, y);
    }
  });
  
  // 添加新的畫布事件處理 - 鼠標移動
  canvas.addEventListener('mousemove', function(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = ensureInt((e.clientX - rect.left) * scaleX);
    const y = ensureInt((e.clientY - rect.top) * scaleY);
    
    if (isDrawing) {
      if (editMode === 'create') {
        // 更新當前繪製區域尺寸
        currentX = x;
        currentY = y;
        drawCanvas();
        drawCurrentArea();
      } else if (editMode === 'move' && selectedAreaIndex >= 0) {
        // 移動選中的區域 - 確保整數值
        const area = richMenuData.areas[selectedAreaIndex];
        area.bounds.x = ensureInt(Math.max(0, Math.min(x - dragOffsetX, richMenuData.size.width - area.bounds.width)));
        area.bounds.y = ensureInt(Math.max(0, Math.min(y - dragOffsetY, richMenuData.size.height - area.bounds.height)));
        
        // 更新表單中的數值
        if (document.getElementById('area-x')) {
          document.getElementById('area-x').value = area.bounds.x;
        }
        if (document.getElementById('area-y')) {
          document.getElementById('area-y').value = area.bounds.y;
        }
        
        drawCanvas();
      } else if (editMode === 'resize' && selectedAreaIndex >= 0 && resizeHandle) {
        // 調整區域大小 - 確保整數值
        const area = richMenuData.areas[selectedAreaIndex];
        const bounds = area.bounds;
        
        // 暫存原始值以便後續更新表單
        const originalBounds = { ...bounds };
        
        if (resizeHandle === 'nw') {
          const newWidth = ensureInt(bounds.x + bounds.width - x);
          const newHeight = ensureInt(bounds.y + bounds.height - y);
          if (newWidth > 50 && newHeight > 50) {
            bounds.x = ensureInt(x);
            bounds.y = ensureInt(y);
            bounds.width = newWidth;
            bounds.height = newHeight;
          }
        } else if (resizeHandle === 'ne') {
          const newWidth = ensureInt(x - bounds.x);
          const newHeight = ensureInt(bounds.y + bounds.height - y);
          if (newWidth > 50 && newHeight > 50) {
            bounds.y = ensureInt(y);
            bounds.width = newWidth;
            bounds.height = newHeight;
          }
        } else if (resizeHandle === 'sw') {
          const newWidth = ensureInt(bounds.x + bounds.width - x);
          const newHeight = ensureInt(y - bounds.y);
          if (newWidth > 50 && newHeight > 50) {
            bounds.x = ensureInt(x);
            bounds.width = newWidth;
            bounds.height = newHeight;
          }
        } else if (resizeHandle === 'se') {
          const newWidth = ensureInt(x - bounds.x);
          const newHeight = ensureInt(y - bounds.y);
          if (newWidth > 50 && newHeight > 50) {
            bounds.width = newWidth;
            bounds.height = newHeight;
          }
        }
        
        // 如果值有變更，則更新表單
        if (originalBounds.x !== bounds.x && document.getElementById('area-x')) {
          document.getElementById('area-x').value = bounds.x;
        }
        if (originalBounds.y !== bounds.y && document.getElementById('area-y')) {
          document.getElementById('area-y').value = bounds.y;
        }
        if (originalBounds.width !== bounds.width && document.getElementById('area-width')) {
          document.getElementById('area-width').value = bounds.width;
        }
        if (originalBounds.height !== bounds.height && document.getElementById('area-height')) {
          document.getElementById('area-height').value = bounds.height;
        }
        
        drawCanvas();
      }
    } else {
      // 更新鼠標指針樣式
      updateCursorStyle(x, y);
    }
  });
  
  // 添加新的畫布事件處理 - 鼠標釋放
  canvas.addEventListener('mouseup', function(e) {
    if (isDrawing) {
      if (editMode === 'create') {
        // 完成新區域的繪製並添加到區域列表
        const x = ensureInt(Math.min(startX, currentX));
        const y = ensureInt(Math.min(startY, currentY));
        const width = ensureInt(Math.abs(currentX - startX));
        const height = ensureInt(Math.abs(currentY - startY));
        
        // 只有當區域尺寸大於最小閾值時才添加
        if (width > 50 && height > 50) {
          const newArea = {
            bounds: {
              x: x,
              y: y,
              width: width,
              height: height
            },
            action: {
              type: "message",
              text: "新按鈕"
            }
          };
          
          richMenuData.areas.push(newArea);
          selectedAreaIndex = richMenuData.areas.length - 1;
          updateAreaProperties();
        }
      }
      
      // 重置繪製狀態
      isDrawing = false;
      editMode = 'select';
      updateEditModeButtons();
      drawCanvas();
    }
  });
  
  // 鼠標離開畫布時重置
  canvas.addEventListener('mouseleave', function() {
    if (isDrawing) {
      isDrawing = false;
      if (editMode === 'create') {
        editMode = 'select';
        updateEditModeButtons();
      }
      drawCanvas();
    }
  });
  
  // 檢查點擊的區域或調整控制點
  function checkForAreaOrHandle(x, y) {
    // 首先檢查是否點擊了調整控制點
    if (selectedAreaIndex >= 0) {
      const area = richMenuData.areas[selectedAreaIndex];
      const bounds = area.bounds;
      
      // 檢查各個控制點 - 使用整數處理
      const handleSize = ensureInt(10);
      
      // 左上角
      if (Math.abs(bounds.x - x) < handleSize && Math.abs(bounds.y - y) < handleSize) {
        editMode = 'resize';
        resizeHandle = 'nw';
        isDrawing = true;
        return;
      }
      
      // 右上角
      if (Math.abs(bounds.x + bounds.width - x) < handleSize && Math.abs(bounds.y - y) < handleSize) {
        editMode = 'resize';
        resizeHandle = 'ne';
        isDrawing = true;
        return;
      }
      
      // 左下角
      if (Math.abs(bounds.x - x) < handleSize && Math.abs(bounds.y + bounds.height - y) < handleSize) {
        editMode = 'resize';
        resizeHandle = 'sw';
        isDrawing = true;
        return;
      }
      
      // 右下角
      if (Math.abs(bounds.x + bounds.width - x) < handleSize && Math.abs(bounds.y + bounds.height - y) < handleSize) {
        editMode = 'resize';
        resizeHandle = 'se';
        isDrawing = true;
        return;
      }
    }
    
    // 檢查是否點擊了某個區域
    let found = false;
    for (let i = richMenuData.areas.length - 1; i >= 0; i--) {
      const area = richMenuData.areas[i];
      if (x >= area.bounds.x && 
          x <= area.bounds.x + area.bounds.width &&
          y >= area.bounds.y && 
          y <= area.bounds.y + area.bounds.height) {
        selectedAreaIndex = i;
        found = true;
        
        // 設置拖動模式和偏移量
        editMode = 'move';
        isDrawing = true;
        dragOffsetX = ensureInt(x - area.bounds.x);
        dragOffsetY = ensureInt(y - area.bounds.y);
        break;
      }
    }
    
    if (!found) {
      selectedAreaIndex = -1;
    }
    
    drawCanvas();
    updateAreaProperties();
  }
  
  // 更新鼠標指針樣式
  function updateCursorStyle(x, y) {
    if (editMode === 'create') {
      canvas.style.cursor = 'crosshair';
      return;
    }
    
    if (selectedAreaIndex >= 0) {
      const area = richMenuData.areas[selectedAreaIndex];
      const bounds = area.bounds;
      const handleSize = ensureInt(10);
      
      // 檢查是否在控制點上
      if (Math.abs(bounds.x - x) < handleSize && Math.abs(bounds.y - y) < handleSize ||
          Math.abs(bounds.x + bounds.width - x) < handleSize && Math.abs(bounds.y + bounds.height - y) < handleSize) {
        canvas.style.cursor = 'nwse-resize';
        return;
      }
      
      if (Math.abs(bounds.x + bounds.width - x) < handleSize && Math.abs(bounds.y - y) < handleSize ||
          Math.abs(bounds.x - x) < handleSize && Math.abs(bounds.y + bounds.height - y) < handleSize) {
        canvas.style.cursor = 'nesw-resize';
        return;
      }
      
      // 檢查是否在選中區域內
      if (x >= bounds.x && x <= bounds.x + bounds.width &&
          y >= bounds.y && y <= bounds.y + bounds.height) {
        canvas.style.cursor = 'move';
        return;
      }
    }
    
    // 檢查是否在任何區域內
    for (let i = richMenuData.areas.length - 1; i >= 0; i--) {
      const area = richMenuData.areas[i];
      if (x >= area.bounds.x && 
          x <= area.bounds.x + area.bounds.width &&
          y >= area.bounds.y && 
          y <= area.bounds.y + area.bounds.height) {
        canvas.style.cursor = 'pointer';
        return;
      }
    }
    
    canvas.style.cursor = 'default';
  }
  
  // 更新編輯模式按鈕狀態
  function updateEditModeButtons() {
    document.getElementById('mode-select').classList.toggle('active', editMode === 'select');
    document.getElementById('mode-create').classList.toggle('active', editMode === 'create');
  }
  
  // 繪製正在創建的區域
  function drawCurrentArea() {
    if (isDrawing && editMode === 'create') {
      const x = ensureInt(Math.min(startX, currentX));
      const y = ensureInt(Math.min(startY, currentY));
      const width = ensureInt(Math.abs(currentX - startX));
      const height = ensureInt(Math.abs(currentY - startY));
      
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x, y, width, height);
      ctx.setLineDash([]);
      
      // 顯示尺寸資訊
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(x + 5, y + height - 25, 80, 20);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px Arial';
      ctx.fillText(`${width} x ${height}`, x + 10, y + height - 10);
    }
  }
  
  // 修改繪製畫布函數
  function drawCanvas() {
    // 清除畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 繪製背景色
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 繪製上傳的圖片
    if (menuImage) {
      ctx.drawImage(menuImage, 0, 0, canvas.width, canvas.height);
    }
    
    // 繪製所有區域
    richMenuData.areas.forEach((area, index) => {
      const isSelected = index === selectedAreaIndex;
      ctx.strokeStyle = isSelected ? '#FF0000' : '#FFFFFF';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(area.bounds.x, area.bounds.y, area.bounds.width, area.bounds.height);
      
      // 繪製區域標籤
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(area.bounds.x, area.bounds.y, 30, 30);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial';
      ctx.fillText(index + 1, area.bounds.x + 10, area.bounds.y + 20);
      
      // 繪製動作類型提示
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      const typeText = area.action.type.substring(0, 3).toUpperCase();
      const textWidth = ctx.measureText(typeText).width;
      ctx.fillRect(area.bounds.x + area.bounds.width - textWidth - 20, area.bounds.y, textWidth + 20, 30);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(typeText, area.bounds.x + area.bounds.width - textWidth - 10, area.bounds.y + 20);
      
      // 如果區域被選中，顯示尺寸資訊
      if (isSelected) {
        drawResizeHandles(area.bounds);
        
        // 顯示區域尺寸
        const bounds = area.bounds;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(bounds.x + 35, bounds.y + 5, 100, 20);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px Arial';
        ctx.fillText(`${bounds.width} x ${bounds.height}`, bounds.x + 40, bounds.y + 20);
        
        // 顯示座標
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(bounds.x + 35, bounds.y + 30, 100, 20);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`X:${bounds.x} Y:${bounds.y}`, bounds.x + 40, bounds.y + 45);
      }
    });
    
    // 繪製當前正在創建的區域
    drawCurrentArea();
  }
  
  // 繪製調整大小的控制點
  function drawResizeHandles(bounds) {
    const handleSize = 8;
    ctx.fillStyle = '#FF0000';
    
    // 左上角
    ctx.fillRect(bounds.x - handleSize/2, bounds.y - handleSize/2, handleSize, handleSize);
    // 右上角
    ctx.fillRect(bounds.x + bounds.width - handleSize/2, bounds.y - handleSize/2, handleSize, handleSize);
    // 左下角
    ctx.fillRect(bounds.x - handleSize/2, bounds.y + bounds.height - handleSize/2, handleSize, handleSize);
    // 右下角
    ctx.fillRect(bounds.x + bounds.width - handleSize/2, bounds.y + bounds.height - handleSize/2, handleSize, handleSize);
    
    // 繪製引導線以更清晰顯示控制點
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    
    // 左上角引導線
    ctx.moveTo(bounds.x - 15, bounds.y);
    ctx.lineTo(bounds.x + 15, bounds.y);
    ctx.moveTo(bounds.x, bounds.y - 15);
    ctx.lineTo(bounds.x, bounds.y + 15);
    
    // 右上角引導線
    ctx.moveTo(bounds.x + bounds.width - 15, bounds.y);
    ctx.lineTo(bounds.x + bounds.width + 15, bounds.y);
    ctx.moveTo(bounds.x + bounds.width, bounds.y - 15);
    ctx.lineTo(bounds.x + bounds.width, bounds.y + 15);
    
    // 左下角引導線
    ctx.moveTo(bounds.x - 15, bounds.y + bounds.height);
    ctx.lineTo(bounds.x + 15, bounds.y + bounds.height);
    ctx.moveTo(bounds.x, bounds.y + bounds.height - 15);
    ctx.lineTo(bounds.x, bounds.y + bounds.height + 15);
    
    // 右下角引導線
    ctx.moveTo(bounds.x + bounds.width - 15, bounds.y + bounds.height);
    ctx.lineTo(bounds.x + bounds.width + 15, bounds.y + bounds.height);
    ctx.moveTo(bounds.x + bounds.width, bounds.y + bounds.height - 15);
    ctx.lineTo(bounds.x + bounds.width, bounds.y + bounds.height + 15);
    
    ctx.stroke();
    ctx.setLineDash([]);
  }
  
  // 建立Rich Menu按鈕
  document.getElementById('create-richmenu').addEventListener('click', async function() {
    if (!validateRichMenu()) {
      return;
    }
    
    try {
      // 顯示載入中訊息
      this.textContent = '處理中...';
      this.disabled = true;
      
      // 從儲存中取出Channel Token
      chrome.storage.sync.get(['channelToken'], async function(result) {
        if (!result.channelToken) {
          alert('請先在插件設定中設定您的Channel Access Token');
          document.getElementById('create-richmenu').textContent = '建立 Rich Menu';
          document.getElementById('create-richmenu').disabled = false;
          return;
        }
        
        try {
          // 1. 創建Rich Menu結構
          const response = await fetch('https://api.line.me/v2/bot/richmenu', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${result.channelToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(richMenuData)
          });
          
          if (!response.ok) {
            throw new Error(`API錯誤 ${response.status}: ${await response.text()}`);
          }
          
          const data = await response.json();
          const richMenuId = data.richMenuId;
          
          // 2. 上傳Rich Menu圖片
          const imageBlob = await fetch(menuImage.src).then(r => r.blob());
          
          // 從 Blob 獲取正確的 MIME 類型
          const imageType = imageBlob.type || 'image/png';
          
          // 使用正確的 API 域名: api-data.line.me 替代 api.line.me
          const imageUploadResponse = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${result.channelToken}`,
              'Content-Type': imageType
            },
            body: imageBlob
          });
          
          if (!imageUploadResponse.ok) {
            throw new Error(`上傳圖片失敗 ${imageUploadResponse.status}: ${await imageUploadResponse.text()}`);
          }
          
          alert(`Rich Menu 建立成功! ID: ${richMenuId}`);
          
          // 詢問是否設為預設Rich Menu
          if (confirm('是否要將此Rich Menu設為預設選單?')) {
            const defaultResponse = await fetch('https://api.line.me/v2/bot/user/all/richmenu/' + richMenuId, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${result.channelToken}`
              }
            });
            
            if (!defaultResponse.ok) {
              throw new Error(`設定預設Rich Menu失敗 ${defaultResponse.status}: ${await defaultResponse.text()}`);
            }
            
            alert('已設定為預設Rich Menu');
          }
          
        } catch (error) {
          console.error('建立Rich Menu失敗:', error);
          alert('建立Rich Menu失敗: ' + error.message);
        } finally {
          document.getElementById('create-richmenu').textContent = '建立 Rich Menu';
          document.getElementById('create-richmenu').disabled = false;
        }
      });
    } catch (error) {
      console.error('處理失敗:', error);
      alert('處理失敗: ' + error.message);
      this.textContent = '建立 Rich Menu';
      this.disabled = false;
    }
  });
  
  // 返回按鈕
  document.getElementById('back-to-home').addEventListener('click', function() {
    window.close();
  });
  
  // 更新區域屬性面板
  function updateAreaProperties() {
    const propertiesPanel = document.getElementById('area-properties');
    
    if (selectedAreaIndex < 0) {
      propertiesPanel.innerHTML = '<p>請選擇或新增一個區域</p>';
      return;
    }
    
    const area = richMenuData.areas[selectedAreaIndex];
    
    let html = `
      <div class="area-form">
        <div>
          <label>X 座標</label>
          <input type="number" id="area-x" value="${area.bounds.x}" min="0" max="${richMenuData.size.width - 1}" step="1">
        </div>
        <div>
          <label>Y 座標</label>
          <input type="number" id="area-y" value="${area.bounds.y}" min="0" max="${richMenuData.size.height - 1}" step="1">
        </div>
        <div>
          <label>寬度</label>
          <input type="number" id="area-width" value="${area.bounds.width}" min="1" max="${richMenuData.size.width}" step="1">
        </div>
        <div>
          <label>高度</label>
          <input type="number" id="area-height" value="${area.bounds.height}" min="1" max="${richMenuData.size.height}" step="1">
        </div>
      </div>
      
      <div class="action-section">
        <label>動作類型</label>
        <select id="action-type" class="action-type-select">
          <option value="message" ${area.action.type === 'message' ? 'selected' : ''}>發送訊息</option>
          <option value="uri" ${area.action.type === 'uri' ? 'selected' : ''}>開啟網址</option>
          <option value="postback" ${area.action.type === 'postback' ? 'selected' : ''}>回傳資料</option>
          <option value="datetimepicker" ${area.action.type === 'datetimepicker' ? 'selected' : ''}>日期時間選擇器</option>
        </select>
        
        <div id="action-properties"></div>
      </div>
    `;
    
    propertiesPanel.innerHTML = html;
    
    // 更新動作屬性
    updateActionProperties();
    
    // 監聽區域屬性變更
    document.getElementById('area-x').addEventListener('change', function(e) {
      richMenuData.areas[selectedAreaIndex].bounds.x = parseInt(e.target.value);
      drawCanvas();
    });
    
    document.getElementById('area-y').addEventListener('change', function(e) {
      richMenuData.areas[selectedAreaIndex].bounds.y = parseInt(e.target.value);
      drawCanvas();
    });
    
    document.getElementById('area-width').addEventListener('change', function(e) {
      richMenuData.areas[selectedAreaIndex].bounds.width = parseInt(e.target.value);
      drawCanvas();
    });
    
    document.getElementById('area-height').addEventListener('change', function(e) {
      richMenuData.areas[selectedAreaIndex].bounds.height = parseInt(e.target.value);
      drawCanvas();
    });
    
    // 監聽動作類型變更
    document.getElementById('action-type').addEventListener('change', function(e) {
      const newType = e.target.value;
      // 根據不同動作類型設定預設值
      switch (newType) {
        case 'message':
          richMenuData.areas[selectedAreaIndex].action = {
            type: 'message',
            text: area.action.text || '新訊息'
          };
          break;
        case 'uri':
          richMenuData.areas[selectedAreaIndex].action = {
            type: 'uri',
            uri: area.action.uri || 'https://'
          };
          break;
        case 'postback':
          richMenuData.areas[selectedAreaIndex].action = {
            type: 'postback',
            data: area.action.data || 'action=buy&itemid=123',
            displayText: area.action.displayText || '已選擇商品'
          };
          break;
        case 'datetimepicker':
          richMenuData.areas[selectedAreaIndex].action = {
            type: 'datetimepicker',
            data: area.action.data || 'storeId=12345',
            mode: area.action.mode || 'datetime'
          };
          break;
      }
      
      updateActionProperties();
    });
  }
  
  // 更新動作屬性
  function updateActionProperties() {
    if (selectedAreaIndex < 0) return;
    
    const area = richMenuData.areas[selectedAreaIndex];
    const actionType = area.action.type;
    const actionPropertiesDiv = document.getElementById('action-properties');
    
    let html = '';
    
    switch (actionType) {
      case 'message':
        html = `
          <div>
            <label>訊息文字</label>
            <input type="text" id="message-text" value="${area.action.text || ''}">
          </div>
        `;
        break;
      case 'uri':
        html = `
          <div>
            <label>網址</label>
            <input type="url" id="uri" value="${area.action.uri || ''}">
          </div>
        `;
        break;
      case 'postback':
        html = `
          <div>
            <label>回傳資料</label>
            <input type="text" id="postback-data" value="${area.action.data || ''}">
          </div>
          <div>
            <label>顯示文字</label>
            <input type="text" id="display-text" value="${area.action.displayText || ''}">
          </div>
        `;
        break;
      case 'datetimepicker':
        html = `
          <div>
            <label>回傳資料</label>
            <input type="text" id="datetime-data" value="${area.action.data || ''}">
          </div>
          <div>
            <label>選擇模式</label>
            <select id="datetime-mode">
              <option value="date" ${area.action.mode === 'date' ? 'selected' : ''}>日期</option>
              <option value="time" ${area.action.mode === 'time' ? 'selected' : ''}>時間</option>
              <option value="datetime" ${area.action.mode === 'datetime' ? 'selected' : ''}>日期時間</option>
            </select>
          </div>
        `;
        break;
    }
    
    actionPropertiesDiv.innerHTML = html;
    
    // 監聽動作屬性變更
    if (actionType === 'message') {
      document.getElementById('message-text').addEventListener('input', function(e) {
        richMenuData.areas[selectedAreaIndex].action.text = e.target.value;
      });
    } else if (actionType === 'uri') {
      document.getElementById('uri').addEventListener('input', function(e) {
        richMenuData.areas[selectedAreaIndex].action.uri = e.target.value;
      });
    } else if (actionType === 'postback') {
      document.getElementById('postback-data').addEventListener('input', function(e) {
        richMenuData.areas[selectedAreaIndex].action.data = e.target.value;
      });
      document.getElementById('display-text').addEventListener('input', function(e) {
        richMenuData.areas[selectedAreaIndex].action.displayText = e.target.value;
      });
    } else if (actionType === 'datetimepicker') {
      document.getElementById('datetime-data').addEventListener('input', function(e) {
        richMenuData.areas[selectedAreaIndex].action.data = e.target.value;
      });
      document.getElementById('datetime-mode').addEventListener('change', function(e) {
        richMenuData.areas[selectedAreaIndex].action.mode = e.target.value;
      });
    }
  }
  
  // 繪製畫布
  function drawCanvas() {
    // 清除畫布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 繪製背景色
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 繪製上傳的圖片
    if (menuImage) {
      ctx.drawImage(menuImage, 0, 0, canvas.width, canvas.height);
    }
    
    // 繪製所有區域
    richMenuData.areas.forEach((area, index) => {
      const isSelected = index === selectedAreaIndex;
      ctx.strokeStyle = isSelected ? '#FF0000' : '#FFFFFF';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(area.bounds.x, area.bounds.y, area.bounds.width, area.bounds.height);
      
      // 繪製區域標籤
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(area.bounds.x, area.bounds.y, 30, 30);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial';
      ctx.fillText(index + 1, area.bounds.x + 10, area.bounds.y + 20);
      
      // 繪製動作類型提示
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      const typeText = area.action.type.substring(0, 3).toUpperCase();
      const textWidth = ctx.measureText(typeText).width;
      ctx.fillRect(area.bounds.x + area.bounds.width - textWidth - 20, area.bounds.y, textWidth + 20, 30);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(typeText, area.bounds.x + area.bounds.width - textWidth - 10, area.bounds.y + 20);
      
      // 如果區域被選中，繪製控制點
      if (isSelected) {
        drawResizeHandles(area.bounds);
      }
    });
    
    // 繪製當前正在創建的區域
    drawCurrentArea();
  }
  
  // 繪製調整大小的控制點
  function drawResizeHandles(bounds) {
    const handleSize = 8;
    ctx.fillStyle = '#FF0000';
    
    // 左上角
    ctx.fillRect(bounds.x - handleSize/2, bounds.y - handleSize/2, handleSize, handleSize);
    // 右上角
    ctx.fillRect(bounds.x + bounds.width - handleSize/2, bounds.y - handleSize/2, handleSize, handleSize);
    // 左下角
    ctx.fillRect(bounds.x - handleSize/2, bounds.y + bounds.height - handleSize/2, handleSize, handleSize);
    // 右下角
    ctx.fillRect(bounds.x + bounds.width - handleSize/2, bounds.y + bounds.height - handleSize/2, handleSize, handleSize);
  }
  
  // 更新預覽
  function updatePreview() {
    const previewImage = document.getElementById('preview-image');
    const previewChatBar = document.getElementById('preview-chat-bar');
    const jsonOutput = document.getElementById('json-output');
    const buttonFunctionsList = document.getElementById('button-functions-list');
    
    // 更新預覽圖片
    if (menuImage) {
      previewImage.src = menuImage.src;
      
      // 等待圖片載入後再繪製 Canvas
      previewImage.onload = function() {
        drawPreviewCanvas();
      };
    }
    
    // 更新聊天欄預覽
    previewChatBar.textContent = richMenuData.chatBarText || '選單';
    
    // 更新JSON預覽
    const jsonData = JSON.stringify(richMenuData, null, 2);
    jsonOutput.textContent = jsonData;
    
    // 更新按鈕功能列表
    updateButtonFunctionsList();
    
    // 初始化預覽 Canvas 的事件處理
    initPreviewCanvasEvents();
  }
  
  // 繪製預覽 Canvas
  function drawPreviewCanvas() {
    const previewCanvas = document.getElementById('preview-canvas');
    const previewImage = document.getElementById('preview-image');
    
    // 設置 Canvas 尺寸與圖片一致
    previewCanvas.width = previewImage.clientWidth;
    previewCanvas.height = previewImage.clientHeight;
    
    const ctx = previewCanvas.getContext('2d');
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    
    // 計算縮放比例
    const scaleX = previewCanvas.width / richMenuData.size.width;
    const scaleY = previewCanvas.height / richMenuData.size.height;
    
    // 繪製所有區域
    richMenuData.areas.forEach((area, index) => {
      const scaledX = area.bounds.x * scaleX;
      const scaledY = area.bounds.y * scaleY;
      const scaledWidth = area.bounds.width * scaleX;
      const scaledHeight = area.bounds.height * scaleY;
      
      // 繪製區域邊框
      ctx.strokeStyle = '#FF0000';
      ctx.lineWidth = 2;
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);
      
      // 繪製區域編號
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(scaledX, scaledY, 30, 30);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '16px Arial';
      ctx.fillText(index + 1, scaledX + 10, scaledY + 20);
      
      // 繪製動作類型提示
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      const typeText = getActionTypeDisplay(area.action.type);
      const textWidth = ctx.measureText(typeText).width;
      ctx.fillRect(scaledX + scaledWidth - textWidth - 20, scaledY, textWidth + 20, 30);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(typeText, scaledX + scaledWidth - textWidth - 10, scaledY + 20);
    });
  }
  
  // 獲取動作類型顯示文字
  function getActionTypeDisplay(actionType) {
    switch(actionType) {
      case 'message': return 'MSG';
      case 'uri': return 'URL';
      case 'postback': return 'PB';
      case 'datetimepicker': return 'DT';
      default: return actionType.substring(0, 3).toUpperCase();
    }
  }
  
  // 更新按鈕功能列表
  function updateButtonFunctionsList() {
    const buttonFunctionsList = document.getElementById('button-functions-list');
    buttonFunctionsList.innerHTML = '';
    
    if (richMenuData.areas.length === 0) {
      buttonFunctionsList.innerHTML = '<p>尚未設定任何按鈕</p>';
      return;
    }
    
    richMenuData.areas.forEach((area, index) => {
      const functionItem = document.createElement('div');
      functionItem.className = 'function-item';
      
      // 創建按鈕編號
      const functionNumber = document.createElement('div');
      functionNumber.className = 'function-number';
      functionNumber.textContent = index + 1;
      
      // 創建功能詳情
      const functionDetails = document.createElement('div');
      functionDetails.className = 'function-details';
      
      // 顯示動作類型
      const functionType = document.createElement('div');
      functionType.className = 'function-type';
      functionType.textContent = getActionTypeFullName(area.action.type);
      
      // 顯示詳細說明
      const functionDescription = document.createElement('div');
      functionDescription.className = 'function-description';
      functionDescription.innerHTML = getActionDescription(area.action);
      
      // 組裝功能項目
      functionDetails.appendChild(functionType);
      functionDetails.appendChild(functionDescription);
      functionItem.appendChild(functionNumber);
      functionItem.appendChild(functionDetails);
      
      buttonFunctionsList.appendChild(functionItem);
    });
  }
  
  // 獲取動作類型全名
  function getActionTypeFullName(actionType) {
    switch(actionType) {
      case 'message': return '發送訊息';
      case 'uri': return '開啟網址';
      case 'postback': return '回傳資料';
      case 'datetimepicker': return '日期時間選擇器';
      default: return actionType;
    }
  }
  
  // 獲取動作詳細說明
  function getActionDescription(action) {
    switch(action.type) {
      case 'message':
        return `發送文字: "${action.text}"`;
      case 'uri':
        return `開啟網址: <a href="${action.uri}" target="_blank">${action.uri}</a>`;
      case 'postback':
        return `回傳資料: ${action.data}${action.displayText ? `<br>顯示文字: "${action.displayText}"` : ''}`;
      case 'datetimepicker':
        return `回傳資料: ${action.data}<br>模式: ${getDatetimePickerModeText(action.mode)}`;
      default:
        return JSON.stringify(action);
    }
  }
  
  // 獲取日期時間選擇器模式文字
  function getDatetimePickerModeText(mode) {
    switch(mode) {
      case 'date': return '日期';
      case 'time': return '時間';
      case 'datetime': return '日期時間';
      default: return mode;
    }
  }
  
  // 初始化預覽 Canvas 的事件處理
  function initPreviewCanvasEvents() {
    const previewCanvas = document.getElementById('preview-canvas');
    const previewContainer = previewCanvas.parentElement;
    
    // 移除舊的 tooltip (如果存在)
    const oldTooltip = document.querySelector('.tooltip');
    if (oldTooltip) {
      oldTooltip.remove();
    }
    
    // 創建新的 tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.style.opacity = '0';
    previewContainer.appendChild(tooltip);
    
    // 鼠標移動事件
    previewCanvas.addEventListener('mousemove', function(e) {
      const rect = previewCanvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // 計算縮放比例
      const scaleX = previewCanvas.width / richMenuData.size.width;
      const scaleY = previewCanvas.height / richMenuData.size.height;
      
      // 檢查是否在任何區域內
      let isOverArea = false;
      
      richMenuData.areas.forEach((area, index) => {
        const scaledX = area.bounds.x * scaleX;
        const scaledY = area.bounds.y * scaleY;
        const scaledWidth = area.bounds.width * scaleX;
        const scaledHeight = area.bounds.height * scaleY;
        
        if (x >= scaledX && x <= scaledX + scaledWidth && 
            y >= scaledY && y <= scaledY + scaledHeight) {
          isOverArea = true;
          
          // 更新 tooltip 內容
          tooltip.innerHTML = `
            <div><strong>${getActionTypeFullName(area.action.type)}</strong></div>
            <div>${getActionDescription(area.action)}</div>
          `;
          
          // 定位 tooltip
          tooltip.style.left = `${e.clientX - rect.left + 10}px`;
          tooltip.style.top = `${e.clientY - rect.top + 10}px`;
          tooltip.style.opacity = '1';
        }
      });
      
      if (!isOverArea) {
        tooltip.style.opacity = '0';
      }
    });
    
    // 鼠標離開事件
    previewCanvas.addEventListener('mouseleave', function() {
      tooltip.style.opacity = '0';
    });
  }
  
  // 驗證Rich Menu資料
  function validateRichMenu() {
    // 檢查名稱
    if (!richMenuData.name) {
      alert('請輸入Rich Menu名稱');
      tabs[0].click();
      return false;
    }
    
    // 檢查聊天欄文字
    if (!richMenuData.chatBarText) {
      alert('請輸入聊天欄文字');
      tabs[0].click();
      return false;
    }
    
    // 檢查圖片
    if (!menuImage) {
      alert('請上傳Rich Menu圖片');
      tabs[0].click();
      return false;
    }
    
    // 檢查區域
    if (richMenuData.areas.length === 0) {
      alert('請至少新增一個區域');
      tabs[1].click();
      return false;
    }
    
    // 檢查區域是否有重疊
    for (let i = 0; i < richMenuData.areas.length; i++) {
      const area1 = richMenuData.areas[i];
      for (let j = i + 1; j < richMenuData.areas.length; j++) {
        const area2 = richMenuData.areas[j];
        if (isOverlapping(area1.bounds, area2.bounds)) {
          alert(`區域 ${i+1} 和區域 ${j+1} 有重疊`);
          tabs[1].click();
          return false;
        }
      }
    }
    
    return true;
  }
  
  // 檢查兩個區域是否重疊
  function isOverlapping(bounds1, bounds2) {
    return !(
      bounds1.x + bounds1.width <= bounds2.x ||
      bounds2.x + bounds2.width <= bounds1.x ||
      bounds1.y + bounds1.height <= bounds2.y ||
      bounds2.y + bounds2.height <= bounds1.y
    );
  }
});
