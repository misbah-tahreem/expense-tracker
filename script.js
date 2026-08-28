// ===== STATE =====
let transactions = [];
let currentFilter = 'All';

// ===== DOM REFS =====
const form = document.getElementById('transactionForm');
const descInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const typeSelect = document.getElementById('type');
const categorySelect = document.getElementById('category');
const dateInput = document.getElementById('date');
const errorDiv = document.getElementById('formError');

const balanceDisplay = document.getElementById('balanceDisplay');
const incomeDisplay = document.getElementById('incomeDisplay');
const expenseDisplay = document.getElementById('expenseDisplay');
const transactionListEl = document.getElementById('transactionList');
const filterSelect = document.getElementById('categoryFilter');

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    renderAll();
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
});

// ===== LOCAL STORAGE =====
function loadFromLocalStorage() {
    const stored = localStorage.getItem('transactions');
    if (stored) {
        try {
            transactions = JSON.parse(stored);
        } catch (e) {
            transactions = [];
        }
    } else {
        // Seed with required test data if empty
        seedTestData();
    }
}

function saveToLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// ===== SEED TEST DATA =====
function seedTestData() {
    const testData = [
        { id: generateId(), description: 'Salary', amount: 50000, type: 'Income', category: 'Salary', date: getDateString(-2) },
        { id: generateId(), description: 'Lunch', amount: 800, type: 'Expense', category: 'Food', date: getDateString(-1) },
        { id: generateId(), description: 'Fuel', amount: 3000, type: 'Expense', category: 'Transport', date: getDateString(0) }
    ];
    transactions = testData;
    saveToLocalStorage();
}

function getDateString(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().split('T')[0];
}

// ===== ID GENERATOR =====
function generateId() {
    return Date.now() + '-' + Math.random().toString(36).substring(2, 8);
}

// ===== VALIDATION =====
function validateForm() {
    const desc = descInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const date = dateInput.value;

    if (!desc) {
        showError('Please enter a description.');
        return false;
    }
    if (!amount || amount <= 0) {
        showError('Please enter a valid amount greater than zero.');
        return false;
    }
    if (!date) {
        showError('Please select a date.');
        return false;
    }
    hideError();
    return true;
}

function showError(msg) {
    errorDiv.textContent = msg;
    errorDiv.style.display = 'block';
}

function hideError() {
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';
}

// ===== ADD TRANSACTION =====
function addTransaction(e) {
    e.preventDefault();

    if (!validateForm()) return;

    const newTransaction = {
        id: generateId(),
        description: descInput.value.trim(),
        amount: parseFloat(amountInput.value),
        type: typeSelect.value,
        category: categorySelect.value,
        date: dateInput.value
    };

    transactions.push(newTransaction);
    saveToLocalStorage();
    renderAll();
    form.reset();
    // Reset date to today
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
    descInput.focus();
}

// ===== DELETE TRANSACTION =====
function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    saveToLocalStorage();
    renderAll();
}

// ===== CALCULATIONS =====
function calculateTotals() {
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
        if (t.type === 'Income') {
            totalIncome += t.amount;
        } else if (t.type === 'Expense') {
            totalExpense += t.amount;
        }
    });

    const balance = totalIncome - totalExpense;
    return { totalIncome, totalExpense, balance };
}

// ===== RENDER =====
function renderAll() {
    const totals = calculateTotals();
    updateSummary(totals);
    renderTransactionList();
}

function updateSummary({ totalIncome, totalExpense, balance }) {
    balanceDisplay.textContent = 'Rs. ' + formatNumber(balance);
    incomeDisplay.textContent = 'Rs. ' + formatNumber(totalIncome);
    expenseDisplay.textContent = 'Rs. ' + formatNumber(totalExpense);
}

function formatNumber(num) {
    return num.toLocaleString('en-IN');
}

function renderTransactionList() {
    const filtered = getFilteredTransactions();
    const listEl = transactionListEl;

    if (filtered.length === 0) {
        listEl.innerHTML = `<div class="empty-state">No transactions yet. Add your first transaction to get started.</div>`;
        return;
    }

    let html = '';
    filtered.forEach(t => {
        const typeClass = t.type.toLowerCase();
        const sign = t.type === 'Income' ? '+' : '-';
        const amountFormatted = formatNumber(t.amount);
        html += `
            <div class="transaction-item ${typeClass}">
                <div class="transaction-info">
                    <span class="transaction-desc">${escapeHtml(t.description)}</span>
                    <span class="transaction-amount">${sign} Rs. ${amountFormatted}</span>
                </div>
                <div class="transaction-meta">
                    <span class="transaction-category">${escapeHtml(t.category)}</span>
                    <span class="transaction-date">${formatDate(t.date)}</span>
                </div>
                <div class="transaction-actions">
                    <button class="btn-delete" data-id="${t.id}" aria-label="Delete transaction">Delete</button>
                </div>
            </div>
        `;
    });

    listEl.innerHTML = html;

    // Attach delete event listeners
    listEl.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', function (e) {
            const id = this.dataset.id;
            deleteTransaction(id);
        });
    });
}

function getFilteredTransactions() {
    if (currentFilter === 'All') {
        return transactions.slice().sort((a, b) => b.id.localeCompare(a.id)); // newest first
    }
    return transactions
        .filter(t => t.category === currentFilter)
        .sort((a, b) => b.id.localeCompare(a.id));
}

// ===== HELPER FUNCTIONS =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ===== FILTER EVENT =====
filterSelect.addEventListener('change', function () {
    currentFilter = this.value;
    renderTransactionList();
});

// ===== FORM SUBMIT =====
form.addEventListener('submit', addTransaction);