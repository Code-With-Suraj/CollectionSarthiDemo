/**
 * CollectionSarthi - Today's Collection Action Center
 * Directly answers: "Aaj paisa recover karne ke liye mujhe kya karna hai?"
 * Enhanced with 10-item pagination, instant cache loading & real-time filtering
 */

const ActionsView = {
  currentTab: "all",
  currentPage: 1,
  pageSize: 10,
  searchTerm: "",
  data: null,
  isRefreshing: false,

  render: async function(container) {
    this.searchTerm = "";
    this.currentPage = 1;

    // Fast cache check: if data is already cached, render immediately (0ms delay!)
    const cached = Store.getCached("actions");
    if (cached) {
      this.data = cached;
      this.renderShell(container);
      this.renderTabContent();
      this.updateBadges();
      // Silently re-verify in the background
      this.loadData(true);
    } else {
      this.renderShell(container, true);
      await this.loadData(false);
    }
  },

  renderShell: function(container, showSkeleton = false) {
    const counts = this.getTabCounts();
    const stats = this.getSummaryStats();

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Today's Action Center</h1>
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                10 per page
              </span>
            </div>
            <p class="text-sm text-slate-500">Targeted daily recovery tasks: Call, WhatsApp, follow up, and collect.</p>
          </div>
          <div class="flex items-center gap-2">
            <button id="actions-refresh-btn" onclick="ActionsView.refresh()" class="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5 text-xs font-medium" title="Refresh Actions">
              <svg id="actions-refresh-icon" class="w-4 h-4 ${this.isRefreshing ? 'animate-spin text-indigo-600' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <!-- Quick Recovery KPI Summary Banner -->
        <div id="actions-stats-bar" class="grid grid-cols-2 lg:grid-cols-4 gap-3">
          ${this.renderStatsBar(stats)}
        </div>

        <!-- Filter & Search Controls -->
        <div class="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div class="w-full sm:w-80 relative">
            <input type="text" id="actions-search-input" value="${Utils.escapeHtml(this.searchTerm)}" placeholder="Search debtor, phone, or reason..." class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" oninput="ActionsView.handleSearch(this.value)">
            <svg class="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>

          <div class="flex items-center gap-2 text-xs text-slate-500 self-end sm:self-auto">
            <span>Displaying <b>10 items</b> per page</span>
          </div>
        </div>

        <!-- Filter Tabs with Count Badges -->
        <div class="flex border-b border-slate-200 overflow-x-auto gap-2 pb-px text-sm font-semibold text-slate-500">
          <button onclick="ActionsView.switchTab('all')" id="tab-all" class="px-4 py-2.5 border-b-2 ${this.currentTab === 'all' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-700'} whitespace-nowrap flex items-center gap-1.5 transition-colors">
            <span>All Action Items</span>
            <span id="badge-all" class="px-2 py-0.5 text-xs rounded-full ${this.currentTab === 'all' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}">${counts.all}</span>
          </button>
          <button onclick="ActionsView.switchTab('promises')" id="tab-promises" class="px-4 py-2.5 border-b-2 ${this.currentTab === 'promises' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-700'} whitespace-nowrap flex items-center gap-1.5 transition-colors">
            <span>Promises Due Today</span>
            <span id="badge-promises" class="px-2 py-0.5 text-xs rounded-full ${this.currentTab === 'promises' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}">${counts.promises}</span>
          </button>
          <button onclick="ActionsView.switchTab('broken')" id="tab-broken" class="px-4 py-2.5 border-b-2 ${this.currentTab === 'broken' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-700'} whitespace-nowrap flex items-center gap-1.5 transition-colors">
            <span>Broken Promises</span>
            <span id="badge-broken" class="px-2 py-0.5 text-xs rounded-full ${this.currentTab === 'broken' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}">${counts.broken}</span>
          </button>
          <button onclick="ActionsView.switchTab('dueToday')" id="tab-dueToday" class="px-4 py-2.5 border-b-2 ${this.currentTab === 'dueToday' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-700'} whitespace-nowrap flex items-center gap-1.5 transition-colors">
            <span>Due Today</span>
            <span id="badge-dueToday" class="px-2 py-0.5 text-xs rounded-full ${this.currentTab === 'dueToday' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}">${counts.dueToday}</span>
          </button>
          <button onclick="ActionsView.switchTab('overdue')" id="tab-overdue" class="px-4 py-2.5 border-b-2 ${this.currentTab === 'overdue' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-700'} whitespace-nowrap flex items-center gap-1.5 transition-colors">
            <span>Overdue Accounts</span>
            <span id="badge-overdue" class="px-2 py-0.5 text-xs rounded-full ${this.currentTab === 'overdue' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}">${counts.overdue}</span>
          </button>
          <button onclick="ActionsView.switchTab('noContact')" id="tab-noContact" class="px-4 py-2.5 border-b-2 ${this.currentTab === 'noContact' ? 'border-indigo-600 text-indigo-600' : 'border-transparent hover:text-slate-700'} whitespace-nowrap flex items-center gap-1.5 transition-colors">
            <span>No Follow-up 7+ Days</span>
            <span id="badge-noContact" class="px-2 py-0.5 text-xs rounded-full ${this.currentTab === 'noContact' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}">${counts.noContact}</span>
          </button>
        </div>

        <div id="actions-list-top"></div>

        <!-- Content Area -->
        <div id="actions-content" class="space-y-4">
          ${showSkeleton ? this.renderSkeletons() : ''}
        </div>
      </div>
    `;
  },

  renderStatsBar: function(stats) {
    if (!stats) {
      return `
        <div class="h-20 skeleton rounded-xl"></div>
        <div class="h-20 skeleton rounded-xl"></div>
        <div class="h-20 skeleton rounded-xl"></div>
        <div class="h-20 skeleton rounded-xl"></div>
      `;
    }

    return `
      <div class="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
        <span class="text-xs font-medium text-slate-500">Total Actionable</span>
        <div class="mt-1 flex items-baseline justify-between">
          <span class="text-lg font-bold text-slate-900">${Utils.formatCurrency(stats.totalOutstanding)}</span>
          <span class="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">${stats.totalCount} tasks</span>
        </div>
      </div>
      <div class="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 shadow-sm flex flex-col justify-between">
        <span class="text-xs font-medium text-emerald-800">Promises Due Today</span>
        <div class="mt-1 flex items-baseline justify-between">
          <span class="text-lg font-bold text-emerald-950">${Utils.formatCurrency(stats.promiseAmt)}</span>
          <span class="text-xs font-semibold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">${stats.promiseCount} due</span>
        </div>
      </div>
      <div class="bg-red-50/60 p-3.5 rounded-xl border border-red-100 shadow-sm flex flex-col justify-between">
        <span class="text-xs font-medium text-red-800">Broken Promises</span>
        <div class="mt-1 flex items-baseline justify-between">
          <span class="text-lg font-bold text-red-950">${Utils.formatCurrency(stats.brokenAmt)}</span>
          <span class="text-xs font-semibold px-2 py-0.5 bg-red-100 text-red-800 rounded-md">${stats.brokenCount} broken</span>
        </div>
      </div>
      <div class="bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 shadow-sm flex flex-col justify-between">
        <span class="text-xs font-medium text-blue-800">Due Today</span>
        <div class="mt-1 flex items-baseline justify-between">
          <span class="text-lg font-bold text-blue-950">${Utils.formatCurrency(stats.dueTodayAmt)}</span>
          <span class="text-xs font-semibold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">${stats.dueTodayCount} inv</span>
        </div>
      </div>
    `;
  },

  renderSkeletons: function() {
    return Array.from({ length: 4 }).map(() => `
      <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div class="space-y-2 w-full max-w-sm">
          <div class="h-4 w-48 skeleton rounded"></div>
          <div class="h-3 w-32 skeleton rounded"></div>
        </div>
        <div class="h-8 w-60 skeleton rounded-lg"></div>
      </div>
    `).join("");
  },

  loadData: async function(silent = false) {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    this.updateRefreshButtonState();

    try {
      const data = await Api.call("getTodayActions");
      this.data = data;
      Store.setCached("actions", data);
      this.updateBadges();

      const statsBar = document.getElementById("actions-stats-bar");
      if (statsBar) {
        statsBar.innerHTML = this.renderStatsBar(this.getSummaryStats());
      }

      this.renderTabContent();
    } catch (err) {
      if (!silent) {
        const container = document.getElementById("actions-content");
        if (container) {
          container.innerHTML = `
            <div class="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-200 flex items-center justify-between">
              <span>Error loading actions: ${err.message}</span>
              <button onclick="ActionsView.refresh()" class="text-xs font-bold underline hover:text-red-800">Try Again</button>
            </div>
          `;
        }
      }
    } finally {
      this.isRefreshing = false;
      this.updateRefreshButtonState();
    }
  },

  updateRefreshButtonState: function() {
    const icon = document.getElementById("actions-refresh-icon");
    if (icon) {
      if (this.isRefreshing) {
        icon.classList.add("animate-spin", "text-indigo-600");
      } else {
        icon.classList.remove("animate-spin", "text-indigo-600");
      }
    }
  },

  handleSearch: function(val) {
    this.searchTerm = (val || "").trim();
    this.currentPage = 1;
    this.renderTabContent();
  },

  switchTab: function(tab) {
    this.currentTab = tab;
    this.currentPage = 1; // Reset to page 1 on tab switch

    document.querySelectorAll("[id^='tab-']").forEach(el => {
      el.className = "px-4 py-2.5 border-b-2 border-transparent text-slate-500 hover:text-slate-700 whitespace-nowrap flex items-center gap-1.5 transition-colors";
    });
    const active = document.getElementById("tab-" + tab);
    if (active) {
      active.className = "px-4 py-2.5 border-b-2 border-indigo-600 text-indigo-600 whitespace-nowrap flex items-center gap-1.5 transition-colors";
    }

    this.updateBadges();
    this.renderTabContent();
  },

  getTabCounts: function() {
    if (!this.data) return { all: 0, promises: 0, broken: 0, dueToday: 0, overdue: 0, noContact: 0 };
    const d = this.data;
    const promises = (d.promiseDueToday || []).length;
    const broken = (d.brokenPromises || []).length;
    const dueToday = (d.dueToday || []).length;
    const overdue = (d.overdue || []).length;
    const noContact = (d.noContactWeek || []).length;
    const all = promises + broken + dueToday + overdue + noContact;
    return { all, promises, broken, dueToday, overdue, noContact };
  },

  getSummaryStats: function() {
    if (!this.data) return null;
    const d = this.data;
    const allItems = this.getItemsForTab("all", false);
    const totalOutstanding = allItems.reduce((sum, item) => {
      const c = item.customer || {};
      const amt = c.metrics ? c.metrics.totalOutstanding : (item.amount || 0);
      return sum + (Number(amt) || 0);
    }, 0);

    const promiseAmt = (d.promiseDueToday || []).reduce((sum, x) => sum + (Number(x.amount) || 0), 0);
    const brokenAmt = (d.brokenPromises || []).reduce((sum, x) => sum + (Number(x.amount) || 0), 0);
    const dueTodayAmt = (d.dueToday || []).reduce((sum, x) => sum + (Number(x.amount) || 0), 0);

    return {
      totalCount: allItems.length,
      totalOutstanding,
      promiseCount: (d.promiseDueToday || []).length,
      promiseAmt,
      brokenCount: (d.brokenPromises || []).length,
      brokenAmt,
      dueTodayCount: (d.dueToday || []).length,
      dueTodayAmt
    };
  },

  updateBadges: function() {
    const counts = this.getTabCounts();
    const tabs = ["all", "promises", "broken", "dueToday", "overdue", "noContact"];
    tabs.forEach(tab => {
      const badge = document.getElementById("badge-" + tab);
      if (badge) {
        badge.innerText = counts[tab] || 0;
        badge.className = `px-2 py-0.5 text-xs rounded-full ${this.currentTab === tab ? 'bg-indigo-100 text-indigo-700 font-bold' : 'bg-slate-100 text-slate-600'}`;
      }
    });
  },

  getItemsForTab: function(tab = this.currentTab, applySearch = true) {
    if (!this.data) return [];
    const d = this.data;
    let items = [];

    if (tab === "all") {
      items = [
        ...(d.promiseDueToday || []).map(x => ({ ...x, category: "Promise Due Today", badgeColor: "bg-emerald-100 text-emerald-800" })),
        ...(d.brokenPromises || []).map(x => ({ ...x, category: "Broken Promise", badgeColor: "bg-red-100 text-red-800" })),
        ...(d.dueToday || []).map(x => ({ ...x, category: "Due Today", badgeColor: "bg-blue-100 text-blue-800" })),
        ...(d.overdue || []).map(x => ({ ...x, category: "Overdue", badgeColor: "bg-amber-100 text-amber-800" })),
        ...(d.noContactWeek || []).map(x => ({ ...x, category: "No Contact", badgeColor: "bg-purple-100 text-purple-800" }))
      ];
    } else if (tab === "promises") {
      items = (d.promiseDueToday || []).map(x => ({ ...x, category: "Promise Due Today", badgeColor: "bg-emerald-100 text-emerald-800" }));
    } else if (tab === "broken") {
      items = (d.brokenPromises || []).map(x => ({ ...x, category: "Broken Promise", badgeColor: "bg-red-100 text-red-800" }));
    } else if (tab === "dueToday") {
      items = (d.dueToday || []).map(x => ({ ...x, category: "Due Today", badgeColor: "bg-blue-100 text-blue-800" }));
    } else if (tab === "overdue") {
      items = (d.overdue || []).map(x => ({ ...x, category: "Overdue", badgeColor: "bg-amber-100 text-amber-800" }));
    } else if (tab === "noContact") {
      items = (d.noContactWeek || []).map(x => ({ ...x, category: "No Contact", badgeColor: "bg-purple-100 text-purple-800" }));
    }

    if (applySearch && this.searchTerm) {
      const q = this.searchTerm.toLowerCase();
      items = items.filter(item => {
        const c = item.customer || {};
        return (
          (c.CustomerName && c.CustomerName.toLowerCase().includes(q)) ||
          (c.Phone && c.Phone.includes(q)) ||
          (item.reason && item.reason.toLowerCase().includes(q)) ||
          (item.category && item.category.toLowerCase().includes(q))
        );
      });
    }

    return items;
  },

  renderTabContent: function() {
    const container = document.getElementById("actions-content");
    if (!container || !this.data) return;

    const allItems = this.getItemsForTab(this.currentTab, true);
    const totalItems = allItems.length;

    if (totalItems === 0) {
      container.innerHTML = `
        <div class="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-sm">
          <div class="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          </div>
          <h3 class="text-base font-bold text-slate-800">
            ${this.searchTerm ? 'No matching recovery actions found' : 'All caught up in this category!'}
          </h3>
          <p class="text-xs text-slate-500 mt-1">
            ${this.searchTerm ? 'Try adjusting your search keyword.' : 'No pending recovery actions found.'}
          </p>
        </div>
      `;
      return;
    }

    // Pagination calculations (10 per page)
    const totalPages = Math.ceil(totalItems / this.pageSize) || 1;
    if (this.currentPage > totalPages) this.currentPage = totalPages;
    if (this.currentPage < 1) this.currentPage = 1;

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, totalItems);
    const pageItems = allItems.slice(startIndex, endIndex);

    container.innerHTML = `
      <div class="space-y-3">
        ${pageItems.map(item => {
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
                  <div class="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                    <span class="font-medium text-slate-700">${item.reason}</span>
                    <span>•</span>
                    <span>Phone: ${c.Phone || "-"}</span>
                    ${c.City ? `<span>•</span><span class="text-slate-400">${Utils.escapeHtml(c.City)}</span>` : ""}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0">
                <div class="text-right">
                  <div class="text-sm font-bold text-slate-900">${Utils.formatCurrency(outAmt)}</div>
                  <div class="text-xs text-slate-400">Outstanding</div>
                </div>

                <div class="flex items-center gap-1.5 flex-shrink-0">
                  <a href="${Utils.getTelUrl(c.Phone)}" class="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm transition-colors" title="Call">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                  </a>
                  <button onclick="Modals.openWhatsAppSender('${c.WhatsApp || c.Phone}', '${Utils.escapeHtml(c.CustomerName)}', ${outAmt})" class="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-sm transition-colors" title="WhatsApp Reminder">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                  </button>
                  <button onclick="Modals.openFollowUp('${c.CustomerID}', '${Utils.escapeHtml(c.CustomerName)}')" class="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 shadow-sm transition-colors" title="Log Follow-up">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                  </button>
                  <button onclick="Modals.openRecordPayment({ customerId: '${c.CustomerID}', amount: ${outAmt} })" class="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 shadow-sm transition-colors">
                    Record Pay
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <!-- Pagination Navigation Bar -->
      <div class="bg-white px-4 py-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
        <!-- Count Display -->
        <div class="text-xs text-slate-600">
          Showing <span class="font-bold text-slate-900">${startIndex + 1}</span> to <span class="font-bold text-slate-900">${endIndex}</span> of <span class="font-bold text-slate-900">${totalItems}</span> actions
          ${totalPages > 1 ? `<span class="text-slate-400 ml-1">(Page ${this.currentPage} of ${totalPages})</span>` : ''}
        </div>

        <!-- Controls -->
        <div class="flex items-center gap-1.5 flex-wrap justify-center">
          <!-- Previous Button -->
          <button
            onclick="ActionsView.goToPage(${this.currentPage - 1})"
            ${this.currentPage === 1 ? 'disabled' : ''}
            class="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all ${
              this.currentPage === 1
                ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
            }"
            title="Previous Page"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
            <span>Prev</span>
          </button>

          <!-- Numbered Page Buttons -->
          ${this.renderPaginationButtons(this.currentPage, totalPages)}

          <!-- Next Button -->
          <button
            onclick="ActionsView.goToPage(${this.currentPage + 1})"
            ${this.currentPage === totalPages ? 'disabled' : ''}
            class="px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all ${
              this.currentPage === totalPages
                ? 'opacity-40 cursor-not-allowed bg-slate-50 border-slate-200 text-slate-400'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-sm'
            }"
            title="Next Page"
          >
            <span>Next</span>
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    `;
  },

  renderPaginationButtons: function(currentPage, totalPages) {
    if (totalPages <= 1) return "";

    let pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages = [1, 2, 3, 4, 5, "...", totalPages];
      } else if (currentPage >= totalPages - 3) {
        pages = [1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      } else {
        pages = [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
      }
    }

    return pages.map(p => {
      if (p === "...") {
        return `<span class="px-2 py-1 text-slate-400 text-xs select-none">...</span>`;
      }
      const isActive = p === currentPage;
      return `
        <button
          onclick="ActionsView.goToPage(${p})"
          class="min-w-[32px] h-8 px-2 rounded-lg text-xs font-semibold transition-all ${
            isActive
              ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-600'
              : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-sm'
          }"
        >
          ${p}
        </button>
      `;
    }).join("");
  },

  goToPage: function(page) {
    const allItems = this.getItemsForTab(this.currentTab, true);
    const totalPages = Math.ceil(allItems.length / this.pageSize) || 1;
    if (page < 1 || page > totalPages || page === this.currentPage) return;

    this.currentPage = page;
    this.renderTabContent();

    const topTarget = document.getElementById("actions-list-top");
    if (topTarget) {
      topTarget.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  },

  refresh: async function() {
    Store.invalidate("actions", "dashboard");
    this.currentPage = 1;
    await this.loadData(false);
    Toast.success("Today's actions refreshed");
  }
};

