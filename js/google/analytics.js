// ================== analytics.js ==================
// Google Analytics 4 事件推送封裝模組與全域行為追蹤
// 依賴：無（僅使用 window.dataLayer）
// ==================================================
/**
 * 推送 GA4 電商事件
 * @param {string} eventName - GA4 標準電商事件名稱（如 view_item、add_to_cart、purchase）
 * @param {Object} params - 事件參數
 * @param {string} [params.currency='TWD'] - 幣別
 * @param {number} [params.value] - 事件總價值
 * @param {Array} [params.items] - 商品陣列
 * @param {Object} [params.extra] - 其他自訂參數（如 transaction_id、coupon）
 */
function pushEcommerceEvent(eventName, params = {}) {
  window.dataLayer = window.dataLayer || [];

  const { currency = 'TWD', value, items, extra = {} } = params;

  // 清空前一次的 ecommerce 資料，防止跨事件污染
  window.dataLayer.push({ ecommerce: null });

  const ecommerce = { currency };

  if (value !== undefined) ecommerce.value = Number(value);
  if (items && Array.isArray(items)) ecommerce.items = items;

  // 合併自訂參數（transaction_id、coupon 等）
  Object.assign(ecommerce, extra);

  window.dataLayer.push({
    event: eventName,
    ecommerce
  });
}

/**
 * 推送 GA4 自訂事件（非電商）
 * @param {string} eventName - 事件名稱
 * @param {Object} [params={}] - 事件參數鍵值對
 */
function pushCustomEvent(eventName, params = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...params
  });
}

// 掛載到 window，供各模組直接呼叫
window.pushEcommerceEvent = pushEcommerceEvent;
window.pushCustomEvent = pushCustomEvent;

// ==================== 全域行為追蹤 ====================

// ---------- 1. 全域點擊追蹤（事件委託）----------
// 使用 document 層級監聽，動態插入的元素也能捕捉（GTM 本身也是這樣做的）
// [reference:0]

let lastClickTime = 0;
const CLICK_THROTTLE_MS = 300; // 防止快速連點造成事件氾濫

document.addEventListener('click', function (e) {
  const now = Date.now();
  if (now - lastClickTime < CLICK_THROTTLE_MS) return;
  lastClickTime = now;

  const el = e.target.closest('button, a, [role="button"], input[type="submit"], input[type="button"], .clickable');
  if (!el) return;

  // 排除 GTM 自身的 iframe / 隱藏元素
  if (el.tagName === 'IFRAME' || el.offsetParent === null) return;

  const tag = el.tagName.toLowerCase();
  const text = (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 100);
  const href = el.getAttribute('href') || '';
  const id = el.id || '';
  const className = typeof el.className === 'string' ? el.className.split(' ').slice(0, 3).join(' ') : '';

  pushCustomEvent('global_click', {
    click_tag: tag,
    click_text: text,
    click_id: id,
    click_class: className,
    click_href: href,
    click_page: window.location.pathname + window.location.search
  });
}, true); // 使用捕獲階段，避免 stopPropagation 阻擋[reference:1]


// ---------- 2. 捲動深度追蹤（25/50/75/100% 里程碑）----------
// 只在每個頁面週期內各觸發一次，SPA 切換頁面時重置[reference:2][reference:3]

const scrollMilestones = [25, 50, 75, 100];
let reachedMilestones = new Set();
let scrollTicking = false;

function resetScrollTracking() {
  reachedMilestones = new Set();
  // 若切換頁面後內容不足一屏，不應誤觸
  scrollTicking = false;
}

function getScrollPercent() {
  const doc = document.documentElement;
  const scrollTop = window.scrollY || doc.scrollTop;
  const scrollHeight = doc.scrollHeight - doc.clientHeight;
  if (scrollHeight <= 0) return 100; // 內容不滿一屏視為 100%
  return Math.min(100, Math.round((scrollTop / scrollHeight) * 100));
}

function checkScrollDepth() {
  const percent = getScrollPercent();
  for (const milestone of scrollMilestones) {
    if (percent >= milestone && !reachedMilestones.has(milestone)) {
      reachedMilestones.add(milestone);
      pushCustomEvent('scroll_depth', {
        scroll_percent: milestone,
        page_path: window.location.pathname + window.location.search
      });
    }
  }
  scrollTicking = false;
}

window.addEventListener('scroll', function () {
  if (!scrollTicking) {
    window.requestAnimationFrame(checkScrollDepth);
    scrollTicking = true;
  }
}, { passive: true }); // 使用 passive 提升滾動效能[reference:4]


// ---------- 3. JS 錯誤偵測 ----------
// GTM 內建的「JavaScript 錯誤」觸發器依賴 window.onerror，
// 但若被框架或第三方 SDK 攔截可能不會觸發，手動推送更可靠[reference:5]
// 推送格式採用 GTM 認可的 gtm.pageError 事件結構[reference:6]

window.addEventListener('error', function (event) {
  // 過濾資源載入錯誤（img/script/css 載入失敗），只追蹤 JS 執行錯誤
  if (event.target && event.target !== window) return;

  pushCustomEvent('gtm.pageError', {
    'gtm.errorMessage': event.message || 'Unknown error',
    'gtm.errorUrl': event.filename || window.location.href,
    'gtm.errorLineNumber': event.lineno || 0,
    'gtm.errorColumn': event.colno || 0,
    'gtm.errorStack': event.error?.stack?.slice(0, 500) || ''
  });
});

// 捕捉未被 catch 的 Promise rejection（async/await 錯誤不會觸發 error 事件）
window.addEventListener('unhandledrejection', function (event) {
  const reason = event.reason;
  const message = reason instanceof Error ? reason.message : String(reason);

  pushCustomEvent('gtm.pageError', {
    'gtm.errorMessage': message.slice(0, 500),
    'gtm.errorUrl': window.location.href,
    'gtm.errorLineNumber': 0,
    'gtm.errorColumn': 0,
    'gtm.errorStack': (reason instanceof Error ? reason.stack : '').slice(0, 500) || ''
  });
});


// ---------- 4. SPA 頁面切換時重置捲動狀態 ----------
// 監聽 navigation.js 的 pushState / popstate
// 若不重置，第二個頁面可能一載入就誤判為「已滾動 100%」

const originalPushState = history.pushState;
history.pushState = function () {
  originalPushState.apply(this, arguments);
  resetScrollTracking();
  // 延遲檢查，等頁面內容渲染後再判斷是否已達門檻
  setTimeout(checkScrollDepth, 500);
};

window.addEventListener('popstate', function () {
  resetScrollTracking();
  setTimeout(checkScrollDepth, 500);
});

console.log('📊 GA4 事件模組已載入');
