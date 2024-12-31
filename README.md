
# Inventory System

## 簡介

Inventory System 是一個基於 Vue 3 和 TypeScript 的庫存管理系統，提供文件上傳、訂單檢查與匯出功能，旨在幫助用戶高效管理商品庫存和訂單狀態。

## 功能特性

- **Excel 文件匯入**：支援 Excel 檔案的上傳與轉換。
- **訂單搜尋**：可根據訂單編號和商品條碼進行快速搜尋。
- **狀態檢查**：檢查訂單是否完成，並提供可視化標註。
- **報表匯出**：
  - 支援 PDF 格式的訂單報表匯出。
  - 截圖功能以保存表格內容。
- **即時操作**：可實時更新訂單和商品的數量與確認狀態。

## 技術棧

- **前端框架**：Vue 3
- **語言**：TypeScript
- **UI 元件庫**：Element Plus
- **文件處理**：
  - 文件解析：`xlsx` 用於處理 Excel 文件。
  - 報表匯出：`jspdf` 和 `html2canvas` 用於生成 PDF 和圖片。
  - 文件保存：`file-saver` 用於下載文件。
- **樣式工具**：Tailwind CSS

## 專案結構

```plaintext
src/
├── assets/                  # 靜態資源 (圖片等)
├── components/              # Vue 組件
├── enum/                    # 枚舉常量
├── router/                  # 路由管理
├── utils/                   # 工具函數和類
├── views/                   # 頁面級組件
├── App.vue                  # 主應用組件
├── main.ts                  # 入口文件
└── tailwind.config.js       # Tailwind 配置文件
```

## 安裝與使用

### 環境需求

- **Node.js**：v18.19.1
- **npm**：10.8.1

### 安裝步驟

1. 克隆此專案：
   ```bash
   git clone https://github.com/tonys61311/inventory-system.git
   ```

2. 進入專案目錄：
   ```bash
   cd inventory-system
   ```

3. 安裝依賴：
   ```bash
   npm install
   ```

4. 啟動本地開發伺服器：
   ```bash
   npm run serve
   ```

5. 在瀏覽器中訪問 [http://localhost:8080](http://localhost:8080)。

### 編譯與打包

執行以下命令來生成生產環境的打包文件：
```bash
npm run build
```

## 使用範例

1. **匯入 Excel 檔案**：上傳包含訂單資訊的 Excel 文件。
2. **檢查訂單狀態**：使用訂單編號或條碼進行快速檢索和狀態更新。
3. **匯出報表**：將訂單內容匯出為 PDF 或截圖保存。

## 聯絡方式

如果您有任何疑問或建議，請聯繫：
- **作者**：Tony Lin.
- **GitHub**：[github.com/tonys61311](https://github.com/tonys61311)
