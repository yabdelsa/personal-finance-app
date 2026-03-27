// =====================
// MINIMIZE MENU
// =====================
const sidebar = document.getElementById('sidebar');
const minimizeBtn = document.getElementById('minimizeBtn');

const collapsed = localStorage.getItem('sidebar_collapsed') === 'true';
if (collapsed) sidebar.classList.add('collapsed');

minimizeBtn.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  localStorage.setItem('sidebar_collapsed', sidebar.classList.contains('collapsed'));
});

// =====================
// LOAD DATA
// =====================
async function loadData() {
  const res = await fetch('./data.json');
  const data = await res.json();
  const savedBudgets = localStorage.getItem('finance_budgets');
  const savedPots = localStorage.getItem('finance_pots');
  if (savedBudgets) data.budgets = JSON.parse(savedBudgets);
  if (savedPots) data.pots = JSON.parse(savedPots);
  return data;
}

function fmt(n) {
  return '$' + Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// =====================
// DONUT CHART
// =====================
function renderDonut(svgEl, budgets, transactions, cx, cy, r, strokeW) {
  svgEl.innerHTML = '';
  const NS = 'http://www.w3.org/2000/svg';
  const circ = 2 * Math.PI * r;

  // Calculate spending per category (current month)
  const dates = transactions.map(t => new Date(t.date));
  const maxDate = new Date(Math.max(...dates));
  const budgetSpending = {};
  transactions.forEach(t => {
    const d = new Date(t.date);
    if (d.getFullYear() === maxDate.getFullYear() && d.getMonth() === maxDate.getMonth()) {
      if (t.amount < 0) {
        budgetSpending[t.category] = (budgetSpending[t.category] || 0) + Math.abs(t.amount);
      }
    }
  });

  const total = budgets.reduce((s, b) => s + b.maximum, 0);

  // Background circle
  const bg = document.createElementNS(NS, 'circle');
  bg.setAttribute('cx', cx); bg.setAttribute('cy', cy); bg.setAttribute('r', r);
  bg.setAttribute('fill', 'none'); bg.setAttribute('stroke', '#f0ede8');
  bg.setAttribute('stroke-width', strokeW);
  svgEl.appendChild(bg);

  const gap = 3;
  let cumulativeLen = 0;

  budgets.forEach(budget => {
    const fraction = budget.maximum / total;
    const segLen = fraction * circ - gap;
    if (segLen <= 0) return;

    const circle = document.createElementNS(NS, 'circle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
    circle.setAttribute('r', r);
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', budget.theme);
    circle.setAttribute('stroke-width', strokeW);
    circle.setAttribute('stroke-dasharray', `${segLen} ${circ - segLen}`);
    circle.setAttribute('stroke-dashoffset', circ * 0.25 - cumulativeLen);
    circle.setAttribute('stroke-linecap', 'butt');
    svgEl.appendChild(circle);

    cumulativeLen += fraction * circ;
  });

  return budgetSpending;
}

// =====================
// RENDER
// =====================
loadData().then(data => {
  const { balance, transactions, budgets, pots } = data;

  // Balance cards
  document.getElementById('currentBalance').textContent = fmt(balance.current);
  document.getElementById('incomeBalance').textContent = fmt(balance.income);
  document.getElementById('expensesBalance').textContent = fmt(balance.expenses);

  // --- POTS ---
  const potsTotalEl = document.getElementById('potsTotalAmount');
  const potsMiniListEl = document.getElementById('potsMiniList');
  const totalSaved = pots.reduce((s, p) => s + p.total, 0);
  potsTotalEl.textContent = fmt(totalSaved);

  pots.slice(0, 4).forEach(pot => {
    const li = document.createElement('li');
    li.className = 'pot-mini-item';
    li.innerHTML = `
      <div class="pot-mini-bar" style="background:${pot.theme}"></div>
      <div class="pot-mini-info">
        <div class="pot-mini-name">${pot.name}</div>
        <div class="pot-mini-amount">${fmt(pot.total)}</div>
      </div>
    `;
    potsMiniListEl.appendChild(li);
  });

  // --- BUDGETS DONUT ---
  const svgEl = document.getElementById('overviewDonut');
  const budgetSpending = renderDonut(svgEl, budgets, transactions, 120, 120, 85, 30);

  const totalSpent = budgets.reduce((s, b) => s + (budgetSpending[b.category] || 0), 0);
  const totalLimit = budgets.reduce((s, b) => s + b.maximum, 0);
  document.getElementById('donutSpent').textContent = fmt(totalSpent);
  document.getElementById('donutLimit').textContent = fmt(totalLimit);

  const budgetMiniListEl = document.getElementById('budgetMiniList');
  budgets.forEach(budget => {
    const spent = budgetSpending[budget.category] || 0;
    const li = document.createElement('li');
    li.className = 'budget-mini-item';
    li.innerHTML = `
      <div class="budget-mini-dot" style="background:${budget.theme}"></div>
      <div class="budget-mini-info">
        <div class="budget-mini-name">${budget.category}</div>
        <div class="budget-mini-amount">${fmt(spent)} <span style="color:#9ca3af;font-weight:400">of ${fmt(budget.maximum)}</span></div>
      </div>
    `;
    budgetMiniListEl.appendChild(li);
  });

  // --- RECENT TRANSACTIONS ---
  const txListEl = document.getElementById('overviewTransactions');
  const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  sorted.slice(0, 5).forEach(t => {
    const li = document.createElement('li');
    li.className = 'overview-tx-row';
    li.innerHTML = `
      <div class="overview-tx-left">
        <div class="avatar" style="width:36px;height:36px;font-size:0.75rem;">
          <img src="${t.avatar}" alt="${t.name}" onerror="this.parentNode.textContent='${t.name.charAt(0)}'"/>
        </div>
        <div>
          <div class="overview-tx-name">${t.name}</div>
          <div class="overview-tx-date">${new Date(t.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        </div>
      </div>
      <div class="overview-tx-amount ${t.amount < 0 ? 'expense' : 'income'}">
        ${t.amount < 0 ? '-' : '+'}${fmt(t.amount)}
      </div>
    `;
    txListEl.appendChild(li);
  });

  // --- RECURRING BILLS SUMMARY ---
  const recurringEl = document.getElementById('recurringOverview');
  const recurring = transactions.filter(t => t.recurring);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const sevenDays = new Date(today); sevenDays.setDate(today.getDate() + 7);

  let paid = 0, upcoming = 0, dueSoon = 0;
  recurring.forEach(bill => {
    const d = new Date(bill.date); d.setHours(0, 0, 0, 0);
    const amt = Math.abs(bill.amount);
    if (d < today) paid += amt;
    else { upcoming += amt; if (d <= sevenDays) dueSoon += amt; }
  });

  const total = paid + upcoming;
  const items = [
    { label: 'Paid Bills', amount: paid, cls: 'paid' },
    { label: 'Total Upcoming', amount: upcoming, cls: '' },
    { label: 'Due Soon', amount: dueSoon, cls: 'due-soon' },
  ];
  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'recurring-summary-item';
    li.innerHTML = `
      <span class="recurring-item-label">${item.label}</span>
      <span class="recurring-item-amount ${item.cls}">${fmt(item.amount)}</span>
    `;
    recurringEl.appendChild(li);
  });

}).catch(err => console.error('Failed to load data:', err));
