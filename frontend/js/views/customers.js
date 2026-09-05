/**
 * CollectionSarthi - Customers View (List & Deep Profile)
 */

const CustomersView = {
  searchTerm: "",
  riskFilter: "ALL",

  render: async function(container, customerId) {
    if (customerId) {
      return await this.renderDetail(container, customerId);
    }
    return await this.renderList(container);
  },

  renderList: async function(container) {
    const plan = Store.getPlan();

    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-2.5">
              <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Debtors & Customers</h1>
              <span id="cust-quota-pill" class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                Quota: ... / ${plan.maxCustomers}
              </span>
            </div>
            <p class="text-sm text-slate-500">Monitor credit exposure, payment health, and debtor risk scores</p>
          </div>
          <div class="flex items-center gap-2 self-start sm:self-auto">
            <button onclick="Modals.openBulkCsvModal('customers')" class="px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm flex items-center gap-1.5 active:scale-95 transition-all" title="Bulk Import Debtors from CSV">
              <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
              Bulk CSV Import
            </button>
            <button onclick="CustomersView.openAddCustomer()" class="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5 active:scale-95 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              Add Customer
            </button>
          </div>
        </div>

        <!-- Filter & Search Bar -->
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div class="w-full md:w-80 relative">
            <input type="text" id="cust-search-input" placeholder="Search customer, code, phone, city..." class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" oninput="CustomersView.handleSearch(this.value)">
            <svg class="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>

          <div class="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
            <select id="cust-risk-filter" onchange="CustomersView.handleRiskFilter(this.value)" class="text-xs font-medium border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none">
              <option value="ALL">All Debtors</option>
              ${Store.hasFeature("riskScoring") ? `
                <option value="CRITICAL">Critical Risk</option>
                <option value="HIGH RISK">High Risk</option>
                <option value="MEDIUM RISK">Medium Risk</option>
                <option value="LOW RISK">Low Risk</option>
              ` : `
                <option value="pro_locked">👑 Risk Filtering (Pro)</option>
              `}
            </select>
          </div>
        </div>

        <!-- Table Container -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="customers-table-container">
          <div class="p-8 skeleton"></div>
        </div>
      </div>
    `;

    await this.loadCustomers();
  },

  loadCustomers: async function() {
    try {
      let customers = Store.getCached("customers");
      if (!customers || customers.length === 0) {
        const res = await Api.call("getCustomers");
        customers = res.customers || [];
        Store.setCached("customers", customers);
      }
      this.allCustomers = customers;
      this.renderTable();
    } catch (err) {
      document.getElementById("customers-table-container").innerHTML = `
        <div class="p-6 text-sm text-red-600">Failed to load customers: ${err.message}</div>
      `;
    }
  },

  handleSearch: function(val) {
    this.searchTerm = val.toLowerCase();
    this.renderTable();
  },

  handleRiskFilter: function(val) {
    if (val === "pro_locked") {
      Modals.openUpgradeModal(
        "Bad Debt Risk Scoring",
        "Target high-risk accounts before they turn into bad debt. Bad debt scoring and filters are unlocked in Growth Plan (Sarthi Pro)."
      );
      const sel = document.getElementById("cust-risk-filter");
      if (sel) sel.value = "ALL";
      this.riskFilter = "ALL";
      return;
    }
    this.riskFilter = val;
    this.renderTable();
  },

  openAddCustomer: function() {
    const count = (this.allCustomers || []).length;
    const plan = Store.getPlan();
    if (!Store.canAddCustomer(count)) {
      Modals.openUpgradeModal(
        `Debtor Limit Reached (${count} / ${plan.maxCustomers})`,
        `Your ${plan.name} allows up to ${plan.maxCustomers} active customers. Upgrade to Growth Plan (Sarthi Pro) to manage up to 500 customers.`
      );
      return;
    }
    Modals.openNewCustomer();
  },

  renderTable: function() {
    const container = document.getElementById("customers-table-container");
    if (!container || !this.allCustomers) return;

    const plan = Store.getPlan();
    const quotaPill = document.getElementById("cust-quota-pill");
    if (quotaPill) {
      const isOver = this.allCustomers.length >= plan.maxCustomers;
      quotaPill.className = `px-2.5 py-0.5 rounded-full text-xs font-bold ${
        isOver ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
      }`;
      quotaPill.innerText = `Debtors: ${this.allCustomers.length} / ${plan.maxCustomers}`;
    }

    let filtered = this.allCustomers.filter(c => {
      const matchSearch =
        !this.searchTerm ||
        (c.CustomerName && c.CustomerName.toLowerCase().includes(this.searchTerm)) ||
        (c.CustomerCode && c.CustomerCode.toLowerCase().includes(this.searchTerm)) ||
        (c.Phone && c.Phone.includes(this.searchTerm)) ||
        (c.City && c.City.toLowerCase().includes(this.searchTerm));

      const matchRisk =
        this.riskFilter === "ALL" ||
        (c.metrics && c.metrics.level === this.riskFilter);

      return matchSearch && matchRisk;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="p-12 text-center text-slate-400">
          <svg class="w-10 h-10 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          <p class="text-sm font-medium">No customers match your criteria.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-700">
          <thead class="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th class="px-5 py-3">Customer / Business</th>
              <th class="px-5 py-3">City & Contact</th>
              <th class="px-5 py-3">Credit Limit</th>
              <th class="px-5 py-3 text-right">Outstanding</th>
              <th class="px-5 py-3">Collection Risk</th>
              <th class="px-5 py-3 text-center">Quick Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-normal">
            ${filtered.map(c => {
              const m = c.metrics || { totalOutstanding: 0, level: "LOW RISK", score: 0 };
              return `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <td class="px-5 py-3.5">
                    <a href="#/customer/${c.CustomerID}" class="font-bold text-slate-900 hover:text-indigo-600 block">
                      ${Utils.escapeHtml(c.CustomerName)}
                    </a>
                    <span class="text-xs text-slate-400 font-mono">${c.CustomerCode || ""}</span>
                  </td>
                  <td class="px-5 py-3.5 text-xs text-slate-600">
                    <div>${c.City || "-"}</div>
                    <div class="text-slate-400">${c.Phone || "-"}</div>
                  </td>
                  <td class="px-5 py-3.5 text-xs text-slate-600 font-medium">
                    ${Utils.formatCurrency(c.CreditLimit)}
                    <span class="text-slate-400 block">${c.CreditDays || 30} Days</span>
                  </td>
                  <td class="px-5 py-3.5 text-right font-bold text-slate-900">
                    ${Utils.formatCurrency(m.totalOutstanding)}
                    ${m.maxOverdueDays > 0 ? `<span class="text-xs font-normal text-rose-500 block">${m.maxOverdueDays}d overdue</span>` : ''}
                  </td>
                  <td class="px-5 py-3.5">
                    ${Store.hasFeature("riskScoring") && m.level ? Utils.getRiskBadge(m.level, m.score) : '<span class="text-xs text-slate-400 font-medium">Standard</span>'}
                  </td>
                  <td class="px-5 py-3.5 text-center">
                    <div class="inline-flex items-center gap-1.5">
                      <a href="${Utils.getTelUrl(c.Phone)}" class="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100" title="Call">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                      </a>
                      <button onclick="Modals.openWhatsAppSender('${c.WhatsApp || c.Phone}', '${Utils.escapeHtml(c.CustomerName)}', ${m.totalOutstanding}, '${c.CustomerID}')" class="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100" title="WhatsApp">
                        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                      </button>
                      <button onclick="Modals.openRecordPayment({ customerId: '${c.CustomerID}', amount: ${m.totalOutstanding} })" class="px-2.5 py-1 rounded-md bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700">
                        Pay
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    `;
  },

  renderDetail: async function(container, customerId) {
    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex items-center gap-2 text-sm text-slate-500 mb-2">
          <a href="#/customers" class="hover:text-slate-800">&larr; Back to Customers</a>
        </div>
        <div id="customer-detail-content" class="h-96 skeleton rounded-2xl"></div>
      </div>
    `;

    try {
      const data = await Api.call("getCustomer", { customerId });
      const c = data.customer || {};
      const m = data.metrics || {};
      const invoices = data.invoices || [];
      const payments = data.payments || [];
      const followups = data.followups || [];

      const utilPercent = c.CreditLimit ? Math.min(100, Math.round((m.totalOutstanding / c.CreditLimit) * 100)) : 0;

      const detailContent = document.getElementById("customer-detail-content");
      detailContent.classList.remove("skeleton", "h-96");

      detailContent.innerHTML = `
        <div class="space-y-6">
          <!-- Profile Card -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <div class="flex items-center gap-3">
                  <h1 class="text-2xl font-bold text-slate-900">${Utils.escapeHtml(c.CustomerName)}</h1>
                  ${Utils.getRiskBadge(m.level, m.score)}
                </div>
                <p class="text-xs text-slate-500 mt-1">Code: ${c.CustomerCode} | GSTIN: ${c.GSTIN || 'N/A'} | City: ${c.City || '-'}</p>
              </div>

              <!-- Quick Recovery Actions -->
              <div class="flex flex-wrap items-center gap-2">
                <a href="${Utils.getTelUrl(c.Phone)}" class="px-3.5 py-2 text-sm font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  Call
                </a>
                <button onclick="Modals.openWhatsAppSender('${c.WhatsApp || c.Phone}', '${Utils.escapeHtml(c.CustomerName)}', ${m.totalOutstanding})" class="px-3.5 py-2 text-sm font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                  WhatsApp
                </button>
                <button onclick="Modals.openFollowUp('${c.CustomerID}', '${Utils.escapeHtml(c.CustomerName)}')" class="px-3.5 py-2 text-sm font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                  Add Follow-Up
                </button>
                <button onclick="Modals.openRecordPayment({ customerId: '${c.CustomerID}', amount: ${m.totalOutstanding} })" class="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 flex items-center gap-1.5">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  Record Payment
                </button>
              </div>
            </div>

            <!-- Financial Metrics Strip -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
              <div>
                <span class="text-xs uppercase font-medium text-slate-500">Total Outstanding</span>
                <div class="text-xl font-bold text-slate-900 mt-0.5">${Utils.formatCurrency(m.totalOutstanding)}</div>
              </div>
              <div>
                <span class="text-xs uppercase font-medium text-slate-500">Max Overdue Days</span>
                <div class="text-xl font-bold ${m.maxOverdueDays > 0 ? 'text-rose-600' : 'text-slate-900'} mt-0.5">${m.maxOverdueDays} Days</div>
              </div>
              <div>
                <span class="text-xs uppercase font-medium text-slate-500">Credit Limit</span>
                <div class="text-xl font-bold text-slate-900 mt-0.5">${Utils.formatCurrency(c.CreditLimit)}</div>
                <div class="text-xs text-slate-400 mt-1">${utilPercent}% Utilized</div>
              </div>
              <div>
                <span class="text-xs uppercase font-medium text-slate-500">Broken Promises</span>
                <div class="text-xl font-bold ${m.brokenPromises > 0 ? 'text-red-600' : 'text-slate-900'} mt-0.5">${m.brokenPromises}</div>
              </div>
            </div>
          </div>

          <!-- Tabs: Invoices / Payments / Follow-ups -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="border-b border-slate-200 px-6 py-4">
              <h2 class="text-base font-bold text-slate-900">Invoice Ledger (${invoices.length})</h2>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-left text-sm">
                <thead class="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th class="px-5 py-3">Invoice No</th>
                    <th class="px-5 py-3">Invoice Date</th>
                    <th class="px-5 py-3">Due Date</th>
                    <th class="px-5 py-3 text-right">Invoice Amount</th>
                    <th class="px-5 py-3 text-right">Paid Amount</th>
                    <th class="px-5 py-3 text-right">Outstanding</th>
                    <th class="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                  ${invoices.map(inv => `
                    <tr>
                      <td class="px-5 py-3 font-semibold text-slate-900">${inv.InvoiceNo}</td>
                      <td class="px-5 py-3 text-xs text-slate-500">${Utils.formatDate(inv.InvoiceDate)}</td>
                      <td class="px-5 py-3 text-xs text-slate-500">${Utils.formatDate(inv.DueDate)}</td>
                      <td class="px-5 py-3 text-right font-medium">${Utils.formatCurrency(inv.InvoiceAmount)}</td>
                      <td class="px-5 py-3 text-right text-emerald-600 font-medium">${Utils.formatCurrency(inv.PaidAmount)}</td>
                      <td class="px-5 py-3 text-right font-bold text-slate-900">${Utils.formatCurrency(inv.OutstandingAmount)}</td>
                      <td class="px-5 py-3 text-center">${Utils.getStatusBadge(inv.Status)}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Follow-up Activity Timeline -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 class="text-base font-bold text-slate-900">Recovery Timeline & Follow-ups (${followups.length})</h2>
            <div class="space-y-4">
              ${followups.length === 0 ? '<p class="text-sm text-slate-400 py-2">No follow-ups recorded yet.</p>' : ''}
              ${followups.map(f => `
                <div class="flex items-start gap-3 text-sm">
                  <div class="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center flex-shrink-0 text-xs">
                    ${f.FollowUpType ? f.FollowUpType[0] : 'C'}
                  </div>
                  <div class="flex-1 pb-3 border-b border-slate-100">
                    <div class="flex items-center justify-between">
                      <span class="font-semibold text-slate-800">${f.FollowUpType || 'CALL'} • <span class="text-indigo-600">${f.Outcome}</span></span>
                      <span class="text-xs text-slate-400">${Utils.formatDate(f.FollowUpDate || f.CreatedAt)}</span>
                    </div>
                    <p class="text-xs text-slate-600 mt-1">${Utils.escapeHtml(f.Remarks || 'No remarks')}</p>
                    ${f.PromiseDate ? `<div class="mt-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block">Promised ₹${Number(f.PromiseAmount).toLocaleString("en-IN")} on ${Utils.formatDate(f.PromiseDate)}</div>` : ''}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      document.getElementById("customer-detail-content").innerHTML = `
        <div class="p-6 text-sm text-red-600">Failed to load customer profile: ${err.message}</div>
      `;
    }
  }
};
