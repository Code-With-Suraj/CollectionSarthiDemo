/**
 * CollectionSarthi - Outstanding Aging View with Interactive Bucket Drill-Down
 */

const OutstandingView = {
  selectedBucket: "all",
  searchDebtor: "",

  render: async function(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Outstanding & Aging Analysis</h1>
            <p class="text-sm text-slate-500">Click any aging bucket below to instantly see and contact customers in that bracket</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="OutstandingView.exportCurrentBucket()" class="px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              Export Aging CSV
            </button>
          </div>
        </div>

        <div id="aging-container" class="space-y-6">
          <div class="h-64 skeleton rounded-2xl"></div>
        </div>
      </div>
    `;

    try {
      let data = Store.getCached("dashboard");
      if (!data) {
        data = await Api.call("getDashboard");
        Store.setCached("dashboard", data);
      }

      this.data = data;
      // Default to first non-empty overdue bucket or "all"
      const aging = data.aging || {};
      if (aging.d90_plus && aging.d90_plus.amount > 0) this.selectedBucket = "d90_plus";
      else if (aging.d61_90 && aging.d61_90.amount > 0) this.selectedBucket = "d61_90";
      else if (aging.d31_60 && aging.d31_60.amount > 0) this.selectedBucket = "d31_60";
      else if (aging.d1_30 && aging.d1_30.amount > 0) this.selectedBucket = "d1_30";
      else this.selectedBucket = "all";

      this.renderAgingContent();
    } catch (err) {
      document.getElementById("aging-container").innerHTML = `
        <div class="p-6 text-sm text-red-600">Failed to load aging data: ${err.message}</div>
      `;
    }
  },

  renderAgingContent: function() {
    const container = document.getElementById("aging-container");
    if (!container || !this.data) return;

    const aging = this.data.aging || {};
    const total = (this.data.kpis && this.data.kpis.totalOutstanding) || 1;

    const buckets = [
      { key: "all", label: "All Outstanding", amount: total, count: this.data.kpis ? this.data.kpis.customersWithOutstanding : 0, color: "bg-indigo-600", text: "text-indigo-700", border: "border-indigo-200" },
      { key: "current", label: "Current (Not Due)", data: aging.current || { amount: 0, count: 0, customerList: [] }, color: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-200" },
      { key: "d1_30", label: "1–30 Days Overdue", data: aging.d1_30 || { amount: 0, count: 0, customerList: [] }, color: "bg-amber-500", text: "text-amber-700", border: "border-amber-200" },
      { key: "d31_60", label: "31–60 Days Overdue", data: aging.d31_60 || { amount: 0, count: 0, customerList: [] }, color: "bg-orange-500", text: "text-orange-700", border: "border-orange-200" },
      { key: "d61_90", label: "61–90 Days Overdue", data: aging.d61_90 || { amount: 0, count: 0, customerList: [] }, color: "bg-red-500", text: "text-red-700", border: "border-red-200" },
      { key: "d90_plus", label: "90+ Days Critical", data: aging.d90_plus || { amount: 0, count: 0, customerList: [] }, color: "bg-rose-700", text: "text-rose-800", border: "border-rose-200" }
    ];

    container.innerHTML = `
      <!-- Clickable Interactive Bucket Cards -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-bold uppercase tracking-wider text-slate-500">Select Aging Bracket to Inspect Customers:</span>
          <span class="text-xs text-indigo-600 font-medium">Click card to switch view</span>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          ${buckets.map(b => {
            const isAll = b.key === "all";
            const amt = isAll ? b.amount : (b.data ? b.data.amount : 0);
            const billCount = isAll ? (this.data.kpis ? this.data.kpis.customersWithOutstanding : 0) : (b.data ? b.data.count : 0);
            const custList = isAll ? [] : (b.data ? (b.data.customerList || []) : []);
            const debtorCount = isAll ? (this.data.kpis ? this.data.kpis.customersWithOutstanding : 0) : custList.length;
            const pct = isAll ? 100 : Math.round((amt / total) * 100);
            const isSelected = this.selectedBucket === b.key;

            return `
              <div onclick="OutstandingView.selectBucket('${b.key}')" class="cursor-pointer transition-all duration-200 rounded-2xl p-4 border ${isSelected ? 'ring-2 ring-indigo-600 shadow-md bg-white ' + b.border : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-sm'}">
                <div class="flex items-center justify-between mb-1.5">
                  <div class="flex items-center gap-1.5 min-w-0">
                    <span class="w-2.5 h-2.5 rounded-full ${b.color} flex-shrink-0"></span>
                    <span class="text-xs font-bold text-slate-700 truncate">${b.label}</span>
                  </div>
                  ${isSelected ? '<span class="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-indigo-600 text-white">Active</span>' : ''}
                </div>

                <div class="text-lg font-extrabold text-slate-900 mt-1">${Utils.formatCurrency(amt)}</div>
                
                <div class="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-100 text-slate-500">
                  <span>${debtorCount} ${debtorCount === 1 ? 'debtor' : 'debtors'}</span>
                  <span class="font-bold ${b.text}">${pct}%</span>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>

      <!-- Chart and Summary Accordion -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Donut Chart -->
        <div class="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
          <div class="w-full flex justify-between items-center mb-2">
            <h3 class="text-sm font-bold text-slate-900">Distribution</h3>
            <span class="text-xs text-slate-400">Total: ${Utils.formatCurrency(total, true)}</span>
          </div>
          <div class="w-52 h-52 relative my-2">
            <canvas id="aging-chart-canvas"></canvas>
          </div>
          <p class="text-[11px] text-slate-400 text-center">Click segments or cards above to filter debtors</p>
        </div>

        <!-- Aging Table Summary -->
        <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="text-sm font-bold text-slate-900">Summary Statement</h3>
            <span class="text-xs font-semibold text-slate-500">Click any row to filter</span>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th class="px-4 py-2.5">Aging Bracket</th>
                  <th class="px-4 py-2.5 text-right">Bills</th>
                  <th class="px-4 py-2.5 text-right">Debtors</th>
                  <th class="px-4 py-2.5 text-right">Amount (₹)</th>
                  <th class="px-4 py-2.5 text-right">Share</th>
                  <th class="px-4 py-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${buckets.filter(b => b.key !== "all").map(b => {
                  const amt = b.data ? b.data.amount : 0;
                  const cList = b.data ? (b.data.customerList || []) : [];
                  const pct = Math.round((amt / total) * 100);
                  const isSel = this.selectedBucket === b.key;
                  return `
                    <tr onclick="OutstandingView.selectBucket('${b.key}')" class="cursor-pointer transition-colors ${isSel ? 'bg-indigo-50/50 font-bold' : 'hover:bg-slate-50'}">
                      <td class="px-4 py-3 text-slate-800 flex items-center gap-2">
                        <span class="w-2.5 h-2.5 rounded-full ${b.color}"></span>
                        <span class="${isSel ? 'text-indigo-700 font-bold' : 'font-medium'}">${b.label}</span>
                      </td>
                      <td class="px-4 py-3 text-right text-slate-600">${b.data ? b.data.count : 0}</td>
                      <td class="px-4 py-3 text-right text-slate-700 font-semibold">${cList.length}</td>
                      <td class="px-4 py-3 text-right font-bold text-slate-900">${Utils.formatCurrency(amt)}</td>
                      <td class="px-4 py-3 text-right font-semibold ${b.text}">${pct}%</td>
                      <td class="px-4 py-3 text-center">
                        <button class="text-xs px-2 py-0.5 rounded ${isSel ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                          ${isSel ? 'Selected' : 'View'}
                        </button>
                      </td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Real-Time Customer Breakdown Panel for Selected Bucket -->
      <div id="selected-bucket-debtors-panel" class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4"></div>
    `;

    // Render the debtors list for current bucket
    this.renderDebtorsPanel();

    // Render Chart.js Donut
    setTimeout(() => {
      const canvas = document.getElementById("aging-chart-canvas");
      if (canvas && window.Chart) {
        const nonAllBuckets = buckets.filter(b => b.key !== "all");
        new Chart(canvas, {
          type: "doughnut",
          data: {
            labels: nonAllBuckets.map(b => b.label),
            datasets: [{
              data: nonAllBuckets.map(b => b.data ? b.data.amount : 0),
              backgroundColor: ["#10b981", "#f59e0b", "#f97316", "#ef4444", "#be123c"],
              borderWidth: 2,
              borderColor: "#ffffff"
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            cutout: "70%",
            onClick: (evt, elements) => {
              if (elements.length > 0) {
                const idx = elements[0].index;
                const clickedKey = nonAllBuckets[idx].key;
                OutstandingView.selectBucket(clickedKey);
              }
            }
          }
        });
      }
    }, 50);
  },

  selectBucket: function(bucketKey) {
    this.selectedBucket = bucketKey;
    this.searchDebtor = "";
    this.renderAgingContent();
    
    // Smooth scroll down to panel
    const panel = document.getElementById("selected-bucket-debtors-panel");
    if (panel) {
      panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  },

  renderDebtorsPanel: function() {
    const panel = document.getElementById("selected-bucket-debtors-panel");
    if (!panel || !this.data) return;

    const aging = this.data.aging || {};
    let bucketTitle = "All Debtors";
    let debtors = [];
    let bucketAmount = 0;

    if (this.selectedBucket === "all") {
      bucketTitle = "All Customers with Outstanding Balances";
      // Aggregate from all buckets or priority list
      const seen = {};
      const allBuckets = ["d90_plus", "d61_90", "d31_60", "d1_30", "current"];
      allBuckets.forEach(bKey => {
        const b = aging[bKey];
        if (b && b.customerList) {
          b.customerList.forEach(c => {
            if (!seen[c.customerId]) {
              seen[c.customerId] = { ...c };
              debtors.push(seen[c.customerId]);
            } else {
              seen[c.customerId].amount += c.amount;
              seen[c.customerId].invoiceCount += c.invoiceCount;
              if (c.maxOverdueDays > seen[c.customerId].maxOverdueDays) {
                seen[c.customerId].maxOverdueDays = c.maxOverdueDays;
              }
              seen[c.customerId].invoices = [...seen[c.customerId].invoices, ...c.invoices];
            }
          });
        }
      });
      bucketAmount = this.data.kpis ? this.data.kpis.totalOutstanding : 0;
    } else {
      const bObj = aging[this.selectedBucket];
      bucketTitle = bObj ? bObj.label : "Selected Bracket";
      debtors = bObj ? (bObj.customerList || []) : [];
      bucketAmount = bObj ? bObj.amount : 0;
    }

    // Filter by internal search if user is typing
    if (this.searchDebtor) {
      debtors = debtors.filter(d => 
        (d.customerName && d.customerName.toLowerCase().includes(this.searchDebtor)) ||
        (d.city && d.city.toLowerCase().includes(this.searchDebtor)) ||
        (d.phone && d.phone.includes(this.searchDebtor))
      );
    }

    panel.innerHTML = `
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-lg font-bold text-slate-900">${bucketTitle}</h2>
            <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              ${debtors.length} ${debtors.length === 1 ? 'Customer' : 'Customers'}
            </span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5">
            Total Stuck in this bracket: <span class="font-extrabold text-slate-900">${Utils.formatCurrency(bucketAmount)}</span>
          </p>
        </div>

        <div class="flex items-center gap-3">
          <div class="relative w-full md:w-64">
            <input type="text" placeholder="Filter debtors by name/city..." value="${this.searchDebtor}" oninput="OutstandingView.handleDebtorSearch(this.value)" class="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <svg class="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>
        </div>
      </div>

      ${debtors.length === 0 ? `
        <div class="p-10 text-center text-slate-400">
          <div class="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <p class="text-sm font-semibold text-slate-700">Zero Debtors in this Bucket!</p>
          <p class="text-xs text-slate-400 mt-1">No outstanding balances currently fall into ${bucketTitle}.</p>
        </div>
      ` : `
        <div class="space-y-3">
          ${debtors.map((d, index) => {
            const collapseId = `inv-collapse-${d.customerId}-${index}`;
            return `
              <div class="p-4 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 transition-all shadow-sm space-y-3">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <!-- Customer Info -->
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                      ${d.customerName ? d.customerName.substring(0, 2).toUpperCase() : 'CU'}
                    </div>
                    <div>
                      <div class="flex items-center gap-2 flex-wrap">
                        <a href="#/customer/${d.customerId}" class="font-bold text-slate-900 hover:text-indigo-600 text-sm">
                          ${Utils.escapeHtml(d.customerName)}
                        </a>
                        <span class="text-xs text-slate-400 font-mono">${d.customerCode}</span>
                        ${Utils.getRiskBadge(d.riskLevel, d.riskScore)}
                      </div>
                      <div class="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                        <span>City: <b class="text-slate-700">${d.city || '-'}</b></span>
                        <span>Phone: <b class="text-slate-700">${d.phone || '-'}</b></span>
                        <span>Max Overdue: <b class="${d.maxOverdueDays > 0 ? 'text-rose-600' : 'text-slate-700'}">${d.maxOverdueDays} days</b></span>
                      </div>
                    </div>
                  </div>

                  <!-- Amount & Quick Actions -->
                  <div class="flex items-center gap-3 justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div class="text-right">
                      <div class="text-base font-extrabold text-slate-900">${Utils.formatCurrency(d.amount)}</div>
                      <div class="text-[11px] text-slate-400 font-medium">${d.invoiceCount} ${d.invoiceCount === 1 ? 'bill' : 'bills'} in bracket</div>
                    </div>

                    <div class="flex items-center gap-1.5">
                      <a href="${Utils.getTelUrl(d.phone)}" class="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-sm" title="Call">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                      </a>
                      <button onclick="Modals.openWhatsAppSender('${d.whatsApp || d.phone}', '${Utils.escapeHtml(d.customerName)}', ${d.amount})" class="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-sm" title="WhatsApp Reminder">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                      </button>
                      <button onclick="Modals.openFollowUp('${d.customerId}', '${Utils.escapeHtml(d.customerName)}')" class="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 shadow-sm" title="Log Follow-Up">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                      </button>
                      <button onclick="Modals.openRecordPayment({ customerId: '${d.customerId}', amount: ${d.amount} })" class="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm">
                        Record Pay
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Sub-table toggle of invoices in this bucket -->
                <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button onclick="OutstandingView.toggleInvoiceList('${collapseId}')" class="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    <span id="btn-text-${collapseId}">Show ${d.invoiceCount} Bill Details</span>
                    <svg id="icon-${collapseId}" class="w-3.5 h-3.5 transform transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
                  </button>

                  <a href="#/customer/${d.customerId}" class="text-xs text-slate-400 hover:text-slate-700 font-medium">
                    Open Full Profile & Ledger &rarr;
                  </a>
                </div>

                <!-- Invoices details collapsible -->
                <div id="${collapseId}" class="hidden pt-2 border-t border-slate-100 bg-slate-50/70 p-3 rounded-lg space-y-2">
                  <div class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Matured Invoices in this Bracket:</div>
                  <div class="space-y-1.5">
                    ${(d.invoices || []).map(inv => `
                      <div class="flex items-center justify-between text-xs py-1 border-b border-slate-200/60 last:border-0">
                        <div>
                          <span class="font-bold text-slate-800">${inv.invoiceNo}</span>
                          <span class="text-slate-400 ml-2">Due: ${Utils.formatDate(inv.dueDate)}</span>
                          ${inv.daysOverdue > 0 ? `<span class="ml-2 text-rose-600 font-semibold">(${inv.daysOverdue} days overdue)</span>` : '<span class="ml-2 text-emerald-600 font-medium">(Current)</span>'}
                        </div>
                        <div class="text-right">
                          <span class="font-bold text-slate-900">${Utils.formatCurrency(inv.outstanding)}</span>
                          <button onclick="Modals.openRecordPayment({ customerId: '${d.customerId}', invoiceId: '${inv.invoiceNo}', amount: ${inv.outstanding} })" class="ml-3 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline">
                            Pay this bill
                          </button>
                        </div>
                      </div>
                    `).join("")}
                  </div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `}
    `;
  },

  handleDebtorSearch: function(val) {
    this.searchDebtor = val.toLowerCase();
    this.renderDebtorsPanel();
  },

  toggleInvoiceList: function(collapseId) {
    const el = document.getElementById(collapseId);
    const btnText = document.getElementById("btn-text-" + collapseId);
    const icon = document.getElementById("icon-" + collapseId);
    if (!el) return;

    if (el.classList.contains("hidden")) {
      el.classList.remove("hidden");
      if (btnText) btnText.innerText = "Hide Bill Details";
      if (icon) icon.classList.add("rotate-180");
    } else {
      el.classList.add("hidden");
      if (btnText) btnText.innerText = "Show Bill Details";
      if (icon) icon.classList.remove("rotate-180");
    }
  },

  exportCurrentBucket: function() {
    if (!this.data) return;
    const aging = this.data.aging || {};
    let list = [];
    if (this.selectedBucket === "all") {
      const allBuckets = ["d90_plus", "d61_90", "d31_60", "d1_30", "current"];
      allBuckets.forEach(bKey => {
        if (aging[bKey] && aging[bKey].customerList) {
          list.push(...aging[bKey].customerList.map(c => ({ ...c, bucket: aging[bKey].label })));
        }
      });
    } else {
      const bObj = aging[this.selectedBucket];
      if (bObj && bObj.customerList) {
        list = bObj.customerList.map(c => ({ ...c, bucket: bObj.label }));
      }
    }

    if (list.length === 0) {
      Toast.warning("No debtors to export in this bracket");
      return;
    }

    const exportRows = list.map(c => ({
      Bucket: c.bucket || this.selectedBucket,
      CustomerCode: c.customerCode,
      CustomerName: c.customerName,
      City: c.city,
      Phone: c.phone,
      AmountInBucket: c.amount,
      InvoiceCount: c.invoiceCount,
      MaxOverdueDays: c.maxOverdueDays,
      RiskLevel: c.riskLevel
    }));

    Utils.exportToCsv(`Aging_${this.selectedBucket}_${new Date().toISOString().split("T")[0]}`, exportRows);
    Toast.success("Aging bucket CSV exported successfully");
  }
};
