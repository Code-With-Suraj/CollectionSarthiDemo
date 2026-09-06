/**
 * CollectionSarthi - Subscription & Plans Management View
 * Features:
 * - Real-time active subscription status & quota meters (Users, Customers)
 * - Monthly vs Yearly billing switcher with savings badge
 * - Smart feature comparison grid (Starter / Vyapar vs Growth / Sarthi Pro)
 * - 1-Click Razorpay Checkout integration with automatic activation
 */

const SubscriptionView = {
  billingCycle: "MONTHLY", // "MONTHLY" or "YEARLY"
  isLoading: false,
  subData: null,

  render: async function(container) {
    this.container = container;
    container.innerHTML = `
      <div class="space-y-6 max-w-6xl mx-auto">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div class="flex items-center gap-2.5">
              <h1 class="text-2xl font-bold text-slate-900 tracking-tight">Subscription & Plans</h1>
              <span id="sub-active-badge-top" class="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                Loading...
              </span>
            </div>
            <p class="text-sm text-slate-500 mt-0.5">Manage your CollectionSarthi plan, team seats, recovery quotas, and billing.</p>
          </div>
          <div class="flex items-center gap-2">
            <button id="btn-sync-master" onclick="SubscriptionView.syncMaster()" class="px-3.5 py-2 text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-1.5 text-xs font-bold">
              <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              <span>Sync Master Sheet</span>
            </button>
            <button onclick="SubscriptionView.refresh()" class="p-2 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow transition-all flex items-center gap-1.5 text-xs font-medium" title="Refresh">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
            </button>
          </div>
        </div>

        <div id="sub-content-container" class="space-y-6">
          <div class="h-48 skeleton rounded-2xl"></div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="h-96 skeleton rounded-2xl"></div>
            <div class="h-96 skeleton rounded-2xl"></div>
          </div>
        </div>
      </div>
    `;

    await this.loadData();
  },

  loadData: async function() {
    try {
      this.isLoading = true;
      const res = await Api.call("getSubscription");
      this.subData = res;
      Store.setSubscription(res);
      this.renderContent();
    } catch (err) {
      console.error("Failed to load subscription data", err);
      const isTrial = Store.isTrial();
      const trialDays = Store.getTrialDaysLeft();
      const activePlan = Store.getPlan();
      this.subData = {
        planId: Store.getPlanId() || "GROWTH",
        planName: activePlan.name,
        badge: activePlan.badge,
        status: Store.isExpired() ? "EXPIRED" : (isTrial ? "TRIAL" : "ACTIVE"),
        isTrial: isTrial,
        trialDaysLeft: trialDays,
        billingCycle: isTrial ? "TRIAL" : "MONTHLY",
        usage: {
          users: { current: 1, max: activePlan.maxUsers || 3 },
          customers: { current: Store.state.customers ? Store.state.customers.length : 0, max: activePlan.maxCustomers || 500 }
        },
        razorpayKeyId: (typeof SUBSCRIPTION_CONFIG !== "undefined" && SUBSCRIPTION_CONFIG.RAZORPAY_KEY_ID) || "rzp_live_Sugpl07IegaqDU",
        plans: Store.getPlans()
      };
      this.renderContent();
    } finally {
      this.isLoading = false;
    }
  },

  refresh: function() {
    this.loadData();
  },

  syncMaster: async function() {
    try {
      if (typeof Toast !== "undefined") Toast.info("Syncing plans & status with Master Google Sheet...");
      const res = await Api.call("syncSubscription");
      if (res) {
        this.subData = res;
        Store.setSubscription(res);
        if (typeof App !== "undefined" && App.updateSubscriptionBadges) App.updateSubscriptionBadges();
        if (typeof Toast !== "undefined") Toast.success("Plans and subscription synchronized with Master Sheet!");
        this.renderContent();
      }
    } catch (e) {
      if (typeof Toast !== "undefined") Toast.error("Sync notice: " + e.message);
      this.loadData();
    }
  },

  setBillingCycle: function(cycle) {
    this.billingCycle = cycle;
    this.renderContent();
  },

  renderContent: function() {
    const container = document.getElementById("sub-content-container");
    if (!container || !this.subData) return;

    const currentPlanId = this.subData.planId || "GROWTH";
    const status = (this.subData.status || "TRIAL").toUpperCase();
    const isTrial = Boolean(this.subData.isTrial || status === "TRIAL");
    const isExpired = Boolean(status === "EXPIRED" || this.subData.isExpired);
    const trialDaysLeft = this.subData.trialDaysLeft !== undefined ? this.subData.trialDaysLeft : (isTrial ? 7 : 0);
    const isProActive = currentPlanId === "GROWTH" || isTrial;
    const usage = this.subData.usage || { users: { current: 1, max: 3 }, customers: { current: 0, max: 500 } };
    const expiry = this.subData.expiryDate;

    // 1. Update top badge
    const topBadge = document.getElementById("sub-active-badge-top");
    if (topBadge) {
      if (isExpired) {
        topBadge.className = "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300";
        topBadge.innerText = "Trial Expired • Action Required";
      } else if (isTrial) {
        topBadge.className = "px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-amber-200 to-orange-200 text-amber-950 border border-amber-300 shadow-sm animate-pulse";
        topBadge.innerText = `🎁 7-Day Free Trial • ${trialDaysLeft} Days Remaining`;
      } else {
        topBadge.className = `px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
          isProActive ? "bg-amber-100 text-amber-900 border border-amber-300" : "bg-indigo-100 text-indigo-800"
        }`;
        topBadge.innerText = `${this.subData.badge || "Vyapar Plan"} • ${status}`;
      }
    }

    // 2. Prepare dynamic plans list from sheet data
    const rawPlans = this.subData.plans || Store.getPlans();
    const plansList = Object.values(rawPlans || {}).sort((a, b) => (a.sortOrder || 99) - (b.sortOrder || 99));

    // Usage calculation percentages
    const custPct = Math.min(100, Math.round((usage.customers.current / Math.max(1, usage.customers.max)) * 100));
    const userPct = Math.min(100, Math.round((usage.users.current / Math.max(1, usage.users.max)) * 100));

    container.innerHTML = `
      <!-- Free Trial / Active Plan Banner -->
      ${isExpired ? `
        <div class="relative overflow-hidden bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 text-white rounded-2xl p-6 shadow-xl border-2 border-rose-600/60">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div class="space-y-2">
              <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500 text-white shadow-sm">
                <span>⚠️ Free Trial / Subscription Expired</span>
              </div>
              <h2 class="text-2xl font-black text-white tracking-tight">Reactivate Your Collection Recovery Intelligence</h2>
              <p class="text-xs text-rose-200 max-w-xl">
                Your 7-day trial period has ended. Choose a plan below to immediately restore automated reminders, team access, and risk scoring.
              </p>
            </div>
            <div class="flex-shrink-0">
              <button onclick="document.getElementById('plans-grid-section')?.scrollIntoView({ behavior: 'smooth' })" class="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-xs hover:from-amber-300 hover:to-amber-400 shadow-lg transition-all">
                Select a Plan Below ⚡
              </button>
            </div>
          </div>
        </div>
      ` : isTrial ? `
        <div class="relative overflow-hidden bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-amber-500/40">
          <div class="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 shadow-sm animate-pulse">
                  🎁 7-DAY FREE TRIAL ACTIVE
                </span>
                <span class="text-xs font-bold text-amber-300">${trialDaysLeft} Days Remaining</span>
              </div>
              <h2 class="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Full Pro Recovery Suite Unlocked
              </h2>
              <p class="text-xs text-indigo-200 max-w-xl">
                You have full access to Growth Plan features including 3 team seats, AI risk scoring, Promise to Pay commitment tracking, and unlimited Action Center.
              </p>
              <div class="flex flex-wrap items-center gap-3 pt-1">
                ${expiry ? `<p class="text-[11px] text-slate-300">Trial ends on: <b class="text-amber-300 font-mono">${expiry}</b></p>` : ''}
                <span class="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md" title="Plans and pricing are synced live with your Google Spreadsheet Plans sheet">
                  <svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <span>Live Sheet-Synced Plans</span>
                </span>
              </div>
            </div>

            <!-- Trial Live Quotas -->
            <div class="grid grid-cols-2 gap-4 bg-white/10 border border-white/10 rounded-xl p-4 min-w-[280px]">
              <div>
                <div class="flex justify-between items-center text-xs mb-1">
                  <span class="text-slate-300">Debtors Quota</span>
                  <span class="font-bold text-white">${usage.customers.current} / ${usage.customers.max}</span>
                </div>
                <div class="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div class="bg-indigo-400 h-2 rounded-full transition-all duration-500" style="width: ${custPct}%"></div>
                </div>
                <p class="text-[10px] text-slate-400 mt-1">${Math.max(0, usage.customers.max - usage.customers.current)} slots left</p>
              </div>

              <div>
                <div class="flex justify-between items-center text-xs mb-1">
                  <span class="text-slate-300">Team Seats</span>
                  <span class="font-bold text-white">${usage.users.current} / ${usage.users.max}</span>
                </div>
                <div class="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div class="bg-emerald-400 h-2 rounded-full transition-all duration-500" style="width: ${userPct}%"></div>
                </div>
                <p class="text-[10px] text-slate-400 mt-1">${Math.max(0, usage.users.max - usage.users.current)} seats left</p>
              </div>
            </div>
          </div>
        </div>
      ` : `
        <div class="relative overflow-hidden bg-gradient-to-r ${isProActive ? 'from-slate-900 via-indigo-950 to-slate-900' : 'from-slate-900 via-slate-800 to-slate-900'} text-white rounded-2xl p-6 shadow-xl border border-slate-700/50">
          <div class="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <span class="text-xs font-semibold uppercase tracking-wider text-indigo-300">Active Membership</span>
                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${isProActive ? 'bg-amber-400 text-slate-950' : 'bg-indigo-500 text-white'}">
                  ${isProActive ? '👑 PRO RECOVERY SUITE' : '⚡ STARTER TIER'}
                </span>
              </div>
              <h2 class="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                ${this.subData.planName}
              </h2>
              <p class="text-xs text-slate-300 max-w-xl">
                ${isProActive 
                  ? 'Your business has unlocked full collection automation, AI risk scoring, Promise to Pay tracker, and multiple user seats.' 
                  : 'Manage your debtors, send 1-click WhatsApp reminders, and view daily action items.'}
              </p>
              <div class="flex flex-wrap items-center gap-3 pt-1">
                ${expiry ? `<p class="text-[11px] text-slate-300">Valid until: <b class="text-white font-mono">${expiry}</b></p>` : ''}
                <span class="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md" title="Subscription is managed & synchronized with Google Spreadsheet">
                  <svg class="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                  <span>Managed via Master Sheet</span>
                </span>
              </div>
            </div>

            <!-- Live Quota Meters -->
            <div class="grid grid-cols-2 gap-4 bg-white/5 border border-white/10 rounded-xl p-4 min-w-[280px]">
              <div>
                <div class="flex justify-between items-center text-xs mb-1">
                  <span class="text-slate-300">Debtors Quota</span>
                  <span class="font-bold text-white">${usage.customers.current} / ${usage.customers.max}</span>
                </div>
                <div class="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div class="bg-indigo-400 h-2 rounded-full transition-all duration-500" style="width: ${custPct}%"></div>
                </div>
                <p class="text-[10px] text-slate-400 mt-1">${Math.max(0, usage.customers.max - usage.customers.current)} slots available</p>
              </div>

              <div>
                <div class="flex justify-between items-center text-xs mb-1">
                  <span class="text-slate-300">Team Seats</span>
                  <span class="font-bold text-white">${usage.users.current} / ${usage.users.max}</span>
                </div>
                <div class="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                  <div class="bg-emerald-400 h-2 rounded-full transition-all duration-500" style="width: ${userPct}%"></div>
                </div>
                <p class="text-[10px] text-slate-400 mt-1">${Math.max(0, usage.users.max - usage.users.current)} seats left</p>
              </div>
            </div>
          </div>
        </div>
      `}

      <!-- Billing Switcher -->
      <div class="flex flex-col items-center justify-center space-y-2 pt-2">
        <div class="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 shadow-inner">
          <button onclick="SubscriptionView.setBillingCycle('MONTHLY')" class="px-5 py-2 rounded-lg text-xs font-bold transition-all ${
            this.billingCycle === 'MONTHLY' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }">
            Monthly Billing
          </button>
          <button onclick="SubscriptionView.setBillingCycle('YEARLY')" class="px-5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            this.billingCycle === 'YEARLY' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }">
            <span>Annual Billing</span>
            <span class="px-1.5 py-0.5 rounded text-[10px] font-black ${this.billingCycle === 'YEARLY' ? 'bg-amber-400 text-slate-900' : 'bg-emerald-100 text-emerald-800'}">
              SAVE ~16%
            </span>
          </button>
        </div>
        <p class="text-xs text-slate-400">Plans, features & prices managed in Master Google Sheet. Cancel or change anytime.</p>
      </div>

      <!-- Dynamic Plans Grid (Directly synced from Master Sheet) -->
      <div id="plans-grid-section" class="grid grid-cols-1 md:grid-cols-${Math.min(plansList.length, 3)} gap-6 items-stretch">
        ${plansList.map(p => {
          const isCurrent = currentPlanId === p.id && !isTrial && !isExpired;
          const isRec = Boolean(p.isRecommended);
          const price = this.billingCycle === "YEARLY" ? p.yearlyPrice : p.monthlyPrice;
          const cycleLabel = this.billingCycle === "YEARLY" ? "year" : "month";
          const subtext = this.billingCycle === "YEARLY"
            ? `Billed annually at ₹${(p.yearlyPrice || 0).toLocaleString("en-IN")}/yr (Effective ~₹${Math.round((p.yearlyPrice || 0) / 12)}/mo)`
            : `Billed monthly at ₹${(p.monthlyPrice || 0).toLocaleString("en-IN")}/mo`;

          // Format features
          let features = p.featuresList || [];
          if (!Array.isArray(features)) features = [];

          return `
            <div class="relative rounded-3xl p-7 shadow-sm flex flex-col justify-between transition-all duration-300 ${
              isRec
                ? 'bg-gradient-to-b from-white to-indigo-50/30 border-2 border-indigo-600 shadow-xl shadow-indigo-600/10'
                : 'bg-white border border-slate-200 hover:border-slate-300'
            } ${isCurrent ? 'ring-2 ring-indigo-500/20' : ''}">
              
              ${isRec ? `
                <div class="absolute -top-3.5 right-6 px-3.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-[11px] uppercase tracking-wider rounded-full shadow-md flex items-center gap-1">
                  <span>⭐ RECOMMENDED FOR SMBs</span>
                </div>
              ` : ''}

              ${isCurrent ? `
                <div class="absolute -top-3 left-6 px-3 py-0.5 bg-indigo-600 text-white font-bold text-[11px] uppercase tracking-wider rounded-full shadow">
                  Active Plan
                </div>
              ` : ''}

              <div>
                <div class="flex justify-between items-start">
                  <div>
                    <div class="flex items-center gap-2">
                      <h3 class="text-xl font-extrabold text-slate-900">${p.name}</h3>
                      ${p.maxUsers ? `<span class="px-2 py-0.5 text-[10px] font-extrabold bg-indigo-100 text-indigo-700 rounded-md">${p.maxUsers} ${p.maxUsers === 1 ? 'SEAT' : 'SEATS'}</span>` : ''}
                    </div>
                    <p class="text-xs text-slate-500 mt-1">${p.description || ''}</p>
                  </div>
                </div>

                <div class="mt-5 pb-5 border-b ${isRec ? 'border-indigo-100' : 'border-slate-100'}">
                  <div class="flex items-baseline gap-1">
                    <span class="text-3xl font-black ${isRec ? 'text-indigo-950' : 'text-slate-900'}">₹${(price || 0).toLocaleString("en-IN")}</span>
                    <span class="text-xs font-semibold text-slate-500">/ ${cycleLabel}</span>
                  </div>
                  <p class="text-[11px] ${isRec ? 'text-indigo-700 font-medium' : 'text-slate-400'} mt-1">
                    ${subtext}
                  </p>
                </div>

                <!-- Features list -->
                <div class="mt-6 space-y-3">
                  <span class="text-xs font-bold uppercase tracking-wider ${isRec ? 'text-indigo-900' : 'text-slate-400'}">Included Features:</span>
                  <ul class="space-y-2.5 text-xs ${isRec ? 'text-slate-800' : 'text-slate-700'}">
                    ${features.map(f => {
                      const isObj = typeof f === "object" && f !== null;
                      const label = isObj ? f.label : String(f);
                      const enabled = isObj ? f.enabled !== false : true;

                      return `
                        <li class="flex items-start gap-2.5 ${enabled ? '' : 'text-slate-400 line-through'}">
                          ${enabled ? `
                            <svg class="w-4 h-4 ${isRec ? 'text-indigo-600' : 'text-emerald-600'} flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                          ` : `
                            <svg class="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                          `}
                          <span class="${isRec && enabled ? 'font-medium' : ''}">${label}</span>
                        </li>
                      `;
                    }).join("")}
                  </ul>
                </div>
              </div>

              <!-- Action Button -->
              <div class="mt-8 pt-4">
                ${isCurrent ? `
                  <div class="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                    <svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>
                    <span>Currently Subscribed</span>
                  </div>
                ` : isTrial && p.id === "GROWTH" ? `
                  <button onclick="SubscriptionView.subscribePlan('${p.id}')" class="w-full py-3.5 px-4 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2">
                    <span>⚡ Activate & Keep Sarthi Pro</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  </button>
                ` : isRec ? `
                  <button onclick="SubscriptionView.subscribePlan('${p.id}')" class="w-full py-3.5 px-4 rounded-xl text-xs font-extrabold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2">
                    <span>⚡ Upgrade to ${p.name}</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
                  </button>
                ` : `
                  <button onclick="SubscriptionView.subscribePlan('${p.id}')" class="w-full py-3 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors">
                    ${isTrial ? `Select ${p.name}` : `Switch to ${p.name}`}
                  </button>
                `}
              </div>
            </div>
          `;
        }).join("")}
      </div>

      <!-- Trust Badges -->
      <div class="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-around gap-4 text-xs text-slate-500">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          <span><b>Razorpay Secured:</b> UPI, Debit/Credit Cards & NetBanking</span>
        </div>
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          <span>Instant feature activation upon payment</span>
        </div>
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
          <span>Auto GST-compliant digital tax invoice</span>
        </div>
      </div>

      <!-- Direct Assistance & Developer Contact Details -->
      <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-7 text-white border border-indigo-500/30 shadow-xl space-y-4">
        <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div class="space-y-1.5">
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-400 text-slate-950 shadow-sm">
              ⚡ Direct Billing & Custom Integration Support
            </div>
            <h3 class="text-lg sm:text-xl font-black text-white tracking-tight">Need Custom Plans, Bank NEFT or Technical Help?</h3>
            <p class="text-xs text-indigo-200 max-w-xl">
              Aap direct phone call, WhatsApp ya email ke madhyam se developer team se connect ho sakte hain:
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <a href="tel:+919355337839" class="px-4 py-2.5 rounded-xl bg-white text-slate-950 hover:bg-slate-100 active:scale-95 text-xs font-black shadow-md flex items-center gap-2 transition-all">
              <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              <span>+91 9355337839</span>
            </a>
            <a href="mailto:suraj.gasdeveloper@gmail.com" class="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-black shadow-md flex items-center gap-2 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              <span>suraj.gasdeveloper@gmail.com</span>
            </a>
            <a href="https://wa.me/919355337839?text=Hi%2C%20I%20want%20to%20discuss%20CollectionSarthi%20subscription%20and%20support." target="_blank" class="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all">
              💬 WhatsApp
            </a>
          </div>
        </div>

        <div class="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-indigo-300 gap-3">
          <div>
            Build by <a href="https://websarthi.surajdx.com" target="_blank" class="font-extrabold text-white hover:text-amber-300 underline decoration-indigo-400 underline-offset-2">WebSarthi</a> • Powered by <a href="http://surajdx.com" target="_blank" class="font-extrabold text-white hover:text-amber-300 underline decoration-indigo-400 underline-offset-2">Suraj Automation</a>
          </div>
          <div class="flex items-center gap-4 text-xs font-semibold">
            <a href="https://websarthi.surajdx.com" target="_blank" class="text-indigo-200 hover:text-white transition-colors flex items-center gap-1">
              <span>websarthi.surajdx.com</span>
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </a>
            <span class="text-indigo-500">•</span>
            <a href="http://surajdx.com" target="_blank" class="text-indigo-200 hover:text-white transition-colors flex items-center gap-1">
              <span>surajdx.com</span>
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
            </a>
          </div>
        </div>
      </div>
    `;
  },

  ensureRazorpayLoaded: async function() {
    if (typeof Razorpay !== "undefined") return true;
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Failed to load Razorpay checkout SDK"));
      document.head.appendChild(script);
    });
  },

  subscribePlan: async function(planId) {
    return await this.startCheckout(planId);
  },

  startCheckout: async function(planId) {
    const rawPlans = (this.subData && this.subData.plans) || Store.getPlans();
    const plan = rawPlans[planId] || (typeof SUBSCRIPTION_CONFIG !== "undefined" && SUBSCRIPTION_CONFIG.PLANS && SUBSCRIPTION_CONFIG.PLANS[planId]);
    if (!plan) {
      if (typeof Toast !== "undefined") Toast.error("Invalid plan selected");
      return;
    }

    const cycle = this.billingCycle;
    const amountInRupees = cycle === "YEARLY" ? plan.yearlyPrice : plan.monthlyPrice;
    const amountInPaise = amountInRupees * 100;
    const razorpayKey = (this.subData && this.subData.razorpayKeyId) || (typeof SUBSCRIPTION_CONFIG !== "undefined" ? SUBSCRIPTION_CONFIG.RAZORPAY_KEY_ID : "");

    const currentUser = Store.state.user || { name: "Business Owner", email: "admin@collectionsarthi.com", phone: "9876543210" };

    if (typeof Razorpay === "undefined") {
      if (typeof Toast !== "undefined") Toast.info("Loading secure payment gateway...");
      try {
        await this.ensureRazorpayLoaded();
      } catch (e) {
        if (typeof Toast !== "undefined") Toast.error("Could not load payment gateway: " + e.message);
        return;
      }
    }

    // Pre-create Razorpay Order with payment_capture: 1 for guaranteed automatic capture
    let createdOrderId = "";
    try {
      if (typeof Toast !== "undefined") Toast.info("Preparing secure auto-capture checkout...");
      const orderRes = await Api.call("createRazorpayOrder", {
        planId: planId,
        billingCycle: cycle,
        email: currentUser.email
      });
      if (orderRes && orderRes.orderId) {
        createdOrderId = orderRes.orderId;
      }
    } catch (orderErr) {
      console.warn("Order creation fallback to standard checkout:", orderErr);
    }

    const options = {
      key: razorpayKey,
      amount: amountInPaise,
      currency: "INR",
      name: (typeof BRAND_CONFIG !== "undefined" && BRAND_CONFIG.name) || "CollectionSarthi",
      description: `${plan.name} (${cycle === "YEARLY" ? "Annual" : "Monthly"} Subscription)`,
      image: (typeof BRAND_CONFIG !== "undefined" && BRAND_CONFIG.logoUrl) || "assets/brand/logo-mark.svg",
      ...(createdOrderId ? { order_id: createdOrderId } : {}),
      handler: async function(response) {
        if (typeof Toast !== "undefined") Toast.info("Payment confirmed! Capturing & activating subscription...");
        try {
          const actResult = await Api.call("activateSubscription", {
            planId: planId,
            billingCycle: cycle,
            paymentId: response.razorpay_payment_id || ("pay_live_" + Date.now()),
            orderId: response.razorpay_order_id || createdOrderId || "",
            signature: response.razorpay_signature || "",
            email: currentUser.email
          });

          if (typeof Toast !== "undefined") Toast.success(`🎉 Congratulations! ${plan.name} is now active.`);
          SubscriptionView.loadData();
          if (typeof App !== "undefined" && App.updateSubscriptionBadges) {
            App.updateSubscriptionBadges();
          }
        } catch (err) {
          if (typeof Toast !== "undefined") Toast.error("Activation failed: " + err.message);
        }
      },
      prefill: {
        name: currentUser.name || "Business Owner",
        email: currentUser.email || "admin@collectionsarthi.com",
        contact: currentUser.phone || "9876543210"
      },
      theme: {
        color: (typeof BRAND_CONFIG !== "undefined" && BRAND_CONFIG.primaryColor) || "#4f46e5"
      },
      modal: {
        ondismiss: function() {
          if (typeof Toast !== "undefined") Toast.info("Subscription checkout was cancelled.");
        }
      }
    };

    try {
      const rzp = new Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error("Razorpay initiation failed", e);
      if (typeof Toast !== "undefined") Toast.error("Could not open Razorpay checkout: " + e.message);
    }
  },

  syncMaster: async function() {
    const syncBtn = document.getElementById("btn-sync-master");
    if (syncBtn) {
      syncBtn.disabled = true;
      syncBtn.innerHTML = `
        <svg class="w-4 h-4 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        <span>Syncing Sheet...</span>
      `;
    }

    try {
      if (typeof Toast !== "undefined") Toast.info("Connecting to Google Sheets 'Plans' tab...");
      const plansRes = await Api.call("getPlans", { forceRefresh: true });
      if (plansRes && plansRes.plans) {
        if (!this.subData) this.subData = {};
        this.subData.plans = plansRes.plans;
        if (Store.state.subscription) {
          Store.state.subscription.plans = plansRes.plans;
        }
      }

      const subRes = await Api.call("getSubscription", { forceRefresh: true });
      if (subRes) {
        this.subData = subRes;
        Store.setSubscription(subRes);
      }

      this.renderContent();
      if (typeof Toast !== "undefined") Toast.success("⚡ Plans & features successfully synced live from Google Sheet!");
    } catch (err) {
      console.error("Master sheet sync error", err);
      if (typeof Toast !== "undefined") Toast.error("Sync failed: " + err.message);
    } finally {
      if (syncBtn) {
        syncBtn.disabled = false;
        syncBtn.innerHTML = `
          <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          <span>Sync Master Sheet</span>
        `;
      }
    }
  },

  refresh: async function() {
    await this.syncMaster();
  }
};
