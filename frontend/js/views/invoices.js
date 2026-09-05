/**
 * CollectionSarthi - Invoices Ledger View
 */

const InvoicesView = {
  render: async function(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Invoice Ledger</h1>
            <p class="text-sm text-slate-500">Track all receivables, due dates, payments, and aging status</p>
          </div>
          <div class="flex items-center gap-2 self-start sm:self-auto">
            <button onclick="Modals.openBulkCsvModal('invoices')" class="px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm flex items-center gap-1.5 active:scale-95 transition-all" title="Bulk Import Invoices from CSV">
              <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
              Bulk CSV Import
            </button>
            <button onclick="InvoicesView.openNewInvoiceModal()" class="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5 active:scale-95 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              Add Invoice
            </button>
          </div>
        </div>

        <!-- Filter bar -->
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <input type="text" id="inv-search-input" placeholder="Search by Invoice # or Customer..." class="w-full md:w-80 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" oninput="InvoicesView.handleSearch(this.value)">

          <div class="flex items-center gap-2">
            <select id="inv-status-filter" onchange="InvoicesView.handleFilter(this.value)" class="text-xs font-medium border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none">
              <option value="ALL">All Invoices</option>
              <option value="OVERDUE">Overdue Only</option>
              <option value="PENDING">Pending Only</option>
              <option value="PARTIAL">Partially Paid</option>
              <option value="PAID">Fully Paid</option>
            </select>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="invoices-table-container">
          <div class="p-8 skeleton"></div>
        </div>
      </div>
    `;

    await this.loadInvoices();
  },

  loadInvoices: async function() {
    try {
      const res = await Api.call("getInvoices");
      this.invoices = res.invoices || [];
      this.renderTable();
    } catch (err) {
      document.getElementById("invoices-table-container").innerHTML = `
        <div class="p-6 text-sm text-red-600">Failed to load invoices: ${err.message}</div>
      `;
    }
  },

  handleSearch: function(val) {
    this.searchTerm = val.toLowerCase();
    this.renderTable();
  },

  handleFilter: function(status) {
    this.statusFilter = status;
    this.renderTable();
  },

  renderTable: function() {
    const container = document.getElementById("invoices-table-container");
    if (!container || !this.invoices) return;

    let filtered = this.invoices.filter(inv => {
      const matchSearch = !this.searchTerm ||
        inv.InvoiceNo.toLowerCase().includes(this.searchTerm) ||
        (inv.CustomerID && inv.CustomerID.toLowerCase().includes(this.searchTerm));
      const matchStatus = !this.statusFilter || this.statusFilter === "ALL" || inv.Status === this.statusFilter;
      return matchSearch && matchStatus;
    });

    if (filtered.length === 0) {
      container.innerHTML = `<div class="p-12 text-center text-slate-400 text-sm">No invoices found.</div>`;
      return;
    }

    container.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-700">
          <thead class="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th class="px-5 py-3">Invoice No</th>
              <th class="px-5 py-3">Invoice Date</th>
              <th class="px-5 py-3">Due Date</th>
              <th class="px-5 py-3 text-right">Invoice Amount</th>
              <th class="px-5 py-3 text-right">Paid</th>
              <th class="px-5 py-3 text-right">Outstanding</th>
              <th class="px-5 py-3 text-center">Status</th>
              <th class="px-5 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${filtered.map(inv => `
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-5 py-3.5 font-bold text-slate-900">${inv.InvoiceNo}</td>
                <td class="px-5 py-3.5 text-xs text-slate-500">${Utils.formatDate(inv.InvoiceDate)}</td>
                <td class="px-5 py-3.5 text-xs text-slate-500">${Utils.formatDate(inv.DueDate)}</td>
                <td class="px-5 py-3.5 text-right font-medium">${Utils.formatCurrency(inv.InvoiceAmount)}</td>
                <td class="px-5 py-3.5 text-right text-emerald-600 font-medium">${Utils.formatCurrency(inv.PaidAmount)}</td>
                <td class="px-5 py-3.5 text-right font-bold text-slate-900">${Utils.formatCurrency(inv.OutstandingAmount)}</td>
                <td class="px-5 py-3.5 text-center">${Utils.getStatusBadge(inv.Status)}</td>
                <td class="px-5 py-3.5 text-center">
                  ${Number(inv.OutstandingAmount) > 0 ? `
                    <button onclick="Modals.openRecordPayment({ customerId: '${inv.CustomerID}', amount: ${inv.OutstandingAmount} })" class="px-3 py-1 rounded-md bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700">
                      Pay
                    </button>
                  ` : '<span class="text-xs text-slate-400">Cleared</span>'}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  },

  openNewInvoiceModal: function() {
    const customers = Store.state.customers || [];
    const today = new Date().toISOString().split("T")[0];

    Modals.container.innerHTML = `
      <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          <div class="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
            <h3 class="text-lg font-semibold">Add New Bill / Invoice</h3>
            <button onclick="Modals.close()" class="text-slate-400 hover:text-white">&times;</button>
          </div>
          <form class="p-6 space-y-4" onsubmit="InvoicesView.submitNewInvoice(event)">
            <div>
              <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Customer <span class="text-red-500">*</span></label>
              <select name="CustomerID" required class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                <option value="">Select Customer...</option>
                ${customers.map(c => `<option value="${c.CustomerID}">${Utils.escapeHtml(c.CustomerName)}</option>`).join("")}
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Invoice No <span class="text-red-500">*</span></label>
                <input type="text" name="InvoiceNo" required placeholder="INV-2026-001" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
              </div>
              <div>
                <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Amount (₹) <span class="text-red-500">*</span></label>
                <input type="number" name="InvoiceAmount" min="1" step="any" required placeholder="50000" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Invoice Date <span class="text-red-500">*</span></label>
                <input type="date" name="InvoiceDate" required value="${today}" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
              </div>
              <div>
                <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Due Date <span class="text-red-500">*</span></label>
                <input type="date" name="DueDate" required value="${today}" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
              </div>
            </div>
            <div class="pt-2 flex justify-end space-x-3">
              <button type="button" onclick="Modals.close()" class="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg">Cancel</button>
              <button type="submit" class="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Save Invoice</button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  submitNewInvoice: async function(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    try {
      await Api.call("createInvoice", data);
      Toast.success("Invoice created successfully");
      Store.invalidate("invoices", "dashboard", "customers");
      Modals.close();
      App.router();
    } catch (err) {
      Toast.error(err.message || "Failed to create invoice");
    }
  }
};
