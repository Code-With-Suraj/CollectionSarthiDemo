/**
 * CollectionSarthi - Follow-Ups Log & Timeline View
 */

const FollowUpsView = {
  render: async function(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Follow-Up History & Notes</h1>
            <p class="text-sm text-slate-500">Every call, WhatsApp, visit, outcome, and payment promise</p>
          </div>
          <button onclick="Modals.openFollowUp('', 'Select Customer in Form')" class="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5 self-start sm:self-auto">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Log Follow-Up
          </button>
        </div>

        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="followups-table-container">
          <div class="p-8 skeleton"></div>
        </div>
      </div>
    `;

    await this.loadFollowUps();
  },

  loadFollowUps: async function() {
    try {
      const res = await Api.call("getFollowUps");
      this.followups = res.followups || [];
      this.renderTable();
    } catch (err) {
      document.getElementById("followups-table-container").innerHTML = `
        <div class="p-6 text-sm text-red-600">Failed to load follow-ups: ${err.message}</div>
      `;
    }
  },

  renderTable: function() {
    const container = document.getElementById("followups-table-container");
    if (!container || !this.followups) return;

    if (this.followups.length === 0) {
      container.innerHTML = `<div class="p-12 text-center text-slate-400 text-sm">No follow-ups recorded yet.</div>`;
      return;
    }

    container.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-700">
          <thead class="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th class="px-5 py-3">Date</th>
              <th class="px-5 py-3">Customer ID</th>
              <th class="px-5 py-3">Channel</th>
              <th class="px-5 py-3">Outcome</th>
              <th class="px-5 py-3">Promise Details</th>
              <th class="px-5 py-3">Remarks</th>
              <th class="px-5 py-3">Logged By</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${this.followups.map(f => `
              <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-5 py-3.5 text-xs text-slate-500">${Utils.formatDate(f.FollowUpDate || f.CreatedAt)}</td>
                <td class="px-5 py-3.5 font-bold text-slate-900">${f.CustomerID}</td>
                <td class="px-5 py-3.5 text-xs">
                  <span class="px-2 py-0.5 rounded-full bg-slate-100 font-semibold text-slate-700">${f.FollowUpType}</span>
                </td>
                <td class="px-5 py-3.5 text-xs">
                  <span class="font-semibold text-indigo-600">${f.Outcome}</span>
                </td>
                <td class="px-5 py-3.5 text-xs">
                  ${f.PromiseDate ? `
                    <div class="font-bold text-amber-700">${Utils.formatCurrency(f.PromiseAmount)}</div>
                    <div class="text-slate-400">By ${Utils.formatDate(f.PromiseDate)}</div>
                  ` : '<span class="text-slate-400">-</span>'}
                </td>
                <td class="px-5 py-3.5 text-xs text-slate-600 max-w-xs truncate">${Utils.escapeHtml(f.Remarks || '-')}</td>
                <td class="px-5 py-3.5 text-xs text-slate-500">${f.CreatedBy || '-'}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  }
};
