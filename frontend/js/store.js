/**
 * CollectionSarthi - Client Store & Local State Caching
 */

const Store = {
  state: {
    user: null,
    token: null,
    dashboard: null,
    actions: null,
    customers: [],
    invoices: [],
    payments: [],
    followups: [],
    settings: {},
    subscription: null,
    lastFetched: {}
  },

  // Cache validity duration in ms (2 minutes for client store)
  CACHE_TTL_MS: 120000,

  init: function() {
    try {
      const savedUser = sessionStorage.getItem("cs_user");
      const savedToken = sessionStorage.getItem("cs_token");
      const savedSub = sessionStorage.getItem("cs_sub");
      // If previous session was a demo simulation token, clear it to force live Google Sheet login
      if (savedToken && String(savedToken).startsWith("demo-token")) {
        this.clearSession();
        return;
      }
      if (savedUser && savedToken) {
        this.state.user = JSON.parse(savedUser);
        this.state.token = savedToken;
      }
      if (savedSub) {
        this.state.subscription = JSON.parse(savedSub);
      }
    } catch (e) {
      console.warn("Could not restore session: " + e.message);
    }
  },

  setSession: function(user, token, subscription = null) {
    this.state.user = user;
    this.state.token = token;
    if (subscription) this.setSubscription(subscription);
    try {
      sessionStorage.setItem("cs_user", JSON.stringify(user));
      sessionStorage.setItem("cs_token", token);
    } catch (e) {}
  },

  setSubscription: function(sub) {
    this.state.subscription = sub;
    try {
      sessionStorage.setItem("cs_sub", JSON.stringify(sub));
    } catch (e) {}
    // Trigger plan badge update if DOM ready
    if (typeof App !== "undefined" && App.updateSubscriptionBadges) {
      App.updateSubscriptionBadges();
    }
  },

  getPlanId: function() {
    if (this.state.subscription && this.state.subscription.planId) {
      return this.state.subscription.planId;
    }
    return "GROWTH";
  },

  getPlans: function() {
    if (this.state.subscription && this.state.subscription.plans) {
      return this.state.subscription.plans;
    }
    if (typeof SUBSCRIPTION_CONFIG !== "undefined" && SUBSCRIPTION_CONFIG.PLANS) {
      return SUBSCRIPTION_CONFIG.PLANS;
    }
    return {};
  },

  getPlan: function() {
    const planId = this.getPlanId();
    // Prioritize dynamic plan from backend/sheet
    if (this.state.subscription && this.state.subscription.plans && this.state.subscription.plans[planId]) {
      return this.state.subscription.plans[planId];
    }
    if (this.state.subscription && this.state.subscription.features && this.state.subscription.features.id === planId) {
      return this.state.subscription.features;
    }
    if (typeof SUBSCRIPTION_CONFIG !== "undefined" && SUBSCRIPTION_CONFIG.PLANS && SUBSCRIPTION_CONFIG.PLANS[planId]) {
      return SUBSCRIPTION_CONFIG.PLANS[planId];
    }
    return {
      id: "GROWTH",
      name: "Growth Plan (Sarthi Pro)",
      badge: "Sarthi Pro",
      maxUsers: 3,
      maxCustomers: 500,
      actionCenterLimit: 0,
      actionCenterPrioritySort: true,
      agingAnalysis: "FULL",
      whatsApp: "CUSTOM_TEMPLATES",
      ptpTracker: true,
      riskScoring: true
    };
  },

  isTrial: function() {
    return Boolean(
      this.state.subscription &&
      (this.state.subscription.status === "TRIAL" || this.state.subscription.isTrial)
    );
  },

  getTrialDaysLeft: function() {
    if (this.state.subscription && typeof this.state.subscription.trialDaysLeft === "number") {
      return this.state.subscription.trialDaysLeft;
    }
    return 0;
  },

  isExpired: function() {
    return Boolean(this.state.subscription && this.state.subscription.status === "EXPIRED");
  },

  hasFeature: function(featureKey) {
    // Pro features enabled during trial
    if (this.isTrial() && (featureKey === "ptpTracker" || featureKey === "riskScoring" || featureKey === "actionCenterPrioritySort")) {
      return true;
    }
    const plan = this.getPlan();
    return Boolean(plan[featureKey]);
  },

  isPro: function() {
    return this.getPlanId() === "GROWTH" || this.isTrial();
  },

  canAddCustomer: function(currentCount = 0) {
    const max = this.getPlan().maxCustomers || 500;
    return currentCount < max;
  },

  canAddUser: function(currentCount = 0) {
    const max = this.getPlan().maxUsers || 3;
    return currentCount < max;
  },

  clearSession: function() {
    this.state.user = null;
    this.state.token = null;
    this.state.subscription = null;
    this.clearCache();
    try {
      sessionStorage.removeItem("cs_user");
      sessionStorage.removeItem("cs_token");
      sessionStorage.removeItem("cs_sub");
    } catch (e) {}
  },

  isCacheValid: function(key) {
    const timestamp = this.state.lastFetched[key];
    if (!timestamp) return false;
    return (Date.now() - timestamp) < this.CACHE_TTL_MS;
  },

  setCached: function(key, data) {
    this.state[key] = data;
    this.state.lastFetched[key] = Date.now();
  },

  getCached: function(key) {
    if (this.isCacheValid(key)) {
      return this.state[key];
    }
    return null;
  },

  invalidate: function(...keys) {
    keys.forEach(k => {
      delete this.state.lastFetched[k];
    });
  },

  clearCache: function() {
    this.state.dashboard = null;
    this.state.actions = null;
    this.state.customers = [];
    this.state.invoices = [];
    this.state.payments = [];
    this.state.followups = [];
    this.state.lastFetched = {};
  }
};
