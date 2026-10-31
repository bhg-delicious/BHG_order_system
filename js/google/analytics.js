// ================== analytics.js ==================
// Google Analytics 4 事件推送封裝模組
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

console.log('📊 GA4 事件模組已載入');
