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

  toggleMobileMenu: function() {
    const menu = document.getElementById("mobile-sidebar");
    if (menu) menu.classList.toggle("hidden");
  }
};

// Initialize when DOM ready
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
