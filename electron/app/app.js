// Udhyana Games - Ultimate Reception & Admin Engine

const DEFAULT_CONSOLES = [
  { id: 'ps5-1', name: 'PS5 Pro — Station 1', type: 'PS5 Pro', rate: null },
  { id: 'ps5-2', name: 'PS5 Pro — Station 2', type: 'PS5 Pro', rate: null },
  { id: 'ps5-3', name: 'PS5 Pro — Station 3', type: 'PS5 Pro', rate: null },
  { id: 'pc-1', name: 'Esports PC — Station 4', type: 'Esports PC', rate: null },
  { id: 'pc-2', name: 'Esports PC — Station 5', type: 'Esports PC', rate: null },
  { id: 'xbox-1', name: 'Xbox Series X — Station 6', type: 'Xbox Series X', rate: null },
];

const DEFAULT_SNACKS = [
  { id: 'snack-1', name: 'Red Bull Energy Drink', price: 500 },
  { id: 'snack-2', name: 'Sting / Monster Energy', price: 250 },
  { id: 'snack-3', name: 'Coca-Cola / Sprite Can', price: 150 },
  { id: 'snack-4', name: 'Lays / Kurkure Chips', price: 200 },
  { id: 'snack-5', name: 'Dairy Milk / KitKat', price: 300 },
  { id: 'snack-6', name: 'Mineral Water (500ml)', price: 100 },
];

// App State
let state = {
  activeTab: 'register',
  activeAdminTab: 'revenue',
  consoles: [...DEFAULT_CONSOLES],
  snacks: [...DEFAULT_SNACKS],
  activeSessions: {}, // { consoleId: { playerName, phone, startTime, endTime, totalSeconds, controllers, totalPaid, isPaused, pausedRemainingMs } }
  waitlist: [],
  cart: [],
  history: [], // operational log
  sales: [],   // financial audit records
  members: [], // [{ name, phone, visits }]
  discountPercent: 0,
  paymentMethod: 'cash',
  selectedConsoleId: null,
  selectedDurationHours: 1,
  selectedControllersCount: 0,
  baseRate: 1000,
  ctrlRate: 200,
  adminPin: '8899', // Default Master PIN
  isAdminUnlocked: false,
  shiftStartTime: Date.now(),
};

// Sound Alert for Expired Station
function playExpireChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.6);
  } catch (e) {
    console.error('Audio chime error:', e);
  }
}

// Local Storage Persistence
function loadState() {
  const saved = localStorage.getItem('udhyana_terminal_v4');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state = { ...state, ...parsed };
    } catch (e) {
      console.error('Error loading state:', e);
    }
  }
}

function saveState() {
  localStorage.setItem('udhyana_terminal_v4', JSON.stringify({
    consoles: state.consoles,
    snacks: state.snacks,
    activeSessions: state.activeSessions,
    waitlist: state.waitlist,
    history: state.history,
    sales: state.sales,
    members: state.members,
    baseRate: state.baseRate,
    ctrlRate: state.ctrlRate,
    adminPin: state.adminPin,
    shiftStartTime: state.shiftStartTime,
  }));
}

// Live Clock
function updateClock() {
  const now = new Date();
  const clockEl = document.getElementById('live-clock');
  if (clockEl) clockEl.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
setInterval(updateClock, 1000);
updateClock();

// 1. Render Station Picker
function renderConsolesSelector() {
  const container = document.getElementById('console-selector');
  if (!container) return;
  container.innerHTML = '';

  state.consoles.forEach((c) => {
    const session = state.activeSessions[c.id];
    const isOccupied = !!session;
    const isSelected = state.selectedConsoleId === c.id;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `station-chip ${isSelected ? 'active' : ''} ${isOccupied ? 'occupied' : ''}`;
    
    btn.innerHTML = `
      <span>${c.name}</span>
      <span class="chip-status ${isOccupied ? 'text-busy' : 'text-avail'}">
        ${isOccupied ? (session.playerName || 'Active') : 'Free'}
      </span>
    `;

    btn.onclick = () => {
      if (isOccupied) return;
      state.selectedConsoleId = c.id;
      renderConsolesSelector();
    };

    container.appendChild(btn);
  });
}

// 2. Render Cafe Items
function renderSnacks() {
  const container = document.getElementById('snacks-grid');
  if (!container) return;
  container.innerHTML = '';

  state.snacks.forEach((snack) => {
    const div = document.createElement('button');
    div.type = 'button';
    div.className = 'cafe-item-btn';
    div.innerHTML = `
      <span class="cafe-name">${snack.name}</span>
      <span class="cafe-price">PKR ${snack.price}</span>
    `;
    div.onclick = () => addToCart({ type: 'snack', id: snack.id, name: snack.name, price: snack.price });
    container.appendChild(div);
  });
}

// 3. Render Cart
function renderCart() {
  const container = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  const checkoutBtn = document.getElementById('checkout-btn');
  if (!container || !totalEl || !checkoutBtn) return;

  if (state.cart.length === 0) {
    container.innerHTML = '<div class="empty-state">No items added yet.</div>';
    totalEl.textContent = 'PKR 0';
    checkoutBtn.disabled = true;
    return;
  }

  container.innerHTML = '';
  let subtotal = 0;

  state.cart.forEach((item, index) => {
    subtotal += item.price;
    const row = document.createElement('div');
    row.className = 'cart-row-item';
    row.innerHTML = `
      <div>
        <div class="cart-row-title">${item.name}</div>
        ${item.sub ? `<div class="cart-row-sub">${item.sub}</div>` : ''}
      </div>
      <div style="display: flex; align-items: center;">
        <span class="cart-row-price">PKR ${item.price}</span>
        <button class="cart-remove-btn" onclick="removeFromCart(${index})">×</button>
      </div>
    `;
    container.appendChild(row);
  });

  let total = subtotal;
  if (state.discountPercent > 0) {
    const discountAmount = Math.round(subtotal * (state.discountPercent / 100));
    total = Math.max(0, subtotal - discountAmount);
    totalEl.innerHTML = `<span style="font-size: 0.8rem; text-decoration: line-through; color: #64748b; margin-right: 6px;">PKR ${subtotal}</span> PKR ${total}`;
  } else {
    totalEl.textContent = `PKR ${total}`;
  }

  checkoutBtn.disabled = false;
}

// 4. Render Station Timers (Lounge Monitor)
function renderStationsMonitor() {
  const container = document.getElementById('stations-grid');
  if (!container) return;
  container.innerHTML = '';
  let activeCount = 0;

  state.consoles.forEach((c) => {
    const session = state.activeSessions[c.id];
    const tile = document.createElement('div');

    if (!session) {
      tile.className = 'station-tile';
      tile.innerHTML = `
        <div class="station-tile-header">
          <span class="station-tile-title">${c.name}</span>
          <span class="badge-tag tag-avail">Available</span>
        </div>
        <div class="station-timer-screen">
          <div class="timer-nums timer-c-idle">00:00:00</div>
        </div>
        <div class="station-player-meta">
          <span class="player-meta-lbl">Status</span>
          <span class="player-meta-name" style="color: #64748b;">Ready for player</span>
        </div>
        <div class="station-tile-actions" style="grid-template-columns: 1fr;">
          <button class="btn btn-primary btn-sm btn-block" onclick="quickAssign('${c.id}')">Assign Station</button>
        </div>
      `;
    } else {
      activeCount++;
      const now = Date.now();
      let remainingSec = 0;

      if (session.isPaused) {
        remainingSec = Math.max(0, Math.floor(session.pausedRemainingMs / 1000));
      } else {
        const remainingMs = session.endTime - now;
        remainingSec = Math.max(0, Math.floor(remainingMs / 1000));
      }
      
      let badgeClass = 'tag-busy';
      let badgeText = 'Active';
      let tileStatus = 'status-busy';
      let timerColor = 'timer-c-busy';

      if (session.isPaused) {
        badgeClass = 'tag-paused';
        badgeText = 'PAUSED';
        tileStatus = 'status-paused';
        timerColor = 'timer-c-paused';
      } else if (remainingSec === 0) {
        badgeClass = 'tag-danger';
        badgeText = 'EXPIRED';
        tileStatus = 'status-expired';
        timerColor = 'timer-c-danger';
        if (!session.expiredAlertFired) {
          session.expiredAlertFired = true;
          playExpireChime();
        }
      } else if (remainingSec < 900) { // Under 15m
        badgeClass = 'tag-warn';
        badgeText = '< 15m Left';
        tileStatus = 'status-warn';
        timerColor = 'timer-c-warn';
      }

      tile.className = `station-tile ${tileStatus}`;
      tile.innerHTML = `
        <div class="station-tile-header">
          <span class="station-tile-title">${c.name}</span>
          <span class="badge-tag ${badgeClass}">${badgeText}</span>
        </div>
        <div class="station-timer-screen">
          <div class="timer-nums ${timerColor}">${formatTime(remainingSec)}</div>
        </div>
        <div class="station-player-meta">
          <span class="player-meta-lbl">Player</span>
          <span class="player-meta-name">${session.playerName} ${session.controllers > 0 ? `(+${session.controllers} Ctrl)` : ''}</span>
        </div>
        <div class="station-tile-actions">
          <button class="btn btn-subtle btn-sm" onclick="openExtendModal('${c.id}')">+ Time</button>
          <button class="btn btn-subtle btn-sm" onclick="openTransferModal('${c.id}')">Transfer</button>
          <button class="btn btn-subtle btn-sm" onclick="togglePauseSession('${c.id}')">${session.isPaused ? 'Resume' : 'Pause'}</button>
          <button class="btn btn-subtle btn-sm text-danger" onclick="endSession('${c.id}')">End</button>
        </div>
      `;
    }

    container.appendChild(tile);
  });

  const countBadge = document.getElementById('active-sessions-count');
  if (countBadge) countBadge.textContent = activeCount;
  const activeStat = document.getElementById('stat-active-players');
  if (activeStat) activeStat.textContent = activeCount;
}

// 5. Render Waitlist
function renderWaitlist() {
  const tbody = document.getElementById('waitlist-tbody');
  const countBadge = document.getElementById('waitlist-count');
  if (countBadge) countBadge.textContent = state.waitlist.length;
  if (!tbody) return;

  tbody.innerHTML = '';

  if (state.waitlist.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b; padding: 20px;">Queue is currently empty.</td></tr>';
    return;
  }

  state.waitlist.forEach((item, index) => {
    const tr = document.createElement('tr');
    const elapsedMins = Math.floor((Date.now() - item.addedAt) / 60000);
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td><strong>${item.name}</strong></td>
      <td><span class="badge-tag tag-busy">${item.station}</span></td>
      <td>${elapsedMins}m ago</td>
      <td>
        <button class="btn btn-primary btn-sm" onclick="assignFromWaitlist(${index})">Assign</button>
        <button class="btn btn-subtle btn-sm text-danger" onclick="removeFromWaitlist(${index})">×</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// 6. Render Daily History Log
function renderHistory() {
  const tbody = document.getElementById('sales-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  let sessionCount = 0;
  let snackCount = 0;

  state.history.forEach((entry) => {
    if (entry.type === 'session') sessionCount++;
    if (entry.type === 'snack' || entry.items?.some(i => i.type === 'snack')) snackCount++;

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><span style="font-family: var(--font-mono); font-size: 0.8rem; color: #94a3b8;">${entry.time}</span></td>
      <td><strong>${entry.description}</strong></td>
      <td><span class="badge-tag tag-avail">${entry.paymentMethod.toUpperCase()}</span></td>
      <td><span style="color: #10b981; font-weight: 600; font-size: 0.82rem;">Completed</span></td>
    `;
    tbody.appendChild(tr);
  });

  const sessionStat = document.getElementById('stat-total-sessions');
  const snackStat = document.getElementById('stat-total-snacks');
  if (sessionStat) sessionStat.textContent = sessionCount;
  if (snackStat) snackStat.textContent = snackCount;
}

// =========================================================
// STATION OPERATIONAL HELPERS: PAUSE & TRANSFER
// =========================================================

window.togglePauseSession = function(consoleId) {
  const session = state.activeSessions[consoleId];
  if (!session) return;

  if (!session.isPaused) {
    // Pause session
    session.isPaused = true;
    session.pausedRemainingMs = Math.max(0, session.endTime - Date.now());
  } else {
    // Resume session
    session.isPaused = false;
    session.endTime = Date.now() + (session.pausedRemainingMs || 0);
    delete session.pausedRemainingMs;
  }

  saveState();
  renderStationsMonitor();
};

let transferringFromConsoleId = null;

window.openTransferModal = function(fromConsoleId) {
  transferringFromConsoleId = fromConsoleId;
  const session = state.activeSessions[fromConsoleId];
  const sourceConsole = state.consoles.find(c => c.id === fromConsoleId);

  document.getElementById('transfer-modal-title').textContent = `Transfer: ${sourceConsole?.name}`;
  document.getElementById('transfer-modal-subtitle').textContent = `Player: ${session?.playerName}`;

  const select = document.getElementById('transfer-dest-select');
  select.innerHTML = '';

  const freeConsoles = state.consoles.filter(c => !state.activeSessions[c.id]);
  if (freeConsoles.length === 0) {
    select.innerHTML = '<option value="">No free stations available</option>';
    document.getElementById('confirm-transfer-btn').disabled = true;
  } else {
    document.getElementById('confirm-transfer-btn').disabled = false;
    freeConsoles.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = `${c.name} (${c.type})`;
      select.appendChild(opt);
    });
  }

  document.getElementById('transfer-modal').classList.add('active');
};

document.getElementById('cancel-transfer-btn').onclick = () => {
  document.getElementById('transfer-modal').classList.remove('active');
};

document.getElementById('confirm-transfer-btn').onclick = () => {
  if (!transferringFromConsoleId) return;
  const destConsoleId = document.getElementById('transfer-dest-select').value;
  if (!destConsoleId) return;

  const session = state.activeSessions[transferringFromConsoleId];
  if (!session) return;

  const sourceConsole = state.consoles.find(c => c.id === transferringFromConsoleId);
  const destConsole = state.consoles.find(c => c.id === destConsoleId);

  // Move session to destination
  state.activeSessions[destConsoleId] = { ...session };
  delete state.activeSessions[transferringFromConsoleId];

  state.history.unshift({
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    description: `Station Transferred: ${sourceConsole?.name} ➔ ${destConsole?.name} (${session.playerName})`,
    paymentMethod: 'system',
    type: 'session',
  });

  document.getElementById('transfer-modal').classList.remove('active');
  saveState();
  renderConsolesSelector();
  renderStationsMonitor();
  renderHistory();
  alert(`Transferred ${session.playerName} to ${destConsole?.name}!`);
};

// =========================================================
// MEMBER AUTOCOMPLETE SEARCH
// =========================================================

const playerInput = document.getElementById('player-name');
const suggestionsBox = document.getElementById('member-suggestions');

if (playerInput && suggestionsBox) {
  playerInput.oninput = () => {
    const val = playerInput.value.trim().toLowerCase();
    if (!val || state.members.length === 0) {
      suggestionsBox.style.display = 'none';
      return;
    }

    const matches = state.members.filter(m => m.name.toLowerCase().includes(val) || (m.phone && m.phone.includes(val)));
    if (matches.length === 0) {
      suggestionsBox.style.display = 'none';
      return;
    }

    suggestionsBox.innerHTML = '';
    matches.slice(0, 5).forEach(m => {
      const item = document.createElement('div');
      item.className = 'member-item';
      item.innerHTML = `<span><strong>${m.name}</strong> ${m.phone ? `(${m.phone})` : ''}</span><span style="color: #06b6d4; font-size: 0.75rem;">${m.visits || 1} Visits</span>`;
      item.onclick = () => {
        playerInput.value = m.name;
        if (m.phone) document.getElementById('player-phone').value = m.phone;
        suggestionsBox.style.display = 'none';
      };
      suggestionsBox.appendChild(item);
    });
    suggestionsBox.style.display = 'block';
  };

  document.addEventListener('click', (e) => {
    if (!playerInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
      suggestionsBox.style.display = 'none';
    }
  });
}

// =========================================================
// SHIFT CLOSING (Z-REPORT)
// =========================================================

function openShiftCloseModal() {
  let totalGross = 0;
  let cashTotal = 0;
  let cardTotal = 0;
  let accountTotal = 0;
  let sessionCount = 0;
  let snackCount = 0;

  state.sales.forEach(sale => {
    totalGross += sale.amount;
    if (sale.paymentMethod === 'cash') cashTotal += sale.amount;
    else if (sale.paymentMethod === 'card') cardTotal += sale.amount;
    else accountTotal += sale.amount;

    if (sale.type === 'session') sessionCount++;
    else snackCount++;
  });

  const now = new Date();
  const shiftStartStr = new Date(state.shiftStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const shiftEndStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  document.getElementById('shift-close-info').innerHTML = `
    <div class="receipt-item-row"><span>Date:</span><strong>${now.toLocaleDateString()}</strong></div>
    <div class="receipt-item-row"><span>Shift Time:</span><span>${shiftStartStr} – ${shiftEndStr}</span></div>
    <div class="receipt-item-row"><span>Total Sessions:</span><span>${sessionCount}</span></div>
    <div class="receipt-item-row"><span>Cafe Orders:</span><span>${snackCount}</span></div>
  `;

  document.getElementById('shift-close-totals').innerHTML = `
    <div class="receipt-item-row"><span>CASH IN DRAWER:</span><strong>PKR ${cashTotal}</strong></div>
    <div class="receipt-item-row"><span>CARD PAYMENTS:</span><strong>PKR ${cardTotal}</strong></div>
    <div class="receipt-item-row"><span>ACCOUNT PAYMENTS:</span><strong>PKR ${accountTotal}</strong></div>
    <div class="receipt-item-row" style="font-size: 1.05rem; font-weight: 900; margin-top: 6px; border-top: 1px dashed #cbd5e1; padding-top: 6px;">
      <span>GROSS TOTAL:</span><span>PKR ${totalGross}</span>
    </div>
  `;

  document.getElementById('shift-close-modal').classList.add('active');
}

document.getElementById('header-shift-btn').onclick = openShiftCloseModal;
document.getElementById('history-shift-btn').onclick = openShiftCloseModal;
document.getElementById('close-shift-modal-btn').onclick = () => {
  document.getElementById('shift-close-modal').classList.remove('active');
};
document.getElementById('print-shift-close-btn').onclick = () => {
  window.print();
};

// =========================================================
// ADMIN CONTROLS & AUTH
// =========================================================

function checkAdminAuth() {
  if (!state.isAdminUnlocked) {
    openAdminPinModal();
    return false;
  }
  return true;
}

function openAdminPinModal() {
  const modal = document.getElementById('admin-pin-modal');
  const input = document.getElementById('admin-pin-input');
  const err = document.getElementById('pin-error-msg');
  if (err) err.style.display = 'none';
  if (input) input.value = '';
  if (modal) modal.classList.add('active');
  setTimeout(() => input?.focus(), 100);
}

function closeAdminPinModal() {
  const modal = document.getElementById('admin-pin-modal');
  if (modal) modal.classList.remove('active');
}

document.getElementById('admin-pin-submit-btn').onclick = () => {
  const input = document.getElementById('admin-pin-input');
  const err = document.getElementById('pin-error-msg');
  const entered = input.value.trim();

  if (entered === state.adminPin) {
    state.isAdminUnlocked = true;
    closeAdminPinModal();
    document.getElementById('admin-lock-badge').textContent = '🔓';
    document.getElementById('admin-lock-btn').style.display = 'inline-flex';
    switchTab('admin');
    renderAdminView();
  } else {
    if (err) err.style.display = 'block';
    input.value = '';
    input.focus();
  }
};

document.getElementById('admin-pin-cancel-btn').onclick = () => {
  closeAdminPinModal();
  switchTab('register');
};

document.getElementById('admin-lock-btn').onclick = () => {
  state.isAdminUnlocked = false;
  document.getElementById('admin-lock-badge').textContent = '🔒';
  document.getElementById('admin-lock-btn').style.display = 'none';
  switchTab('register');
  alert('Admin controls locked.');
};

// Render Admin View
function renderAdminView() {
  if (!state.isAdminUnlocked) return;

  let totalRevenue = 0;
  let sessionsRev = 0;
  let snacksRev = 0;
  let cashTotal = 0;
  let cardTotal = 0;

  state.sales.forEach(sale => {
    totalRevenue += sale.amount;
    if (sale.paymentMethod === 'cash') cashTotal += sale.amount;
    else cardTotal += sale.amount;

    if (sale.type === 'session') sessionsRev += sale.amount;
    else snacksRev += sale.amount;
  });

  const cashRatio = totalRevenue > 0 ? Math.round((cashTotal / totalRevenue) * 100) : 0;

  document.getElementById('admin-kpi-revenue').textContent = `PKR ${totalRevenue}`;
  document.getElementById('admin-kpi-sessions-rev').textContent = `PKR ${sessionsRev}`;
  document.getElementById('admin-kpi-sessions-count').textContent = `${state.sales.filter(s => s.type === 'session').length} sessions`;
  document.getElementById('admin-kpi-snacks-rev').textContent = `PKR ${snacksRev}`;
  document.getElementById('admin-kpi-snacks-count').textContent = `${state.sales.filter(s => s.type !== 'session').length} orders`;
  document.getElementById('admin-kpi-cash-ratio').textContent = `${cashRatio}% Cash`;
  document.getElementById('admin-kpi-payment-split').textContent = `Cash: PKR ${cashTotal} | Card: PKR ${cardTotal}`;

  const auditTbody = document.getElementById('admin-audit-tbody');
  if (auditTbody) {
    auditTbody.innerHTML = '';
    state.sales.forEach(sale => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><span style="font-family: var(--font-mono); font-size: 0.8rem;">${sale.time}</span></td>
        <td><strong>${sale.summary}</strong></td>
        <td><span class="badge-tag ${sale.type === 'session' ? 'tag-busy' : 'tag-warn'}">${sale.type ? sale.type.toUpperCase() : 'ORDER'}</span></td>
        <td><span class="badge-tag tag-avail">${sale.paymentMethod.toUpperCase()}</span></td>
        <td style="font-family: var(--font-mono); font-weight: 800; color: #c1ff1c;">PKR ${sale.amount}</td>
      `;
      auditTbody.appendChild(tr);
    });
  }

  renderAdminStations();
  renderAdminSnacks();
  document.getElementById('admin-setting-base-rate').value = state.baseRate;
  document.getElementById('admin-setting-ctrl-rate').value = state.ctrlRate;
}

function renderAdminStations() {
  const tbody = document.getElementById('admin-stations-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  state.consoles.forEach((c, index) => {
    const isOccupied = !!state.activeSessions[c.id];
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${c.name}</strong></td>
      <td><span class="badge-tag tag-busy">${c.type}</span></td>
      <td><span class="badge-tag ${isOccupied ? 'tag-warn' : 'tag-avail'}">${isOccupied ? 'In-Use' : 'Available'}</span></td>
      <td>
        ${isOccupied ? `<button class="btn btn-subtle btn-sm text-danger" onclick="adminForceResetStation('${c.id}')">Reset Timer</button>` : ''}
        <button class="btn btn-subtle btn-sm text-danger" onclick="adminDeleteStation(${index})">Remove</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderAdminSnacks() {
  const tbody = document.getElementById('admin-snacks-tbody');
  if (!tbody) return;
  tbody.innerHTML = '';

  state.snacks.forEach((s, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><strong>${s.name}</strong></td>
      <td style="font-family: var(--font-mono); font-weight: 700;">PKR ${s.price}</td>
      <td>
        <button class="btn btn-subtle btn-sm text-danger" onclick="adminDeleteSnack(${index})">Delete</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// Admin Sub-Nav
document.querySelectorAll('.admin-nav-tab').forEach(btn => {
  btn.onclick = () => {
    const tabKey = btn.dataset.admintab;
    state.activeAdminTab = tabKey;
    document.querySelectorAll('.admin-nav-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
    const targetContent = document.getElementById(`admin-sec-${tabKey}`);
    if (targetContent) targetContent.classList.add('active');
  };
});

// Admin Add Station
document.getElementById('admin-add-station-form').onsubmit = (e) => {
  e.preventDefault();
  const name = document.getElementById('new-station-name').value.trim();
  const type = document.getElementById('new-station-type').value;
  const customRate = parseInt(document.getElementById('new-station-rate').value) || null;

  const id = `station_${Date.now()}`;
  state.consoles.push({ id, name, type, rate: customRate });
  saveState();
  renderConsolesSelector();
  renderStationsMonitor();
  renderAdminStations();
  document.getElementById('new-station-name').value = '';
  document.getElementById('new-station-rate').value = '';
  alert(`Added ${name} successfully!`);
};

window.adminDeleteStation = function(index) {
  if (confirm('Are you sure you want to remove this station?')) {
    const removed = state.consoles.splice(index, 1)[0];
    delete state.activeSessions[removed.id];
    saveState();
    renderConsolesSelector();
    renderStationsMonitor();
    renderAdminStations();
  }
};

window.adminForceResetStation = function(consoleId) {
  if (confirm('Force reset and free this station immediately?')) {
    delete state.activeSessions[consoleId];
    saveState();
    renderConsolesSelector();
    renderStationsMonitor();
    renderAdminStations();
  }
};

// Admin Add Snack
document.getElementById('admin-add-snack-form').onsubmit = (e) => {
  e.preventDefault();
  const name = document.getElementById('new-snack-name').value.trim();
  const price = parseFloat(document.getElementById('new-snack-price').value) || 0;

  const id = `snack_${Date.now()}`;
  state.snacks.push({ id, name, price });
  saveState();
  renderSnacks();
  renderAdminSnacks();
  document.getElementById('new-snack-name').value = '';
  document.getElementById('new-snack-price').value = '';
  alert(`Added ${name} to cafe menu!`);
};

window.adminDeleteSnack = function(index) {
  if (confirm('Delete this item from cafe menu?')) {
    state.snacks.splice(index, 1);
    saveState();
    renderSnacks();
    renderAdminSnacks();
  }
};

// Admin Save Rates
document.getElementById('admin-save-rates-btn').onclick = () => {
  state.baseRate = parseInt(document.getElementById('admin-setting-base-rate').value) || 1000;
  state.ctrlRate = parseInt(document.getElementById('admin-setting-ctrl-rate').value) || 200;
  saveState();
  alert('Pricing rates updated successfully!');
};

// Admin Change PIN
document.getElementById('admin-change-pin-btn').onclick = () => {
  const currentPin = document.getElementById('admin-current-pin').value.trim();
  const newPin = document.getElementById('admin-new-pin').value.trim();

  if (currentPin !== state.adminPin) return alert('Current PIN is incorrect.');
  if (!newPin || newPin.length < 4) return alert('New PIN must be at least 4 digits.');

  state.adminPin = newPin;
  saveState();
  document.getElementById('admin-current-pin').value = '';
  document.getElementById('admin-new-pin').value = '';
  alert('Admin Master PIN updated successfully!');
};

// Database Backup & Restore
document.getElementById('admin-export-backup-btn').onclick = () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `udhyana_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
};

document.getElementById('admin-restore-file').onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const parsed = JSON.parse(event.target.result);
      if (confirm('Restore database from this backup file? Existing data will be overwritten.')) {
        state = { ...state, ...parsed, isAdminUnlocked: true };
        saveState();
        location.reload();
      }
    } catch (err) {
      alert('Invalid backup file.');
    }
  };
  reader.readAsText(file);
};

document.getElementById('admin-clear-all-data-btn').onclick = () => {
  if (confirm('WARNING: Are you sure you want to reset all today\'s shift financial logs and start a new shift?')) {
    state.sales = [];
    state.history = [];
    state.shiftStartTime = Date.now();
    saveState();
    renderHistory();
    renderAdminView();
    alert('Shift records reset.');
  }
};

document.getElementById('admin-print-financials-btn').onclick = () => {
  window.print();
};

function formatTime(totalSec) {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Cart Actions
function addToCart(item) {
  state.cart.push(item);
  renderCart();
}

window.removeFromCart = function(index) {
  state.cart.splice(index, 1);
  renderCart();
};

function quickAssign(consoleId) {
  state.selectedConsoleId = consoleId;
  switchTab('register');
  renderConsolesSelector();
}

// Form Submission
document.getElementById('session-form').onsubmit = (e) => {
  e.preventDefault();
  const name = document.getElementById('player-name').value.trim();
  const phone = document.getElementById('player-phone').value.trim();

  if (!state.selectedConsoleId) {
    alert('Please select an available station.');
    return;
  }

  // Update member directory
  const existingMember = state.members.find(m => m.name.toLowerCase() === name.toLowerCase());
  if (existingMember) {
    existingMember.visits = (existingMember.visits || 1) + 1;
    if (phone) existingMember.phone = phone;
  } else {
    state.members.push({ name, phone, visits: 1 });
  }

  const durationHours = state.selectedDurationHours;
  const sessionCost = Math.round(durationHours * state.baseRate);
  const ctrlCost = state.selectedControllersCount * state.ctrlRate;
  const totalCost = sessionCost + ctrlCost;

  const consoleObj = state.consoles.find(c => c.id === state.selectedConsoleId);

  addToCart({
    type: 'session',
    consoleId: state.selectedConsoleId,
    consoleName: consoleObj?.name,
    playerName: name,
    phone: phone,
    durationHours: durationHours,
    controllers: state.selectedControllersCount,
    name: `${consoleObj?.name} (${name})`,
    sub: `${durationHours} Hr${durationHours > 1 ? 's' : ''} ${state.selectedControllersCount > 0 ? `+${state.selectedControllersCount} Controller(s)` : ''}`,
    price: totalCost,
  });

  document.getElementById('player-name').value = '';
  document.getElementById('player-phone').value = '';
  state.selectedConsoleId = null;
  renderConsolesSelector();
};

// Checkout & Slip Printing
document.getElementById('checkout-btn').onclick = () => {
  if (state.cart.length === 0) return;

  const subtotal = state.cart.reduce((sum, item) => sum + item.price, 0);
  const discountAmount = Math.round(subtotal * (state.discountPercent / 100));
  const finalTotal = Math.max(0, subtotal - discountAmount);
  const now = Date.now();

  const sessionData = [];

  state.cart.forEach((item) => {
    if (item.type === 'session') {
      const durationMs = item.durationHours * 3600 * 1000;
      state.activeSessions[item.consoleId] = {
        playerName: item.playerName,
        phone: item.phone,
        startTime: now,
        endTime: now + durationMs,
        totalSeconds: item.durationHours * 3600,
        controllers: item.controllers,
        totalPaid: item.price,
        isPaused: false,
      };

      sessionData.push({
        stationName: item.consoleName || item.name,
        playerName: item.playerName || 'Guest',
        startTime: new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTime: new Date(now + durationMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: `${item.durationHours} Hour${item.durationHours > 1 ? 's' : ''}`,
        controllers: item.controllers || 0,
      });
    }
  });

  const description = state.cart.map(i => i.name).join(', ');
  
  state.history.unshift({
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    description: state.discountPercent > 0 ? `${description} (${state.discountPercent}% OFF)` : description,
    paymentMethod: state.paymentMethod,
    items: [...state.cart],
    type: sessionData.length > 0 ? 'session' : 'snack',
  });

  state.sales.unshift({
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    summary: state.discountPercent > 0 ? `${description} (${state.discountPercent}% OFF)` : description,
    amount: finalTotal,
    paymentMethod: state.paymentMethod,
    type: sessionData.length > 0 ? 'session' : 'snack',
  });

  showReceiptModal({
    token: Math.floor(1000 + Math.random() * 9000),
    sessions: sessionData,
    items: [...state.cart],
    discount: state.discountPercent,
    discountAmount: discountAmount,
    total: finalTotal,
    paymentMethod: state.paymentMethod,
    time: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
  });

  state.cart = [];
  state.discountPercent = 0;
  document.querySelectorAll('.disc-chip').forEach(b => b.classList.toggle('active', b.dataset.disc === '0'));
  saveState();
  renderCart();
  renderConsolesSelector();
  renderStationsMonitor();
  renderHistory();
};

// Receipt Modal
function showReceiptModal(receipt) {
  const infoEl = document.getElementById('receipt-info');
  const itemsEl = document.getElementById('receipt-items');
  const totalEl = document.getElementById('receipt-total');

  let sessionHtml = '';
  if (receipt.sessions && receipt.sessions.length > 0) {
    receipt.sessions.forEach(s => {
      sessionHtml += `
        <div class="receipt-station-box">
          <div class="receipt-station-hdr">${s.stationName.toUpperCase()}</div>
          <div class="receipt-item-row"><span>Player:</span><strong>${s.playerName}</strong></div>
          <div class="receipt-item-row"><span>Start Time:</span><span>${s.startTime}</span></div>
          <div class="receipt-item-row"><span>End Time:</span><span style="font-weight: 800;">${s.endTime}</span></div>
          <div class="receipt-item-row"><span>Duration:</span><span>${s.duration} ${s.controllers > 0 ? `(+${s.controllers} Ctrl)` : ''}</span></div>
        </div>
      `;
    });
  }

  infoEl.innerHTML = `
    <div class="receipt-item-row" style="font-weight: 800;">
      <span>TOKEN #:</span><span>#${receipt.token || '001'}</span>
    </div>
    <div class="receipt-item-row"><span>Date & Time:</span><span>${receipt.time}</span></div>
    <div class="receipt-item-row"><span>Payment:</span><span>${receipt.paymentMethod.toUpperCase()}</span></div>
    ${sessionHtml}
  `;

  itemsEl.innerHTML = '';
  receipt.items.forEach((item) => {
    itemsEl.innerHTML += `
      <div class="receipt-item-row">
        <span>${item.name}</span>
        <span>PKR ${item.price}</span>
      </div>
    `;
  });

  if (receipt.discount > 0) {
    itemsEl.innerHTML += `
      <div class="receipt-item-row" style="color: #10b981;">
        <span>Discount (${receipt.discount}%):</span>
        <span>- PKR ${receipt.discountAmount}</span>
      </div>
    `;
  }

  totalEl.innerHTML = `
    <div class="receipt-item-row" style="font-size: 1.05rem; font-weight: 900;">
      <span>TOTAL PAID:</span>
      <span>PKR ${receipt.total}</span>
    </div>
  `;

  document.getElementById('receipt-modal').classList.add('active');
}

document.getElementById('close-receipt-btn').onclick = () => {
  document.getElementById('receipt-modal').classList.remove('active');
};

document.getElementById('print-receipt-btn').onclick = () => {
  if (window.electronAPI?.printReceipt) {
    window.electronAPI.printReceipt({ silent: false });
  } else {
    window.print();
  }
};

// Add Time Extension
let extendingConsoleId = null;
let extendHours = 1;

window.openExtendModal = function(consoleId) {
  extendingConsoleId = consoleId;
  const session = state.activeSessions[consoleId];
  const consoleObj = state.consoles.find(c => c.id === consoleId);
  
  document.getElementById('extend-modal-title').textContent = `Extend Time: ${consoleObj?.name}`;
  document.getElementById('extend-modal-subtitle').textContent = `Active Player: ${session?.playerName}`;
  document.getElementById('extend-modal').classList.add('active');
};

document.getElementById('cancel-extend-btn').onclick = () => {
  document.getElementById('extend-modal').classList.remove('active');
};

document.querySelectorAll('.extend-time-btn').forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll('.extend-time-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    extendHours = parseFloat(btn.dataset.hours);
  };
});

document.getElementById('confirm-extend-btn').onclick = () => {
  if (!extendingConsoleId) return;
  const session = state.activeSessions[extendingConsoleId];
  if (!session) return;

  const consoleObj = state.consoles.find(c => c.id === extendingConsoleId);
  const addedMs = extendHours * 3600 * 1000;
  const addedPrice = Math.round(extendHours * state.baseRate);

  if (session.isPaused) {
    session.pausedRemainingMs = (session.pausedRemainingMs || 0) + addedMs;
  } else {
    if (session.endTime < Date.now()) {
      session.endTime = Date.now() + addedMs;
    } else {
      session.endTime += addedMs;
    }
  }
  session.expiredAlertFired = false;

  state.history.unshift({
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    description: `Time Extension (+${extendHours}h) - ${consoleObj?.name} (${session.playerName})`,
    paymentMethod: 'cash',
    type: 'session',
  });

  state.sales.unshift({
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    summary: `Time Extension (+${extendHours}h) - ${consoleObj?.name} (${session.playerName})`,
    amount: addedPrice,
    paymentMethod: 'cash',
    type: 'session',
  });

  document.getElementById('extend-modal').classList.remove('active');
  saveState();
  renderStationsMonitor();
  renderHistory();

  showReceiptModal({
    token: Math.floor(1000 + Math.random() * 9000),
    sessions: [
      {
        stationName: consoleObj?.name || 'Gaming Station',
        playerName: session.playerName,
        startTime: new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        endTime: new Date(session.endTime || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: `+${extendHours} Hour${extendHours > 1 ? 's' : ''}`,
        controllers: session.controllers || 0,
      }
    ],
    items: [
      {
        name: `Time Extension (+${extendHours}h) - ${consoleObj?.name}`,
        price: addedPrice,
      }
    ],
    total: addedPrice,
    paymentMethod: 'cash',
    time: new Date().toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }),
  });
};

window.endSession = function(consoleId) {
  if (confirm('End this gaming session early? Station will become free.')) {
    delete state.activeSessions[consoleId];
    saveState();
    renderConsolesSelector();
    renderStationsMonitor();
  }
};

// Waitlist Actions
document.getElementById('waitlist-form').onsubmit = (e) => {
  e.preventDefault();
  const name = document.getElementById('waitlist-name').value.trim();
  const station = document.getElementById('waitlist-station').value;

  state.waitlist.push({ name, station, addedAt: Date.now() });
  document.getElementById('waitlist-name').value = '';
  saveState();
  renderWaitlist();
};

document.getElementById('quick-waitlist-btn').onclick = () => {
  const name = document.getElementById('player-name').value.trim();
  if (!name) return alert('Enter player name first.');

  state.waitlist.push({ name, station: 'Any Station', addedAt: Date.now() });
  document.getElementById('player-name').value = '';
  saveState();
  renderWaitlist();
  switchTab('waitlist');
};

window.assignFromWaitlist = function(index) {
  const item = state.waitlist[index];
  document.getElementById('player-name').value = item.name;
  state.waitlist.splice(index, 1);
  saveState();
  renderWaitlist();
  switchTab('register');
};

window.removeFromWaitlist = function(index) {
  state.waitlist.splice(index, 1);
  saveState();
  renderWaitlist();
};

// Selectors
document.querySelectorAll('#duration-selector .chip-btn').forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll('#duration-selector .chip-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedDurationHours = parseFloat(btn.dataset.hours);
  };
});

document.querySelectorAll('.ctrl-chip').forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll('.ctrl-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.selectedControllersCount = parseInt(btn.dataset.count);
  };
});

document.querySelectorAll('.disc-chip').forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll('.disc-chip').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.discountPercent = parseInt(btn.dataset.disc);
    renderCart();
  };
});

document.querySelectorAll('.pay-tab').forEach((btn) => {
  btn.onclick = () => {
    document.querySelectorAll('.pay-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.paymentMethod = btn.dataset.pay;
  };
});

document.getElementById('clear-cart-btn').onclick = () => {
  state.cart = [];
  renderCart();
};

// Tab Switcher
function switchTab(tabId) {
  if (tabId === 'admin') {
    if (!checkAdminAuth()) return;
  }

  state.activeTab = tabId;
  document.querySelectorAll('.nav-item').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tabId);
  });
  document.querySelectorAll('.view-panel').forEach(v => {
    v.classList.toggle('active', v.id === `view-${tabId}`);
  });

  const titles = {
    register: ['New Order / POS', 'Walk-in player session registration and cafe orders'],
    monitor: ['Station Timers', 'Active gaming stations, live countdowns, and time controls'],
    waitlist: ['Waitlist Queue', 'Player queue management and station assignments'],
    history: ['Daily History', 'Today\'s player sessions and order activity log'],
    admin: ['Admin Controls & Analytics', 'Lounge revenue, station hardware, pricing rates & security'],
  };

  if (titles[tabId]) {
    document.getElementById('page-title').textContent = titles[tabId][0];
    document.getElementById('page-subtitle').textContent = titles[tabId][1];
  }

  if (tabId === 'monitor') renderStationsMonitor();
  if (tabId === 'waitlist') renderWaitlist();
  if (tabId === 'history') renderHistory();
  if (tabId === 'admin') renderAdminView();
}

document.querySelectorAll('.sidebar-nav .nav-item').forEach((btn) => {
  btn.onclick = () => switchTab(btn.dataset.tab);
});

// Live timer tick
setInterval(() => {
  if (state.activeTab === 'monitor') {
    renderStationsMonitor();
  }
}, 1000);

// Init
loadState();
renderConsolesSelector();
renderSnacks();
renderCart();
renderStationsMonitor();
renderWaitlist();
renderHistory();
