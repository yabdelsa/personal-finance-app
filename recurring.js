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
// DOM ELEMENTS
// =====================
const billsList = document.getElementById('billsList');
const totalBillsAmount = document.getElementById('totalBillsAmount');
const paidBillsAmount = document.getElementById('paidBillsAmount');
const upcomingBillsAmount = document.getElementById('upcomingBillsAmount');
const dueSoonBillsAmount = document.getElementById('dueSoonBillsAmount');
const searchInput = document.getElementById('searchBills');
const sortSelect = document.getElementById('sortBills');

let recurringBills = [];
let filteredBills = [];

function fmt(n) {
  return '$' + Math.abs(n).toFixed(2);
}

// =====================
// FETCH DATA
// =====================
fetch('./data.json')
  .then(res => res.json())
  .then(data => {
    recurringBills = data.transactions.filter(t => t.recurring);
    filteredBills = [...recurringBills];
    calculateSummary(recurringBills);
    renderBills(filteredBills);
  })
  .catch(err => console.error(err));

// =====================
// SUMMARY
// =====================
function calculateSummary(bills) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDays = new Date(today);
  sevenDays.setDate(today.getDate() + 7);

  let total = 0, paid = 0, upcoming = 0, dueSoon = 0;

  bills.forEach(bill => {
    const amount = Math.abs(bill.amount);
    const billDate = new Date(bill.date);
    billDate.setHours(0, 0, 0, 0);
    total += amount;
    if (billDate < today) {
      paid += amount;
    } else {
      upcoming += amount;
      if (billDate <= sevenDays) dueSoon += amount;
    }
  });

  totalBillsAmount.textContent = fmt(total);
  paidBillsAmount.textContent = fmt(paid);
  upcomingBillsAmount.textContent = fmt(upcoming);
  dueSoonBillsAmount.textContent = fmt(dueSoon);
}

// =====================
// RENDER BILLS
// =====================
function renderBills(bills) {
  billsList.innerHTML = '';

  if (bills.length === 0) {
    billsList.innerHTML = '<li style="padding:2rem;text-align:center;color:#9ca3af;">No bills found.</li>';
    return;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDays = new Date(today);
  sevenDays.setDate(today.getDate() + 7);

  bills.forEach(bill => {
    const billDate = new Date(bill.date);
    billDate.setHours(0, 0, 0, 0);

    let badge = 'Upcoming';
    let badgeClass = 'badge-upcoming';

    if (billDate < today) {
      badge = 'Paid';
      badgeClass = 'badge-paid';
    } else if (billDate <= sevenDays) {
      badge = 'Due Soon';
      badgeClass = 'badge-due-soon';
    }

    const li = document.createElement('li');
    li.className = 'bill-item';
    li.style.cursor = 'pointer';

    li.addEventListener('click', () => {
      const query = encodeURIComponent(bill.name);
      window.location.href = `transactions.html?search=${query}`;
    });

    li.innerHTML = `
      <div class="bill-left">
        <div class="bill-avatar">
          <img src="${bill.avatar}" alt="${bill.name}" onerror="this.parentNode.textContent='${bill.name.charAt(0)}'"/>
        </div>
        <div class="bill-info">
          <p class="bill-name">
            ${bill.name}
            <span class="badge ${badgeClass}">${badge}</span>
          </p>
          <p class="bill-date">Monthly · ${billDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</p>
        </div>
      </div>
      <div class="bill-right">
        <div class="bill-amount">${fmt(bill.amount)}</div>
      </div>
    `;

    billsList.appendChild(li);
  });
}

// =====================
// SEARCH & SORT (FIXED)
// =====================
searchInput.addEventListener('input', applyFilters);
sortSelect.addEventListener('change', applyFilters);

function applyFilters() {
  const query = searchInput.value.toLowerCase();
  const sortValue = sortSelect.value;

  filteredBills = recurringBills.filter(bill =>
    bill.name.toLowerCase().includes(query)
  );

  // Fixed: values match the <option value="..."> attributes
  if (sortValue === 'latest') filteredBills.sort((a, b) => new Date(b.date) - new Date(a.date));
  else if (sortValue === 'oldest') filteredBills.sort((a, b) => new Date(a.date) - new Date(b.date));
  else if (sortValue === 'az') filteredBills.sort((a, b) => a.name.localeCompare(b.name));
  else if (sortValue === 'za') filteredBills.sort((a, b) => b.name.localeCompare(a.name));
  else if (sortValue === 'highest') filteredBills.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  else if (sortValue === 'lowest') filteredBills.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));

  renderBills(filteredBills);
}
