/**
 * CollectionSarthi - Dynamic Modals & Slide-over Drawer Component
 */

const Modals = {
  container: null,

  init: function() {
    this.container = document.getElementById("modal-container");
  },

  close: function() {
    if (!this.container) this.init();
    if (this.container) {
      this.container.innerHTML = "";
    }
  },

  /**
   * Open Record Payment Modal
   */
  openRecordPayment: async function(prefill = {}) {
    if (!this.container) this.init();
    const custData = Store.getWithStale("customers");
    let customers = custData.data || Store.state.customers || [];
    if (!customers || customers.length === 0) {
      try {
        const res = await Api.call("getCustomers");
        customers = res.customers || [];
        Store.setCached("customers", customers);
      } catch (e) {}
    } else if (custData.isStale) {
      // Silently refresh in background without blocking modal
      Api.call("getCustomers").then(res => {
        if (res && res.customers) Store.setCached("customers", res.customers);
      }).catch(e => {});
    }
    const invoices = Store.state.invoices || [];

    const custOptions = customers.map(c => `
      <option value="${c.CustomerID}" ${prefill.customerId === c.CustomerID ? "selected" : ""}>
        ${Utils.escapeHtml(c.CustomerName)} (Outstanding: ${Utils.formatCurrency(c.metrics ? c.metrics.totalOutstanding : 0)})
      </option>
    `).join("");

    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transform transition-all">
          <div class="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
            <div>
              <h3 class="text-lg font-semibold flex items-center">
                <svg class="w-5 h-5 mr-2 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Record Payment
              </h3>
              <p class="text-xs text-slate-400">Append-only safe recovery transaction</p>
            </div>
            <button onclick="Modals.close()" class="text-slate-400 hover:text-white">&times;</button>
          </div>

          <form id="payment-form" class="p-6 space-y-4" onsubmit="Modals.submitPayment(event, '${requestId}')">
            <input type="hidden" name="requestId" value="${requestId}">

            <div>
              <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Customer <span class="text-red-500">*</span></label>
              <select name="CustomerID" required class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value="">Select Customer...</option>
                ${custOptions}
              </select>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Amount (₹) <span class="text-red-500">*</span></label>
                <input type="number" name="Amount" min="1" step="any" required placeholder="50000" value="${prefill.amount || ""}" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold">
              </div>
              <div>
                <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Payment Date <span class="text-red-500">*</span></label>
                <input type="date" name="PaymentDate" required value="${new Date().toISOString().split("T")[0]}" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Mode <span class="text-red-500">*</span></label>
                <select name="PaymentMode" required class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                  <option value="UPI">UPI / QR Code</option>
                  <option value="NEFT" selected>NEFT / RTGS / IMPS</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CASH">Cash</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Reference / UTR No</label>
                <input type="text" name="ReferenceNo" placeholder="UTR / Cheque No" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Remarks / Note</label>
              <input type="text" name="Remarks" placeholder="e.g. Received via PhonePe against August billing" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
            </div>

            <div class="pt-2 flex justify-end space-x-3">
              <button type="button" onclick="Modals.close()" class="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Cancel</button>
              <button type="submit" id="btn-submit-payment" class="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center shadow-md shadow-emerald-600/20">
                <span>Confirm & Record Payment</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  submitPayment: async function(e, requestId) {
    e.preventDefault();
    const btn = document.getElementById("btn-submit-payment");
    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Recording...`;

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      const res = await Api.call("recordPayment", data);
      Toast.success(res.message || "Payment recorded successfully!");
      Store.invalidate("dashboard", "customers", "invoices", "payments", "actions");
      Modals.close();
      App.router(); // Refresh current active view
    } catch (err) {
      Toast.error(err.message || "Failed to record payment");
      btn.disabled = false;
      btn.innerText = "Confirm & Record Payment";
    }
  },

  _followUpCustomers: [],
  _selectedFollowUpCustomer: null,

  /**
   * Open Follow-up Logging Modal with smart customer search & select
   */
  openFollowUp: async function(customerId = "", customerName = "") {
    if (!this.container) this.init();
    const todayStr = new Date().toISOString().split("T")[0];

    // Normalize customerId if placeholder string was passed
    if (customerId === "Select Customer in Form") customerId = "";

    // Load customers from Store or API
    const custData = Store.getWithStale("customers");
    let customers = custData.data || Store.state.customers || [];
    if (!customers || customers.length === 0) {
      try {
        const res = await Api.call("getCustomers");
        customers = res.customers || [];
        Store.setCached("customers", customers);
      } catch (e) {
        console.warn("Could not load customers for follow-up modal:", e);
      }
    } else if (custData.isStale) {
      Api.call("getCustomers").then(res => {
        if (res && res.customers) Store.setCached("customers", res.customers);
      }).catch(e => {});
    }
    this._followUpCustomers = customers;

    // Find preselected customer if customerId passed
    if (customerId) {
      this._selectedFollowUpCustomer = this._followUpCustomers.find(c => c.CustomerID === customerId) || {
        CustomerID: customerId,
        CustomerName: customerName || "Customer",
        CustomerCode: customerId,
        Phone: "-",
        metrics: { totalOutstanding: 0, level: "LOW RISK" }
      };
    } else {
      this._selectedFollowUpCustomer = null;
    }

    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
          <div class="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
            <div>
              <h3 class="text-lg font-semibold flex items-center">
                <svg class="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                Log Follow-up Activity
              </h3>
              <p class="text-xs text-slate-400">Record calls, WhatsApp messages, promises & debtor notes</p>
            </div>
            <button onclick="Modals.close()" class="text-slate-400 hover:text-white">&times;</button>
          </div>

          <form id="followup-form" class="p-6 space-y-4" onsubmit="Modals.submitFollowUp(event)">
            <input type="hidden" name="CustomerID" id="fup-customer-id" value="${this._selectedFollowUpCustomer ? this._selectedFollowUpCustomer.CustomerID : ''}">
            <input type="hidden" name="FollowUpDate" value="${todayStr}">

            <!-- Smart Customer Search & Select Section -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-semibold uppercase text-slate-500">
                  Select Customer / Debtor <span class="text-red-500">*</span>
                </label>
                <span class="text-[11px] text-slate-400 font-medium">Quick search by name, code or phone</span>
              </div>
              <div id="fup-customer-selection-area">
                ${this.renderFollowUpCustomerArea()}
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Type <span class="text-red-500">*</span></label>
                <select name="FollowUpType" required class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                  <option value="CALL">Phone Call</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="VISIT">Physical Visit</option>
                  <option value="EMAIL">Email</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Outcome <span class="text-red-500">*</span></label>
                <select name="Outcome" id="fup-outcome-select" required onchange="Modals.togglePromiseFields(this.value)" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-medium text-slate-700">
                  <option value="PROMISED" selected>Payment Promised</option>
                  <option value="REQUESTED_TIME">Requested Extension</option>
                  <option value="PARTIAL_PAYMENT">Partial Paid</option>
                  <option value="DISPUTE">Invoice Dispute</option>
                  <option value="NO_RESPONSE">No Response / Switch Off</option>
                  <option value="REFUSED">Refused Payment</option>
                </select>
              </div>
            </div>

            <!-- Promise specific fields -->
            <div id="promise-fields" class="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-semibold uppercase text-amber-800 mb-1">Promise Date <span class="text-red-500">*</span></label>
                  <input type="date" name="PromiseDate" id="promise-date-input" value="${todayStr}" class="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none">
                </div>
                <div>
                  <label class="block text-xs font-semibold uppercase text-amber-800 mb-1">Promise Amount (₹) <span class="text-red-500">*</span></label>
                  <input type="number" name="PromiseAmount" id="promise-amount-input" placeholder="50000" class="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm bg-white font-semibold focus:outline-none">
                </div>
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Next Follow-Up Date</label>
              <input type="date" name="NextFollowUpDate" value="${todayStr}" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Remarks</label>
              <textarea name="Remarks" rows="2" placeholder="Customer promised payment after GST filing on 10th..." class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"></textarea>
            </div>

            <div class="pt-2 flex justify-end space-x-3">
              <button type="button" onclick="Modals.close()" class="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Cancel</button>
              <button type="submit" id="btn-submit-fup" class="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-600/20">
                Log Follow-up
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  renderFollowUpCustomerArea: function() {
    const c = this._selectedFollowUpCustomer;
    if (c) {
      const outAmt = c.metrics ? c.metrics.totalOutstanding : 0;
      return `
        <div class="p-3 bg-indigo-50/80 border border-indigo-200 rounded-xl flex items-center justify-between gap-3 transition-all">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm">
              ${(c.CustomerName || "C").charAt(0).toUpperCase()}
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-bold text-slate-900 text-sm truncate">${Utils.escapeHtml(c.CustomerName)}</span>
                <span class="text-[11px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">${Utils.escapeHtml(c.CustomerCode || c.CustomerID)}</span>
                ${c.metrics ? Utils.getRiskBadge(c.metrics.level) : ""}
              </div>
              <div class="text-xs text-slate-500 flex items-center gap-2 mt-0.5 flex-wrap">
                <span>Phone: ${c.Phone || "-"}</span>
                ${c.City ? `<span>• ${Utils.escapeHtml(c.City)}</span>` : ""}
                <span>•</span>
                <span class="font-semibold text-slate-700">Outstanding: ${Utils.formatCurrency(outAmt)}</span>
              </div>
            </div>
          </div>
          <button type="button" onclick="Modals.clearFollowUpCustomer()" class="text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-white hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-lg flex-shrink-0 shadow-sm transition-colors" title="Select a different customer">
            Change
          </button>
        </div>
      `;
    }

    return `
      <div class="space-y-2">
        <div class="relative">
          <input type="text" id="fup-customer-search" placeholder="Search customer by name, code, phone, or city..." class="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500" oninput="Modals.filterFollowUpCustomers(this.value)" autocomplete="off">
          <svg class="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
        </div>
        <div id="fup-customer-dropdown" class="max-h-48 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white shadow-inner">
          ${this.renderCustomerDropdownList(this._followUpCustomers)}
        </div>
      </div>
    `;
  },

  renderCustomerDropdownList: function(customers) {
    if (!customers || customers.length === 0) {
      return `<div class="p-4 text-center text-xs text-slate-400">No matching customers found.</div>`;
    }

    return customers.map(c => {
      const outAmt = c.metrics ? c.metrics.totalOutstanding : 0;
      return `
        <div onclick="Modals.selectFollowUpCustomer('${c.CustomerID}')" class="p-2.5 hover:bg-indigo-50/70 cursor-pointer transition-colors flex items-center justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-semibold text-slate-900 truncate">${Utils.escapeHtml(c.CustomerName)}</span>
              <span class="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded">${Utils.escapeHtml(c.CustomerCode || c.CustomerID)}</span>
              ${c.metrics ? Utils.getRiskBadge(c.metrics.level) : ""}
            </div>
            <div class="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span>${c.Phone || "No phone"}</span>
              ${c.City ? `<span>• ${Utils.escapeHtml(c.City)}</span>` : ""}
            </div>
          </div>
          <div class="text-right flex-shrink-0">
            <div class="text-xs font-bold text-slate-800">${Utils.formatCurrency(outAmt)}</div>
            <div class="text-[10px] text-slate-400">Outstanding</div>
          </div>
        </div>
      `;
    }).join("");
  },

  filterFollowUpCustomers: function(query) {
    const q = (query || "").toLowerCase().trim();
    const dropdown = document.getElementById("fup-customer-dropdown");
    if (!dropdown) return;

    if (!q) {
      dropdown.innerHTML = this.renderCustomerDropdownList(this._followUpCustomers);
      return;
    }

    const filtered = this._followUpCustomers.filter(c => {
      return (
        (c.CustomerName && c.CustomerName.toLowerCase().includes(q)) ||
        (c.CustomerCode && c.CustomerCode.toLowerCase().includes(q)) ||
        (c.Phone && c.Phone.includes(q)) ||
        (c.City && c.City.toLowerCase().includes(q))
      );
    });

    dropdown.innerHTML = this.renderCustomerDropdownList(filtered);
  },

  selectFollowUpCustomer: function(customerId) {
    const cust = this._followUpCustomers.find(c => c.CustomerID === customerId);
    if (!cust) return;

    this._selectedFollowUpCustomer = cust;
    const hiddenInput = document.getElementById("fup-customer-id");
    if (hiddenInput) hiddenInput.value = cust.CustomerID;

    const area = document.getElementById("fup-customer-selection-area");
    if (area) {
      area.innerHTML = this.renderFollowUpCustomerArea();
    }
  },

  clearFollowUpCustomer: function() {
    this._selectedFollowUpCustomer = null;
    const hiddenInput = document.getElementById("fup-customer-id");
    if (hiddenInput) hiddenInput.value = "";

    const area = document.getElementById("fup-customer-selection-area");
    if (area) {
      area.innerHTML = this.renderFollowUpCustomerArea();
      const searchInput = document.getElementById("fup-customer-search");
      if (searchInput) searchInput.focus();
    }
  },

  togglePromiseFields: function(outcome) {
    const fields = document.getElementById("promise-fields");
    const dateInput = document.getElementById("promise-date-input");
    const amtInput = document.getElementById("promise-amount-input");
    if (outcome === "PROMISED") {
      fields.style.display = "block";
      dateInput.required = true;
      amtInput.required = true;
    } else {
      fields.style.display = "none";
      dateInput.required = false;
      amtInput.required = false;
    }
  },

  submitFollowUp: async function(e) {
    e.preventDefault();
    const btn = document.getElementById("btn-submit-fup");
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    if (!data.CustomerID) {
      Toast.error("Please search and select a customer first!");
      const searchInput = document.getElementById("fup-customer-search");
      if (searchInput) searchInput.focus();
      return;
    }

    btn.disabled = true;
    btn.innerText = "Saving...";

    try {
      await Api.call("createFollowUp", data);
      Toast.success("Follow-up logged successfully");
      Store.invalidate("dashboard", "customers", "followups", "actions");
      Modals.close();
      App.router();
    } catch (err) {
      Toast.error(err.message || "Failed to log follow-up");
      btn.disabled = false;
      btn.innerText = "Log Follow-up";
    }
  },

  /**
   * Open New Customer Modal
   */
  openNewCustomer: function() {
    if (!this.container) this.init();

    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden">
          <div class="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
            <h3 class="text-lg font-semibold">Add New Customer / Debtor</h3>
            <button onclick="Modals.close()" class="text-slate-400 hover:text-white">&times;</button>
          </div>

          <form id="new-customer-form" class="p-6 space-y-4" onsubmit="Modals.submitNewCustomer(event)">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Customer / Trade Name <span class="text-red-500">*</span></label>
                <input type="text" name="CustomerName" required placeholder="Sharma Traders" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              </div>
              <div>
                <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Contact Person</label>
                <input type="text" name="ContactPerson" placeholder="Ramesh Sharma" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Phone / Mobile <span class="text-red-500">*</span></label>
                <input type="tel" name="Phone" required placeholder="9820011223" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              </div>
              <div>
                <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">WhatsApp Number</label>
                <input type="tel" name="WhatsApp" placeholder="9820011223" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">City</label>
                <input type="text" name="City" placeholder="Mumbai" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              </div>
              <div>
                <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">GSTIN</label>
                <input type="text" name="GSTIN" placeholder="27AAACS1429B1ZB" maxlength="15" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm uppercase focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono">
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Credit Limit (₹)</label>
                <input type="number" name="CreditLimit" placeholder="500000" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none font-semibold">
              </div>
              <div>
                <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Default Credit Days</label>
                <input type="number" name="CreditDays" value="30" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              </div>
            </div>

            <div class="pt-2 flex justify-end space-x-3">
              <button type="button" onclick="Modals.close()" class="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Cancel</button>
              <button type="submit" id="btn-submit-cust" class="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-600/20">
                Save Customer
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  },

  submitNewCustomer: async function(e) {
    e.preventDefault();
    const btn = document.getElementById("btn-submit-cust");
    btn.disabled = true;
    btn.innerText = "Saving...";

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
      await Api.call("createCustomer", data);
      Toast.success("Customer added successfully");
      Store.invalidate("customers", "dashboard");
      Modals.close();
      App.router();
    } catch (err) {
      Toast.error(err.message || "Failed to add customer");
      btn.disabled = false;
      btn.innerText = "Save Customer";
    }
  },

  /**
   * Universal Pro Plan Upgrade Modal
   */
  openUpgradeModal: function(featureName = "This feature", benefitText = "Upgrade to unlock advanced collection powers and recover money 40% faster.", targetPlan = "GROWTH") {
    if (!this.container) this.init();

    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
          <div class="p-6 bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white relative">
            <button onclick="Modals.close()" class="absolute top-4 right-4 text-white/70 hover:text-white text-xl font-bold">&times;</button>
            <div class="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center text-xl font-black mb-3 shadow-lg shadow-amber-400/20">
              👑
            </div>
            <span class="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/50 text-indigo-200 border border-indigo-400/30">
              Sarthi Pro Feature
            </span>
            <h3 class="text-xl font-black mt-2 tracking-tight text-white">${Utils.escapeHtml(featureName)}</h3>
            <p class="text-xs text-indigo-200 mt-1 leading-relaxed">${Utils.escapeHtml(benefitText)}</p>
          </div>

          <div class="p-6 space-y-4">
            <div class="space-y-2.5">
              <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Included in Growth Plan (Sarthi Pro):</span>
              <ul class="space-y-2 text-xs text-slate-700">
                <li class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                  <span><b>3 Team Seats</b> (1 Owner + 2 Collection Executives)</span>
                </li>
                <li class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                  <span><b>Up to 500 Debtors</b> (vs. 100 on Starter)</span>
                </li>
                <li class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                  <span><b>Promise to Pay (PTP) Tracker</b> & Broken Commit Alerts</span>
                </li>
                <li class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                  <span><b>AI Bad Debt Risk Scoring</b> (0-100 Warning System)</span>
                </li>
                <li class="flex items-center gap-2">
                  <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                  <span><b>13+ High-Converting WhatsApp Templates & Quick Auto-Logs</b></span>
                </li>
              </ul>
            </div>

            <div class="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between">
              <div>
                <span class="text-xs text-indigo-900 font-bold">Starts at just ₹599/mo</span>
                <p class="text-[10px] text-indigo-600">or ₹5,999/year (Save ~16%)</p>
              </div>
              <span class="text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">Razorpay Live</span>
            </div>

            <div class="pt-2 flex items-center justify-end gap-3">
              <button onclick="Modals.close()" class="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                Maybe Later
              </button>
              <button onclick="Modals.close(); window.location.hash = '#/subscription';" class="px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5">
                <span>⚡ View Plans & Upgrade</span>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * 10+ Very Convincing WhatsApp Reminder Message Templates Library
   */
  getWhatsAppTemplates: function(name, amount, biz) {
    const amtStr = Number(amount || 0).toLocaleString("en-IN");
    return {
      gentle: {
        id: "gentle",
        title: "1. Gentle Courtesy Reminder (Soft / Relationship)",
        badge: "Soft / Goodwill",
        text: `Dear ${name}, namaskar! Hope you are doing well. This is a gentle reminder from ${biz} regarding pending balance of ₹${amtStr}. We value our business relationship and request you to kindly process the clearance at your earliest convenience. Thank you! 🙏`
      },
      reconcile: {
        id: "reconcile",
        title: "2. Account Statement & Reconciliation Check",
        badge: "Ledger Audit",
        text: `Hello ${name}, accounts team at ${biz} here. As per our books, an outstanding balance of ₹${amtStr} is pending reconciliation. Kindly verify against your ledger and confirm the scheduled payment date, or let us know if bill copies are needed. Thank you!`
      },
      due_today: {
        id: "due_today",
        title: "3. Payment Due Today Alert (Prompt Clearance)",
        badge: "Due Alert",
        text: `Dear ${name}, greetings from ${biz}. Your invoice payment totaling ₹${amtStr} is due for settlement today. Kindly arrange the transfer via NEFT/RTGS/UPI to ensure continuous uninterrupted supplies. Thank you for your promptness!`
      },
      ptp_commitment: {
        id: "ptp_commitment",
        title: "4. Promised Date (PTP) Commitment Follow-up",
        badge: "Commitment",
        text: `Dear ${name}, as discussed and committed by your team, payment of ₹${amtStr} was scheduled for release today towards ${biz}. Kindly share the UTR / bank transfer screenshot once initiated. Thank you!`
      },
      supplier_cashflow: {
        id: "supplier_cashflow",
        title: "5. Supplier Cash Flow & Vendor Commitment Appeal",
        badge: "Urgent Appeal",
        text: `Dear ${name}, outstanding balance of ₹${amtStr} with ${biz} has been pending beyond agreed terms. As we have strict time-bound commitments with manufacturing units and raw material suppliers, we sincerely urge you to clear this amount today. Thank you for your cooperation.`
      },
      dispatch_hold: {
        id: "dispatch_hold",
        title: "6. Credit Limit & Order Dispatch Hold Warning",
        badge: "Operational Hold",
        text: `URGENT NOTICE: Dear ${name}, your outstanding dues of ₹${amtStr} with ${biz} have exceeded credit limits. As per our credit policy, new order processing and dispatches will be put on temporary hold until clearance. Kindly initiate payment today to avoid operational disruption.`
      },
      director_appeal: {
        id: "director_appeal",
        title: "7. Owner / Director Direct Personal Appeal",
        badge: "Executive Note",
        text: `Dear ${name} ji, writing personally from ${biz} leadership. We have always extended our highest priority service and credit support to your esteemed firm. I request your personal intervention to release our overdue payment of ₹${amtStr} this week. Looking forward to your prompt support.`
      },
      audit_gst: {
        id: "audit_gst",
        title: "8. Month-End Financial Audit & GST Compliance",
        badge: "Statutory / GST",
        text: `Dear ${name}, our statutory auditors and finance team are finalizing periodic accounts closing and GST reconciliation for ${biz}. An overdue balance of ₹${amtStr} has been flagged in your account. Kindly clear this immediately so returns match smoothly without tax audit mismatch.`
      },
      installment_offer: {
        id: "installment_offer",
        title: "9. 50% Token / Installment Settlement Offer",
        badge: "Relief / Settlement",
        text: `Dear ${name}, we understand market cash flow challenges. If clearing the full amount of ₹${amtStr} is not feasible today, please release at least 50% immediately to keep your credit active with ${biz}, and confirm the date for the remaining balance. Thank you!`
      },
      banking_utr: {
        id: "banking_utr",
        title: "10. Banking Reconciliation & UTR Confirmation",
        badge: "Banking Check",
        text: `Dear ${name}, we are reconciling today's bank statement for ${biz}. Could you please share the UTR / NEFT reference number for the pending amount of ₹${amtStr}? If not yet processed, kindly expedite the transfer today. Thank you!`
      },
      pre_legal: {
        id: "pre_legal",
        title: "11. Pre-Legal Caution & Credit Bureau Intimation",
        badge: "Pre-Legal Warning",
        text: `PRE-LEGAL CAUTION: Attention ${name}, despite repeated follow-ups, overdue payment of ₹${amtStr} with ${biz} remains unpaid. Please note that continued non-payment may impact your commercial credit score and compel us to refer this file for legal recovery. Kindly settle within 24 hours.`
      },
      legal_demand: {
        id: "legal_demand",
        title: "12. Final Demand Notice (48-Hour Ultimatum)",
        badge: "Critical Notice",
        text: `FINAL DEMAND NOTICE: Attention ${name}, outstanding amount of ₹${amtStr} with ${biz} is critically overdue. Immediate settlement within 48 hours is required to prevent formal legal recovery proceedings, interest charges, and statutory recovery notice under commercial debt laws.`
      },
      thank_you: {
        id: "thank_you",
        title: "13. Payment Received & Thank You Acknowledgment",
        badge: "Goodwill / Receipt",
        text: `Dear ${name}, thank you for the payment received towards your account with ${biz}! We sincerely appreciate your cooperation and look forward to strengthening our valued business partnership. 🙏`
      }
    };
  },

  /**
   * WhatsApp Template Quick Sender with Direct Deep-Link & 13 Persuasive Templates
   */
  openWhatsAppSender: function(phone, name, amount, customerId = "") {
    if (!this.container) this.init();
    const isPro = Store.isPro();
    const biz = (Store.state.settings && Store.state.settings.BUSINESS_NAME) || "Apex Supplies";
    const amtStr = Number(amount || 0).toLocaleString("en-IN");
    const templates = this.getWhatsAppTemplates(name, amount, biz);
    this._waTemplates = templates;

    let defaultKey = "gentle";
    if (amount > 0 && Number(amount) > 100000) defaultKey = "supplier_cashflow";

    // Growth Plan gets 13+ Persuasive Templates library; Starter gets standard direct reminder
    const starterBasicMsg = `Dear ${name}, namaskar! This is a reminder from ${biz} regarding pending balance of ₹${amtStr}. Kindly arrange for payment clearance at your earliest convenience. Thank you!`;
    const selectedMsg = isPro
      ? (templates[defaultKey] ? templates[defaultKey].text : templates.gentle.text)
      : starterBasicMsg;

    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div class="px-6 py-4 bg-emerald-600 text-white flex justify-between items-center shadow-md">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
              </div>
              <div>
                <h3 class="text-base font-bold leading-tight">Instant WhatsApp Reminder</h3>
                <p class="text-xs text-emerald-100">${isPro ? "Deep-link direct sending with persuasive templates" : "Direct WhatsApp Reminder (Starter Mode)"}</p>
              </div>
            </div>
            <button onclick="Modals.close()" class="text-white/80 hover:text-white text-xl font-bold p-1">&times;</button>
          </div>

          <div class="p-6 space-y-4">
            <!-- Debtor summary header -->
            <div class="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <p class="text-[11px] font-semibold uppercase text-slate-500">Debtor / Contact</p>
                <p class="text-sm font-bold text-slate-900">${Utils.escapeHtml(name)}</p>
                <p class="text-xs font-mono text-slate-500">${phone || "No phone registered"}</p>
              </div>
              <div class="text-right">
                <p class="text-[11px] font-semibold uppercase text-slate-500">Due Balance</p>
                <p class="text-base font-extrabold text-indigo-700">₹${amtStr}</p>
              </div>
            </div>

            <!-- Template Picker for Growth OR Locked Banner for Starter -->
            ${isPro ? `
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="block text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                    <span>Select Reminder Template</span>
                    <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">👑 13 Persuasive Templates</span>
                  </label>
                </div>
                <select id="wa-template-select" onchange="Modals.handleTemplateChange(this.value)" class="w-full text-xs font-semibold border border-indigo-200 bg-indigo-50/50 rounded-xl p-2.5 focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm">
                  ${Object.keys(templates).map(k => `
                    <option value="${k}" ${k === defaultKey ? "selected" : ""}>
                      ${templates[k].title}
                    </option>
                  `).join("")}
                </select>
              </div>
            ` : `
              <div class="p-3.5 bg-gradient-to-r from-amber-50 to-indigo-50 border border-amber-200/80 rounded-xl">
                <div class="flex items-start justify-between gap-3">
                  <div class="space-y-1">
                    <div class="flex items-center gap-1.5 text-xs font-black text-amber-950">
                      <svg class="w-4 h-4 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
                      <span>13+ Persuasive WhatsApp Templates (Growth Plan Feature)</span>
                    </div>
                    <p class="text-[11px] text-slate-600 leading-relaxed">
                      Starter plan includes standard basic text. Upgrade to <b>Growth Plan (Sarthi Pro)</b> to unlock 13 high-converting templates: <i>Gentle, PTP Followup, Dispatch Hold, Statutory GST, Legal Notices & more</i>.
                    </p>
                  </div>
                  <button type="button" onclick="Modals.openUpgradeModal('Unlock 13+ High-Converting WhatsApp Templates Library (Gentle, PTP, Credit Hold, Legal Notice)')" class="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[11px] font-black tracking-wide shadow-sm flex-shrink-0 flex items-center gap-1 active:scale-95 transition-all">
                    <span>⚡ Unlock</span>
                  </button>
                </div>
              </div>
            `}

            <!-- Message Preview & Character Count -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="block text-xs font-semibold uppercase text-slate-500">Message Preview (Editable)</label>
                <div class="flex items-center gap-2">
                  <span id="wa-char-count" class="text-[11px] font-mono text-slate-400">${selectedMsg.length} chars</span>
                  <button type="button" onclick="Modals.copyWhatsAppText()" class="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"/></svg>
                    Copy Text
                  </button>
                </div>
              </div>
              <textarea id="wa-text-preview" rows="5" oninput="document.getElementById('wa-char-count').innerText = this.value.length + ' chars'" class="w-full border border-slate-200 rounded-xl p-3 text-xs leading-relaxed text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50/50 font-sans shadow-inner">${selectedMsg}</textarea>
            </div>

            <!-- Auto-log Follow-up check -->
            ${customerId ? `
              <div class="p-3 bg-emerald-50/50 border border-emerald-200/60 rounded-xl flex items-center gap-2.5">
                <input type="checkbox" id="wa-autolog-checkbox" checked class="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500">
                <label for="wa-autolog-checkbox" class="text-xs text-slate-700 font-medium cursor-pointer">
                  Auto-record this reminder in Customer Follow-up Timeline
                </label>
              </div>
            ` : ""}

            <!-- Actions -->
            <div class="pt-2 flex items-center justify-between">
              <button onclick="Modals.close()" class="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button onclick="Modals.sendWhatsAppDirect('${phone}', '${customerId}')" class="px-5 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/25 active:scale-95 transition-all">
                <span>Send via WhatsApp</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  handleTemplateChange: function(type) {
    if (!Store.isPro()) {
      Modals.openUpgradeModal("Unlock 13+ High-Converting WhatsApp Templates Library");
      return;
    }
    const preview = document.getElementById("wa-text-preview");
    const counter = document.getElementById("wa-char-count");
    if (preview && this._waTemplates && this._waTemplates[type]) {
      const text = this._waTemplates[type].text;
      preview.value = text;
      if (counter) counter.innerText = text.length + " chars";
    }
  },

  copyWhatsAppText: function() {
    const preview = document.getElementById("wa-text-preview");
    if (!preview) return;
    navigator.clipboard.writeText(preview.value).then(() => {
      Toast.success("WhatsApp message copied to clipboard!");
    }).catch(() => {
      preview.select();
      document.execCommand("copy");
      Toast.success("Message copied!");
    });
  },

  sendWhatsAppDirect: async function(phone, customerId) {
    const preview = document.getElementById("wa-text-preview");
    const msg = preview ? preview.value : "";
    const autoLog = document.getElementById("wa-autolog-checkbox");

    if (autoLog && autoLog.checked && customerId) {
      try {
        await Api.call("createFollowUp", {
          CustomerID: customerId,
          FollowUpDate: new Date().toISOString().split("T")[0],
          FollowUpType: "WHATSAPP",
          Outcome: "SENT_REMINDER",
          Remarks: "WhatsApp reminder sent: " + (msg.length > 80 ? msg.substring(0, 80) + "..." : msg)
        });
        Toast.success("Follow-up logged in timeline");
      } catch (e) {
        console.warn("Could not auto-log follow-up", e);
      }
    }

    const waLink = Utils.getWhatsAppUrl(phone, msg);
    // Direct deep-link execution
    window.open(waLink, "_blank");
    Modals.close();
  },

  // ==========================================
  // UNIVERSAL BULK CSV IMPORTER
  // ==========================================
  _csvState: {
    entityType: "customers",
    rows: [],
    validRows: [],
    invalidRows: []
  },

  /**
   * Open Universal Bulk CSV Modal
   * @param {'customers'|'invoices'|'payments'} entityType
   */
  openBulkCsvModal: async function(entityType = "customers") {
    if (!this.container) this.init();
    this._csvState = {
      entityType: entityType,
      rows: [],
      validRows: [],
      invalidRows: []
    };

    // Ensure customers are in cache for invoice/payment customer lookups
    if (entityType !== "customers") {
      let custs = (Store.getWithStale("customers").data) || Store.state.customers;
      if (!custs || custs.length === 0) {
        try {
          const res = await Api.call("getCustomers");
          Store.setCached("customers", res.customers || []);
        } catch (e) {}
      }
    }

    this.renderBulkCsvModal();
  },

  switchBulkEntity: function(newType) {
    this._csvState.entityType = newType;
    this._csvState.rows = [];
    this._csvState.validRows = [];
    this._csvState.invalidRows = [];
    this.renderBulkCsvModal();
  },

  renderBulkCsvModal: function() {
    const type = this._csvState.entityType;
    const meta = {
      customers: {
        title: "Debtors & Customers Bulk CSV Import",
        subtitle: "Import client profiles, credit limits, phone numbers, and credit days",
        cols: "CustomerName, Phone, City, CreditLimit, CreditDays, ContactPerson, Email, GSTIN",
        iconBg: "bg-indigo-50 text-indigo-600",
        color: "indigo"
      },
      invoices: {
        title: "Invoice Ledger Bulk CSV Import",
        subtitle: "Upload unpaid or historical invoices mapped to existing debtors",
        cols: "CustomerName or Phone, InvoiceNo, InvoiceDate, DueDate, InvoiceAmount, Description",
        iconBg: "bg-blue-50 text-blue-600",
        color: "blue"
      },
      payments: {
        title: "Recovery & Payment History Bulk CSV Import",
        subtitle: "Upload collection receipts, NEFT/UPI reference numbers, and FIFO allocations",
        cols: "CustomerName or Phone, Amount, PaymentDate, PaymentMode, ReferenceNo, Remarks",
        iconBg: "bg-emerald-50 text-emerald-600",
        color: "emerald"
      }
    }[type] || meta.customers;

    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[90vh]">
          <!-- Modal Header -->
          <div class="px-6 py-4 bg-slate-900 text-white flex justify-between items-center shrink-0">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-xl bg-white/10 text-white">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
              </div>
              <div>
                <h3 class="text-base font-bold">${meta.title}</h3>
                <p class="text-xs text-slate-300">${meta.subtitle}</p>
              </div>
            </div>
            <button onclick="Modals.close()" class="text-white/80 hover:text-white text-xl font-bold p-1">&times;</button>
          </div>

          <!-- Entity Tabs -->
          <div class="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 shrink-0">
            <button onclick="Modals.switchBulkEntity('customers')" class="px-3.5 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-all ${type === 'customers' ? 'border-indigo-600 text-indigo-700 bg-white shadow-sm' : 'border-transparent text-slate-500 hover:text-slate-700'}">
              👥 1. Debtors & Customers
            </button>
            <button onclick="Modals.switchBulkEntity('invoices')" class="px-3.5 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-all ${type === 'invoices' ? 'border-indigo-600 text-indigo-700 bg-white shadow-sm' : 'border-transparent text-slate-500 hover:text-slate-700'}">
              📄 2. Invoice Ledger
            </button>
            <button onclick="Modals.switchBulkEntity('payments')" class="px-3.5 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-all ${type === 'payments' ? 'border-indigo-600 text-indigo-700 bg-white shadow-sm' : 'border-transparent text-slate-500 hover:text-slate-700'}">
              💳 3. Recovery & Payments
            </button>
          </div>

          <!-- Body Container (Scrollable) -->
          <div class="p-6 space-y-4 overflow-y-auto flex-1">
            <!-- Sample Download & Instructions Banner -->
            <div class="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div class="flex items-center gap-2">
                  <span class="text-xs font-bold uppercase text-slate-700">Expected CSV Columns:</span>
                </div>
                <p class="text-xs font-mono text-indigo-700 mt-0.5 break-all">${meta.cols}</p>
              </div>
              <button onclick="Modals.downloadSampleCsv('${type}')" class="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg flex items-center gap-1.5 shrink-0 active:scale-95 transition-all">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Download Sample CSV
              </button>
            </div>

            <!-- Upload Zone & Paste Option -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Drag and drop / File Picker -->
              <div class="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-4 text-center cursor-pointer transition-colors bg-white flex flex-col items-center justify-center" onclick="document.getElementById('csv-file-input').click()">
                <input type="file" id="csv-file-input" accept=".csv, text/csv, text/plain" class="hidden" onchange="Modals.handleCsvFileSelect(event)">
                <div class="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
                </div>
                <p class="text-xs font-bold text-slate-800">Upload CSV File</p>
                <p class="text-[11px] text-slate-500 mt-0.5">Click or drag & drop .csv file here</p>
              </div>

              <!-- Paste CSV text -->
              <div class="space-y-1">
                <div class="flex items-center justify-between">
                  <label class="text-[11px] font-bold uppercase text-slate-500">Or Paste CSV Text</label>
                  <button onclick="document.getElementById('csv-raw-textarea').value = ''; Modals.handleCsvTextInput('');" class="text-[10px] text-slate-400 hover:text-slate-600">Clear</button>
                </div>
                <textarea id="csv-raw-textarea" rows="4" placeholder="Paste CSV rows here..." oninput="Modals.handleCsvTextInput(this.value)" class="w-full border border-slate-200 rounded-xl p-2.5 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-slate-50/50"></textarea>
              </div>
            </div>

            <!-- Live Validation Preview Container -->
            <div id="bulk-csv-preview-area">
              <div class="p-6 text-center text-xs text-slate-400 border border-slate-100 rounded-xl bg-slate-50/50">
                Upload a file or paste CSV rows above to preview & validate data before importing.
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
            <div id="bulk-summary-status" class="text-xs font-medium text-slate-500">
              No data loaded yet
            </div>
            <div class="flex items-center gap-2">
              <button onclick="Modals.close()" class="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl transition-colors">
                Cancel
              </button>
              <button id="btn-execute-bulk" onclick="Modals.executeBulkImport()" disabled class="px-5 py-2 text-xs font-bold text-white bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 active:scale-95 transition-all flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
                <span id="btn-bulk-label">Import 0 Records</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Sample CSV Downloader
   */
  downloadSampleCsv: function(type) {
    let filename = "";
    let content = "";

    if (type === "customers") {
      filename = "Sample_Debtors_Customers.csv";
      content = "CustomerName,Phone,City,CreditLimit,CreditDays,ContactPerson,Email,GSTIN\n" +
                "Sharma Traders,9820011223,Mumbai,500000,30,Ramesh Sharma,ramesh@sharmatraders.in,27AAACS1429B1ZB\n" +
                "Gupta Hardware & Sanitary,9810022334,Delhi,350000,45,Vikas Gupta,vikas@guptahardware.com,07AAACG2345C1ZA\n" +
                "Agarwal Electricals,9845033445,Bengaluru,400000,30,Sunil Agarwal,sunil@agarwalelec.in,29AAAAA4567D1ZC\n" +
                "Patel Building Solutions,9898055667,Ahmedabad,250000,15,Jignesh Patel,patel@pbsolutions.com,24AAACR1234F1ZM";
    } else if (type === "invoices") {
      filename = "Sample_Invoice_Ledger.csv";
      content = "CustomerName,Phone,InvoiceNo,InvoiceDate,DueDate,InvoiceAmount,Description\n" +
                "Sharma Traders,9820011223,INV-2026-001,2026-08-01,2026-08-31,125000,Industrial Supplies Consignment A\n" +
                "Gupta Hardware & Sanitary,9810022334,INV-2026-002,2026-08-05,2026-09-04,84000,Sanitary Ware Dispatch\n" +
                "Agarwal Electricals,9845033445,INV-2026-003,2026-08-10,2026-09-09,62000,Cable Wires & Switchboards\n" +
                "Sharma Traders,9820011223,INV-2026-004,2026-08-15,2026-09-14,45000,Hardware Accessories";
    } else {
      filename = "Sample_Recovery_Payments.csv";
      content = "CustomerName,Phone,Amount,PaymentDate,PaymentMode,ReferenceNo,Remarks\n" +
                "Sharma Traders,9820011223,50000,2026-09-01,NEFT,UTR99882211,Part recovery against August bills\n" +
                "Gupta Hardware & Sanitary,9810022334,84000,2026-09-02,UPI,UPI2026090288,Full clearance INV-2026-002\n" +
                "Agarwal Electricals,9845033445,30000,2026-09-03,CHEQUE,CHQ445566,Advance recovery cheque clearance\n" +
                "Sharma Traders,9820011223,25000,2026-09-04,RTGS,RTGS2026993,Interim payment";
    }

    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    Toast.success(`Downloaded ${filename}`);
  },

  handleCsvFileSelect: function(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const ta = document.getElementById("csv-raw-textarea");
      if (ta) ta.value = text;
      this.handleCsvTextInput(text);
    };
    reader.readAsText(file);
  },

  handleCsvTextInput: function(text) {
    if (!text || !text.trim()) {
      this._csvState.rows = [];
      this._csvState.validRows = [];
      this._csvState.invalidRows = [];
      this.renderBulkCsvPreview();
      return;
    }

    this.parseAndValidateCsv(text.trim(), this._csvState.entityType);
  },

  /**
   * Smart CSV Parser and Validator
   */
  parseAndValidateCsv: function(text, entityType) {
    const lines = text.split(/\r\n|\n|\r/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return;

    // Helper to split CSV respecting quoted commas
    const parseLine = (line) => {
      const parts = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (c === '"') {
          inQuotes = !inQuotes;
        } else if (c === ',' && !inQuotes) {
          parts.push(cur.trim().replace(/^"|"$/g, ''));
          cur = "";
        } else {
          cur += c;
        }
      }
      parts.push(cur.trim().replace(/^"|"$/g, ''));
      return parts;
    };

    const firstParts = parseLine(lines[0]);
    // Check if line 0 is a header row
    const isHeader = firstParts.some(p => {
      const lp = p.toLowerCase();
      return ["customer", "name", "phone", "mobile", "invoice", "amount", "date", "limit"].some(k => lp.includes(k));
    });

    const headerIndices = {};
    let dataStartIdx = 0;

    if (isHeader) {
      dataStartIdx = 1;
      firstParts.forEach((col, idx) => {
        const c = col.toLowerCase().replace(/[\s_#-]/g, "");
        if (["customername", "customer", "party", "debtor", "name"].includes(c)) headerIndices.customerName = idx;
        else if (["phone", "mobile", "contact", "whatsapp"].includes(c)) headerIndices.phone = idx;
        else if (["customerid", "customercode", "code"].includes(c)) headerIndices.customerId = idx;
        else if (["city", "location", "town"].includes(c)) headerIndices.city = idx;
        else if (["creditlimit", "limit"].includes(c)) headerIndices.creditLimit = idx;
        else if (["creditdays", "days", "terms"].includes(c)) headerIndices.creditDays = idx;
        else if (["contactperson", "person"].includes(c)) headerIndices.contactPerson = idx;
        else if (["email", "mail"].includes(c)) headerIndices.email = idx;
        else if (["gstin", "gst"].includes(c)) headerIndices.gstin = idx;
        // Invoices
        else if (["invoiceno", "invoice", "invno", "billno", "bill"].includes(c)) headerIndices.invoiceNo = idx;
        else if (["invoicedate", "billdate"].includes(c)) headerIndices.invoiceDate = idx;
        else if (["duedate", "due"].includes(c)) headerIndices.dueDate = idx;
        else if (["invoiceamount", "billamount", "total"].includes(c) || (entityType === "invoices" && c === "amount")) headerIndices.amount = idx;
        else if (["description", "remarks", "narration", "item", "ref"].includes(c)) headerIndices.description = idx;
        // Payments
        else if (["amount", "paidamount", "paymentamount"].includes(c)) headerIndices.amount = idx;
        else if (["paymentdate", "receiptdate", "date"].includes(c)) headerIndices.paymentDate = idx;
        else if (["paymentmode", "mode", "type"].includes(c)) headerIndices.paymentMode = idx;
        else if (["referenceno", "refno", "utr", "chequeno", "txnid"].includes(c)) headerIndices.referenceNo = idx;
      });
    }

    const cachedCustomers = (Store.getWithStale("customers").data) || Store.state.customers || [];
    const validRows = [];
    const invalidRows = [];

    // Helper to resolve customer from cache
    const findCustomer = (nameOrId, phone) => {
      if (!cachedCustomers || cachedCustomers.length === 0) return null;
      if (nameOrId) {
        const byId = cachedCustomers.find(c => c.CustomerID === nameOrId);
        if (byId) return byId;
        const byCode = cachedCustomers.find(c => (c.CustomerCode || "").toLowerCase() === nameOrId.toLowerCase());
        if (byCode) return byCode;
        const byName = cachedCustomers.find(c => (c.CustomerName || "").toLowerCase().trim() === nameOrId.toLowerCase().trim());
        if (byName) return byName;
      }
      if (phone) {
        const cleanP = String(phone).replace(/\D/g, "");
        const byPhone = cachedCustomers.find(c => String(c.Phone || "").replace(/\D/g, "").endsWith(cleanP.slice(-10)));
        if (byPhone) return byPhone;
      }
      return null;
    };

    for (let i = dataStartIdx; i < lines.length; i++) {
      const parts = parseLine(lines[i]);
      if (parts.length === 0 || (parts.length === 1 && !parts[0])) continue;

      const rowErrors = [];

      if (entityType === "customers") {
        const name = parts[headerIndices.customerName !== undefined ? headerIndices.customerName : 0] || "";
        const phone = parts[headerIndices.phone !== undefined ? headerIndices.phone : 1] || "";
        const city = parts[headerIndices.city !== undefined ? headerIndices.city : 2] || "";
        const creditLimit = Number(parts[headerIndices.creditLimit !== undefined ? headerIndices.creditLimit : 3]) || 0;
        const creditDays = Number(parts[headerIndices.creditDays !== undefined ? headerIndices.creditDays : 4]) || 30;
        const contact = parts[headerIndices.contactPerson !== undefined ? headerIndices.contactPerson : 5] || "";
        const email = parts[headerIndices.email !== undefined ? headerIndices.email : 6] || "";
        const gstin = parts[headerIndices.gstin !== undefined ? headerIndices.gstin : 7] || "";

        if (!name.trim()) rowErrors.push("Customer Name is required");
        const cleanPhone = phone.replace(/\D/g, "");
        if (cleanPhone.length < 10) rowErrors.push("Valid 10-digit Phone required");

        const rowObj = {
          rowNum: i + 1,
          CustomerName: name.trim(),
          Phone: cleanPhone.slice(-10),
          City: city.trim(),
          CreditLimit: creditLimit,
          CreditDays: creditDays,
          ContactPerson: contact.trim(),
          Email: email.trim(),
          GSTIN: gstin.trim()
        };

        if (rowErrors.length === 0) validRows.push(rowObj);
        else invalidRows.push({ ...rowObj, errors: rowErrors });

      } else if (entityType === "invoices") {
        const custIdent = parts[headerIndices.customerName !== undefined ? headerIndices.customerName : (headerIndices.customerId !== undefined ? headerIndices.customerId : 0)] || "";
        const phone = parts[headerIndices.phone !== undefined ? headerIndices.phone : 1] || "";
        const invNo = parts[headerIndices.invoiceNo !== undefined ? headerIndices.invoiceNo : 2] || ("INV-" + (Date.now() + i));
        const invDate = parts[headerIndices.invoiceDate !== undefined ? headerIndices.invoiceDate : 3] || new Date().toISOString().split("T")[0];
        const dueDate = parts[headerIndices.dueDate !== undefined ? headerIndices.dueDate : 4] || new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
        const amt = Number(parts[headerIndices.amount !== undefined ? headerIndices.amount : 5]) || 0;
        const desc = parts[headerIndices.description !== undefined ? headerIndices.description : 6] || "";

        const matchedCust = findCustomer(custIdent, phone);
        let resolvedCustId = matchedCust ? matchedCust.CustomerID : "";
        let resolvedCustName = matchedCust ? matchedCust.CustomerName : (custIdent || "Unknown");

        if (!resolvedCustId) {
          // If customer not found, we will create customer profile automatically or map directly
          resolvedCustId = "CUS-AUTO-" + (phone.replace(/\D/g, "").slice(-10) || ("GEN" + (i + 1)));
        }

        if (!invNo.trim()) rowErrors.push("Invoice No required");
        if (amt <= 0) rowErrors.push("Amount must be > 0");

        const rowObj = {
          rowNum: i + 1,
          CustomerID: resolvedCustId,
          CustomerName: resolvedCustName,
          Phone: phone.replace(/\D/g, "").slice(-10),
          InvoiceNo: invNo.trim(),
          InvoiceDate: invDate,
          DueDate: dueDate,
          InvoiceAmount: amt,
          Description: desc
        };

        if (rowErrors.length === 0) validRows.push(rowObj);
        else invalidRows.push({ ...rowObj, errors: rowErrors });

      } else if (entityType === "payments") {
        const custIdent = parts[headerIndices.customerName !== undefined ? headerIndices.customerName : 0] || "";
        const phone = parts[headerIndices.phone !== undefined ? headerIndices.phone : 1] || "";
        const amt = Number(parts[headerIndices.amount !== undefined ? headerIndices.amount : 2]) || 0;
        const payDate = parts[headerIndices.paymentDate !== undefined ? headerIndices.paymentDate : 3] || new Date().toISOString().split("T")[0];
        const mode = (parts[headerIndices.paymentMode !== undefined ? headerIndices.paymentMode : 4] || "UPI").toUpperCase();
        const refNo = parts[headerIndices.referenceNo !== undefined ? headerIndices.referenceNo : 5] || ("REF-" + Math.floor(Math.random() * 899999 + 100000));
        const remarks = parts[headerIndices.description !== undefined ? headerIndices.description : 6] || "";

        const matchedCust = findCustomer(custIdent, phone);
        let resolvedCustId = matchedCust ? matchedCust.CustomerID : "";
        let resolvedCustName = matchedCust ? matchedCust.CustomerName : custIdent;

        if (!resolvedCustId && cachedCustomers.length > 0) {
          resolvedCustId = cachedCustomers[0].CustomerID; // fallback to first active customer
        }

        if (amt <= 0) rowErrors.push("Payment Amount must be > 0");
        if (!resolvedCustId) rowErrors.push("Customer could not be resolved");

        const rowObj = {
          rowNum: i + 1,
          CustomerID: resolvedCustId,
          CustomerName: resolvedCustName,
          Amount: amt,
          PaymentDate: payDate,
          PaymentMode: mode,
          ReferenceNo: refNo,
          Remarks: remarks
        };

        if (rowErrors.length === 0) validRows.push(rowObj);
        else invalidRows.push({ ...rowObj, errors: rowErrors });
      }
    }

    this._csvState.validRows = validRows;
    this._csvState.invalidRows = invalidRows;
    this.renderBulkCsvPreview();
  },

  renderBulkCsvPreview: function() {
    const area = document.getElementById("bulk-csv-preview-area");
    const status = document.getElementById("bulk-summary-status");
    const btn = document.getElementById("btn-execute-bulk");
    const btnLabel = document.getElementById("btn-bulk-label");
    if (!area) return;

    const valid = this._csvState.validRows;
    const invalid = this._csvState.invalidRows;
    const total = valid.length + invalid.length;
    const type = this._csvState.entityType;

    if (total === 0) {
      area.innerHTML = `
        <div class="p-6 text-center text-xs text-slate-400 border border-slate-100 rounded-xl bg-slate-50/50">
          Upload a file or paste CSV rows above to preview & validate data before importing.
        </div>
      `;
      if (status) status.innerText = "No data loaded yet";
      if (btn) btn.disabled = true;
      if (btnLabel) btnLabel.innerText = "Import 0 Records";
      return;
    }

    if (status) {
      status.innerHTML = `Total parsed: <b>${total}</b> | Valid: <b class="text-emerald-600">${valid.length}</b> ${invalid.length > 0 ? `| Errors: <b class="text-rose-600">${invalid.length}</b>` : ''}`;
    }
    if (btn) btn.disabled = valid.length === 0;
    if (btnLabel) btnLabel.innerText = `Import ${valid.length} Valid Records`;

    // Preview table
    let tableHeaders = "";
    if (type === "customers") {
      tableHeaders = `<th>#</th><th>Customer Name</th><th>Phone</th><th>City</th><th>Credit Limit</th><th>Status</th>`;
    } else if (type === "invoices") {
      tableHeaders = `<th>#</th><th>Customer</th><th>Invoice #</th><th>Due Date</th><th>Amount</th><th>Status</th>`;
    } else {
      tableHeaders = `<th>#</th><th>Customer</th><th>Amount</th><th>Date</th><th>Mode</th><th>Ref #</th><th>Status</th>`;
    }

    const displayRows = [...valid.slice(0, 15), ...invalid.slice(0, 5)];

    area.innerHTML = `
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold uppercase text-slate-700">Preview Parsed Records (${Math.min(total, 20)} of ${total})</span>
          <span class="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            ${valid.length} Ready to Import
          </span>
        </div>

        <div class="border border-slate-200 rounded-xl overflow-hidden shadow-sm max-h-56 overflow-y-auto">
          <table class="w-full text-left text-xs text-slate-700">
            <thead class="bg-slate-50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200 sticky top-0">
              <tr>${tableHeaders}</tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              ${displayRows.map(r => {
                const isErr = !!r.errors;
                if (type === "customers") {
                  return `
                    <tr class="${isErr ? 'bg-rose-50/50' : 'hover:bg-slate-50'}">
                      <td class="p-2 font-mono text-[11px] text-slate-400">${r.rowNum}</td>
                      <td class="p-2 font-bold text-slate-900">${Utils.escapeHtml(r.CustomerName)}</td>
                      <td class="p-2 font-mono">${r.Phone}</td>
                      <td class="p-2 text-slate-500">${Utils.escapeHtml(r.City || '-')}</td>
                      <td class="p-2 font-bold text-indigo-700">₹${Number(r.CreditLimit || 0).toLocaleString('en-IN')}</td>
                      <td class="p-2">
                        ${isErr ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700" title="${r.errors.join(', ')}">Error: ${r.errors[0]}</span>` : `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">Valid</span>`}
                      </td>
                    </tr>
                  `;
                } else if (type === "invoices") {
                  return `
                    <tr class="${isErr ? 'bg-rose-50/50' : 'hover:bg-slate-50'}">
                      <td class="p-2 font-mono text-[11px] text-slate-400">${r.rowNum}</td>
                      <td class="p-2 font-bold text-slate-900">${Utils.escapeHtml(r.CustomerName)}</td>
                      <td class="p-2 font-mono font-bold text-slate-700">${r.InvoiceNo}</td>
                      <td class="p-2 text-slate-500">${r.DueDate}</td>
                      <td class="p-2 font-bold text-indigo-700">₹${Number(r.InvoiceAmount || 0).toLocaleString('en-IN')}</td>
                      <td class="p-2">
                        ${isErr ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">Error: ${r.errors[0]}</span>` : `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">Valid</span>`}
                      </td>
                    </tr>
                  `;
                } else {
                  return `
                    <tr class="${isErr ? 'bg-rose-50/50' : 'hover:bg-slate-50'}">
                      <td class="p-2 font-mono text-[11px] text-slate-400">${r.rowNum}</td>
                      <td class="p-2 font-bold text-slate-900">${Utils.escapeHtml(r.CustomerName)}</td>
                      <td class="p-2 font-bold text-emerald-700">₹${Number(r.Amount || 0).toLocaleString('en-IN')}</td>
                      <td class="p-2 text-slate-500">${r.PaymentDate}</td>
                      <td class="p-2 font-mono text-[11px]">${r.PaymentMode}</td>
                      <td class="p-2 font-mono text-[11px] text-slate-500">${r.ReferenceNo}</td>
                      <td class="p-2">
                        ${isErr ? `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">Error: ${r.errors[0]}</span>` : `<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">Valid</span>`}
                      </td>
                    </tr>
                  `;
                }
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  /**
   * Execute Bulk CSV Import via API
   */
  executeBulkImport: async function() {
    const valid = this._csvState.validRows;
    const type = this._csvState.entityType;
    if (!valid || valid.length === 0) {
      Toast.warning("No valid rows to import");
      return;
    }

    const btn = document.getElementById("btn-execute-bulk");
    const label = document.getElementById("btn-bulk-label");
    if (btn) btn.disabled = true;
    if (label) label.innerText = `Importing ${valid.length} records...`;

    try {
      await Api.call("batchImport", {
        importType: type,
        rows: valid
      });

      Toast.success(`Successfully imported ${valid.length} ${type}!`);
      Store.invalidate("customers", "invoices", "payments", "dashboard", "outstanding", "actions");

      Modals.close();

      // Refresh currently open view
      const hash = window.location.hash.split("?")[0];
      if (hash.includes("customers") && window.CustomersView && CustomersView.loadCustomers) {
        CustomersView.loadCustomers();
      } else if (hash.includes("invoices") && window.InvoicesView && InvoicesView.loadInvoices) {
        InvoicesView.loadInvoices();
      } else if (hash.includes("payments") && window.PaymentsView && PaymentsView.loadPayments) {
        PaymentsView.loadPayments();
      } else if (hash.includes("dashboard") && window.DashboardView && DashboardView.loadDashboard) {
        DashboardView.loadDashboard();
      } else if (hash.includes("outstanding") && window.OutstandingView && OutstandingView.loadData) {
        OutstandingView.loadData();
      }
    } catch (err) {
      Toast.error(err.message || "Bulk import failed");
      if (btn) btn.disabled = false;
      if (label) label.innerText = `Retry Import (${valid.length})`;
    }
  }
};

