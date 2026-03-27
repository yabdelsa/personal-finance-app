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
// SETUP
// =====================
const sortSelect = document.getElementById('sortTransactions');
const categorySelect = document.getElementById('categoryFilter');
const searchInput = document.getElementById('transactionSearch');
const list = document.getElementById('transactionsList');
const paginationEl = document.getElementById('pagination');

const PER_PAGE = 10;
let currentPage = 1;
let filtered = [];

// Read URL params
const params = new URLSearchParams(window.location.search);
searchInput.value = params.get('search') || '';
if (params.get('category')) categorySelect.value = params.get('category');

// =====================
// FETCH & INIT
// =====================
fetch('./data.json')
  .then(res => res.json())
  .then(data => {
    const transactions = data.transactions;
    applyFilters(transactions);

    searchInput.addEventListener('input', () => { currentPage = 1; applyFilters(transactions); });
    sortSelect.addEventListener('change', () => { currentPage = 1; applyFilters(transactions); });
    categorySelect.addEventListener('change', () => { currentPage = 1; applyFilters(transactions); });
  });

// =====================
// FILTER & SORT
// =====================
function applyFilters(transactions) {
  const query = searchInput.value.toLowerCase();
  const category = categorySelect.value;
  const sort = sortSelect.value;

  filtered = [...transactions];

  // Search
  if (query) filtered = filtered.filter(t => t.name.toLowerCase().includes(query));

  // Category filter
  if (category && category !== 'all') filtered = filtered.filter(t => t.category === category);

  // Sort
  if (sort === 'latest') filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  else if (sort === 'oldest') filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
  else if (sort === 'az') filtered.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === 'za') filtered.sort((a, b) => b.name.localeCompare(a.name));
  else if (sort === 'highest') filtered.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
  else if (sort === 'lowest') filtered.sort((a, b) => Math.abs(a.amount) - Math.abs(b.amount));

  render();
  renderPagination();
}

// =====================
// RENDER
// =====================
function render() {
  list.innerHTML = '';

  const start = (currentPage - 1) * PER_PAGE;
  const page = filtered.slice(start, start + PER_PAGE);

  if (page.length === 0) {
    list.innerHTML = '<li style="padding:2rem;text-align:center;color:#9ca3af;font-size:0.9rem;">No transactions found.</li>';
    return;
  }

  page.forEach(t => {
    const li = document.createElement('li');
    li.className = 'transaction-row';
    li.innerHTML = `
      <div class="row-left">
        <div class="avatar">
          <img src="${t.avatar}" alt="${t.name}" onerror="this.parentNode.textContent='${t.name.charAt(0)}'"/>
        </div>
        <div class="row-info">
          <p class="row-name">${t.name}</p>
          <p class="row-category">${t.category}${t.recurring ? ' · <span style="color:#9ca3af;">Recurring</span>' : ''}</p>
        </div>
      </div>
      <div class="row-category" style="font-size:0.85rem;">${t.category}</div>
      <div class="row-date">${new Date(t.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
      <div class="row-amount ${t.amount < 0 ? 'expense' : 'income'}">
        ${t.amount < 0 ? '-' : '+'}$${Math.abs(t.amount).toFixed(2)}
      </div>
    `;
    list.appendChild(li);
  });
}

// =====================
// PAGINATION
// =====================
function renderPagination() {
  paginationEl.innerHTML = '';
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  if (totalPages <= 1) return;

  const start = (currentPage - 1) * PER_PAGE + 1;
  const end = Math.min(currentPage * PER_PAGE, filtered.length);

  const info = document.createElement('span');
  info.className = 'pagination-info';
  info.textContent = `${start}–${end} of ${filtered.length}`;
  paginationEl.appendChild(info);

  const controls = document.createElement('div');
  controls.className = 'pagination-controls';

  // Prev
  const prevBtn = document.createElement('button');
  prevBtn.className = 'page-btn';
  prevBtn.textContent = '←';
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => { currentPage--; render(); renderPagination(); });
  controls.appendChild(prevBtn);

  // Page buttons (show up to 5)
  const range = getPageRange(currentPage, totalPages);
  range.forEach(p => {
    if (p === '...') {
      const dots = document.createElement('span');
      dots.textContent = '...';
      dots.style.padding = '0 4px';
      dots.style.color = '#9ca3af';
      controls.appendChild(dots);
    } else {
      const btn = document.createElement('button');
      btn.className = 'page-btn' + (p === currentPage ? ' active' : '');
      btn.textContent = p;
      btn.addEventListener('click', () => { currentPage = p; render(); renderPagination(); });
      controls.appendChild(btn);
    }
  });

  // Next
  const nextBtn = document.createElement('button');
  nextBtn.className = 'page-btn';
  nextBtn.textContent = '→';
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => { currentPage++; render(); renderPagination(); });
  controls.appendChild(nextBtn);

  paginationEl.appendChild(controls);
}

function getPageRange(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}
