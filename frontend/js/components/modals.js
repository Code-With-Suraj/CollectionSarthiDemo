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
  openRecordPayment: function(prefill = {}) {
    if (!this.container) this.init();
    const requestId = Utils.generateRequestId("PAY");
    const customers = Store.state.customers || [];
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

  /**
   * Open Follow-up Logging Modal
   */
  openFollowUp: function(customerId, customerName) {
    if (!this.container) this.init();
    const todayStr = new Date().toISOString().split("T")[0];

    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
          <div class="px-6 py-4 bg-slate-900 text-white flex justify-between items-center">
            <div>
              <h3 class="text-lg font-semibold flex items-center">
                <svg class="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                Log Follow-up Activity
              </h3>
              <p class="text-xs text-slate-400">${Utils.escapeHtml(customerName || "Customer")}</p>
            </div>
            <button onclick="Modals.close()" class="text-slate-400 hover:text-white">&times;</button>
          </div>

          <form id="followup-form" class="p-6 space-y-4" onsubmit="Modals.submitFollowUp(event)">
            <input type="hidden" name="CustomerID" value="${customerId}">
            <input type="hidden" name="FollowUpDate" value="${todayStr}">

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
    btn.disabled = true;
    btn.innerText = "Saving...";

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

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
   * WhatsApp Template Quick Sender
   */
  openWhatsAppSender: function(phone, name, amount) {
    if (!this.container) this.init();
    const biz = (Store.state.settings && Store.state.settings.BUSINESS_NAME) || "Apex Supplies";
    const msg = `Dear ${name}, this is a gentle reminder regarding your outstanding payment of ₹${Number(amount || 0).toLocaleString("en-IN")} with ${biz}. Kindly arrange the clearance. Thank you!`;

    const waLink = Utils.getWhatsAppUrl(phone, msg);

    this.container.innerHTML = `
      <div class="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          <div class="px-6 py-4 bg-emerald-600 text-white flex justify-between items-center">
            <h3 class="text-lg font-semibold flex items-center">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/></svg>
              Send WhatsApp Reminder
            </h3>
            <button onclick="Modals.close()" class="text-white/80 hover:text-white">&times;</button>
          </div>

          <div class="p-6 space-y-4">
            <div>
              <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">To</label>
              <p class="text-sm font-semibold text-slate-800">${Utils.escapeHtml(name)} (${phone})</p>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Message Preview</label>
              <textarea id="wa-text-preview" rows="4" class="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-slate-50">${msg}</textarea>
            </div>

            <div class="pt-2 flex justify-end space-x-3">
              <button onclick="Modals.close()" class="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">Cancel</button>
              <a href="${waLink}" target="_blank" onclick="Modals.close()" class="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center shadow-md shadow-emerald-600/20">
                <span>Open in WhatsApp</span>
                <svg class="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    `;
  }
};
