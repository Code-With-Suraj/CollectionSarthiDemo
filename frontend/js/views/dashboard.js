/**
 * CollectionSarthi - Dashboard View
 * The Daily Money Recovery Command Center
 */

const DashboardView = {
  render: async function(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Recovery Command Center</h1>
            <p class="text-sm text-slate-500">Live outstanding intelligence & today's collection priorities</p>
          </div>
          <div class="flex items-center gap-3">
            <button onclick="Modals.openRecordPayment()" class="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
              Record Payment
            </button>
            <a href="#/actions" class="px-4 py-2 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm flex items-center gap-1.5 transition-all">
              <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
              Today's Actions
            </a>
          </div>
        </div>

        <!-- Skeleton Loader while fetching -->
        <div id="dashboard-loader" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          ${Array(6).fill('<div class="h-24 skeleton rounded-xl"></div>').join("")}
        </div>

        <!-- Dashboard Content -->
        <div id="dashboard-content" class="hidden space-y-6"></div>
      </div>
    `;

    try {
      let data = Store.getCached("dashboard");
      if (!data) {
        data = await Api.call("getDashboard");
        Store.setCached("dashboard", data);
      }

      this.populateDashboard(data);
    } catch (err) {
      document.getElementById("dashboard-loader").innerHTML = `
        <div class="col-span-full p-6 bg-red-50 text-red-700 rounded-xl border border-red-200 text-sm">
          Failed to load dashboard: ${err.message}. Please check your backend connection.
        </div>
      `;
    }
  },

  populateDashboard: function(data) {
    const loader = document.getElementById("dashboard-loader");
    const content = document.getElementById("dashboard-content");
    if (loader) loader.classList.add("hidden");
    if (!content) return;
    content.classList.remove("hidden");

    const k = data.kpis || {};
    const aging = data.aging || {};
    const priority = data.priorityCustomers || [];
    const pipeline = data.pipeline || {};
    const alerts = data.alerts || [];

    // Alerts Bar
    let alertsHtml = "";
    if (alerts.length > 0) {
      alertsHtml = `
        <div class="p-4 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 border border-slate-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <span class="flex h-3 w-3 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <span class="text-sm font-semibold text-slate-800">Action Alerts:</span>
            <div class="text-sm text-slate-600 space-y-0.5">
              ${alerts.map(a => `<div>${Utils.escapeHtml(a.message)}</div>`).join("")}
            </div>
          </div>
          <a href="#/actions" class="text-xs font-bold text-indigo-600 hover:text-indigo-800 uppercase tracking-wider flex items-center whitespace-nowrap">
            Take Action Now &rarr;
          </a>
        </div>
      `;
    }

    content.innerHTML = `
      ${alertsHtml}

      <!-- 6 Top KPI Cards -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm card-hover">
          <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Outstanding</span>
          <div class="text-xl font-bold text-slate-900 mt-1">${Utils.formatCurrency(k.totalOutstanding, true)}</div>
          <span class="text-xs text-slate-400">${k.customersWithOutstanding || 0} accounts owing</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-rose-200/60 shadow-sm card-hover">
          <span class="text-xs font-medium text-rose-600 uppercase tracking-wider">Overdue Amount</span>
          <div class="text-xl font-bold text-rose-600 mt-1">${Utils.formatCurrency(k.overdueAmount, true)}</div>
          <span class="text-xs text-rose-500/80">${k.overdueCustomers || 0} debtors overdue</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm card-hover">
          <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">Due Today</span>
          <div class="text-xl font-bold text-slate-900 mt-1">${Utils.formatCurrency(k.dueTodayAmount, true)}</div>
          <span class="text-xs text-slate-400">Bills maturing today</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm card-hover">
          <span class="text-xs font-medium text-slate-500 uppercase tracking-wider">Due This Week</span>
          <div class="text-xl font-bold text-slate-900 mt-1">${Utils.formatCurrency(k.dueThisWeekAmount, true)}</div>
          <span class="text-xs text-slate-400">Next 7 days inflow</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-emerald-200/60 shadow-sm card-hover">
          <span class="text-xs font-medium text-emerald-600 uppercase tracking-wider">Collected Month</span>
          <div class="text-xl font-bold text-emerald-600 mt-1">${Utils.formatCurrency(k.collectedThisMonth, true)}</div>
          <span class="text-xs text-emerald-600/80">Realized cash in</span>
        </div>

        <div class="bg-white p-4 rounded-xl border border-indigo-200/60 shadow-sm card-hover">
          <span class="text-xs font-medium text-indigo-600 uppercase tracking-wider">Recovery Rate</span>
          <div class="text-xl font-bold text-indigo-600 mt-1">${k.collectionEfficiency || 0}%</div>
          <span class="text-xs text-indigo-500">Collection efficiency</span>
        </div>
      </div>

      <!-- Priority Recovery & Pipeline Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Today's Collection Priority (2 Cols) -->
        <div class="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-bold text-slate-900">Today's Collection Priority</h2>
              <p class="text-xs text-slate-500">Ranked by algorithm: Outstanding amount + Overdue days + Broken promises</p>
            </div>
            <a href="#/actions" class="text-xs font-semibold text-indigo-600 hover:text-indigo-800">View All Actions &rarr;</a>
          </div>

          <div class="space-y-3">
            ${priority.length === 0 ? '<p class="text-sm text-slate-400 py-4 text-center">No outstanding debts right now! 🎉</p>' : ''}
            ${priority.map((c, idx) => `
              <div class="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all">
                <div class="flex items-start gap-3">
                  <span class="flex items-center justify-center w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex-shrink-0 mt-0.5">
                    #${idx + 1}
                  </span>
                  <div>
                    <div class="flex items-center gap-2">
                      <a href="#/customer/${c.CustomerID}" class="font-bold text-slate-900 hover:text-indigo-600 text-sm">
                        ${Utils.escapeHtml(c.CustomerName)}
                      </a>
                      ${Utils.getRiskBadge(c.metrics.level)}
                    </div>
                    <div class="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-x-3 gap-y-1">
                      <span>Overdue: <b class="text-slate-700">${c.metrics.maxOverdueDays} days</b></span>
                      <span>Broken Promises: <b class="${c.metrics.brokenPromises > 0 ? 'text-red-600' : 'text-slate-700'}">${c.metrics.brokenPromises}</b></span>
                      <span>Last contact: <b class="text-slate-700">${c.metrics.lastContactDays === -1 ? 'Never' : c.metrics.lastContactDays + 'd ago'}</b></span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div class="text-right">
                    <div class="text-sm font-bold text-slate-900">${Utils.formatCurrency(c.metrics.totalOutstanding)}</div>
                    <div class="text-xs text-slate-400 font-medium">Outstanding</div>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <a href="${Utils.getTelUrl(c.Phone)}" class="p-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm" title="Call">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                    </a>
                    <button onclick="Modals.openWhatsAppSender('${c.WhatsApp || c.Phone}', '${Utils.escapeHtml(c.CustomerName)}', ${c.metrics.totalOutstanding})" class="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 shadow-sm" title="WhatsApp">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
                    </button>
                    <button onclick="Modals.openFollowUp('${c.CustomerID}', '${Utils.escapeHtml(c.CustomerName)}')" class="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 shadow-sm" title="Follow Up">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                    </button>
                    <button onclick="Modals.openRecordPayment({ customerId: '${c.CustomerID}', amount: ${c.metrics.totalOutstanding} })" class="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-medium text-xs hover:bg-emerald-700 shadow-sm" title="Record Payment">
                      Pay
                    </button>
                  </div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Collection Pipeline & Aging Donut (1 Col) -->
        <div class="space-y-6">
          <!-- Pipeline Card -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 class="text-base font-bold text-slate-900">Recovery Pipeline</h2>
            
            <div class="space-y-3">
              <div>
                <div class="flex justify-between text-xs font-semibold mb-1">
                  <span class="text-slate-500">1. Total Outstanding</span>
                  <span class="text-slate-900">${Utils.formatCurrency(pipeline.outstanding)}</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2">
                  <div class="bg-slate-400 h-2 rounded-full" style="width: 100%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-xs font-semibold mb-1">
                  <span class="text-slate-500">2. Contacted / Followed Up</span>
                  <span class="text-indigo-600">${Utils.formatCurrency(pipeline.contacted)}</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2">
                  <div class="bg-indigo-500 h-2 rounded-full" style="width: ${pipeline.outstanding ? Math.min(100, Math.round((pipeline.contacted / pipeline.outstanding) * 100)) : 0}%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-xs font-semibold mb-1">
                  <span class="text-slate-500">3. Promises Committed</span>
                  <span class="text-amber-600">${Utils.formatCurrency(pipeline.promised)}</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2">
                  <div class="bg-amber-500 h-2 rounded-full" style="width: ${pipeline.outstanding ? Math.min(100, Math.round((pipeline.promised / pipeline.outstanding) * 100)) : 0}%"></div>
                </div>
              </div>

              <div>
                <div class="flex justify-between text-xs font-semibold mb-1">
                  <span class="text-slate-500">4. Successfully Collected</span>
                  <span class="text-emerald-600 font-bold">${Utils.formatCurrency(pipeline.collected)}</span>
                </div>
                <div class="w-full bg-slate-100 rounded-full h-2">
                  <div class="bg-emerald-500 h-2 rounded-full" style="width: ${pipeline.outstanding ? Math.min(100, Math.round((pipeline.collected / pipeline.outstanding) * 100)) : 0}%"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Aging Breakdown Summary -->
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div class="flex justify-between items-center">
              <h2 class="text-base font-bold text-slate-900">Aging Summary</h2>
              <a href="#/outstanding" class="text-xs font-semibold text-indigo-600 hover:text-indigo-800">Details &rarr;</a>
            </div>

            <div class="space-y-1.5">
              <a href="#/outstanding" onclick="OutstandingView.selectedBucket='current'" class="flex justify-between items-center text-xs py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors border-b border-slate-100">
                <span class="text-slate-600 font-medium flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Current (Not Due)
                </span>
                <span class="font-semibold text-slate-900">${Utils.formatCurrency(aging.current ? aging.current.amount : 0)} &rarr;</span>
              </a>
              <a href="#/outstanding" onclick="OutstandingView.selectedBucket='d1_30'" class="flex justify-between items-center text-xs py-1.5 px-2 rounded-lg hover:bg-amber-50/50 transition-colors border-b border-slate-100">
                <span class="text-amber-700 font-medium flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                  1–30 Days Overdue
                </span>
                <span class="font-semibold text-amber-700">${Utils.formatCurrency(aging.d1_30 ? aging.d1_30.amount : 0)} &rarr;</span>
              </a>
              <a href="#/outstanding" onclick="OutstandingView.selectedBucket='d31_60'" class="flex justify-between items-center text-xs py-1.5 px-2 rounded-lg hover:bg-orange-50/50 transition-colors border-b border-slate-100">
                <span class="text-orange-700 font-medium flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-orange-500"></span>
                  31–60 Days Overdue
                </span>
                <span class="font-semibold text-orange-700">${Utils.formatCurrency(aging.d31_60 ? aging.d31_60.amount : 0)} &rarr;</span>
              </a>
              <a href="#/outstanding" onclick="OutstandingView.selectedBucket='d61_90'" class="flex justify-between items-center text-xs py-1.5 px-2 rounded-lg hover:bg-red-50/50 transition-colors border-b border-slate-100">
                <span class="text-red-700 font-medium flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-red-500"></span>
                  61–90 Days Overdue
                </span>
                <span class="font-semibold text-red-700">${Utils.formatCurrency(aging.d61_90 ? aging.d61_90.amount : 0)} &rarr;</span>
              </a>
              <a href="#/outstanding" onclick="OutstandingView.selectedBucket='d90_plus'" class="flex justify-between items-center text-xs py-1.5 px-2 rounded-lg hover:bg-rose-50/50 transition-colors">
                <span class="text-rose-800 font-bold flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-rose-700"></span>
                  90+ Days Critical
                </span>
                <span class="font-bold text-rose-800">${Utils.formatCurrency(aging.d90_plus ? aging.d90_plus.amount : 0)} &rarr;</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
