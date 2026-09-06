/**
 * CollectionSarthi - Payments Recovery History View
 */

const PaymentsView = {
  render: async function(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Recovery & Payment History</h1>
            <p class="text-sm text-slate-500">Append-only audit trail of all collected funds & receipts</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="PaymentsView.exportCsv()" class="px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              Export CSV
            </button>
            <button onclick="Modals.openBulkCsvModal('payments')" class="px-3.5 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg shadow-sm flex items-center gap-1.5 active:scale-95 transition-all" title="Bulk Import Payments from CSV">
              <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
              Bulk CSV Import
            </button>
            <button onclick="Modals.openRecordPayment()" class="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              Record Payment
            </button>
          </div>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="payments-table-container">
          <div class="p-8 skeleton"></div>
        </div>
      </div>
    `;

    await this.loadPayments();
  },

  loadPayments: async function() {
    try {
      const cached = Store.getWithStale("payments");
      if (cached.data && cached.data.length > 0) {
        this.payments = cached.data;
        this.renderTable();

        if (cached.isStale) {
          Api.call("getPayments").then(res => {
            if (res && res.payments) {
              Store.setCached("payments", res.payments);
              this.payments = res.payments;
              this.renderTable();
            }
          }).catch(e => console.warn("Background revalidation failed for payments:", e));
        }
      } else {
        const res = await Api.call("getPayments");
        const payments = res.payments || [];
        Store.setCached("payments", payments);
        this.payments = payments;
        this.renderTable();
      }
    } catch (err) {
      const el = document.getElementById("payments-table-container");
      if (el) {
        el.innerHTML = `
          <div class="p-6 text-sm text-red-600">Failed to load payments: ${err.message}</div>
        `;
      }
    }
  },

  renderTable: function() {
    const container = document.getElementById("payments-table-container");
    if (!container || !this.payments) return;

    if (this.payments.length === 0) {
      container.innerHTML = `<div class="p-12 text-center text-slate-400 text-sm">No payment records found.</div>`;
      return;
    }

    container.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-700">
          <thead class="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th class="px-5 py-3">Receipt / ID</th>
              <th class="px-5 py-3">Date</th>
              <th class="px-5 py-3">Customer ID</th>
              <th class="px-5 py-3 text-right">Amount Paid</th>
              <th class="px-5 py-3">Payment Mode</th>
              <th class="px-5 py-3">Reference / UTR</th>
              <th class="px-5 py-3">Collected By</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${this.payments.map(p => `
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-5 py-3.5 font-mono text-xs font-semibold text-slate-900">${p.PaymentID}</td>
                <td class="px-5 py-3.5 text-xs text-slate-500">${Utils.formatDate(p.PaymentDate || p.CreatedAt)}</td>
                <td class="px-5 py-3.5 text-xs font-semibold text-slate-800">${p.CustomerID}</td>
                <td class="px-5 py-3.5 text-right font-bold text-emerald-600 text-base">${Utils.formatCurrency(p.Amount)}</td>
                <td class="px-5 py-3.5 text-xs">
                  <span class="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">${p.PaymentMode || 'NEFT'}</span>
                </td>
                <td class="px-5 py-3.5 text-xs text-slate-500 font-mono">${p.ReferenceNo || '-'}</td>
                <td class="px-5 py-3.5 text-xs text-slate-600">${p.CollectedBy || 'Admin'}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  },

  exportCsv: function() {
    if (!this.payments || this.payments.length === 0) {
      Toast.warning("No payments to export");
      return;
    }
    Utils.exportToCsv("Payment_History_" + new Date().toISOString().split("T")[0], this.payments);
    Toast.success("Payment records exported to CSV");
  }
};
