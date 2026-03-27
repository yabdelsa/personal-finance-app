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
let allTransactions = [];
let budgets = [];
let editingCategory = null;
let deletingCategory = null;
let selectedColor = THEMES[0].hex;

async function loadData() {
  const res = await fetch('./data.json');
  const data = await res.json();
  allTransactions = data.transactions;
  const saved = localStorage.getItem('finance_budgets');
  budgets = saved ? JSON.parse(saved) : data.budgets;
}

function saveData() {
  localStorage.setItem('finance_budgets', JSON.stringify(budgets));
}

// =====================
// SPENDING CALCULATION
// =====================
function getSpending(category) {
  const dates = allTransactions.map(t => new Date(t.date));
  const maxDate = new Date(Math.max(...dates));
  return allTransactions
    .filter(t => {
      const d = new Date(t.date);
      return t.category === category &&
        t.amount < 0 &&
        d.getFullYear() === maxDate.getFullYear() &&
        d.getMonth() === maxDate.getMonth();
    })
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

function getRecentTransactions(category, limit = 3) {
  return allTransactions
    .filter(t => t.category === category && t.amount < 0)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, limit);
}

function fmt(n) {
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// =====================
// DONUT CHART
// =====================
function renderDonut() {
  const svg = document.getElementById('budgetDonut');
  svg.innerHTML = '';
  const NS = 'http://www.w3.org/2000/svg';
  const cx = 120, cy = 120, r = 88, sw = 32;
  const circ = 2 * Math.PI * r;
  const total = budgets.reduce((s, b) => s + b.maximum, 0);
  const totalSpent = budgets.reduce((s, b) => s + getSpending(b.category), 0);

  // Background
  const bg = document.createElementNS(NS, 'circle');
  bg.setAttribute('cx', cx); bg.setAttribute('cy', cy); bg.setAttribute('r', r);
  bg.setAttribute('fill', 'none'); bg.setAttribute('stroke', '#f0ede8');
  bg.setAttribute('stroke-width', sw);
  svg.appendChild(bg);

  let cumLen = 0;
  const gap = 4;
  budgets.forEach(b => {
    const frac = b.maximum / total;
    const segLen = frac * circ - gap;
    if (segLen <= 0) return;
    const circle = document.createElementNS(NS, 'circle');
    circle.setAttribute('cx', cx); circle.setAttribute('cy', cy); circle.setAttribute('r', r);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', b.theme);
    circle.setAttribute('stroke-width', sw);
    circle.setAttribute('stroke-dasharray', `${segLen} ${circ - segLen}`);
    circle.setAttribute('stroke-dashoffset', circ * 0.25 - cumLen);
    svg.appendChild(circle);
    cumLen += frac * circ;
  });

  document.getElementById('donutSpentTotal').textContent = fmt(totalSpent);
  document.getElementById('donutMaxTotal').textContent = fmt(total);
}

// =====================
// LEGEND
// =====================
function renderLegend() {
  const legendEl = document.getElementById('legendList');
  legendEl.innerHTML = '';
  budgets.forEach(b => {
    const spent = getSpending(b.category);
    const li = document.createElement('li');
    li.className = 'legend-item';
    li.innerHTML = `
      <div class="legend-bar" style="background:${b.theme}"></div>
      <div>
        <div class="legend-info-cat">${b.category}</div>
        <div class="legend-info-spent">${fmt(spent)}</div>
        <div class="legend-info-max">of ${fmt(b.maximum)}</div>
      </div>
    `;
    legendEl.appendChild(li);
  });
}

// =====================
// BUDGET CARDS
// =====================
function renderBudgetCards() {
  const listEl = document.getElementById('budgetsList');
  listEl.innerHTML = '';

  if (budgets.length === 0) {
    listEl.innerHTML = '<div class="empty-state"><p>No budgets yet. Add one to get started!</p></div>';
    return;
  }

  budgets.forEach(budget => {
    const spent = getSpending(budget.category);
    const remaining = Math.max(0, budget.maximum - spent);
    const pct = Math.min((spent / budget.maximum) * 100, 100);
    const recentTxns = getRecentTransactions(budget.category);

    const card = document.createElement('div');
    card.className = 'budget-card';
    card.innerHTML = `
      <div class="budget-card-header">
        <div class="budget-category-title">
          <div class="budget-color-dot" style="background:${budget.theme}"></div>
          <h2 class="budget-category-name">${budget.category}</h2>
        </div>
        <div class="actions-dropdown">
          <button class="budget-actions-btn" data-category="${budget.category}">
            <img src="./assets/images/icon-ellipsis.svg" />
          </button>
          <div class="actions-menu" id="menu-${CSS.escape(budget.category)}">
            <button class="actions-menu-item edit-budget" data-category="${budget.category}">Edit Budget</button>
            <button class="actions-menu-item danger delete-budget" data-category="${budget.category}">Delete Budget</button>
          </div>
        </div>
      </div>

      <p class="budget-max-label">Maximum of <span>${fmt(budget.maximum)}</span></p>

      <div class="budget-progress-track">
        <div class="budget-progress-fill" style="width:${pct}%;background:${budget.theme}"></div>
      </div>

      <div class="budget-progress-stats">
        <div class="budget-stat">
          <div class="budget-stat-bar" style="background:${budget.theme}"></div>
          <div>
            <div class="budget-stat-label">Spent</div>
            <div class="budget-stat-value">${fmt(spent)}</div>
          </div>
        </div>
        <div class="budget-stat">
          <div class="budget-stat-bar" style="background:#f0ede8"></div>
          <div>
            <div class="budget-stat-label">Remaining</div>
            <div class="budget-stat-value">${fmt(remaining)}</div>
          </div>
        </div>
      </div>

      <div class="budget-txns">
        <div class="budget-txns-header">
          <span class="budget-txns-title">Latest Spending</span>
          <a href="transactions.html?category=${encodeURIComponent(budget.category)}" class="budget-txns-link">
            See All <img src="./assets/images/icon-caret-right.svg" style="width:5px;"/>
          </a>
        </div>
        <ul class="budget-txns-list">
          ${recentTxns.length === 0
            ? '<li style="padding:0.6rem 0;font-size:0.82rem;color:#9ca3af;">No transactions this month</li>'
            : recentTxns.map(t => `
              <li class="budget-txn-row">
                <div class="budget-txn-left">
                  <div class="budget-txn-avatar">
                    <img src="${t.avatar}" alt="${t.name}" onerror="this.parentNode.textContent='${t.name.charAt(0)}'"/>
                  </div>
                  <div>
                    <div class="budget-txn-name">${t.name}</div>
                    <div class="budget-txn-date">${new Date(t.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </div>
                </div>
                <div class="budget-txn-amount expense">-${fmt(t.amount)}</div>
              </li>
            `).join('')
          }
        </ul>
      </div>
    `;

    listEl.appendChild(card);
  });

  // Ellipsis menu toggle
  document.querySelectorAll('.budget-actions-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const cat = btn.dataset.category;
      const menu = document.getElementById(`menu-${CSS.escape(cat)}`);
      document.querySelectorAll('.actions-menu.open').forEach(m => { if (m !== menu) m.classList.remove('open'); });
      menu.classList.toggle('open');
    });
  });

  document.querySelectorAll('.edit-budget').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(btn.dataset.category));
  });

  document.querySelectorAll('.delete-budget').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(btn.dataset.category));
  });
}

function renderAll() {
  renderDonut();
  renderLegend();
  renderBudgetCards();
}

// Close menus on outside click
document.addEventListener('click', () => {
  document.querySelectorAll('.actions-menu.open').forEach(m => m.classList.remove('open'));
});

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
// ADD BUDGET MODAL
// =====================
const budgetModal = document.getElementById('budgetModal');
const budgetModalTitle = document.getElementById('budgetModalTitle');
const budgetModalDesc = document.getElementById('budgetModalDesc');
const budgetModalClose = document.getElementById('budgetModalClose');
const budgetModalSubmit = document.getElementById('budgetModalSubmit');
const budgetCategory = document.getElementById('budgetCategory');
const budgetMaximum = document.getElementById('budgetMaximum');

document.getElementById('addBudgetBtn').addEventListener('click', () => {
  editingCategory = null;
  budgetModalTitle.textContent = 'Add New Budget';
  budgetModalDesc.textContent = 'Choose a category to set a spending budget. These categories can help you monitor spending.';
  budgetModalSubmit.textContent = 'Add Budget';
  budgetCategory.value = 'Entertainment';
  budgetMaximum.value = '';
  buildColorPicker('budgetColorPicker', THEMES[0].hex);

  // Disable already-used categories in dropdown
  const usedCats = budgets.map(b => b.category);
  Array.from(budgetCategory.options).forEach(opt => {
    opt.disabled = usedCats.includes(opt.value);
  });
  // Select first non-disabled
  const firstAvail = Array.from(budgetCategory.options).find(o => !o.disabled);
  if (firstAvail) budgetCategory.value = firstAvail.value;

  budgetModal.classList.add('open');
});

function openEditModal(category) {
  const budget = budgets.find(b => b.category === category);
  if (!budget) return;
  editingCategory = category;

  budgetModalTitle.textContent = 'Edit Budget';
  budgetModalDesc.textContent = 'As your budgets change, feel free to update your spending limits.';
  budgetModalSubmit.textContent = 'Save Changes';
  budgetCategory.value = category;
  budgetMaximum.value = budget.maximum;
  buildColorPicker('budgetColorPicker', budget.theme);

  // Disable other used categories (but allow current)
  const usedCats = budgets.filter(b => b.category !== category).map(b => b.category);
  Array.from(budgetCategory.options).forEach(opt => {
    opt.disabled = usedCats.includes(opt.value);
  });

  budgetModal.classList.add('open');
  document.querySelectorAll('.actions-menu.open').forEach(m => m.classList.remove('open'));
}

budgetModalClose.addEventListener('click', () => budgetModal.classList.remove('open'));
budgetModal.addEventListener('click', (e) => { if (e.target === budgetModal) budgetModal.classList.remove('open'); });

budgetModalSubmit.addEventListener('click', () => {
  const cat = budgetCategory.value;
  const max = parseFloat(budgetMaximum.value);

  if (!cat) return alert('Please select a category.');
  if (!max || max <= 0) return alert('Please enter a valid maximum amount.');

  if (editingCategory) {
    const idx = budgets.findIndex(b => b.category === editingCategory);
    budgets[idx] = { category: cat, maximum: max, theme: selectedColor };
  } else {
    if (budgets.some(b => b.category === cat)) return alert('A budget for this category already exists.');
    budgets.push({ category: cat, maximum: max, theme: selectedColor });
  }

  saveData();
  renderAll();
  budgetModal.classList.remove('open');
});

// =====================
// DELETE MODAL
// =====================
const deleteBudgetModal = document.getElementById('deleteBudgetModal');
const deleteBudgetTitle = document.getElementById('deleteBudgetTitle');
const deleteBudgetConfirm = document.getElementById('deleteBudgetConfirm');
const deleteBudgetCancel = document.getElementById('deleteBudgetCancel');
const deleteBudgetClose = document.getElementById('deleteBudgetClose');

function openDeleteModal(category) {
  deletingCategory = category;
  deleteBudgetTitle.textContent = `Delete '${category}'`;
  deleteBudgetModal.classList.add('open');
  document.querySelectorAll('.actions-menu.open').forEach(m => m.classList.remove('open'));
}

deleteBudgetClose.addEventListener('click', () => deleteBudgetModal.classList.remove('open'));
deleteBudgetCancel.addEventListener('click', () => deleteBudgetModal.classList.remove('open'));
deleteBudgetModal.addEventListener('click', (e) => { if (e.target === deleteBudgetModal) deleteBudgetModal.classList.remove('open'); });

deleteBudgetConfirm.addEventListener('click', () => {
  budgets = budgets.filter(b => b.category !== deletingCategory);
  saveData();
  renderAll();
  deleteBudgetModal.classList.remove('open');
});

// =====================
// INIT
// =====================
loadData().then(renderAll).catch(err => console.error(err));
