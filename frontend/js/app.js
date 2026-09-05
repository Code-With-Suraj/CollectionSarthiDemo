/**
 * CollectionSarthi - Single-Page Application Core Engine & Router
 */

const App = {
  init: function() {
    Store.init();
    Toast.init();
    Modals.init();

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

    // Route matching
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
  }
};

// Initialize when DOM ready
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
