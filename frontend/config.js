/**
 * CollectionSarthi - Client Configuration
 * To connect to your deployment, update BASE_URL with your Apps Script Web App URL.
 */
const API_CONFIG = {
  // Replace with your Google Apps Script Web App deployment URL:
  // e.g., "https://script.google.com/macros/s/AKfycbx.../exec"
  BASE_URL: "https://script.google.com/macros/s/AKfycbxmEMAba4hdonMPPMGMJYVzWroa8ZXBb8Rz6LKNM3aqQzmKstNxtucGzmf81icN-aeL/exec",

  // Demo Mode: Disabled to enforce 100% Live Google Sheet data
  DEMO_MODE_IF_EMPTY: false,

  REQUEST_TIMEOUT_MS: 20000
};

const BRAND_CONFIG = {
  name: "CollectionSarthi",
  tagline: "Your Daily Money Recovery Command Center",
  shortName: "CollectionSarthi",
  currency: "INR",
  currencySymbol: "₹",
  supportPhone: "+91 9355337839",
  supportEmail: "suraj.gasdeveloper@gmail.com",
  developerName: "WebSarthi",
  developerUrl: "https://websarthi.surajdx.com",
  poweredByName: "Suraj Automation",
  poweredByUrl: "http://surajdx.com",
  primaryColor: "#4f46e5"
};

const SUBSCRIPTION_CONFIG = {
  RAZORPAY_KEY_ID: "rzp_live_Sugpl07IegaqDU",
  TRIAL_DAYS: 7,
  PLANS: {
    STARTER: {
      id: "STARTER",
      name: "Starter Plan (Vyapar Plan)",
      badge: "Vyapar Plan",
      description: "Essential recovery workflow for micro & solo SMB business owners.",
      monthlyPrice: 399,
      yearlyPrice: 3999,
      maxUsers: 1,
      maxCustomers: 100,
      actionCenterLimit: 10,
      actionCenterPrioritySort: false,
      agingAnalysis: "BASIC", // Basic Summary
      whatsApp: "DIRECT", // 1-Click WhatsApp Direct (Standard Plain Text only)
      ptpTracker: false, // Promise to Pay Tracker: NO
      riskScoring: false, // Risk Scoring: NO
      dataImport: true,
      support: true,
      featuresList: [
        { label: "1 User Login (Business Owner)", enabled: true },
        { label: "Up to 100 Active Debtors / Customers", enabled: true },
        { label: "Today's Action Center (10 items / page)", enabled: true },
        { label: "Basic Aging Analysis (30-60-90+ Days)", enabled: true },
        { label: "1-Click Direct WhatsApp Reminders (Standard Text)", enabled: true },
        { label: "Data Import (CSV / Sheet)", enabled: true },
        { label: "Standard Business Support", enabled: true },
        { label: "13+ Persuasive WhatsApp Templates Library", enabled: false },
        { label: "Promise to Pay (PTP) Commitment Tracker", enabled: false },
        { label: "Bad Debt Risk Scoring & Early Alerts", enabled: false },
        { label: "Action Center Priority Sorting", enabled: false }
      ]
    },
    GROWTH: {
      id: "GROWTH",
      name: "Growth Plan (Sarthi Pro)",
      badge: "Sarthi Pro",
      isRecommended: true,
      description: "Advanced recovery intelligence & team delegation for growing businesses.",
      monthlyPrice: 599,
      yearlyPrice: 5999,
      maxUsers: 3,
      maxCustomers: 500,
      actionCenterLimit: 0, // Unlimited
      actionCenterPrioritySort: true,
      agingAnalysis: "FULL", // Full Detailed Breakdown
      whatsApp: "CUSTOM_TEMPLATES", // Custom Templates & Quick Logs
      ptpTracker: true, // Promise to Pay Tracker: YES
      riskScoring: true, // Risk Scoring: YES
      dataImport: true,
      support: true,
      featuresList: [
        { label: "3 Users (1 Owner + 2 Collection Executives)", enabled: true },
        { label: "Up to 500 Active Debtors / Customers", enabled: true },
        { label: "Today's Action Center with Priority Sorting", enabled: true },
        { label: "Full Detailed Aging Breakdown & Export", enabled: true },
        { label: "13+ High-Converting WhatsApp Templates Library", enabled: true },
        { label: "WhatsApp Custom Templates & Auto Quick-Logs", enabled: true },
        { label: "Promise to Pay (PTP) Tracker with Alert History", enabled: true },
        { label: "AI Bad Debt Risk Scoring & Red-Alerts", enabled: true },
        { label: "Data Import (CSV / Excel / Sheet)", enabled: true },
        { label: "Priority Fast SMB Support", enabled: true }
      ]
    }
  }
};
