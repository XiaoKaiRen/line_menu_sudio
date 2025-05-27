> **注意**：本文件使用 Claude 3.7 Sonnet 輔助撰寫。此工具尚未完整測試，使用時請留意可能存在的問題。

# LINE Rich Menu 工具

![LINE Rich Menu Tool](images/icon128.png)

## 專案介紹

LINE Rich Menu 工具是一個Chrome擴充功能，提供簡易直覺的視覺化介面，協助開發者輕鬆建立、編輯及管理LINE官方訊息平台的Rich Menu選單。透過此工具，您可以省去手動編寫JSON結構和處理複雜API呼叫的繁瑣過程。

## 功能特色

- 📝 **直覺式視覺編輯器**：透過拖拉方式建立、調整選單區域
- 📱 **即時預覽功能**：即時查看Rich Menu在手機上的呈現效果
- 🔄 **多種動作類型支援**：完整支援LINE官方提供的所有動作類型
  - 發送訊息
  - 開啟網址
  - 回傳資料
  - 日期時間選擇器
- 📊 **完整的Rich Menu管理功能**：
  - 列出所有已建立的Rich Menu
  - 上傳或更新Rich Menu圖片
  - 設定為預設選單
  - 綁定選單給特定用戶
  - 刪除不需要的Rich Menu

## 安裝說明

### 開發者安裝
1. 將此專案clone到本地：
   ```
   git clone https://github.com/yourusername/line_richmenu_ctool.git
   ```
2. 在Chrome瀏覽器中開啟擴充功能管理頁面 (chrome://extensions/)
3. 開啟右上角的「開發人員模式」
4. 點擊「載入未封裝項目」按鈕
5. 選擇此專案的根目錄

### 一般使用者安裝
1. 從Chrome Web Store下載安裝本擴充功能 (待發布)
2. 點擊Chrome工具列中的擴充功能圖示開始使用

## 使用方法

### 設定Channel Access Token
1. 從LINE Developers Console取得Channel Access Token
   - 登入 [LINE Developers Console](https://developers.line.biz/console/)
   - 選擇您的Provider和Channel
   - 在「Basic settings」中建立長期或短期的Channel Access Token
2. 在擴充功能中點擊工具列的LINE Rich Menu Tool圖示
3. 在設定區域中輸入您的Channel Access Token並儲存

### 建立Rich Menu
1. 點擊「建立Rich Menu」按鈕
2. 在「基本設定」頁籤中：
   - 輸入Rich Menu名稱和聊天欄文字
   - 選擇適合的尺寸規格
   - 上傳Rich Menu圖片
3. 切換到「區域設定」頁籤：
   - 使用拉框模式建立互動區域
   - 或點擊「新增區域」按鈕建立預設區域
   - 設定每個區域的動作類型與參數
4. 在「預覽」頁籤中：
   - 檢視最終效果
   - 確認每個按鈕的功能
   - 查看JSON結構
5. 點擊「建立Rich Menu」按鈕將設定部署到LINE

### 管理Rich Menu
1. 在主畫面點擊「查看Rich Menu」按鈕
2. 在列表中查看所有已建立的Rich Menu
3. 對每個Rich Menu可執行以下操作：
   - 上傳圖片：為尚未有圖片的Rich Menu上傳圖片
   - 設為預設：將選定的Rich Menu設為預設選單
   - 綁定給用戶：將Rich Menu綁定到特定用戶
   - 刪除：移除不需要的Rich Menu

## 主要檔案結構

```
line_richmenu_ctool/
├── css/
│   └── styles.css          # 樣式表
├── js/
│   ├── popup.js            # 彈出窗口控制邏輯
│   ├── richMenuEditor.js   # Rich Menu編輯器核心邏輯
│   └── richMenuViewer.js   # Rich Menu管理器核心邏輯
├── images/                 # 圖示與其他圖片資源
├── popup.html              # 主彈出介面
├── richMenuEditor.html     # Rich Menu編輯器介面
├── richMenuViewer.html     # Rich Menu管理器介面
├── background.js           # 背景服務
├── manifest.json           # Chrome擴充功能配置
└── README.md               # 本文件
```

## 技術需求

- Chrome瀏覽器 88 或更新版本
- LINE Messaging API Channel Access Token
- 正常的網路連接以調用LINE API

## Rich Menu 規格限制

- 圖片格式：JPEG 或 PNG
- 圖片大小：最大 1MB
- 圖片尺寸：寬度 800-2500px，高度至少 250px
- 圖片比例：寬/高比率需大於 1.45
- 每個Rich Menu最多可設定 20 個區域
- 每個LINE Official Account最多可建立 1000 個Rich Menu

## 注意事項

- 請妥善保管您的Channel Access Token，勿分享給未經授權的人員
- 建議使用LINE官方建議的標準尺寸：
  - 全尺寸：2500 x 1686px
  - 半尺寸：2500 x 843px
- 刪除Rich Menu操作無法撤銷，請謹慎操作

## 待優化/未實現功能

目前已知問題：
1. **建立Rich Menu 上傳圖片未檢測**：
    - 未增加圖片格式與尺寸的即時檢測功能，確保上傳的圖片符合LINE Rich Menu的規格限制。
    - 提供圖片壓縮建議，幫助使用者優化圖片大小以符合1MB的限制。
2. **處理Rich Menu建立成功但圖片上傳失敗**：
    - 增加錯誤提示，提醒使用者圖片上傳失敗的原因（如格式或大小不符合規範）。
3. **編輯器拉框功能若超出範圍會跳掉**：
    - 修正拉框功能的邏輯，確保使用者無法將框拉出可編輯範圍。
4. **最終刪除確認頁面需增加遮罩效果**：  
    - 在進行刪除操作時，頁面應顯示半透明遮罩，防止使用者操作其他區域。  
    - 確保使用者專注於確認刪除的彈窗，避免誤操作。


以下是未來版本計劃添加或改進的功能：

1. ~~**匯入/匯出功能**：支援將 Rich Menu 設計匯出為 JSON 或專案檔案，以及從這些檔案匯入~~ <- 已完成
2. **範本庫**：提供常用的 Rich Menu 設計範本，方便快速建立新的 Rich Menu
3. **編輯已有 Rich Menu**：目前 LINE API 不支援直接修改現有 Rich Menu，未來將探索可行的替代方案
4. **多帳號管理**：在同一介面中管理多個 LINE Official Account 的 Rich Menu
5. **多語言支援**：界面支援更多語言

如果您有其他功能需求或建議，歡迎通過 GitHub Issues 提出。

## 相關資源

- [LINE Developers - Rich Menu文檔](https://developers.line.biz/en/docs/messaging-api/using-rich-menus/)
- [LINE Messaging API參考文件](https://developers.line.biz/en/reference/messaging-api/)
- [LINE Official Account Manager](https://manager.line.biz/)

## 授權資訊

本專案採用MIT授權條款。

---

## 更新日誌

### 版本 1.0
- 初始版本發布
- 實現基本的Rich Menu編輯功能
- 實現Rich Menu管理功能
