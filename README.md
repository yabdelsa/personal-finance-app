# 💰 Personal Finance App

A fully functional personal finance dashboard built with vanilla HTML, CSS, and JavaScript. Track your balance, manage budgets, organize savings pots, view transactions, and monitor recurring bills — all in one place.

---

## Pages

| Page | Description |
|------|-------------|
| **Overview** | Summary of balance, pots, budgets, recent transactions, and recurring bills |
| **Transactions** | Full transaction history with search, category filter, sort, and pagination |
| **Budgets** | Set spending limits per category with a live donut chart and progress tracking |
| **Pots** | Create savings goals, add/withdraw money, and track progress visually |
| **Recurring Bills** | View all recurring bills with paid/upcoming/due-soon status |

---

## Features

- 📊 **Live donut chart** on the budgets page showing spending vs. limits
- 💾 **Persistent data** — budgets and pots are saved in `localStorage` so changes survive page refresh
- ➕ **Full CRUD** — add, edit, and delete budgets and pots via modals
- 💸 **Add & withdraw money** from pots with a real-time progress bar preview
- 🔍 **Search, filter, and sort** on transactions and recurring bills
- 📄 **Pagination** on the transactions page (10 per page)
- 🔗 **Cross-page linking** — clicking a recurring bill takes you to that transaction
- 📱 **Collapsible sidebar** that remembers its state across all pages

---


## 📝 Data

All seed data lives in `data.json` and includes:
- Account balance (current, income, expenses)
- 50 transactions across multiple categories
- 4 default budgets (Entertainment, Bills, Dining Out, Personal Care)
- 5 default savings pots

Budgets and pots you add/edit/delete are saved in `localStorage` on top of the seed data.

---

## Live Demo

Hosted on GitHub Pages: [View Live](https://personal-finance-app-eta-five.vercel.app/)

