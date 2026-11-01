async function loadDebtWhitelist(event) {
  const btn = event?.currentTarget;
  if (btn) setButtonLoading(btn, true);

  const container = document.getElementById('dwDisplay');
  if (container) showConanLoading('dwDisplay', 'default');

  try {
    const sb = await initSupabase();

    // 白名單 + JOIN users 取姓名、餘額
    const { data: list, error } = await sb
      .from('debt_whitelist')
      .select('user_id, note, created_at');

    if (btn) setButtonLoading(btn, false);
    if (error) throw new Error(error.message);

    if (!list || list.length === 0) {
      if (container) container.innerHTML = '<div class="message info">白名單尚無資料</div>';
      return;
    }

    // 撈 users 資料（管理員有權讀全部）
    const userIds = list.map(r => r.user_id);
    const { data: users } = await sb
      .from('users')
      .select('user_id, name, balance')
      .in('user_id', userIds);

    const userMap = {};
    (users || []).forEach(u => { userMap[u.user_id] = u; });

    let html = `<p style="color: var(--gray); margin-bottom: 8px;">共 ${list.length} 人</p>`;
    html += '<div class="table-container"><table class="table">';
    html += '<thead><tr><th>學號</th><th>姓名</th><th>餘額</th><th>備註</th><th>加入時間</th><th>操作</th></tr></thead><tbody>';

    list.forEach(row => {
      const u = userMap[row.user_id];
      const bal = u ? Number(u.balance) : null;
      const balClass = bal !== null && bal < 0 ? 'balance-negative' : 'balance-positive';
      const balText = bal !== null ? `$${bal}` : '—';
      const dateStr = row.created_at
        ? new Date(row.created_at).toLocaleDateString('zh-TW')
        : '—';

      html += `<tr>
        <td>${escapeHtml(row.user_id)}</td>
        <td>${escapeHtml(u?.name || '（已刪除）')}</td>
        <td class="${balClass}">${balText}</td>
        <td>${escapeHtml(row.note || '')}</td>
        <td style="font-size: 0.85rem; color: var(--gray);">${dateStr}</td>
        <td>
          <button class="btn btn-danger" style="padding: 2px 8px; font-size: 0.8rem;"
            onclick="removeDebtWhitelist('${row.user_id}')">移除</button>
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

window.loadDebtWhitelist = loadDebtWhitelist;
window.addDebtWhitelist = addDebtWhitelist;
window.removeDebtWhitelist = removeDebtWhitelist;
