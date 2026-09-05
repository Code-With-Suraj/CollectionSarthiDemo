/**
 * CollectionSarthi - Client Store & Local State Caching
 */

const Store = {
  state: {
    user: null,
    token: null,
    dashboard: null,
    customers: [],
    invoices: [],
    payments: [],
    followups: [],
    settings: {},
    lastFetched: {}
  },

  // Cache validity duration in ms (2 minutes for client store)
  CACHE_TTL_MS: 120000,

  init: function() {
    try {
      const savedUser = sessionStorage.getItem("cs_user");
      const savedToken = sessionStorage.getItem("cs_token");
      // If previous session was a demo simulation token, clear it to force live Google Sheet login
      if (savedToken && String(savedToken).startsWith("demo-token")) {
        this.clearSession();
        return;
      }
      if (savedUser && savedToken) {
        this.state.user = JSON.parse(savedUser);
        this.state.token = savedToken;
      }
    } catch (e) {
      console.warn("Could not restore session: " + e.message);
    }
  },

  setSession: function(user, token) {
    this.state.user = user;
    this.state.token = token;
    try {
      sessionStorage.setItem("cs_user", JSON.stringify(user));
      sessionStorage.setItem("cs_token", token);
    } catch (e) {}
  },

  clearSession: function() {
    this.state.user = null;
    this.state.token = null;
    this.clearCache();
    try {
      sessionStorage.removeItem("cs_user");
      sessionStorage.removeItem("cs_token");
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
    this.state.customers = [];
    this.state.invoices = [];
    this.state.payments = [];
    this.state.followups = [];
    this.state.lastFetched = {};
  }
};
