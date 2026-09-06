/**
 * CollectionSarthi - Follow-Ups Log & Timeline View
 * Displays every collection interaction, customer profile, outcome, and PTP promise
 */

const FollowUpsView = {
  searchTerm: "",
  outcomeFilter: "ALL",
  channelFilter: "ALL",
  followups: [],
  customerMap: new Map(),

  render: async function(container) {
    this.searchTerm = "";
    this.outcomeFilter = "ALL";
    this.channelFilter = "ALL";

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Follow-Up History & Notes</h1>
            <p class="text-sm text-slate-500">Every phone call, WhatsApp reminder, visit, outcome, and payment promise</p>
          </div>
          <button onclick="Modals.openFollowUp()" class="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5 self-start sm:self-auto active:scale-95 transition-all">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            Log Follow-Up
          </button>
        </div>

        <!-- Filter & Search Bar -->
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div class="w-full md:w-80 relative">
            <input type="text" id="fup-search-input" placeholder="Search customer name, phone, notes..." class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" oninput="FollowUpsView.handleSearch(this.value)">
            <svg class="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          </div>

          <div class="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <!-- Outcome Filter -->
            <select id="fup-outcome-filter" onchange="FollowUpsView.handleOutcomeFilter(this.value)" class="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="ALL">All Outcomes</option>
              <option value="PROMISED">Payment Promised (PTP)</option>
              <option value="REQUESTED_TIME">Requested Time / Extension</option>
              <option value="DISPUTED">Disputed Invoice</option>
              <option value="NO_RESPONSE">No Response / Unreachable</option>
              <option value="ESCALATED">Escalated</option>
            </select>

            <!-- Channel Filter -->
            <select id="fup-channel-filter" onchange="FollowUpsView.handleChannelFilter(this.value)" class="text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="ALL">All Channels</option>
              <option value="CALL">Phone Call</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="VISIT">Field Visit</option>
              <option value="EMAIL">Email</option>
            </select>
          </div>
        </div>

        <!-- Table Container -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="followups-table-container">
          <div class="p-8 skeleton"></div>
        </div>
      </div>
    `;

    await this.loadFollowUps();
  },

  loadFollowUps: async function() {
    try {
      // 1. Build customer lookup map from warm cache for instant 0ms name resolution
      this.syncCustomerMap();

      const cached = Store.getWithStale("followups");
      if (cached.data && cached.data.length > 0) {
        this.followups = cached.data;
        this.renderTable();

        // Background revalidation
        if (cached.isStale) {
          Api.call("getFollowUps").then(res => {
            if (res && res.followups) {
              Store.setCached("followups", res.followups);
              this.followups = res.followups;
              this.renderTable();
            }
          }).catch(e => console.warn("Background revalidation failed for followups:", e));
        }
      } else {
        const res = await Api.call("getFollowUps");
        const followups = res.followups || [];
        Store.setCached("followups", followups);
        this.followups = followups;
        this.renderTable();
      }

      // If customer cache was empty, load customers in background to enrich any missing names
      if (this.customerMap.size === 0) {
        Api.call("getCustomers").then(cRes => {
          if (cRes && cRes.customers) {
            Store.setCached("customers", cRes.customers);
            this.syncCustomerMap();
            this.renderTable();
          }
        }).catch(e => {});
      }
    } catch (err) {
      const el = document.getElementById("followups-table-container");
      if (el) {
        el.innerHTML = `
          <div class="p-6 text-sm text-red-600">Failed to load follow-ups: ${err.message}</div>
        `;
      }
    }
  },

  syncCustomerMap: function() {
    this.customerMap.clear();
    const custData = (Store.getWithStale && Store.getWithStale("customers").data) || Store.state.customers || [];
    for (let i = 0; i < custData.length; i++) {
      const c = custData[i];
      if (c && c.CustomerID) {
        this.customerMap.set(c.CustomerID, c);
      }
    }
  },

  handleSearch: function(val) {
    this.searchTerm = (val || "").toLowerCase().trim();
    this.renderTable();
  },

  handleOutcomeFilter: function(val) {
    this.outcomeFilter = val;
    this.renderTable();
  },

  handleChannelFilter: function(val) {
    this.channelFilter = val;
    this.renderTable();
  },

  getCustomerInfo: function(customerId, explicitName) {
    const cust = this.customerMap.get(customerId);
    const name = (cust && cust.CustomerName) || explicitName || (cust && cust.BusinessName) || customerId || "Unknown Customer";
    const phone = (cust && (cust.Phone || cust.WhatsApp)) || "";
    const code = (cust && cust.CustomerCode) || customerId || "";
    return { name, phone, code, cust };
  },

  getChannelBadge: function(type) {
    const t = String(type || "CALL").toUpperCase();
    if (t === "WHATSAPP") {
      return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <svg class="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
        WhatsApp
      </span>`;
    }
    if (t === "VISIT") {
      return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <svg class="w-3.5 h-3.5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
        Visit
      </span>`;
    }
    if (t === "EMAIL") {
      return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
        <svg class="w-3.5 h-3.5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
        Email
      </span>`;
    }
    return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
      <svg class="w-3.5 h-3.5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
      Call
    </span>`;
  },

  getOutcomeBadge: function(outcome) {
    const o = String(outcome || "").toUpperCase();
    if (o === "PROMISED") {
      return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"/></svg>
        Promised (PTP)
      </span>`;
    }
    if (o === "REQUESTED_TIME") {
      return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
        Time Requested
      </span>`;
    }
    if (o === "DISPUTED") {
      return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        Disputed
      </span>`;
    }
    if (o === "NO_RESPONSE") {
      return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>
        No Response
      </span>`;
    }
    if (o === "ESCALATED") {
      return `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
        Escalated
      </span>`;
    }
    return `<span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">${Utils.escapeHtml(outcome || '-')}</span>`;
  },

  renderTable: function() {
    const container = document.getElementById("followups-table-container");
    if (!container || !this.followups) return;

    if (this.followups.length === 0) {
      container.innerHTML = `
        <div class="p-16 text-center">
          <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
          </div>
          <h3 class="text-sm font-bold text-slate-900">No follow-ups recorded yet</h3>
          <p class="text-xs text-slate-500 mt-1 max-w-sm mx-auto">Start logging phone calls, WhatsApp recovery conversations, and promises to maintain complete audit history.</p>
          <button onclick="Modals.openFollowUp()" class="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm">
            Log First Follow-Up
          </button>
        </div>
      `;
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Filter followups by search query, outcome, and channel
    const filtered = this.followups.filter(f => {
      const custInfo = this.getCustomerInfo(f.CustomerID, f.CustomerName);
      
      // Search matching
      if (this.searchTerm) {
        const term = this.searchTerm;
        const matchName = custInfo.name.toLowerCase().includes(term);
        const matchPhone = custInfo.phone.toLowerCase().includes(term);
        const matchCode = custInfo.code.toLowerCase().includes(term);
        const matchRemarks = (f.Remarks || "").toLowerCase().includes(term);
        const matchUser = (f.CreatedBy || "").toLowerCase().includes(term);
        if (!matchName && !matchPhone && !matchCode && !matchRemarks && !matchUser) {
          return false;
        }
      }

      // Outcome filter
      if (this.outcomeFilter !== "ALL") {
        if (String(f.Outcome || "").toUpperCase() !== this.outcomeFilter) {
          return false;
        }
      }

      // Channel filter
      if (this.channelFilter !== "ALL") {
        if (String(f.FollowUpType || "").toUpperCase() !== this.channelFilter) {
          return false;
        }
      }

      return true;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="p-12 text-center text-slate-500 text-sm">
          No follow-ups found matching your search or filter criteria.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="overflow-x-auto">
        <table class="w-full text-left text-sm text-slate-700">
          <thead class="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
            <tr>
              <th class="px-5 py-3">Date</th>
              <th class="px-5 py-3">Customer / Debtor</th>
              <th class="px-5 py-3">Channel</th>
              <th class="px-5 py-3">Outcome</th>
              <th class="px-5 py-3">Promise Details</th>
              <th class="px-5 py-3">Remarks & Notes</th>
              <th class="px-5 py-3">Logged By</th>
              <th class="px-5 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${filtered.map(f => {
              const custInfo = this.getCustomerInfo(f.CustomerID, f.CustomerName);
              const cleanPhone = custInfo.phone ? String(custInfo.phone).replace(/\D/g, "").slice(-10) : "";
              const hasPromise = Boolean(f.PromiseDate);
              const isOverduePromise = hasPromise && f.PromiseDate < todayStr && f.Outcome === "PROMISED";

              return `
                <tr class="hover:bg-slate-50/80 transition-colors">
                  <!-- Date -->
                  <td class="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap align-top">
                    <div class="font-medium text-slate-900">${Utils.formatDate(f.FollowUpDate || f.CreatedAt)}</div>
                    ${f.CreatedAt && f.CreatedAt.includes(" ") ? `<div class="text-[10px] text-slate-400 font-mono">${f.CreatedAt.split(" ")[1]}</div>` : ""}
                  </td>

                  <!-- Customer / Debtor (With Name, Code & Phone) -->
                  <td class="px-5 py-3.5 align-top">
                    <div class="flex flex-col">
                      <a href="#/customers/${encodeURIComponent(f.CustomerID)}" class="font-bold text-slate-900 hover:text-indigo-600 hover:underline flex items-center gap-1.5 transition-colors">
                        <span>${Utils.escapeHtml(custInfo.name)}</span>
                      </a>
                      <div class="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                        <span class="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">${custInfo.code}</span>
                        ${cleanPhone ? `<span class="text-slate-500 font-mono">📞 ${cleanPhone}</span>` : ""}
                      </div>
                    </div>
                  </td>

                  <!-- Channel -->
                  <td class="px-5 py-3.5 whitespace-nowrap align-top">
                    ${this.getChannelBadge(f.FollowUpType)}
                  </td>

                  <!-- Outcome -->
                  <td class="px-5 py-3.5 whitespace-nowrap align-top">
                    ${this.getOutcomeBadge(f.Outcome)}
                  </td>

                  <!-- Promise Details -->
                  <td class="px-5 py-3.5 text-xs whitespace-nowrap align-top">
                    ${hasPromise ? `
                      <div class="flex flex-col">
                        <span class="font-bold ${isOverduePromise ? 'text-red-700' : 'text-emerald-700'}">${Utils.formatCurrency(f.PromiseAmount || 0)}</span>
                        <div class="flex items-center gap-1 mt-0.5">
                          <span class="text-[11px] text-slate-500">By ${Utils.formatDate(f.PromiseDate)}</span>
                          ${isOverduePromise ? `<span class="px-1.5 py-0.2 rounded text-[10px] font-extrabold bg-red-100 text-red-700">Overdue</span>` : ""}
                        </div>
                      </div>
                    ` : '<span class="text-slate-400">-</span>'}
                  </td>

                  <!-- Remarks -->
                  <td class="px-5 py-3.5 text-xs text-slate-700 max-w-xs align-top">
                    <p class="line-clamp-2 leading-relaxed" title="${Utils.escapeHtml(f.Remarks || '')}">${Utils.escapeHtml(f.Remarks || '-')}</p>
                  </td>

                  <!-- Logged By -->
                  <td class="px-5 py-3.5 text-xs text-slate-500 whitespace-nowrap align-top">
                    <div class="flex items-center gap-1">
                      <svg class="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                      <span>${Utils.escapeHtml(f.CreatedBy || 'Admin')}</span>
                    </div>
                  </td>

                  <!-- Action -->
                  <td class="px-5 py-3.5 text-right whitespace-nowrap align-top">
                    <div class="flex items-center justify-end gap-1.5">
                      ${cleanPhone ? `
                        <a href="https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Namaste ${custInfo.name}, regards from CollectionSarthi. Regarding our discussion on payment follow-up...`)}" target="_blank" class="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors" title="Send WhatsApp">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                        </a>
                      ` : ""}
                      <button onclick="Modals.openFollowUp('${f.CustomerID}', '${Utils.escapeHtml(custInfo.name).replace(/'/g, "\\'")}')" class="p-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors" title="Log New Follow-up for this Debtor">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
      <div class="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
        <span>Showing <b>${filtered.length}</b> of <b>${this.followups.length}</b> follow-up record(s)</span>
        <span class="text-slate-400">PTP = Promise to Pay</span>
      </div>
    `;
  }
};
