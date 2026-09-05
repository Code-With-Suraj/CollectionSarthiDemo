/**
 * CollectionSarthi - Reports & Intelligence View
 */

const ReportsView = {
  currentReport: "outstanding",

  render: async function(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Recovery & Audit Reports</h1>
            <p class="text-sm text-slate-500">Accounts receivable reports, collection performance, and recovery metrics</p>
          </div>
          <button onclick="ReportsView.exportCurrentReport()" class="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm flex items-center gap-1.5 self-start sm:self-auto">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            Export Report CSV
          </button>
        </div>

        <!-- Report Tabs -->
        <div class="flex border-b border-slate-200 overflow-x-auto gap-2 pb-px text-sm font-semibold text-slate-500">
          <button onclick="ReportsView.switchReport('outstanding')" id="rep-outstanding" class="px-4 py-2 border-b-2 border-indigo-600 text-indigo-600 whitespace-nowrap">
            Debtors Aging Report
          </button>
          <button onclick="ReportsView.switchReport('collections')" id="rep-collections" class="px-4 py-2 border-b-2 border-transparent hover:text-slate-700 whitespace-nowrap">
            Collections Realized
          </button>
          <button onclick="ReportsView.switchReport('promises')" id="rep-promises" class="px-4 py-2 border-b-2 border-transparent hover:text-slate-700 whitespace-nowrap">
            Promise-to-Pay Audit
          </button>
        </div>

        <div id="report-content" class="space-y-4">
          <div class="h-64 skeleton rounded-2xl"></div>
        </div>
      </div>
    `;

    await this.loadData();
  },

  loadData: async function() {
    try {
      const res = await Api.call("getReports", { type: this.currentReport });
      this.data = res;
      this.renderReportTable();
    } catch (err) {
      document.getElementById("report-content").innerHTML = `
        <div class="p-6 text-sm text-red-600">Failed to load reports: ${err.message}</div>
      `;
    }
  },

  switchReport: function(rep) {
    this.currentReport = rep;
    document.querySelectorAll("[id^='rep-']").forEach(el => {
      el.className = "px-4 py-2 border-b-2 border-transparent text-slate-500 hover:text-slate-700 whitespace-nowrap";
    });
    const active = document.getElementById("rep-" + rep);
    if (active) active.className = "px-4 py-2 border-b-2 border-indigo-600 text-indigo-600 whitespace-nowrap";
    this.renderReportTable();
  },

  renderReportTable: function() {
    const container = document.getElementById("report-content");
    if (!container || !this.data) return;

    if (this.currentReport === "outstanding") {
      const custs = (this.data.customers || []).filter(c => c.metrics && c.metrics.totalOutstanding > 0);
      container.innerHTML = `
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-slate-700">
              <thead class="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th class="px-5 py-3">Customer</th>
                  <th class="px-5 py-3">City</th>
                  <th class="px-5 py-3 text-right">Credit Limit</th>
                  <th class="px-5 py-3 text-right">Outstanding</th>
                  <th class="px-5 py-3 text-right">Max Overdue</th>
                  <th class="px-5 py-3">Risk Level</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${custs.map(c => `
                  <tr>
                    <td class="px-5 py-3 font-semibold text-slate-900">${Utils.escapeHtml(c.CustomerName)}</td>
                    <td class="px-5 py-3 text-xs text-slate-500">${c.City || '-'}</td>
                    <td class="px-5 py-3 text-right text-slate-600 font-medium">${Utils.formatCurrency(c.CreditLimit)}</td>
                    <td class="px-5 py-3 text-right font-bold text-slate-900">${Utils.formatCurrency(c.metrics.totalOutstanding)}</td>
                    <td class="px-5 py-3 text-right ${c.metrics.maxOverdueDays > 0 ? 'text-rose-600 font-semibold' : 'text-slate-500'}">${c.metrics.maxOverdueDays} days</td>
                    <td class="px-5 py-3">${Utils.getRiskBadge(c.metrics.level)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (this.currentReport === "collections") {
      const pays = this.data.payments || [];
      const totalCollected = pays.reduce((acc, p) => acc + (Number(p.Amount) || 0), 0);
      container.innerHTML = `
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <span class="text-sm font-semibold text-slate-700">Total Realized Collections:</span>
          <span class="text-xl font-bold text-emerald-600">${Utils.formatCurrency(totalCollected)}</span>
        </div>
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-slate-700">
              <thead class="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th class="px-5 py-3">Receipt</th>
                  <th class="px-5 py-3">Date</th>
                  <th class="px-5 py-3">Customer ID</th>
                  <th class="px-5 py-3 text-right">Amount</th>
                  <th class="px-5 py-3">Mode</th>
                  <th class="px-5 py-3">UTR / Ref</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${pays.map(p => `
                  <tr>
                    <td class="px-5 py-3 font-mono text-xs text-slate-900 font-semibold">${p.PaymentID}</td>
                    <td class="px-5 py-3 text-xs text-slate-500">${Utils.formatDate(p.PaymentDate)}</td>
                    <td class="px-5 py-3 text-xs font-semibold text-slate-800">${p.CustomerID}</td>
                    <td class="px-5 py-3 text-right font-bold text-emerald-600">${Utils.formatCurrency(p.Amount)}</td>
                    <td class="px-5 py-3 text-xs font-semibold">${p.PaymentMode}</td>
                    <td class="px-5 py-3 text-xs text-slate-500 font-mono">${p.ReferenceNo || '-'}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } else if (this.currentReport === "promises") {
      const promises = (this.data.followups || []).filter(f => f.Outcome === "PROMISED");
      container.innerHTML = `
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm text-slate-700">
              <thead class="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th class="px-5 py-3">Follow-up Date</th>
                  <th class="px-5 py-3">Customer ID</th>
                  <th class="px-5 py-3">Promise Date</th>
                  <th class="px-5 py-3 text-right">Promised Amount</th>
                  <th class="px-5 py-3">Follow-up By</th>
                  <th class="px-5 py-3">Remarks</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                ${promises.map(f => `
                  <tr>
                    <td class="px-5 py-3 text-xs text-slate-500">${Utils.formatDate(f.FollowUpDate)}</td>
                    <td class="px-5 py-3 font-semibold text-slate-900">${f.CustomerID}</td>
                    <td class="px-5 py-3 text-xs font-bold text-amber-700">${Utils.formatDate(f.PromiseDate)}</td>
                    <td class="px-5 py-3 text-right font-bold text-slate-900">${Utils.formatCurrency(f.PromiseAmount)}</td>
                    <td class="px-5 py-3 text-xs text-slate-600">${f.CreatedBy || '-'}</td>
                    <td class="px-5 py-3 text-xs text-slate-500">${Utils.escapeHtml(f.Remarks || '-')}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  },

  exportCurrentReport: function() {
    if (!this.data) return;
    if (this.currentReport === "outstanding") {
      const exportRows = (this.data.customers || []).map(c => ({
        CustomerCode: c.CustomerCode,
        CustomerName: c.CustomerName,
        City: c.City,
        Phone: c.Phone,
        CreditLimit: c.CreditLimit,
        CreditDays: c.CreditDays,
        TotalOutstanding: c.metrics ? c.metrics.totalOutstanding : 0,
        MaxOverdueDays: c.metrics ? c.metrics.maxOverdueDays : 0,
        RiskLevel: c.metrics ? c.metrics.level : "LOW RISK"
      }));
      Utils.exportToCsv("Outstanding_Report_" + new Date().toISOString().split("T")[0], exportRows);
    } else if (this.currentReport === "collections") {
      Utils.exportToCsv("Collections_Report_" + new Date().toISOString().split("T")[0], this.data.payments || []);
    } else {
      Utils.exportToCsv("Promises_Report_" + new Date().toISOString().split("T")[0], this.data.followups || []);
    }
    Toast.success("Report CSV exported successfully");
  }
};
