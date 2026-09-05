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
              <h2 class="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">WhatsApp Reminder Message Template</h2>
              <div class="mt-4 space-y-2">
                <label class="block text-xs font-semibold uppercase text-slate-500">Template Text</label>
                <textarea name="WHATSAPP_TEMPLATE_REMINDER" rows="3" class="w-full border border-slate-200 rounded-lg p-3 text-sm focus:outline-none font-mono text-xs">${s.WHATSAPP_TEMPLATE_REMINDER || 'Dear {{customer_name}}, gentle reminder from {{business_name}} regarding pending payment of ₹{{amount}}. Kindly arrange clearance. Thank you!'}</textarea>
                <p class="text-xs text-slate-400">Available variables: {{customer_name}}, {{amount}}, {{business_name}}</p>
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <button type="submit" id="btn-save-settings" class="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md shadow-indigo-600/20">
                Save All Settings
              </button>
            </div>
          </form>
        </div>

        <!-- CSV Importer Card (1 Col) -->
        <div class="space-y-6">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div class="flex items-center gap-2">
              <div class="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/></svg>
              </div>
              <div>
                <h3 class="text-sm font-bold text-slate-900">CSV Customer Importer</h3>
                <p class="text-xs text-slate-400">Validated migration tool</p>
              </div>
            </div>

            <p class="text-xs text-slate-600">
              Paste CSV text formatted as: <br>
              <code class="bg-slate-100 px-1 py-0.5 rounded text-indigo-600 font-mono">CustomerName,Phone,City,CreditLimit</code>
            </p>

            <textarea id="csv-import-text" rows="5" placeholder="Sharma Traders,9820011223,Mumbai,500000&#10;Gupta Hardware,9810022334,Delhi,350000" class="w-full border border-slate-200 rounded-lg p-3 text-xs font-mono focus:outline-none"></textarea>

            <div class="flex gap-2">
              <button onclick="SettingsView.previewCsv()" class="w-1/2 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg">
                Preview & Validate
              </button>
              <button onclick="SettingsView.executeImport()" id="btn-run-import" class="w-1/2 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg">
                Run Import
              </button>
            </div>

            <div id="import-preview-box" class="hidden text-xs p-3 rounded-lg border"></div>
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
