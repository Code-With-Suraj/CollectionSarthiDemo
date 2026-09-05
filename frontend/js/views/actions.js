/**
 * CollectionSarthi - Today's Collection Action Center
 * Directly answers: "Aaj paisa recover karne ke liye mujhe kya karna hai?"
 */

const ActionsView = {
  currentTab: "all",

  render: async function(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Today's Action Center</h1>
            <p class="text-sm text-slate-500">Targeted daily recovery tasks: Call, WhatsApp, follow up, and collect.</p>
          </div>
          <div class="flex items-center gap-2">
            <button onclick="ActionsView.refresh()" class="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg shadow-sm" title="Refresh Actions">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="flex border-b border-slate-200 overflow-x-auto gap-2 pb-px text-sm font-semibold text-slate-500">
          <button onclick="ActionsView.switchTab('all')" id="tab-all" class="px-4 py-2 border-b-2 border-indigo-600 text-indigo-600 whitespace-nowrap">
            All Action Items
          </button>
          <button onclick="ActionsView.switchTab('promises')" id="tab-promises" class="px-4 py-2 border-b-2 border-transparent hover:text-slate-700 whitespace-nowrap">
            Promises Due Today
          </button>
          <button onclick="ActionsView.switchTab('broken')" id="tab-broken" class="px-4 py-2 border-b-2 border-transparent hover:text-slate-700 whitespace-nowrap">
            Broken Promises
          </button>
          <button onclick="ActionsView.switchTab('dueToday')" id="tab-dueToday" class="px-4 py-2 border-b-2 border-transparent hover:text-slate-700 whitespace-nowrap">
            Due Today
          </button>
          <button onclick="ActionsView.switchTab('overdue')" id="tab-overdue" class="px-4 py-2 border-b-2 border-transparent hover:text-slate-700 whitespace-nowrap">
            Overdue Accounts
          </button>
          <button onclick="ActionsView.switchTab('noContact')" id="tab-noContact" class="px-4 py-2 border-b-2 border-transparent hover:text-slate-700 whitespace-nowrap">
            No Follow-up 7+ Days
          </button>
        </div>

        <!-- Content Area -->
        <div id="actions-content" class="space-y-4">
          <div class="h-48 skeleton rounded-2xl"></div>
        </div>
      </div>
    `;

    await this.loadData();
  },

  loadData: async function() {
    try {
      const data = await Api.call("getTodayActions");
      this.data = data;
      this.renderTabContent();
    } catch (err) {
      document.getElementById("actions-content").innerHTML = `
        <div class="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200">
          Error loading actions: ${err.message}
        </div>
      `;
    }
  },

  switchTab: function(tab) {
    this.currentTab = tab;
    document.querySelectorAll("[id^='tab-']").forEach(el => {
      el.className = "px-4 py-2 border-b-2 border-transparent text-slate-500 hover:text-slate-700 whitespace-nowrap";
    });
    const active = document.getElementById("tab-" + tab);
    if (active) {
      active.className = "px-4 py-2 border-b-2 border-indigo-600 text-indigo-600 whitespace-nowrap";
    }
    this.renderTabContent();
  },

  renderTabContent: function() {
    const container = document.getElementById("actions-content");
    if (!container || !this.data) return;

    let items = [];
    const d = this.data;

    if (this.currentTab === "all") {
      items = [
        ...d.promiseDueToday.map(x => ({ ...x, category: "Promise Due Today", badgeColor: "bg-emerald-100 text-emerald-800" })),
        ...d.brokenPromises.map(x => ({ ...x, category: "Broken Promise", badgeColor: "bg-red-100 text-red-800" })),
        ...d.dueToday.map(x => ({ ...x, category: "Due Today", badgeColor: "bg-blue-100 text-blue-800" })),
        ...d.overdue.map(x => ({ ...x, category: "Overdue", badgeColor: "bg-amber-100 text-amber-800" })),
        ...d.noContactWeek.map(x => ({ ...x, category: "No Contact", badgeColor: "bg-purple-100 text-purple-800" }))
      ];
    } else if (this.currentTab === "promises") {
      items = d.promiseDueToday.map(x => ({ ...x, category: "Promise Due Today", badgeColor: "bg-emerald-100 text-emerald-800" }));
    } else if (this.currentTab === "broken") {
      items = d.brokenPromises.map(x => ({ ...x, category: "Broken Promise", badgeColor: "bg-red-100 text-red-800" }));
    } else if (this.currentTab === "dueToday") {
      items = d.dueToday.map(x => ({ ...x, category: "Due Today", badgeColor: "bg-blue-100 text-blue-800" }));
    } else if (this.currentTab === "overdue") {
      items = d.overdue.map(x => ({ ...x, category: "Overdue", badgeColor: "bg-amber-100 text-amber-800" }));
    } else if (this.currentTab === "noContact") {
      items = d.noContactWeek.map(x => ({ ...x, category: "No Contact", badgeColor: "bg-purple-100 text-purple-800" }));
    }

    if (items.length === 0) {
      container.innerHTML = `
        <div class="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm">
          <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          </div>
          <h3 class="text-base font-bold text-slate-800">All caught up in this category!</h3>
          <p class="text-xs text-slate-500 mt-1">No pending recovery actions found.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="space-y-3">
        ${items.map(item => {
          const c = item.customer || {};
          const outAmt = c.metrics ? c.metrics.totalOutstanding : item.amount;
          return `
            <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div class="flex items-start gap-3">
                <div>
                  <div class="flex items-center gap-2 flex-wrap">
                    <a href="#/customer/${c.CustomerID}" class="font-bold text-slate-900 hover:text-indigo-600 text-sm">
                      ${Utils.escapeHtml(c.CustomerName || "Customer")}
                    </a>
                    <span class="text-xs font-semibold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-slate-100 text-slate-700'}">
                      ${item.category}
                    </span>
                    ${c.metrics ? Utils.getRiskBadge(c.metrics.level) : ""}
                  </div>
                  <div class="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span class="font-medium text-slate-700">${item.reason}</span>
                    <span>•</span>
                    <span>Phone: ${c.Phone || "-"}</span>
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                <div class="text-right">
                  <div class="text-sm font-bold text-slate-900">${Utils.formatCurrency(outAmt)}</div>
                  <div class="text-xs text-slate-400">Outstanding</div>
                </div>

                <div class="flex items-center gap-1.5">
                  <a href="${Utils.getTelUrl(c.Phone)}" class="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm" title="Call">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  </a>
                  <button onclick="Modals.openWhatsAppSender('${c.WhatsApp || c.Phone}', '${Utils.escapeHtml(c.CustomerName)}', ${outAmt})" class="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-sm" title="WhatsApp Reminder">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                  </button>
                  <button onclick="Modals.openFollowUp('${c.CustomerID}', '${Utils.escapeHtml(c.CustomerName)}')" class="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 shadow-sm" title="Log Follow-up">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                  </button>
                  <button onclick="Modals.openRecordPayment({ customerId: '${c.CustomerID}', amount: ${outAmt} })" class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-sm">
                    Record Pay
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
  },

  refresh: function() {
    Store.invalidate("dashboard");
    this.loadData();
  }
};
