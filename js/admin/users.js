// ==================== users.js ====================
// 管理員用戶管理模組（更改學號 + 欠錢白名單）
// 依賴：supabase.js、state.js、ui.js、common.js、core.js
// ====================================================

// ============================================================
// 更改學號
// ============================================================

function confirmChangeUserId() {
  const oldUserId = document.getElementById('changeOldUserId').value.trim();
  const newUserId = document.getElementById('changeNewUserId').value.trim();

  if (!/^\d{6}$/.test(oldUserId)) {
    showMessageModal('❌ 輸入錯誤', '原學號必須是6位數字');
    return;
  }
  if (!/^\d{6}$/.test(newUserId)) {
    showMessageModal('❌ 輸入錯誤', '新學號必須是6位數字');
    return;
  }
  if (oldUserId === newUserId) {
    showMessageModal('⚠️ 提醒', '新學號不能與原學號相同');
    return;
  }

  showConfirmModal(
    '⚠️ 確認更改學號',
    `確定要將 ${oldUserId} 改為 ${newUserId} 嗎？\n\n` +
    `此操作會更新使用者資料、交易紀錄與訂單歷史。\n` +
    `此操作無法復原！`,
    function() { changeUserId(oldUserId, newUserId); }
  );
}

async function changeUserId(oldUserId, newUserId) {
  const resultDiv = document.getElementById('changeUserIdResult');
  const btn = document.querySelector('#page-admin-users .btn-warning');

  if (btn) setButtonLoading(btn, true);
  if (resultDiv) showConanLoading('changeUserIdResult', 'changeUserId');

  try {
    const sb = await initSupabase();

    const { data, error } = await sb.rpc('change_user_id', {
      p_old_user_id: oldUserId,
      p_new_user_id: newUserId
    });

    if (btn) setButtonLoading(btn, false);

    if (error) {
      if (resultDiv) resultDiv.innerHTML = `<div class="message error">❌ ${escapeHtml(error.message)}</div>`;
      return;
    }

    assertRpcSuccess(data, 'change_user_id');

    // 若被改的就是目前登入的學號，同步 AppState
    if (AppState.currentStudentId() === oldUserId) {
      AppState.setCurrentStudentId(newUserId);
    }

    let details = '';
    if (data.results) {
      details = '<ul style="margin-top: 10px; text-align: left;">';
      if (data.results.users) details += '<li>✓ 使用者資料已更新</li>';
      if (data.results.transactions) details += '<li>✓ 交易紀錄已更新</li>';
      if (data.results.orderDetails) details += '<li>✓ 訂單歷史已更新</li>';
      details += '</ul>';
    }

    if (resultDiv) {
      resultDiv.innerHTML = `<div class="message success">✅ ${escapeHtml(data.message)}${details}</div>`;
    }

    document.getElementById('changeOldUserId').value = '';
    document.getElementById('changeNewUserId').value = '';

    showMessageModal('✅ 成功', '學號更改成功');
  } catch (error) {
    if (btn) setButtonLoading(btn, false);
    console.error('更改學號失敗:', error);
    if (resultDiv) resultDiv.innerHTML = `<div class="message error">❌ ${escapeHtml(error.message)}</div>`;
  }
}

// ============================================================
// 欠錢白名單
// ============================================================

async function loadDebtWhitelist(event) {
  const btn = event?.currentTarget;
  if (btn) setButtonLoading(btn, true);

  const container = document.getElementById('dwDisplay');
  if (container) showConanLoading('dwDisplay', 'default');

  try {
    const sb = await initSupabase();
    const { data, error } = await sb.rpc('get_debt_whitelist_with_users');

    if (btn) setButtonLoading(btn, false);
    if (error) throw new Error(error.message);
    assertRpcSuccess(data, 'get_debt_whitelist_with_users');

    const list = data.list || [];

    if (list.length === 0) {
      if (container) container.innerHTML = '<div class="message info">白名單尚無資料</div>';
      return;
    }

    let html = `<p style="color: var(--gray); margin-bottom: 8px;">共 ${list.length} 人</p>`;
    html += '<div class="table-container"><table class="table">';
    html += '<thead><tr><th>學號</th><th>姓名</th><th>備註</th><th>加入時間</th><th>操作</th></tr></thead><tbody>';

    list.forEach(row => {
      const dateStr = row.created_at
        ? new Date(row.created_at).toLocaleDateString('zh-TW')
        : '—';

      html += `<tr>
        <td>${escapeHtml(row.user_id)}</td>
        <td>${escapeHtml(row.name || '（已刪除）')}</td>
        <td>${escapeHtml(row.note || '')}</td>
        <td style="font-size: 0.85rem; color: var(--gray);">${dateStr}</td>
        <td>
          <button class="btn btn-danger" style="padding: 2px 8px; font-size: 0.8rem;"
            onclick="removeDebtWhitelist('${escapeHtml(row.user_id)}')">移除</button>
        </td>
      </tr>`;
    });

    html += '</tbody></table></div>';
    if (container) container.innerHTML = html;

  } catch (err) {
    if (btn) setButtonLoading(btn, false);
    if (container) container.innerHTML = `<div class="message error">❌ ${escapeHtml(err.message)}</div>`;
  }
}

async function addDebtWhitelist(event) {
  if (event) event.preventDefault();

  const userId = document.getElementById('dwUserId').value.trim();
  const note = document.getElementById('dwNote').value.trim();
  const resultDiv = document.getElementById('dwResult');

  if (!/^\d{6}$/.test(userId)) {
    showMessageModal('❌ 錯誤', '學號必須是 6 位數字');
    return;
  }

  if (resultDiv) showConanLoading('dwResult', 'default');

  try {
    const sb = await initSupabase();
    const { data, error } = await sb.rpc('add_debt_whitelist', {
      p_user_id: userId,
      p_note: note || null
    });

    if (error) throw new Error(error.message);
    assertRpcSuccess(data, 'add_debt_whitelist');

    if (resultDiv) {
      resultDiv.innerHTML = `<div class="message success">
        ✅ ${escapeHtml(data.name)}（${escapeHtml(data.user_id)}）已加入白名單
      </div>`;
    }

    document.getElementById('dwUserId').value = '';
    document.getElementById('dwNote').value = '';

    loadDebtWhitelist();

  } catch (err) {
    if (resultDiv) {
      resultDiv.innerHTML = `<div class="message error">❌ ${escapeHtml(err.message)}</div>`;
    }
  }
}

async function removeDebtWhitelist(userId) {
  showConfirmModal(
    '⚠️ 確認移除',
    `確定要將 ${userId} 從欠錢白名單移除嗎？\n移除後該學生餘額不足時將無法點餐。`,
    async () => {
      const resultDiv = document.getElementById('dwResult');
      if (resultDiv) showConanLoading('dwResult', 'default');

      try {
        const sb = await initSupabase();
        const { data, error } = await sb.rpc('remove_debt_whitelist', {
          p_user_id: userId
        });

        if (error) throw new Error(error.message);
        assertRpcSuccess(data, 'remove_debt_whitelist');

        if (resultDiv) {
          resultDiv.innerHTML = `<div class="message success">✅ 已移除 ${escapeHtml(userId)}</div>`;
        }
        loadDebtWhitelist();

      } catch (err) {
        if (resultDiv) {
          resultDiv.innerHTML = `<div class="message error">❌ ${escapeHtml(err.message)}</div>`;
        }
      }
    }
  );
}

// ============================================================
// 頁面初始化
// ============================================================

function initAdminUsersPage() {
  // 更改學號
  const resultDiv = document.getElementById('changeUserIdResult');
  if (resultDiv) resultDiv.innerHTML = '';
  const oldInput = document.getElementById('changeOldUserId');
  const newInput = document.getElementById('changeNewUserId');
  if (oldInput) oldInput.value = '';
  if (newInput) newInput.value = '';

  // 白名單
  const dwResult = document.getElementById('dwResult');
  if (dwResult) dwResult.innerHTML = '';
  const dwUserId = document.getElementById('dwUserId');
  const dwNote = document.getElementById('dwNote');
  if (dwUserId) dwUserId.value = '';
  if (dwNote) dwNote.value = '';

  // 若白名單容器存在，自動載入
  if (document.getElementById('dwDisplay')) {
    loadDebtWhitelist();
  }
}

// ============================================================
// 掛載到 window
// ============================================================

window.confirmChangeUserId = confirmChangeUserId;
window.changeUserId = changeUserId;
window.initAdminUsersPage = initAdminUsersPage;
window.loadDebtWhitelist = loadDebtWhitelist;
window.addDebtWhitelist = addDebtWhitelist;
window.removeDebtWhitelist = removeDebtWhitelist;

console.log('👥 管理員用戶模組已載入（Tabs + 白名單版）');
