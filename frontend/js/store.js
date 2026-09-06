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

  // Cache validity duration in ms (default fallback)
  CACHE_TTL_MS: 120000,

  getTTL: function(key) {
    const upper = String(key).toUpperCase();
    if (typeof APP_CONFIG !== "undefined" && APP_CONFIG.CACHE_TTL_MS && APP_CONFIG.CACHE_TTL_MS[upper]) {
      return APP_CONFIG.CACHE_TTL_MS[upper];
    }
    return this.CACHE_TTL_MS;
  },

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
        // Self-heal: If remaining days are >= 0 (e.g. Sat Sep 12), immediately clear any false EXPIRED state
        if (this.state.subscription) {
          const days = this.getDaysLeft();
          if (days >= 0 && (this.state.subscription.status === "EXPIRED" || this.state.subscription.isExpired)) {
            this.state.subscription.status = this.state.subscription.isTrial ? "TRIAL" : "ACTIVE";
            this.state.subscription.isExpired = false;
            try { sessionStorage.setItem("cs_sub", JSON.stringify(this.state.subscription)); } catch (err) {}
          }
        }
      }

      // Warm-start restore for instant UI rendering
      const cacheKeys = ["dashboard", "actions", "customers", "invoices", "payments", "followups", "settings"];
      for (let i = 0; i < cacheKeys.length; i++) {
        const k = cacheKeys[i];
        try {
          const raw = sessionStorage.getItem("cs_cache_" + k);
          const time = sessionStorage.getItem("cs_cache_ts_" + k);
          if (raw) {
            this.state[k] = JSON.parse(raw);
            if (time) this.state.lastFetched[k] = Number(time);
          }
        } catch (e) {}
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
    if (sub) {
      this.state.subscription = sub;
      // Auto-validate status against real days left
      const days = this.getDaysLeft();
      if (days >= 0 && (this.state.subscription.status === "EXPIRED" || this.state.subscription.isExpired)) {
        this.state.subscription.status = this.state.subscription.isTrial ? "TRIAL" : "ACTIVE";
        this.state.subscription.isExpired = false;
      }
    } else {
      this.state.subscription = null;
    }
    try {
      sessionStorage.setItem("cs_sub", JSON.stringify(this.state.subscription));
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

  getDaysLeft: function() {
    if (!this.state.subscription) return 999;
    const sub = this.state.subscription;

    // 1. Direct date calculation from expiryDate
    let expDate = null;
    if (sub.expiryDate) {
      try {
        const str = String(sub.expiryDate).trim();
        if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
          const parts = str.substring(0, 10).split("-");
          expDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        } else {
          // If string like "Sat Sep 12" lacks a 4-digit year, append current year (e.g. 2026)
          const currentYear = new Date().getFullYear();
          const withYear = str.includes(String(currentYear)) ? str : (str + " " + currentYear);
          const parsed = new Date(withYear);
          if (!isNaN(parsed.getTime())) {
            expDate = parsed;
          }
        }
      } catch (e) {
        console.warn("Date parse error for expiryDate:", e);
      }
    }

    if (expDate && !isNaN(expDate.getTime())) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expDate.setHours(0, 0, 0, 0);
      const diffMs = expDate.getTime() - today.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      // Self-heal: If diffDays >= 0, status CANNOT be EXPIRED
      if (diffDays >= 0 && (sub.status === "EXPIRED" || sub.isExpired)) {
        sub.status = sub.isTrial ? "TRIAL" : "ACTIVE";
        sub.isExpired = false;
        try { sessionStorage.setItem("cs_sub", JSON.stringify(sub)); } catch (err) {}
      }
      return diffDays;
    }

    if (sub.status === "EXPIRED" || sub.isExpired) {
      return -1;
    }

    if (typeof sub.daysLeft === "number") {
      return sub.daysLeft;
    }
    if (sub.isTrial && typeof sub.trialDaysLeft === "number") {
      return sub.trialDaysLeft;
    }

    return 999;
  },

  getTrialDaysLeft: function() {
    if (this.state.subscription && typeof this.state.subscription.trialDaysLeft === "number") {
      return this.state.subscription.trialDaysLeft;
    }
    const days = this.getDaysLeft();
    return days >= 0 ? days : 0;
  },

  isExpired: function() {
    if (!this.state.subscription) return false;
    const days = this.getDaysLeft();
    return days < 0;
  },

  isExpiringSoon: function() {
    if (!this.state.subscription) return false;
    if (this.isExpired()) return false;
    const days = this.getDaysLeft();
    return days >= 0 && days <= 7;
  },

  hasFeature: function(featureKey) {
    // Pro features enabled during active trial
    if (this.isTrial() && !this.isExpired()) {
      return true;
    }
    const plan = this.getPlan();
    if (!plan) return false;

    // 1. Direct boolean flag (e.g. ptpTracker, riskScoring, actionCenterPrioritySort, dataImport)
    if (typeof plan[featureKey] === "boolean") {
      return plan[featureKey];
    }

    // 2. String enum flags
    if (featureKey === "fullAging" || featureKey === "agingAnalysisFull") {
      return plan.agingAnalysis === "FULL";
    }
    if (featureKey === "customWhatsAppTemplates" || featureKey === "whatsAppTemplates") {
      return plan.whatsApp === "CUSTOM_TEMPLATES";
    }

    // 3. Dynamic search in sheet featuresList
    if (Array.isArray(plan.featuresList)) {
      const match = plan.featuresList.find(function(f) {
        if (!f) return false;
        if (typeof f === "string") return f.toLowerCase().includes(featureKey.toLowerCase());
        if (f.id === featureKey || f.key === featureKey) return true;
        return (f.label || "").toLowerCase().includes(featureKey.toLowerCase());
      });
      if (match) {
        return typeof match === "object" ? match.enabled !== false : true;
      }
    }

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
    return (Date.now() - timestamp) < this.getTTL(key);
  },

  setCached: function(key, data) {
    this.state[key] = data;
    const now = Date.now();
    this.state.lastFetched[key] = now;
    try {
      sessionStorage.setItem("cs_cache_" + key, JSON.stringify(data));
      sessionStorage.setItem("cs_cache_ts_" + key, String(now));
    } catch (e) {}
  },

  getCached: function(key) {
    if (this.isCacheValid(key)) {
      return this.state[key];
    }
    return null;
  },

  getWithStale: function(key) {
    const data = this.state[key];
    const hasData = Array.isArray(data) ? data.length > 0 : Boolean(data);
    const valid = this.isCacheValid(key);
    return {
      data: hasData ? data : null,
      isStale: !valid
    };
  },

  invalidate: function(...keys) {
    keys.forEach(k => {
      delete this.state.lastFetched[k];
      try {
        sessionStorage.removeItem("cs_cache_ts_" + k);
      } catch (e) {}
    });
  },

  clearCache: function() {
    const keys = ["dashboard", "actions", "customers", "invoices", "payments", "followups", "settings"];
    keys.forEach(k => {
      try {
        sessionStorage.removeItem("cs_cache_" + k);
        sessionStorage.removeItem("cs_cache_ts_" + k);
      } catch (e) {}
    });
    this.state.dashboard = null;
    this.state.actions = null;
    this.state.customers = [];
    this.state.invoices = [];
    this.state.payments = [];
    this.state.followups = [];
    this.state.settings = {};
    this.state.lastFetched = {};
  }
};
