// =====================
// MINIMIZE MENU
// =====================
const sidebar = document.getElementById('sidebar');
const minimizeBtn = document.getElementById('minimizeBtn');
if (localStorage.getItem('sidebar_collapsed') === 'true') sidebar.classList.add('collapsed');
minimizeBtn.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  localStorage.setItem('sidebar_collapsed', sidebar.classList.contains('collapsed'));
});

// =====================
// THEME COLORS
// =====================
const THEMES = [
  { name: 'Green', hex: '#277C78' },
  { name: 'Yellow', hex: '#F2CDAC' },
  { name: 'Cyan', hex: '#82C9D7' },
  { name: 'Navy', hex: '#626070' },
  { name: 'Red', hex: '#C94736' },
  { name: 'Purple', hex: '#826CB0' },
  { name: 'Turquoise', hex: '#597C7C' },
  { name: 'Brown', hex: '#93674F' },
  { name: 'Magenta', hex: '#934F6F' },
  { name: 'Blue', hex: '#3F82B2' },
  { name: 'Navy Grey', hex: '#97A0AC' },
  { name: 'Army Green', hex: '#7F9161' },
  { name: 'Pink', hex: '#AF81BA' },
  { name: 'Gold', hex: '#CAB361' },
  { name: 'Orange', hex: '#BE6C49' },
];

// =====================
// DATA
// =====================
let pots = [];
let editingPotName = null;
let deletingPotName = null;
let activePotName = null;
let selectedColor = THEMES[0].hex;

function fmt(n) {
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

async function loadData() {
  const res = await fetch('./data.json');
  const data = await res.json();
  const saved = localStorage.getItem('finance_pots');
  pots = saved ? JSON.parse(saved) : data.pots;
}

function saveData() {
  localStorage.setItem('finance_pots', JSON.stringify(pots));
}

// =====================
// COLOR PICKER
// =====================
function buildColorPicker(pickerId, currentHex) {
  const grid = document.getElementById(pickerId);
  grid.innerHTML = '';
  THEMES.forEach(t => {
    const swatch = document.createElement('div');
    swatch.className = 'color-swatch' + (t.hex === currentHex ? ' selected' : '');
    swatch.style.background = t.hex;
    swatch.title = t.name;
    swatch.addEventListener('click', () => {
      grid.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');
      selectedColor = t.hex;
    });
    grid.appendChild(swatch);
  });
  selectedColor = currentHex;
}

// =====================
// RENDER POTS
// =====================
function renderPots() {
  const grid = document.getElementById('potsGrid');
  grid.innerHTML = '';

  if (pots.length === 0) {
    grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1;"><p>No pots yet. Add one to start saving!</p></div>';
    return;
  }

  pots.forEach(pot => {
    const pct = Math.min((pot.total / pot.target) * 100, 100);
    const card = document.createElement('div');
    card.className = 'pot-card';
    card.innerHTML = `
      <div class="pot-card-header">
        <div class="pot-title">
          <div class="pot-color-dot" style="background:${pot.theme}"></div>
          <h2 class="pot-name">${pot.name}</h2>
        </div>
        <div class="actions-dropdown">
          <button class="budget-actions-btn" data-pot="${pot.name}">
            <img src="./assets/images/icon-ellipsis.svg" />
          </button>
          <div class="actions-menu" id="menu-${CSS.escape(pot.name)}">
            <button class="actions-menu-item edit-pot" data-pot="${pot.name}">Edit Pot</button>
            <button class="actions-menu-item danger delete-pot" data-pot="${pot.name}">Delete Pot</button>
          </div>
        </div>
      </div>

      <p class="pot-total-label">Total Saved</p>
      <p class="pot-total-amount">${fmt(pot.total)}</p>

      <div class="pot-progress-track">
        <div class="pot-progress-fill" style="width:${pct}%;background:${pot.theme}"></div>
      </div>
      <div class="pot-progress-stats">
        <span class="pot-progress-pct">${pct.toFixed(1)}%</span>
        <span class="pot-progress-target">Target of ${fmt(pot.target)}</span>
      </div>

      <div class="pot-card-actions">
        <button class="pot-action-btn add-money-btn" data-pot="${pot.name}">+ Add Money</button>
        <button class="pot-action-btn withdraw-btn" data-pot="${pot.name}">Withdraw</button>
      </div>
    `;
    grid.appendChild(card);
  });

  // Ellipsis menus
  document.querySelectorAll('.budget-actions-btn[data-pot]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const name = btn.dataset.pot;
      const menu = document.getElementById(`menu-${CSS.escape(name)}`);
      document.querySelectorAll('.actions-menu.open').forEach(m => { if (m !== menu) m.classList.remove('open'); });
      menu.classList.toggle('open');
    });
  });

  document.querySelectorAll('.edit-pot').forEach(btn => {
    btn.addEventListener('click', () => openEditPotModal(btn.dataset.pot));
  });

  document.querySelectorAll('.delete-pot').forEach(btn => {
    btn.addEventListener('click', () => openDeletePotModal(btn.dataset.pot));
  });

  document.querySelectorAll('.add-money-btn').forEach(btn => {
    btn.addEventListener('click', () => openAddMoneyModal(btn.dataset.pot));
  });

  document.querySelectorAll('.withdraw-btn').forEach(btn => {
    btn.addEventListener('click', () => openWithdrawModal(btn.dataset.pot));
  });
}

document.addEventListener('click', () => {
  document.querySelectorAll('.actions-menu.open').forEach(m => m.classList.remove('open'));
});

// =====================
// ADD / EDIT POT MODAL
// =====================
const potModal = document.getElementById('potModal');
const potModalTitle = document.getElementById('potModalTitle');
const potModalDesc = document.getElementById('potModalDesc');
const potModalClose = document.getElementById('potModalClose');
const potModalSubmit = document.getElementById('potModalSubmit');
const potNameInput = document.getElementById('potName');
const potTargetInput = document.getElementById('potTarget');

document.getElementById('addPotBtn').addEventListener('click', () => {
  editingPotName = null;
  potModalTitle.textContent = 'Add New Pot';
  potModalDesc.textContent = 'Create a pot to set savings targets. These can help keep you on track as you save for special purchases.';
  potModalSubmit.textContent = 'Add Pot';
  potNameInput.value = '';
  potTargetInput.value = '';
  buildColorPicker('potColorPicker', THEMES[0].hex);
  potModal.classList.add('open');
});

function openEditPotModal(name) {
  const pot = pots.find(p => p.name === name);
  if (!pot) return;
  editingPotName = name;
  potModalTitle.textContent = 'Edit Pot';
  potModalDesc.textContent = 'If your saving targets change, feel free to update your pots.';
  potModalSubmit.textContent = 'Save Changes';
  potNameInput.value = pot.name;
  potTargetInput.value = pot.target;
  buildColorPicker('potColorPicker', pot.theme);
  potModal.classList.add('open');
  document.querySelectorAll('.actions-menu.open').forEach(m => m.classList.remove('open'));
}

potModalClose.addEventListener('click', () => potModal.classList.remove('open'));
potModal.addEventListener('click', (e) => { if (e.target === potModal) potModal.classList.remove('open'); });

potModalSubmit.addEventListener('click', () => {
  const name = potNameInput.value.trim();
  const target = parseFloat(potTargetInput.value);

  if (!name) return alert('Please enter a pot name.');
  if (!target || target <= 0) return alert('Please enter a valid target amount.');

  if (editingPotName) {
    const idx = pots.findIndex(p => p.name === editingPotName);
    pots[idx] = { ...pots[idx], name, target, theme: selectedColor };
  } else {
    if (pots.some(p => p.name === name)) return alert('A pot with this name already exists.');
    pots.push({ name, target, total: 0, theme: selectedColor });
  }

  saveData();
  renderPots();
  potModal.classList.remove('open');
});

// =====================
// DELETE POT MODAL
// =====================
const deletePotModal = document.getElementById('deletePotModal');
const deletePotTitle = document.getElementById('deletePotTitle');
const deletePotConfirm = document.getElementById('deletePotConfirm');
const deletePotCancel = document.getElementById('deletePotCancel');
const deletePotClose = document.getElementById('deletePotClose');

function openDeletePotModal(name) {
  deletingPotName = name;
  deletePotTitle.textContent = `Delete '${name}'`;
  deletePotModal.classList.add('open');
  document.querySelectorAll('.actions-menu.open').forEach(m => m.classList.remove('open'));
}

deletePotClose.addEventListener('click', () => deletePotModal.classList.remove('open'));
deletePotCancel.addEventListener('click', () => deletePotModal.classList.remove('open'));
deletePotModal.addEventListener('click', (e) => { if (e.target === deletePotModal) deletePotModal.classList.remove('open'); });

deletePotConfirm.addEventListener('click', () => {
  pots = pots.filter(p => p.name !== deletingPotName);
  saveData();
  renderPots();
  deletePotModal.classList.remove('open');
});

// =====================
// ADD MONEY MODAL
// =====================
const addMoneyModal = document.getElementById('addMoneyModal');
const addMoneyClose = document.getElementById('addMoneyClose');
const addMoneyAmount = document.getElementById('addMoneyAmount');
const addMoneyNewAmount = document.getElementById('addMoneyNewAmount');
const addMoneyCurrentFill = document.getElementById('addMoneyCurrentFill');
const addMoneyDeltaFill = document.getElementById('addMoneyDeltaFill');
const addMoneyPct = document.getElementById('addMoneyPct');
const addMoneyTarget = document.getElementById('addMoneyTarget');
const addMoneyConfirm = document.getElementById('addMoneyConfirm');

function openAddMoneyModal(name) {
  activePotName = name;
  const pot = pots.find(p => p.name === name);
  document.getElementById('addMoneyTitle').textContent = `Add to '${name}'`;
  addMoneyAmount.value = '';
  addMoneyTarget.textContent = fmt(pot.target);
  updateAddMoneyDisplay(pot, 0);
  addMoneyModal.classList.add('open');
}

function updateAddMoneyDisplay(pot, delta) {
  const newTotal = Math.min(pot.total + delta, pot.target);
  const basePct = Math.min((pot.total / pot.target) * 100, 100);
  const newPct = Math.min((newTotal / pot.target) * 100, 100);
  const deltaPct = newPct - basePct;

  addMoneyNewAmount.textContent = fmt(newTotal);
  addMoneyCurrentFill.style.width = basePct + '%';
  addMoneyCurrentFill.style.background = pots.find(p => p.name === activePotName)?.theme || '#277C78';
  addMoneyDeltaFill.style.left = basePct + '%';
  addMoneyDeltaFill.style.width = Math.max(0, deltaPct) + '%';
  addMoneyDeltaFill.style.background = 'rgba(46,125,82,0.35)';
  addMoneyPct.textContent = newPct.toFixed(1) + '%';
}

addMoneyAmount.addEventListener('input', () => {
  const pot = pots.find(p => p.name === activePotName);
  const delta = parseFloat(addMoneyAmount.value) || 0;
  updateAddMoneyDisplay(pot, delta);
});

addMoneyClose.addEventListener('click', () => addMoneyModal.classList.remove('open'));
addMoneyModal.addEventListener('click', (e) => { if (e.target === addMoneyModal) addMoneyModal.classList.remove('open'); });

addMoneyConfirm.addEventListener('click', () => {
  const amount = parseFloat(addMoneyAmount.value);
  if (!amount || amount <= 0) return alert('Please enter a valid amount.');
  const idx = pots.findIndex(p => p.name === activePotName);
  pots[idx].total = Math.min(pots[idx].total + amount, pots[idx].target);
  saveData();
  renderPots();
  addMoneyModal.classList.remove('open');
});

// =====================
// WITHDRAW MODAL
// =====================
const withdrawModal = document.getElementById('withdrawModal');
const withdrawClose = document.getElementById('withdrawClose');
const withdrawAmount = document.getElementById('withdrawAmount');
const withdrawNewAmount = document.getElementById('withdrawNewAmount');
const withdrawCurrentFill = document.getElementById('withdrawCurrentFill');
const withdrawDeltaFill = document.getElementById('withdrawDeltaFill');
const withdrawPct = document.getElementById('withdrawPct');
const withdrawTarget = document.getElementById('withdrawTarget');
const withdrawConfirm = document.getElementById('withdrawConfirm');

function openWithdrawModal(name) {
  activePotName = name;
  const pot = pots.find(p => p.name === name);
  document.getElementById('withdrawTitle').textContent = `Withdraw from '${name}'`;
  withdrawAmount.value = '';
  withdrawTarget.textContent = fmt(pot.target);
  updateWithdrawDisplay(pot, 0);
  withdrawModal.classList.add('open');
}

function updateWithdrawDisplay(pot, delta) {
  const newTotal = Math.max(pot.total - delta, 0);
  const basePct = Math.min((pot.total / pot.target) * 100, 100);
  const newPct = Math.min((newTotal / pot.target) * 100, 100);
  const deltaPct = basePct - newPct;

  withdrawNewAmount.textContent = fmt(newTotal);
  withdrawCurrentFill.style.width = newPct + '%';
  withdrawCurrentFill.style.background = pots.find(p => p.name === activePotName)?.theme || '#277C78';
  withdrawDeltaFill.style.left = newPct + '%';
  withdrawDeltaFill.style.width = Math.max(0, deltaPct) + '%';
  withdrawPct.textContent = newPct.toFixed(1) + '%';
}

withdrawAmount.addEventListener('input', () => {
  const pot = pots.find(p => p.name === activePotName);
  const delta = parseFloat(withdrawAmount.value) || 0;
  updateWithdrawDisplay(pot, delta);
});

withdrawClose.addEventListener('click', () => withdrawModal.classList.remove('open'));
withdrawModal.addEventListener('click', (e) => { if (e.target === withdrawModal) withdrawModal.classList.remove('open'); });

withdrawConfirm.addEventListener('click', () => {
  const amount = parseFloat(withdrawAmount.value);
  if (!amount || amount <= 0) return alert('Please enter a valid amount.');
  const idx = pots.findIndex(p => p.name === activePotName);
  if (amount > pots[idx].total) return alert(`You only have ${fmt(pots[idx].total)} in this pot.`);
  pots[idx].total = Math.max(pots[idx].total - amount, 0);
  saveData();
  renderPots();
  withdrawModal.classList.remove('open');
});

// =====================
// INIT
// =====================
loadData().then(renderPots).catch(err => console.error(err));
