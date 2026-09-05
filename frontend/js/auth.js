/**
 * CollectionSarthi - Professional Authentication & User Onboarding Handler
 */

const Auth = {
  currentTab: "register", // Default to setup/register so user sees Add Account option immediately on open

  renderLogin: function() {
    const mainApp = document.getElementById("app-layout");
    const loginOverlay = document.getElementById("login-overlay");
    if (mainApp) mainApp.classList.add("hidden");
    if (!loginOverlay) return;

    loginOverlay.classList.remove("hidden");
    this.renderForm();
  },

  switchTab: function(tab) {
    this.currentTab = tab;
    this.renderForm();
  },

  renderForm: function() {
    const loginOverlay = document.getElementById("login-overlay");
    if (!loginOverlay) return;

    const isRegister = this.currentTab === "register";

    loginOverlay.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-8 relative overflow-hidden">
        <!-- Subtle Ambient Background Glows -->
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
        <div class="absolute bottom-10 right-10 w-[300px] h-[300px] bg-emerald-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="max-w-lg w-full space-y-6 bg-white p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-100 relative z-10">
          
          <!-- Brand Header -->
          <div class="text-center">
            <div class="inline-flex items-center justify-center w-13 h-13 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 mb-3">
              <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h2 class="text-2xl font-black text-slate-900 tracking-tight">${BRAND_CONFIG.name}</h2>
            <p class="text-xs text-slate-500 mt-0.5">${BRAND_CONFIG.tagline}</p>
          </div>

          <!-- Professional Segmented Navigation Tabs -->
          <div class="grid grid-cols-2 p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
            <button type="button" onclick="Auth.switchTab('register')" class="py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              isRegister ? 'bg-white text-indigo-700 shadow-sm' : 'hover:text-slate-900'
            }">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/></svg>
              <span>Add My User (Setup)</span>
            </button>
            <button type="button" onclick="Auth.switchTab('login')" class="py-2.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              !isRegister ? 'bg-white text-indigo-700 shadow-sm' : 'hover:text-slate-900'
            }">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>
              <span>Existing Sign In</span>
            </button>
          </div>

          ${isRegister ? this.renderRegisterForm() : this.renderLoginForm()}

          <!-- Security & Privacy Guarantee Note -->
          <div class="pt-2 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-600">
            <svg class="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            <span>Live Data directly stored in your private Google Sheets database</span>
          </div>

        </div>
      </div>
    `;
  },

  renderRegisterForm: function() {
    return `
      <div>
        <!-- Notice Banner -->
        <div class="p-3 bg-gradient-to-r from-emerald-50 to-indigo-50 border border-emerald-200/60 rounded-2xl text-xs text-slate-700 space-y-1">
          <div class="font-bold flex items-center gap-1.5 text-emerald-900">
            <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Add Real Owner User to Database
          </div>
          <p class="text-[11px] text-slate-600 leading-relaxed">
            Enter your details below to create your account in your Google Sheet <strong class="text-slate-800">Users</strong> tab. You can also auto-delete default demo test accounts in 1 click.
          </p>
        </div>

        <form class="mt-5 space-y-3.5" onsubmit="Auth.handleRegister(event)">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Full Name <span class="text-rose-500">*</span></label>
            <input type="text" id="reg-name" required placeholder="e.g. Rajesh Sharma" class="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all">
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Business Email <span class="text-rose-500">*</span></label>
              <input type="email" id="reg-email" required placeholder="owner@mycompany.com" class="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all">
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Mobile / WhatsApp</label>
              <input type="tel" id="reg-phone" placeholder="9876543210" class="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all">
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Set Password <span class="text-rose-500">*</span></label>
              <input type="password" id="reg-password" required minlength="6" placeholder="Min 6 characters" class="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-all">
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Account Role</label>
              <select id="reg-role" class="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white">
                <option value="OWNER" selected>👑 Business Owner (Full Access)</option>
                <option value="ADMIN">🛡️ Admin</option>
                <option value="COLLECTION_EXECUTIVE">📞 Collection Executive</option>
              </select>
            </div>
          </div>

          <!-- Purge Demo Accounts Checkbox Option -->
          <div class="pt-1">
            <label class="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/70 border border-amber-200 cursor-pointer hover:bg-amber-50 transition-colors">
              <input type="checkbox" id="reg-purge-demo" checked class="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4">
              <div class="text-xs text-amber-950">
                <span class="font-bold">Permanently delete Demo Users from database</span>
                <p class="text-[11px] text-amber-800/80 mt-0.5">Removes <code class="font-mono font-bold">admin@collectionsarthi.com</code> & <code class="font-mono font-bold">rahul@collectionsarthi.com</code> from your Users Sheet so only your account remains.</p>
              </div>
            </label>
          </div>

          <button type="submit" id="btn-reg-submit" class="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2">
            <span>Add User to Sheet & Launch Dashboard</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
          </button>
        </form>
      </div>
    `;
  },

  renderLoginForm: function() {
    return `
      <div>
        <form class="space-y-4" onsubmit="Auth.handleLogin(event)">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Email Address</label>
            <input type="email" id="login-email" required placeholder="owner@mycompany.com" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">Password</label>
            <input type="password" id="login-password" required placeholder="••••••••" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
          </div>

          <button type="submit" id="btn-login-submit" class="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2">
            <span>Sign In to Recovery Center</span>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>
          </button>
        </form>
      </div>
    `;
  },

  prefill: function(email, pass) {
    const em = document.getElementById("login-email");
    const pw = document.getElementById("login-password");
    if (em) em.value = email;
    if (pw) pw.value = pass;
  },

  handleRegister: async function(e) {
    e.preventDefault();
    const name = document.getElementById("reg-name").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const phone = document.getElementById("reg-phone").value.trim();
    const password = document.getElementById("reg-password").value;
    const role = document.getElementById("reg-role").value;
    const purgeDemoUsers = document.getElementById("reg-purge-demo").checked;
    const btn = document.getElementById("btn-reg-submit");

    if (password.length < 6) {
      Toast.error("Password must be at least 6 characters long.");
      return;
    }

    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Writing to Google Sheet...`;

    try {
      const res = await Api.call("registerUser", {
        name,
        email,
        phone,
        password,
        role,
        purgeDemoUsers
      });

      Store.setSession(res.user, res.token, res.subscription || null);

      if (res.purgedDemoUsersCount && res.purgedDemoUsersCount > 0) {
        Toast.success(`User added to Sheet! Removed ${res.purgedDemoUsersCount} demo account(s).`);
      } else {
        Toast.success(`User added successfully to Google Sheet! Welcome, ${res.user.name}!`);
      }

      document.getElementById("login-overlay").classList.add("hidden");
      document.getElementById("app-layout").classList.remove("hidden");

      App.updateUserBadge();
      if (App.updateSubscriptionBadges) App.updateSubscriptionBadges();
      window.location.hash = "#/dashboard";
      App.router();
    } catch (err) {
      Toast.error(err.message || "Failed to create user in database");
      btn.disabled = false;
      btn.innerHTML = `<span>Add User to Sheet & Launch Dashboard</span> <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>`;
    }
  },

  handleLogin: async function(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const btn = document.getElementById("btn-login-submit");

    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Signing In...`;

    try {
      const res = await Api.call("login", { email, password });
      Store.setSession(res.user, res.token, res.subscription || null);
      Toast.success(`Welcome back, ${res.user.name}!`);

      document.getElementById("login-overlay").classList.add("hidden");
      document.getElementById("app-layout").classList.remove("hidden");

      App.updateUserBadge();
      if (App.updateSubscriptionBadges) App.updateSubscriptionBadges();
      window.location.hash = "#/dashboard";
      App.router();
    } catch (err) {
      Toast.error(err.message || "Invalid credentials");
      btn.disabled = false;
      btn.innerHTML = `<span>Sign In to Recovery Center</span> <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>`;
    }
  },

  logout: async function() {
    try {
      await Api.call("logout");
    } catch (e) {}
    Store.clearSession();
    window.location.hash = "#/login";
    this.renderLogin();
    Toast.info("Signed out successfully");
  }
};
