# 大家政便當廠 — 儲值點餐系統

> 校園便當儲值與線上訂餐系統。學生以學號與密碼登入，即時查詢餘額、於每日點餐時段線上點餐、檢視交易紀錄；管理員可設定當日餐廳、執行儲值與扣款、管理訂單與使用者，並檢視營運數據分析。

[![Lint](https://github.com/bhg-delicious/BHG_order_system/actions/workflows/lint.yml/badge.svg)](https://github.com/bhg-delicious/BHG_order_system/actions/workflows/lint.yml)
[![PWA](https://img.shields.io/badge/PWA-installable-brightgreen)](https://web.dev/progressive-web-apps/)
[![License: Private](https://img.shields.io/badge/license-Private-red)](#授權)

---

## 目錄

- [功能特性](#功能特性)
- [技術堆疊](#技術堆疊)
- [專案結構](#專案結構)
- [快速開始](#快速開始)
- [架構說明](#架構說明)
- [分析與可觀測性](#分析與可觀測性)
- [SEO 與 AI 可發現性](#seo-與-ai-可發現性)
- [安全與合規](#安全與合規)
- [部署](#部署)
- [貢獻指南](#貢獻指南)
- [授權](#授權)
- [聯絡](#聯絡)

---

## 功能特性

### 學生端

- **學號登入**：以 6 位學號與姓名註冊，日後以學號與密碼登入，不需電子郵件。
- **餘額查詢**：登入後即時顯示帳戶餘額與累計消費。
- **線上點餐**：每日 08:00–10:00 開放點餐，選擇品項與數量後送出訂單。
- **交易紀錄**：分頁載入，每頁 5 筆，可檢視儲值與扣款明細。
- **歷史訂單**：以日期區間查詢過往訂單與訂單明細。
- **密碼管理**：支援自助修改密碼；忘記密碼請聯繫管理員。
- **PWA 安裝**：可安裝至主畫面，支援離線瀏覽。
- **推播通知**：管理員設定當日餐廳後，透過 OneSignal 推播通知訂閱者。

### 管理端

- **當日餐廳設定**：08:00–12:00 開放設定，設定後自動觸發推播。
- **儲值與扣款**：支援單筆儲值、單筆扣款與批次扣款。
- **訂單查詢**：以日期區間查詢訂單明細。
- **使用者管理**：新增、修改、變更學號並同步歷史交易與訂單資料。
- **營運分析**：總儲值、總消費、系統總餘額、平均餘額、消費排名與交易趨勢。
- **利息系統**：針對負餘額帳戶的半自動計息，每月手動執行至多一次，月利率 1.33%。

---

## 技術堆疊

| 分類 | 技術 |
|---|---|
| **前端架構** | 原生 JavaScript（ES Modules）、HTML5、CSS3，無框架 |
| **路由** | `history.pushState` + `?page=` 查詢參數的 SPA 路由 |
| **身份驗證** | Supabase Auth（Email/Password，以 `學號@bhg.app` 作為識別） |
| **資料庫** | Supabase（PostgreSQL），啟用 Row Level Security（RLS） |
| **API 層** | 自建 `api.js` 封裝 Supabase RPC 與查詢 |
| **離線支援** | Service Worker（Network-First 策略）+ `offline.html` 備援 |
| **PWA** | `manifest.webmanifest`，支援安裝至主畫面 |
| **推播** | OneSignal Web Push |
| **行為分析** | Google Tag Manager + Google Analytics 4 |
| **程式碼品質** | ESLint（flat config）+ Prettier |
| **CI** | GitHub Actions（`.github/workflows/lint.yml`） |
| **部署** | GitHub Pages（含 `.nojekyll` 停用 Jekyll 處理） |

---

## 專案結構

```
BHG_order_system/
├── index.html                      # SPA 主入口，載入所有模組與 GTM/GA4
├── 404.html                        # 404 錯誤頁
├── offline.html                    # 離線備援頁（由 Service Worker 提供）
├── styles.css                      # 全站樣式
├── manifest.webmanifest            # PWA 資訊清單
├── service-worker.js               # Service Worker（Network-First 快取策略）
├── api.js                          # API 層，封裝 Supabase RPC 與查詢
├── eslint.config.js                # ESLint flat config
├── .prettierrc                     # Prettier 設定
├── .prettierignore                 # Prettier 忽略清單
├── .nojekyll                       # 停用 GitHub Pages 的 Jekyll 處理
├── README.md                       # 本文件
├── sitemap.xml                     # 搜尋引擎索引清單
├── llms.txt                        # 站點導覽（給 LLM 閱讀）
├──
├── pages/                          # HTML 頁面片段（由 navigation.js fetch 載入）
│   ├── admin/
│   │   ├── analytics.html
│   │   ├── finance.html
│   │   ├── operations.html
│   │   └── users.html
│   └── user/
│       ├── account.html
│       ├── home.html
│       └── order.html
│
├── js/
│   ├── core/                       # 核心模組（所有頁面共用）
│   │   ├── core.js                 # 應用初始化
│   │   ├── navigation.js           # SPA 路由與頁面切換
│   │   ├── preload.js              # 資源預載入
│   │   ├── state.js                # 全域狀態管理
│   │   ├── supabase.js             # Supabase client 初始化
│   │   ├── time.js                 # 時間處理工具
│   │   ├── ui.js                   # UI 輔助函式
│   │   └── common.js               # 共用工具
│   │
│   ├── user/                       # 學生端業務邏輯
│   │   ├── register.js             # 註冊與登入
│   │   ├── account.js              # 帳號頁面
│   │   ├── changepwd.js            # 修改密碼
│   │   ├── meal.js                 # 菜單載入
│   │   ├── meal-order.js           # 訂餐流程
│   │   └── query.js                # 交易與訂單查詢
│   │
│   ├── admin/                      # 管理端業務邏輯
│   │   ├── auth.js                 # 管理員登入
│   │   ├── analytics.js            # 營運分析
│   │   ├── deduct.js               # 扣款
│   │   ├── orders.js               # 訂單查詢
│   │   ├── query.js                # 通用查詢
│   │   ├── recharge.js             # 儲值
│   │   ├── restaurant.js           # 餐廳設定
│   │   └── users.js                # 使用者管理
│   │
│   ├── google/                     # Google 服務整合
│   │   ├── analytics.js            # GA4 事件推送封裝（pushEcommerceEvent / pushCustomEvent）
│   │   └── gtag.js                 # GTM / gtag 載入
│   │
│   └── shared/                     # 前後端共用模組
│       ├── notify.js               # 通知與 Toast
│       └── tutorial.js             # 新手教學
│
├── onesignal/                      # OneSignal Service Worker
│   ├── OneSignalSDKWorker.js
│   └── OneSignalSDKUpdaterWorker.js
│
├── assets/
│   ├── rss.xml                     # 系統公告 RSS
│   └── legal/
│       ├── privacy_policy.txt      # 隱私權政策
│       └── terms_of_service.txt    # 服務條款
│
├── .well-known/
│   ├── ai-catalog.json             # AI 資源發現清單（ARD）
│   └── security.txt                # RFC 9116 漏洞揭露政策
│
└── .github/
    └── workflows/
        └── lint.yml                # ESLint + Prettier CI
```

---

## 快速開始

### 環境需求

- Node.js 18 以上（僅用於本機 lint，非執行必要）
- 現代瀏覽器（支援 ES Modules、Service Worker、`history.pushState`）
- Supabase 專案（需設定 Auth 與資料表）

### 本機開發

本專案為純靜態網站，無需建置流程。但由於使用了 ES Modules 與 Service Worker，**必須透過 HTTP 伺服器提供，不能直接以 `file://` 開啟**。

```bash
# 使用 Python 內建 HTTP 伺服器
python3 -m http.server 8000

# 或使用 Node.js
npx serve .
```

開啟 `http://localhost:8000/` 即可。

### 設定 Supabase

1. 於 Supabase 建立專案，取得 `Project URL` 與 `anon public key`。
2. 在 `js/core/supabase.js` 中填入上述兩項設定。
3. 於 Supabase SQL Editor 中建立所需的資料表與 RPC 函式（詳見 Supabase 專案文件）。
4. 啟用 Row Level Security（RLS）並設定存取政策。

### 程式碼檢查

```bash
# 安裝依賴
npm install

# 執行 ESLint
npx eslint .

# 執行 Prettier 檢查
npx prettier --check .

# 自動修復
npx eslint . --fix
npx prettier --write .
```

CI 會在每次 push 至 `main` 分支時自動執行上述檢查（見 `.github/workflows/lint.yml`）。

---

## 架構說明

### SPA 路由

本專案採用**查詢參數路由**，而非 History API 的路徑路由：

```
https://bhg-delicious.github.io/BHG_order_system/?page=home
https://bhg-delicious.github.io/BHG_order_system/?page=order
https://bhg-delicious.github.io/BHG_order_system/?page=account
```

`js/core/navigation.js` 的 `navigateTo()` 會執行以下流程：

1. 透過 `fetch` 載入 `pages/user/*.html` 或 `pages/admin/*.html` 片段。
2. 將片段注入主容器的 `<div id="app">`。
3. 呼叫 `history.pushState` 更新 URL 的 `?page=` 參數。
4. 觸發對應頁面的初始化函式。

**為什麼不採用路徑路由？** GitHub Pages 不支援 SPA fallback（所有未知路徑預設回傳 `404.html`），因此採用查詢參數路由，避免部署環境的額外設定。

### 狀態管理

`js/core/state.js` 提供全域狀態容器 `AppState`，主要用於：

- 儲存當前登入使用者的學號（`currentStudentId`）
- 儲存管理員 session token
- 跨頁面共享的暫存資料（如購物車 `cart`）

### 身份驗證

- **學生**：註冊時以 `學號@bhg.app` 作為 Supabase Auth 的 Email，密碼以不可逆雜湊儲存。登入成功後，`AppState.setCurrentStudentId()` 記錄當前使用者。
- **管理員**：透過獨立的 `js/admin/auth.js` 登入流程，驗證成功後設定 `AppState.setAdmin()`。
- 所有權限驗證（包含 RLS）均由 Supabase 後端執行，前端僅負責 UI 呈現。

### 離線支援

`service-worker.js` 採用 **Network-First** 策略：

1. 優先嘗試從網路取得資源。
2. 成功時複製一份至快取（`bhg-cache-vX.X.X`）。
3. 失敗時回退至快取；若快取也無資料，導覽請求會回退至 `offline.html`。

**快取版本管理**：每次部署若修改了快取策略或關鍵資源，請遞增 `CACHE_NAME` 中的版本號（例如 `bhg-cache-v4.0.1` → `bhg-cache-v4.0.2`），Service Worker 的 `activate` 事件會自動清除舊版快取。

---

## 分析與可觀測性

本專案整合 Google Tag Manager（GTM）與 Google Analytics 4（GA4），所有事件推送集中於 `js/google/analytics.js`。

### 事件推送 API

```javascript
// 電商事件（自動清空前次 ecommerce 資料）
pushEcommerceEvent('purchase', {
  value: 120,
  items: [{ item_id: 'MEAL-001', item_name: '排骨便當', price: 120, quantity: 1 }],
  extra: { transaction_id: 'ORD-20261101-001' }
});

// 自訂事件（平鋪於 dataLayer 頂層）
pushCustomEvent('sign_up', {
  method: 'email',
  student_id: 'A12345'
});
```

### 追蹤事件一覽

| 事件 | 觸發時機 | 類型 |
|---|---|---|
| `view_item_list` | 載入菜單列表 | 電商 |
| `add_to_cart` | 加入餐點至購物車 | 電商 |
| `purchase` | 完成訂單／管理員儲值 | 電商 |
| `sign_up` / `login` | 學生註冊／登入 | 自訂 |
| `admin_login` | 管理員登入 | 自訂 |
| `deduct_success` | 管理員扣款成功 | 自訂 |
| `change_user_id` | 變更學號成功 | 自訂 |
| `global_click` | 全站點擊（事件委託） | 自訂 |
| `scroll_depth` | 捲動至 25/50/75/100% | 自訂 |
| `gtm.pageError` | JS 錯誤與未處理的 Promise rejection | 錯誤 |

### GTM 設定重點

- 於 GTM 後台停用 GA4 的「基於瀏覽器歷史記錄事件的頁面變更」，改以 GTM 的「歷史記錄更改」觸發器手動推送虛擬 `page_view`。
- 自訂參數（如 `student_id`、`amount`）需於 GA4 的「自訂定義」中註冊為事件範圍的自訂維度／指標，才能在報表中使用。
- 完整的 GTM／GA4 設定步驟與 DLV 命名規則，請參閱專案內部技術文件。

### JS 錯誤監控

`js/google/analytics.js` 監聽 `window.error` 與 `unhandledrejection`，並以 `gtm.pageError` 事件推送至 GTM，再由 GTM 轉送至 GA4 的 `exception` 事件。此機制不依賴 GTM 內建的錯誤觸發器，可避免被框架或第三方 SDK 攔截而失效。

---

## SEO 與 AI 可發現性

本專案同時針對傳統搜尋引擎與 AI 代理進行了可發現性優化：

| 檔案 | 路徑 | 用途 |
|---|---|---|
| `sitemap.xml` | 根目錄 | 搜尋引擎索引清單，涵蓋所有公開的 `?page=` 頁面與法律文件 |
| `llms.txt` | 根目錄 | 給 LLM 閱讀的站點導覽，說明核心頁面、管理功能與技術架構 |
| `ai-catalog.json` | `/.well-known/` | 遵循 ARD 規範的 AI 資源發現清單，列出 `llms.txt`、法律文件與 RSS |
| `security.txt` | `/.well-known/` | 遵循 RFC 9116 的漏洞揭露政策 |
| `rss.xml` | `assets/` | 系統公告與功能更新的 RSS feed |

### 結構化資料

`index.html` 的 `<head>` 中內嵌了 JSON-LD，包含以下 schema.org 實體：

- `Organization`：營運者資訊與聯絡窗口
- `WebSite`：網站層級中繼資料
- `SoftwareApplication`：應用程式功能、平台、版本等
- `FAQPage`：14 題常見問答，涵蓋註冊、儲值、點餐、個資與第三方服務

部署後建議使用 [Google Rich Results Test](https://search.google.com/test/rich-results) 驗證結構化資料是否正確解析。

---

## 安全與合規

### 資料安全

- **傳輸加密**：全站 HTTPS／TLS。
- **密碼儲存**：不可逆雜湊，系統人員無法還原明文密碼。
- **存取控制**：Supabase Row Level Security（RLS）於資料庫層限制存取範圍。
- **管理端驗證**：所有管理操作需通過 Supabase Auth 驗證，並留存操作日誌。
- **權限分級**：資料存取依角色（學生／管理員）分級授權。

### 法規遵循

- 依《個人資料保護法》第 8 條告知義務，於 [隱私權政策](assets/legal/privacy_policy.txt) 中明確說明搜集目的、類別、利用期間、地區、對象與方式。
- 依《消費者保護法》與《民法》相關規定，於 [服務條款](assets/legal/terms_of_service.txt) 中明定儲值、訂餐、交易與爭議處理規則。
- 未成年人使用本服務需經法定代理人同意。

### 漏洞揭露

若發現安全問題，請依 [security.txt](.well-known/security.txt) 中的聯絡方式通報。本專案目前不提供漏洞賞金計畫。

---

## 部署

### GitHub Pages（預設）

本專案透過 GitHub Pages 部署，`main` 分支的根目錄即為部署來源。

1. 將變更 push 至 `main` 分支。
2. GitHub Actions 會自動執行 ESLint + Prettier 檢查（見 `.github/workflows/lint.yml`）。
3. 檢查通過後，GitHub Pages 會自動部署最新版本。

**注意事項：**

- `.nojekyll` 檔案用於停用 Jekyll 處理，避免以底線開頭的目錄（如 `_worker.js`）被忽略。請勿刪除。
- 若部署於子路徑（例如 `/BHG_order_system/`），`sitemap.xml`、`llms.txt`、`ai-catalog.json`、`security.txt` 中的所有絕對 URL 需同步更新。
- `service-worker.js` 的快取版本號應於每次部署前遞增，以確保使用者取得最新資源。

### 更新 Service Worker

修改 `service-worker.js` 後，請執行以下步驟：

1. 遞增 `CACHE_NAME` 的版本號（例如 `bhg-cache-v4.0.1` → `bhg-cache-v4.0.2`）。
2. 部署後，使用者的瀏覽器會偵測到新版 Service Worker。
3. 舊版快取會於 `activate` 事件中自動清除。

若需強制所有使用者立即更新，可於主執行緒透過 `postMessage` 發送 `SKIP_WAITING` 指令。

---

## 貢獻指南

本專案為內部專案，目前不對外開放貢獻。若你為團隊成員，請遵循以下流程：

1. 從 `main` 分支建立功能分支（`feature/your-feature-name`）。
2. 提交前執行 `npx eslint .` 與 `npx prettier --check .`，確保通過 CI。
3. 建立 Pull Request，並於描述中說明變更內容與測試方式。
4. 至少一位團隊成員審核通過後合併。

### Commit Message 規範

建議採用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
feat: 新增批次扣款功能
fix: 修正離線頁面未正確快取的問題
docs: 更新 README 部署說明
style: 依 Prettier 格式化 analytics.js
refactor: 重構 navigation.js 的頁面切換邏輯
```

---

## 授權

本專案為私人專案，未經授權請勿複製、散布或用於商業用途。所有內容之著作權與智慧財產權歸屬於營運者。

---

## 聯絡

- **營運者**：大家政便當廠
- **Email**：bhg.delicious@gmail.com
- **安全通報**：請參閱 [security.txt](.well-known/security.txt)

---

<p align="center">
  <sub>Built with ❤️ for campus meal ordering</sub>
</p>
