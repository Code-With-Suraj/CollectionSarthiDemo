/**
 * CollectionSarthi - Authentication Handler
 */

const Auth = {
  renderLogin: function() {
    const mainApp = document.getElementById("app-layout");
    const loginOverlay = document.getElementById("login-overlay");
    if (mainApp) mainApp.classList.add("hidden");
    if (!loginOverlay) return;

    loginOverlay.classList.remove("hidden");
    loginOverlay.innerHTML = `
      <div class="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-12">
        <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-3xl shadow-2xl">
          <div class="text-center">
            <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 mb-4">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h2 class="text-2xl font-bold text-slate-900 tracking-tight">${BRAND_CONFIG.name}</h2>
            <p class="text-xs text-slate-500 mt-1">${BRAND_CONFIG.tagline}</p>
          </div>

          <!-- Demo Quick Credentials Box -->
          <div class="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-indigo-900 space-y-1">
            <div class="font-bold flex items-center gap-1 text-indigo-800">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Quick Test Credentials:
            </div>
            <div class="flex justify-between items-center pt-1">
              <span>Owner: <code class="font-mono text-indigo-600">admin@collectionsarthi.com</code></span>
              <button onclick="Auth.prefill('admin@collectionsarthi.com', 'admin123')" class="px-2 py-0.5 bg-indigo-600 text-white rounded text-[11px] font-semibold hover:bg-indigo-700">Auto-fill</button>
            </div>
            <div class="flex justify-between items-center pt-0.5">
              <span>Collector: <code class="font-mono text-indigo-600">rahul@collectionsarthi.com</code></span>
              <button onclick="Auth.prefill('rahul@collectionsarthi.com', 'exec123')" class="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[11px] font-semibold hover:bg-slate-300">Auto-fill</button>
            </div>
          </div>

          <form class="mt-6 space-y-4" onsubmit="Auth.handleLogin(event)">
            <div>
              <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Email Address</label>
              <input type="email" id="login-email" required placeholder="admin@collectionsarthi.com" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase text-slate-500 mb-1">Password</label>
              <input type="password" id="login-password" required placeholder="••••••••" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none">
            </div>

            <button type="submit" id="btn-login-submit" class="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center">
              <span>Sign In to Recovery Center</span>
            </button>
          </form>
        </div>
      </div>
    `;
  },

  prefill: function(email, pass) {
    const em = document.getElementById("login-email");
    const pw = document.getElementById("login-password");
    if (em) em.value = email;
    if (pw) pw.value = pass;
  },

  handleLogin: async function(e) {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const btn = document.getElementById("btn-login-submit");

    btn.disabled = true;
    btn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Signing In...`;

    try {
      const res = await Api.call("login", { email, password });
      Store.setSession(res.user, res.token);
      Toast.success(`Welcome back, ${res.user.name}!`);

      document.getElementById("login-overlay").classList.add("hidden");
      document.getElementById("app-layout").classList.remove("hidden");

      App.updateUserBadge();
      window.location.hash = "#/dashboard";
      App.router();
    } catch (err) {
      Toast.error(err.message || "Invalid credentials");
      btn.disabled = false;
      btn.innerText = "Sign In to Recovery Center";
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
