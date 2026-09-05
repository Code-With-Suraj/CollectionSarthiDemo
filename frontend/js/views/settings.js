/**
 * CollectionSarthi - Business & Collection Settings View + CSV Importer
 */

const SettingsView = {
  render: async function(container) {
    container.innerHTML = `
      <div class="space-y-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-900 tracking-tight">System Settings & Data Import</h1>
          <p class="text-sm text-slate-500">Tenant branding, recovery rules, WhatsApp message templates, and CSV migration</p>
        </div>

        <div id="settings-content" class="space-y-6">
          <div class="h-64 skeleton rounded-2xl"></div>
        </div>
      </div>
    `;

    await this.loadSettings();
  },

  loadSettings: async function() {
    try {
      const res = await Api.call("getSettings");
      this.settings = res.settings || {};
      this.renderForm();
    } catch (err) {
      document.getElementById("settings-content").innerHTML = `
        <div class="p-6 text-sm text-red-600">Failed to load settings: ${err.message}</div>
      `;
    }
  },

  renderForm: function() {
    const container = document.getElementById("settings-content");
    if (!container || !this.settings) return;

    const s = this.settings;
    const isPro = Store.isPro();

    container.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Settings Form (2 Cols) -->
        <div class="lg:col-span-2 space-y-6">
          <form class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6" onsubmit="SettingsView.saveSettings(event)">
            <div>
              <h2 class="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Business Profile & Branding</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Business Name</label>
                  <input type="text" name="BUSINESS_NAME" value="${Utils.escapeHtml(s.BUSINESS_NAME || 'Apex Industrial Supplies')}" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                </div>
                <div>
                  <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Currency Symbol</label>
                  <input type="text" name="CURRENCY" value="${Utils.escapeHtml(s.CURRENCY || 'INR')}" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                </div>
              </div>
            </div>

            <div>
              <h2 class="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Collection Recovery Rules</h2>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Default Credit Days</label>
                  <input type="number" name="DEFAULT_CREDIT_DAYS" value="${s.DEFAULT_CREDIT_DAYS || 30}" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                </div>
                <div>
                  <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Overdue Trigger Days</label>
                  <input type="number" name="OVERDUE_THRESHOLD_DAYS" value="${s.OVERDUE_THRESHOLD_DAYS || 15}" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none">
                </div>
              </div>
            </div>

            <div>
              <div class="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 class="text-base font-bold text-slate-900">WhatsApp Reminder Message Template</h2>
                ${isPro ? `
                  <div class="flex items-center gap-2">
                    <label class="text-[11px] font-semibold text-indigo-700">Load Preset:</label>
                    <select onchange="SettingsView.loadPresetTemplate(this.value)" class="text-xs font-semibold border border-indigo-200 bg-indigo-50/50 rounded-lg px-2 py-1 focus:outline-none">
                      <option value="">-- Choose 1 of 13 Templates --</option>
                      <option value="gentle">1. Gentle Courtesy Reminder</option>
                      <option value="reconcile">2. Statement & Reconciliation Enquiry</option>
                      <option value="due_today">3. Payment Due Today Alert</option>
                      <option value="ptp_commitment">4. Promised Date (PTP) Commitment</option>
                      <option value="supplier_cashflow">5. Supplier Cash Flow & Vendor Appeal</option>
                      <option value="dispatch_hold">6. Order Dispatch Hold Warning</option>
                      <option value="director_appeal">7. Director Direct Personal Appeal</option>
                      <option value="audit_gst">8. Month-End & GST Audit Compliance</option>
                      <option value="installment_offer">9. 50% Token / Installment Offer</option>
                      <option value="banking_utr">10. Banking UTR & Reference Request</option>
                      <option value="pre_legal">11. Pre-Legal Caution Notice</option>
                      <option value="legal_demand">12. Final Legal Demand Notice (48h)</option>
                      <option value="thank_you">13. Payment Received & Thank You</option>
                    </select>
                  </div>
                ` : `
                  <div class="flex items-center gap-1.5">
                    <button type="button" onclick="Modals.openUpgradeModal('Unlock 13+ High-Converting WhatsApp Reminder Templates (Gentle, PTP, Hold, Legal Notice)')" class="text-xs font-bold text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg px-2.5 py-1 flex items-center gap-1 transition-colors">
                      <svg class="w-3.5 h-3.5 text-amber-600" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>
                      <span>🔒 13 Presets (Growth Plan)</span>
                    </button>
                  </div>
                `}
              </div>
              <div class="mt-4 space-y-2">
                <label class="block text-xs font-semibold uppercase text-slate-500">Default Template Text</label>
                <textarea id="setting-wa-template" name="WHATSAPP_TEMPLATE_REMINDER" rows="3" class="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none font-sans text-xs">${s.WHATSAPP_TEMPLATE_REMINDER || 'Dear {{customer_name}}, namaskar! Hope you are doing well. This is a gentle reminder from {{business_name}} regarding pending balance of ₹{{amount}}. We value our business relationship and request you to kindly process the clearance at your earliest convenience. Thank you! 🙏'}</textarea>
                <p class="text-xs text-slate-400">Supported variables: <code class="text-indigo-600 font-mono">{{customer_name}}</code>, <code class="text-indigo-600 font-mono">{{business_name}}</code>, <code class="text-indigo-600 font-mono">{{amount}}</code>, <code class="text-indigo-600 font-mono">{{phone}}</code></p>
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <button type="submit" id="btn-save-settings" class="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-600/20">
                Save All Settings
              </button>
            </div>
          </form>
        </div>

        <!-- Comprehensive Bulk CSV Migration Hub (1 Col) -->
        <div class="space-y-6">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div class="flex items-center gap-2">
              <div class="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900">Bulk Data Import Hub</h3>
                <p class="text-xs text-slate-400">Validated CSV migration for 3 core entities</p>
              </div>
            </div>

            <p class="text-xs text-slate-600 leading-relaxed">
              Quickly import large spreadsheets with sample templates, auto-customer mapping, and instant validation:
            </p>

            <div class="space-y-2.5 pt-1">
              <!-- Customers Importer -->
              <div class="p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>👥 Debtors & Customers</span>
                  </h4>
                  <p class="text-[11px] text-slate-500">Profiles, credit limits, phone numbers</p>
                </div>
                <button onclick="Modals.openBulkCsvModal('customers')" class="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm">
                  Import CSV
                </button>
              </div>

              <!-- Invoices Importer -->
              <div class="p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-200 rounded-xl transition-all flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>📄 Invoice Ledger</span>
                  </h4>
                  <p class="text-[11px] text-slate-500">Unpaid bills, due dates, invoice amounts</p>
                </div>
                <button onclick="Modals.openBulkCsvModal('invoices')" class="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm">
                  Import CSV
                </button>
              </div>

              <!-- Payments Importer -->
              <div class="p-3 bg-slate-50 hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-200 rounded-xl transition-all flex items-center justify-between">
                <div>
                  <h4 class="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span>💳 Recovery & Payments</span>
                  </h4>
                  <p class="text-[11px] text-slate-500">Receipts, modes, UTR / Cheque references</p>
                </div>
                <button onclick="Modals.openBulkCsvModal('payments')" class="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm">
                  Import CSV
                </button>
              </div>
            </div>

            <div class="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Need ready CSV templates?</span>
              <button onclick="Modals.downloadSampleCsv('customers')" class="font-bold text-indigo-600 hover:underline">
                Download Samples
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  saveSettings: async function(e) {
    e.preventDefault();
    const btn = document.getElementById("btn-save-settings");
    btn.disabled = true;
    btn.innerText = "Saving...";

    const formData = new FormData(e.target);
    const settings = Object.fromEntries(formData.entries());

    try {
      await Api.call("updateSettings", { settings });
      Toast.success("Settings saved successfully!");
      Store.state.settings = settings;
    } catch (err) {
      Toast.error(err.message || "Failed to update settings");
    } finally {
      btn.disabled = false;
      btn.innerText = "Save All Settings";
    }
  },

  loadPresetTemplate: function(key) {
    if (!Store.isPro()) {
      Modals.openUpgradeModal("Unlock 13+ High-Converting WhatsApp Reminder Templates Library");
      return;
    }
    if (!key || !Modals.getWhatsAppTemplates) return;
    const biz = (Store.state.settings && Store.state.settings.BUSINESS_NAME) || "Apex Supplies";
    const templates = Modals.getWhatsAppTemplates("{{customer_name}}", "{{amount}}", biz);
    if (templates && templates[key]) {
      const ta = document.getElementById("setting-wa-template");
      if (ta) {
        ta.value = templates[key].text;
        Toast.success(`Loaded "${templates[key].title}"`);
      }
    }
  },

  parseCsvText: function() {
    const text = document.getElementById("csv-import-text").value.trim();
    if (!text) return [];

    const lines = text.split("\n");
    const rows = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(",").map(p => p.trim());
      if (parts.length >= 2) {
        rows.push({
          CustomerName: parts[0],
          Phone: parts[1],
          City: parts[2] || "",
          CreditLimit: Number(parts[3]) || 0
        });
      }
    }
    return rows;
  },

  previewCsv: function() {
    const rows = this.parseCsvText();
    const previewBox = document.getElementById("import-preview-box");
    if (rows.length === 0) {
      Toast.warning("Please paste valid CSV lines");
      return;
    }

    previewBox.classList.remove("hidden");
    previewBox.className = "text-xs p-3 rounded-lg border bg-blue-50 border-blue-200 text-blue-800 space-y-1";
    previewBox.innerHTML = `
      <div class="font-bold">Validation Preview:</div>
      <div>Total Rows Parsed: <b>${rows.length}</b></div>
      <div>Sample 1: ${rows[0].CustomerName} (${rows[0].Phone}) - City: ${rows[0].City || 'N/A'}</div>
      <div class="text-emerald-700 font-semibold pt-1">Ready for import. Click "Run Import" to insert.</div>
    `;
  },

  executeImport: async function() {
    const rows = this.parseCsvText();
    if (rows.length === 0) {
      Toast.warning("No rows to import");
      return;
    }

    const btn = document.getElementById("btn-run-import");
    btn.disabled = true;
    btn.innerText = "Importing...";

    try {
      for (let r = 0; r < rows.length; r++) {
        await Api.call("createCustomer", rows[r]);
      }
      Toast.success(`Successfully imported ${rows.length} customers!`);
      Store.invalidate("customers", "dashboard");
      document.getElementById("csv-import-text").value = "";
      document.getElementById("import-preview-box").classList.add("hidden");
    } catch (err) {
      Toast.error(err.message || "Import failed partially");
    } finally {
      btn.disabled = false;
      btn.innerText = "Run Import";
    }
  }
};
