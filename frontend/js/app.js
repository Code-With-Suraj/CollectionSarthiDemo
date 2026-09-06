/**
 * CollectionSarthi - Single-Page Application Core Engine & Router
 */

const App = {
  init: function() {
    Store.init();
    Toast.init();
    Modals.init();
    this.initSidebar();

    // Check if user is logged in
    if (!Store.state.token || !Store.state.user) {
      window.location.hash = "#/login";
      Auth.renderLogin();
    } else {
      document.getElementById("login-overlay").classList.add("hidden");
      document.getElementById("app-layout").classList.remove("hidden");
      this.updateUserBadge();
      
      // Default to dashboard if root or login
      if (!window.location.hash || window.location.hash === "#/login" || window.location.hash === "#/") {
        window.location.hash = "#/dashboard";
      }
      this.router();
    }

    // Listen to hash changes
    window.addEventListener("hashchange", () => this.router());
  },

  router: function() {
    const hash = window.location.hash || "#/dashboard";

    if (!Store.state.token && hash !== "#/login") {
      window.location.hash = "#/login";
      Auth.renderLogin();
      return;
    }

    if (hash === "#/login") {
      Auth.renderLogin();
      return;
    }

    document.getElementById("login-overlay").classList.add("hidden");
    document.getElementById("app-layout").classList.remove("hidden");

    const mainContainer = document.getElementById("main-content");
    if (!mainContainer) return;

    // Scroll to top
    window.scrollTo(0, 0);

    // Update active nav links
    this.updateActiveNav(hash);

    // Update Subscription Badges and 7-day Warning Banner
    this.updateSubscriptionBadges();
    this.updateSubscriptionWarningBanner();

    // HARD LOCKOUT ENFORCEMENT: If subscription is expired, stop the app!
    if (Store.isExpired()) {
      if (hash === "#/subscription") {
        SubscriptionView.render(mainContainer);
      } else {
        this.renderLockoutScreen(mainContainer);
      }
      return;
    }

    // Route matching for active subscription
    if (hash === "#/dashboard") {
      DashboardView.render(mainContainer);
    } else if (hash === "#/actions") {
      ActionsView.render(mainContainer);
    } else if (hash === "#/customers") {
      CustomersView.render(mainContainer);
    } else if (hash.startsWith("#/customer/")) {
      const custId = hash.replace("#/customer/", "").trim();
      CustomersView.render(mainContainer, custId);
    } else if (hash === "#/invoices") {
      InvoicesView.render(mainContainer);
    } else if (hash === "#/payments") {
      PaymentsView.render(mainContainer);
    } else if (hash === "#/followups") {
      FollowUpsView.render(mainContainer);
    } else if (hash === "#/outstanding") {
      OutstandingView.render(mainContainer);
    } else if (hash === "#/reports") {
      ReportsView.render(mainContainer);
    } else if (hash === "#/users") {
      UsersView.render(mainContainer);
    } else if (hash === "#/settings") {
      SettingsView.render(mainContainer);
    } else if (hash === "#/subscription") {
      SubscriptionView.render(mainContainer);
    } else {
      DashboardView.render(mainContainer);
    }
  },

  /**
   * Update 7-Day Pre-Expiry Warning Banner on the App
   */
  updateSubscriptionWarningBanner: function() {
    const bannerEl = document.getElementById("subscription-warning-banner");
    if (!bannerEl) return;

    // If expired, the full-screen lockout takes precedence
    if (Store.isExpired()) {
      bannerEl.innerHTML = "";
      bannerEl.classList.add("hidden");
      return;
    }

    // Check if expiring within 7 days
    if (Store.isExpiringSoon()) {
      const daysLeft = Store.getDaysLeft();
      const sub = Store.state.subscription || {};
      const expiryDate = sub.expiryDate || "";
      const supportPhone = (typeof BRAND_CONFIG !== "undefined" && BRAND_CONFIG.supportPhone) || "+91 98765 43210";
      const cleanPhone = supportPhone.replace(/[^0-9]/g, "");

      let badgeText = "";
      let headline = "";
      let subtext = "";
      let gradientClass = "";

      if (daysLeft === 0) {
        badgeText = "🚨 EXPIRES TODAY • आज समाप्त";
        headline = "Urgent: Aapka CollectionSarthi subscription aaj raat expire ho raha hai!";
        subtext = `Validity date: ${expiryDate || 'Today'}. Services pause hone se bachane ke liye abhi apna plan renew karein.`;
        gradientClass = "from-rose-600 via-rose-500 to-amber-600 shadow-rose-600/25 border-rose-300/40";
      } else if (daysLeft === 1) {
        badgeText = "⚠️ EXPIRES TOMORROW • कल समाप्त";
        headline = `Urgent: CollectionSarthi subscription kal (${expiryDate}) expire ho raha hai!`;
        subtext = "Automatic debtor follow-ups aur team access band hone se bachane ke liye abhi plan renew karein.";
        gradientClass = "from-orange-600 via-amber-500 to-amber-600 shadow-amber-600/25 border-amber-300/40";
      } else {
        badgeText = `⚠️ SUBSCRIPTION NOTICE • ${daysLeft} DAYS LEFT`;
        headline = `Aapka CollectionSarthi subscription agle ${daysLeft} dino mein (${expiryDate}) expire ho raha hai.`;
        subtext = "Continuous WhatsApp collection reminders aur daily action items ke liye abhi apna plan renew ya upgrade karein.";
        gradientClass = "from-amber-500 via-amber-600 to-orange-500 shadow-amber-500/25 border-amber-300/40";
      }

      bannerEl.innerHTML = `
        <div class="relative overflow-hidden bg-gradient-to-r ${gradientClass} text-white rounded-2xl p-4 sm:p-5 shadow-lg border">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div class="flex items-start sm:items-center gap-3.5">
              <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-xl flex-shrink-0 shadow-inner">
                ${daysLeft <= 1 ? "🚨" : "🔔"}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white text-slate-900 shadow-sm">
                    ${badgeText}
                  </span>
                  ${expiryDate ? `<span class="text-xs font-semibold text-white/90">Due: ${expiryDate}</span>` : ""}
                </div>
                <h3 class="text-sm sm:text-base font-extrabold text-white mt-1">
                  ${headline}
                </h3>
                <p class="text-xs text-white/90 mt-0.5">
                  ${subtext}
                </p>
              </div>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <a href="#/subscription" class="px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-50 active:scale-95 font-black text-xs shadow-md transition-all flex items-center gap-1.5 whitespace-nowrap">
                <span>⚡ Renew Plan Now / अभी रिन्यू करें</span>
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
              </a>
              <a href="https://wa.me/${cleanPhone}?text=Hi%2C%20I%20want%20to%20renew%20my%20CollectionSarthi%20subscription%20plan." target="_blank" class="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all flex items-center gap-1" title="WhatsApp Support">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.18-2.587-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.303-.058.116-.087.188-.173.289l-.26.303c-.087.087-.177.182-.076.356.101.174.449.741.964 1.201.662.591 1.221.774 1.394.861.174.086.275.072.376-.044.101-.116.433-.506.549-.68.116-.173.231-.144.39-.086s1.011.477 1.184.564.289.13.332.202c.045.072.045.419-.099.824z"/></svg>
                <span class="hidden md:inline text-[11px]">Help</span>
              </a>
            </div>
          </div>
        </div>
      `;
      bannerEl.classList.remove("hidden");
    } else {
      bannerEl.innerHTML = "";
      bannerEl.classList.add("hidden");
    }
  },

  /**
   * Hard-Lockout Screen when Subscription has Expired
   * Stops the app and mandates subscription renewal
   */
  renderLockoutScreen: function(container) {
    const user = Store.state.user || {};
    const isOwner = user.role === "OWNER";
    const sub = Store.state.subscription || {};
    const expiry = sub.expiryDate || "Recently";
    const plans = Store.getPlans();
    const starterPlan = plans.STARTER || { monthlyPrice: 399, yearlyPrice: 3999, name: "Starter Plan (Vyapar Plan)" };
    const growthPlan = plans.GROWTH || { monthlyPrice: 999, yearlyPrice: 9999, name: "Growth Plan (Sarthi Pro)" };
    const supportPhone = (typeof BRAND_CONFIG !== "undefined" && BRAND_CONFIG.supportPhone) || "+91 9355337839";
    const supportEmail = (typeof BRAND_CONFIG !== "undefined" && BRAND_CONFIG.supportEmail) || "suraj.gasdeveloper@gmail.com";
    const cleanPhone = supportPhone.replace(/[^0-9]/g, "");

    container.innerHTML = `
      <div class="min-h-[75vh] flex flex-col items-center justify-center py-6 px-2">
        <div class="w-full max-w-4xl space-y-8">
          
          <!-- Stop / Lockout Alert Banner -->
          <div class="relative overflow-hidden bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border-2 border-rose-600/80 text-center space-y-4">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-600/30 border border-rose-500/50 text-3xl shadow-lg shadow-rose-600/30 animate-bounce">
              🔒
            </div>

            <div class="space-y-2 max-w-2xl mx-auto">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500 text-white shadow-md">
                <span>APP ACCESS STOPPED • SUBSCRIPTION EXPIRED</span>
              </div>
              <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Aapka Subscription Expire Ho Chuka Hai
              </h1>
              <p class="text-sm text-rose-200">
                Aapke CollectionSarthi account ki validity <b class="font-mono text-white">${expiry}</b> ko samapt ho gayi hai.
                App ki sabhi money recovery features, debtor records aur automated WhatsApp reminders pause kar diye gaye hain.
              </p>
            </div>

            ${!isOwner ? `
              <!-- Notice for Non-Owners / Executives -->
              <div class="max-w-xl mx-auto p-4 rounded-xl bg-rose-900/50 border border-rose-500/40 text-xs text-rose-100 text-center space-y-1">
                <p class="font-bold text-white text-sm">Team Member Access Notice</p>
                <p>Aapke business organization ka subscription expire ho chuka hai. Kripya apne Business Owner / Administrator se contact karein taaki wo account renew kar sakein.</p>
              </div>
            ` : `
              <p class="text-xs font-semibold text-amber-300">
                ⚡ Aage kaam jaari rakhne ke liye kripya niche diye gaye plan mein se subscribe ya renew karein:
              </p>
            `}
          </div>

          <!-- Subscription Plan Selection Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <!-- Starter Plan Card -->
            <div class="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-lg flex flex-col justify-between hover:border-slate-300 transition-all">
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="px-3 py-1 rounded-full text-xs font-extrabold bg-slate-100 text-slate-700">Vyapar Plan</span>
                  <span class="text-xs text-slate-500 font-medium">1 Seat • Solo Owner</span>
                </div>
                <div>
                  <h3 class="text-xl font-black text-slate-900">${starterPlan.name}</h3>
                  <p class="text-xs text-slate-500 mt-1">Essential recovery workflow for micro SMBs.</p>
                </div>
                <div class="pt-2 pb-4 border-b border-slate-100">
                  <div class="flex items-baseline gap-1">
                    <span class="text-3xl font-black text-slate-900">₹${(starterPlan.monthlyPrice || 399).toLocaleString("en-IN")}</span>
                    <span class="text-xs font-semibold text-slate-500">/ month</span>
                  </div>
                  <p class="text-[11px] text-slate-400 mt-0.5">Or ₹${(starterPlan.yearlyPrice || 3999).toLocaleString("en-IN")}/year (Save ~16%)</p>
                </div>
                <ul class="space-y-2 text-xs text-slate-700">
                  <li class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    <span>1 User Login (Business Owner)</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    <span>Up to 100 Active Debtors</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    <span>1-Click Direct WhatsApp (Standard Text)</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    <span>Basic Aging Analysis (30-60-90+ Days)</span>
                  </li>
                  <li class="flex items-center gap-2 text-slate-400 line-through">
                    <svg class="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                    <span>13+ Persuasive WhatsApp Templates</span>
                  </li>
                </ul>
              </div>

              <div class="mt-6 pt-4">
                <button onclick="SubscriptionView.subscribePlan('STARTER')" class="w-full py-3.5 px-4 rounded-xl text-xs font-extrabold text-slate-800 bg-slate-100 hover:bg-slate-200 active:scale-[0.99] transition-all flex items-center justify-center gap-2">
                  <span>Reactivate with Starter (₹${starterPlan.monthlyPrice || 399}/mo)</span>
                </button>
              </div>
            </div>

            <!-- Growth Plan Card (Recommended) -->
            <div class="relative bg-gradient-to-b from-white to-indigo-50/40 rounded-3xl p-6 sm:p-7 border-2 border-indigo-600 shadow-xl shadow-indigo-600/10 flex flex-col justify-between">
              <div class="absolute -top-3.5 right-6 px-3.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-[11px] uppercase tracking-wider rounded-full shadow-md">
                ⭐ RECOMMENDED • FULL RECOVERY SUITE
              </div>

              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <span class="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-700">Sarthi Pro</span>
                  <span class="text-xs text-indigo-700 font-bold">3 Seats • Owner + 2 Staff</span>
                </div>
                <div>
                  <h3 class="text-xl font-black text-slate-900">${growthPlan.name}</h3>
                  <p class="text-xs text-slate-500 mt-1">Full power money collection with AI intelligence.</p>
                </div>
                <div class="pt-2 pb-4 border-b border-indigo-100">
                  <div class="flex items-baseline gap-1">
                    <span class="text-3xl font-black text-indigo-950">₹${(growthPlan.monthlyPrice || 999).toLocaleString("en-IN")}</span>
                    <span class="text-xs font-semibold text-slate-500">/ month</span>
                  </div>
                  <p class="text-[11px] text-indigo-700 font-medium mt-0.5">Or ₹${(growthPlan.yearlyPrice || 9999).toLocaleString("en-IN")}/year (Save ~16%)</p>
                </div>
                <ul class="space-y-2 text-xs text-slate-800">
                  <li class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    <span class="font-bold">3 Team Seats (Owner + 2 Executives)</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    <span class="font-bold">Up to 500 Active Debtors</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    <span class="font-bold">13+ High-Converting WhatsApp Templates Library</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    <span>Promise to Pay (PTP) Commitment Tracker</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    <span>Bad Debt AI Risk Scoring & Smart Priority</span>
                  </li>
                  <li class="flex items-center gap-2">
                    <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    <span>Complete Aging Analysis & Audit Logs</span>
                  </li>
                </ul>
              </div>

              <div class="mt-6 pt-4">
                <button onclick="SubscriptionView.subscribePlan('GROWTH')" class="w-full py-3.5 px-4 rounded-xl text-xs font-black text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2">
                  <span>⚡ Subscribe Sarthi Pro (₹${growthPlan.monthlyPrice || 999}/mo)</span>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                </button>
              </div>
            </div>

          </div>

          <!-- Offline Payment / Google Sheet Sync & Support Options -->
          <div class="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div class="text-slate-600 text-center sm:text-left">
                <p class="font-bold text-slate-800">Paid directly or renewed in Google Sheet?</p>
                <p class="text-slate-500 mt-0.5">Click sync to instantly verify your updated subscription status.</p>
              </div>
              <div class="flex items-center gap-2 flex-wrap justify-center">
                <button onclick="SubscriptionView.syncMaster()" class="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5">
                  <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                  <span>Sync Master Sheet</span>
                </button>
                <a href="tel:+919355337839" class="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5">
                  <span>📞 9355337839</span>
                </a>
                <a href="mailto:${supportEmail}" class="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5">
                  <span>✉️ Email</span>
                </a>
                <a href="https://wa.me/${cleanPhone}?text=Hi%2C%20my%20CollectionSarthi%20subscription%20expired.%20Please%20help%20me%20renew%20via%20UPI%20or%20NEFT." target="_blank" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5">
                  <span>💬 WhatsApp Support</span>
                </a>
                <button onclick="Auth.logout()" class="px-3 py-2 text-slate-500 hover:text-red-600 font-semibold transition-colors">
                  Sign Out
                </button>
              </div>
            </div>

            <div class="pt-3 border-t border-slate-200 text-center text-[11px] text-slate-500">
              Software build by <a href="https://websarthi.surajdx.com" target="_blank" class="font-bold text-indigo-600 hover:underline">WebSarthi</a> • Powered by <a href="http://surajdx.com" target="_blank" class="font-bold text-indigo-600 hover:underline">Suraj Automation</a>
            </div>
          </div>

        </div>
      </div>
    `;
  },

  /**
   * Helper to immediately lock the app if API reports subscription expired
   */
  lockExpiredSubscription: function() {
    if (Store.state.subscription) {
      Store.state.subscription.status = "EXPIRED";
      Store.setSubscription(Store.state.subscription);
    }
    const mainContainer = document.getElementById("main-content");
    if (mainContainer) {
      this.renderLockoutScreen(mainContainer);
    }
  },

  updateActiveNav: function(hash) {
    const navLinks = document.querySelectorAll("[data-route]");
    const baseHash = hash.startsWith("#/customer/") ? "#/customers" : hash;

    navLinks.forEach(link => {
      const target = link.getAttribute("data-route");
      if (target === baseHash) {
        link.className = "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold bg-indigo-50 text-indigo-700 transition-colors";
      } else {
        link.className = "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors";
      }
    });

    // Close mobile drawer if open
    const mobileMenu = document.getElementById("mobile-sidebar");
    if (mobileMenu && !mobileMenu.classList.contains("hidden")) {
      mobileMenu.classList.add("hidden");
    }
  },

  updateUserBadge: function() {
    const user = Store.state.user;
    if (!user) return;
    const nameEl = document.getElementById("header-user-name");
    const roleEl = document.getElementById("header-user-role");
    if (nameEl) nameEl.innerText = user.name;
    if (roleEl) roleEl.innerText = user.role;

    // RBAC: Hide Users and Settings for Collection Executives
    if (user.role === "COLLECTION_EXECUTIVE") {
      const adminNavs = document.querySelectorAll(".admin-only");
      adminNavs.forEach(el => el.classList.add("hidden"));
    }
  },

  updateSubscriptionBadges: function() {
    const isPro = Store.isPro();
    const isTrial = Store.isTrial();
    const isExpired = Store.isExpired();
    const trialDaysLeft = Store.getTrialDaysLeft();
    const plan = Store.getPlan();

    const pill = document.getElementById("sidebar-plan-pill");
    const tierIcon = document.getElementById("sidebar-tier-icon");
    const tierName = document.getElementById("sidebar-tier-name");
    const upgradeLink = document.getElementById("sidebar-upgrade-link");
    const quotaMini = document.getElementById("sidebar-quota-mini");

    if (pill) {
      if (isExpired) {
        pill.innerText = "EXPIRED";
        pill.className = "px-2 py-0.5 text-[10px] font-black rounded-md bg-rose-500 text-white shadow-sm";
      } else if (isTrial) {
        pill.innerText = `${trialDaysLeft}D TRIAL`;
        pill.className = "px-2 py-0.5 text-[10px] font-black rounded-md bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 shadow-sm";
      } else {
        pill.innerText = isPro ? "PRO" : "STARTER";
        pill.className = isPro
          ? "px-2 py-0.5 text-[10px] font-black rounded-md bg-amber-400 text-slate-950 shadow-sm"
          : "px-2 py-0.5 text-[10px] font-black rounded-md bg-indigo-50 text-indigo-700";
      }
    }

    if (tierIcon) {
      if (isExpired) tierIcon.innerText = "⚠️";
      else if (isTrial) tierIcon.innerText = "🎁";
      else tierIcon.innerText = isPro ? "👑" : "⚡";

      const tierIconMini = document.getElementById("sidebar-tier-icon-mini");
      if (tierIconMini) tierIconMini.innerText = tierIcon.innerText;
    }

    if (tierName) {
      if (isExpired) {
        tierName.innerText = "Trial Expired";
      } else if (isTrial) {
        tierName.innerText = `Free Trial (${trialDaysLeft}d left)`;
      } else {
        tierName.innerText = plan.badge || (isPro ? "Sarthi Pro" : "Vyapar Plan");
      }
    }

    if (upgradeLink) {
      if (isExpired) {
        upgradeLink.innerText = "Reactivate";
        upgradeLink.className = "text-[11px] font-black text-rose-600 hover:text-rose-800 underline";
      } else if (isTrial) {
        upgradeLink.innerText = "Upgrade";
        upgradeLink.className = "text-[11px] font-black text-amber-600 hover:text-amber-800";
      } else {
        upgradeLink.innerText = isPro ? "Manage" : "Upgrade";
        upgradeLink.className = isPro ? "text-[11px] font-bold text-slate-600 hover:text-slate-900" : "text-[11px] font-black text-indigo-600 hover:text-indigo-800";
      }
    }

    if (quotaMini) {
      quotaMini.innerText = `${plan.maxUsers || 1} ${plan.maxUsers === 1 ? 'Seat' : 'Seats'} • Upto ${plan.maxCustomers || 100} Debtors`;
    }
  },

  toggleMobileMenu: function() {
    const menu = document.getElementById("mobile-sidebar");
    if (menu) menu.classList.toggle("hidden");
  },

  initSidebar: function() {
    try {
      const isCollapsed = localStorage.getItem("cs_sidebar_collapsed") === "true";
      const sidebar = document.getElementById("desktop-sidebar");
      if (sidebar && isCollapsed) {
        sidebar.classList.add("sidebar-collapsed");
        const btn = document.getElementById("sidebar-collapse-btn");
        if (btn) btn.title = "Expand sidebar (Ctrl+B)";
      }
    } catch (e) {}

    // Global keyboard shortcut: Ctrl+B or Cmd+B to toggle sidebar
    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "b" || e.key === "B")) {
        const target = e.target;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        this.toggleSidebar();
      }
    });
  },

  toggleSidebar: function() {
    const sidebar = document.getElementById("desktop-sidebar");
    if (!sidebar) return;
    const isCollapsed = sidebar.classList.toggle("sidebar-collapsed");
    try {
      localStorage.setItem("cs_sidebar_collapsed", String(isCollapsed));
    } catch (e) {}

    const btn = document.getElementById("sidebar-collapse-btn");
    if (btn) {
      btn.title = isCollapsed ? "Expand sidebar (Ctrl+B)" : "Collapse sidebar (Ctrl+B)";
    }
  }
};

// Initialize when DOM ready
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
