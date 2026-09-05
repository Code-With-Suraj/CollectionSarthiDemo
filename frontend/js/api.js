/**
 * CollectionSarthi - Centralized API Client
 * Manages request deduplication, session token injection, and error formatting
 */

const Api = {
  /**
   * Execute API Action
   */
  call: async function(action, data = {}) {
    const url = API_CONFIG.BASE_URL ? API_CONFIG.BASE_URL.trim() : "";

    // If no backend URL configured and demo mode allowed, run in-memory simulator
    if (!url && API_CONFIG.DEMO_MODE_IF_EMPTY) {
      return await this.simulateApi(action, data);
    }

    if (!url) {
      throw new Error("Backend URL not configured. Please enter your Google Apps Script Web App URL in config.js");
    }

    const payload = {
      action: action,
      token: Store.state.token || "",
      data: data
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT_MS);

    try {
      // Google Apps Script Web App accepts POST with redirect follow
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8" // GAS handles text/plain without CORS preflight issues
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const json = await response.json();

      if (!json.success) {
        if (json.error && json.error.code === "UNAUTHORIZED") {
          Store.clearSession();
          window.location.hash = "#/login";
          Toast.error("Your session has expired. Please sign in again.");
          throw new Error("Session expired");
        }
        throw new Error(json.error ? json.error.message : "API request failed");
      }

      return json.data;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === "AbortError") {
        throw new Error("Request timed out. Please check your internet connection.");
      }
      throw err;
    }
  },

  /**
   * High-fidelity in-browser simulation when BASE_URL is not set yet
   */
  simulateApi: async function(action, data) {
    // Artificial small delay for realistic UX feeling
    await new Promise(r => setTimeout(r, 200));

    // Initialize in-memory demo database in localStorage if needed
    if (!window.__CS_DEMO_DB) {
      window.__CS_DEMO_DB = this.initDemoDb();
    }
    const db = window.__CS_DEMO_DB;

    switch (action) {
      case "login":
        if (data.email === "admin@collectionsarthi.com" && data.password === "admin123") {
          const user = { userId: "USR-001", name: "Business Owner", email: data.email, role: "OWNER", phone: "9876543210" };
          return { success: true, token: "demo-token-12345", user: user };
        }
        if (data.email === "rahul@collectionsarthi.com" && data.password === "exec123") {
          const user = { userId: "USR-002", name: "Rahul Sharma (Collector)", email: data.email, role: "COLLECTION_EXECUTIVE", phone: "9811122233" };
          return { success: true, token: "demo-token-exec", user: user };
        }
        // Allow any quick test login in demo mode
        const testUser = { userId: "USR-001", name: "Demo Admin", email: data.email, role: "OWNER", phone: "9876543210" };
        return { success: true, token: "demo-token-12345", user: testUser };

      case "getCurrentUser":
        return { user: Store.state.user };

      case "logout":
        return {};

      case "getDashboard":
        return db.dashboard;

      case "getTodayActions":
        return db.actions;

      case "getCustomers":
        return { customers: db.customers };

      case "getCustomer":
        const cust = db.customers.find(c => c.CustomerID === data.customerId);
        if (!cust) throw new Error("Customer not found");
        const invs = db.invoices.filter(i => i.CustomerID === data.customerId);
        const pays = db.payments.filter(p => p.CustomerID === data.customerId);
        const fups = db.followups.filter(f => f.CustomerID === data.customerId);
        return { customer: cust, metrics: cust.metrics, invoices: invs, payments: pays, followups: fups };

      case "createCustomer":
        const newC = {
          CustomerID: "CUS-" + Date.now(),
          CustomerCode: data.CustomerCode || "CL-" + Math.floor(Math.random() * 900 + 100),
          CustomerName: data.CustomerName,
          BusinessName: data.BusinessName || data.CustomerName,
          ContactPerson: data.ContactPerson,
          Phone: data.Phone,
          WhatsApp: data.WhatsApp || data.Phone,
          Email: data.Email,
          City: data.City,
          GSTIN: data.GSTIN,
          CreditLimit: Number(data.CreditLimit) || 0,
          CreditDays: Number(data.CreditDays) || 30,
          Status: "ACTIVE",
          metrics: { score: 10, level: "LOW RISK", totalOutstanding: 0, maxOverdueDays: 0, brokenPromises: 0, lastContactDays: -1 }
        };
        db.customers.unshift(newC);
        return { customer: newC };

      case "recordPayment":
        const pAmt = Number(data.Amount) || 0;
        const newPay = {
          PaymentID: "PAY-" + Date.now(),
          CustomerID: data.CustomerID,
          InvoiceID: data.InvoiceID || "",
          PaymentDate: data.PaymentDate || new Date().toISOString().split("T")[0],
          Amount: pAmt,
          PaymentMode: data.PaymentMode || "UPI",
          ReferenceNo: data.ReferenceNo || "UPI-" + Math.floor(Math.random() * 899999 + 100000),
          Remarks: data.Remarks || ""
        };
        db.payments.unshift(newPay);

        // Update target customer outstanding
        const targetC = db.customers.find(c => c.CustomerID === data.CustomerID);
        if (targetC) {
          targetC.metrics.totalOutstanding = Math.max(0, targetC.metrics.totalOutstanding - pAmt);
          if (targetC.metrics.totalOutstanding === 0) {
            targetC.metrics.score = 5;
            targetC.metrics.level = "LOW RISK";
          }
        }
        db.dashboard.kpis.collectedThisMonth += pAmt;
        db.dashboard.kpis.totalOutstanding = Math.max(0, db.dashboard.kpis.totalOutstanding - pAmt);
        return { success: true, payment: newPay, message: "Payment of ₹" + pAmt.toLocaleString("en-IN") + " recorded" };

      case "createFollowUp":
        const newFup = {
          FollowUpID: "FUP-" + Date.now(),
          CustomerID: data.CustomerID,
          FollowUpDate: data.FollowUpDate || new Date().toISOString().split("T")[0],
          FollowUpType: data.FollowUpType || "CALL",
          Outcome: data.Outcome || "PROMISED",
          PromiseDate: data.PromiseDate || "",
          PromiseAmount: Number(data.PromiseAmount) || 0,
          Remarks: data.Remarks || "",
          CreatedBy: Store.state.user ? Store.state.user.name : "Admin"
        };
        db.followups.unshift(newFup);
        return { followup: newFup };

      case "getInvoices":
        return { invoices: db.invoices };

      case "getPayments":
        return { payments: db.payments };

      case "getFollowUps":
        return { followups: db.followups };

      case "getSettings":
        return { settings: db.settings };

      case "updateSettings":
        db.settings = { ...db.settings, ...(data.settings || {}) };
        return { settings: db.settings };

      case "getUsers":
        return { users: db.users };

      default:
        return {};
    }
  },

  /**
   * Demo database generator for instant client preview
   */
  initDemoDb: function() {
    const customers = [
      {
        CustomerID: "CUS-101",
        CustomerCode: "CL-101",
        CustomerName: "Sharma Traders",
        BusinessName: "Sharma Building Materials",
        ContactPerson: "Ramesh Sharma",
        Phone: "9820011223",
        WhatsApp: "9820011223",
        Email: "ramesh@sharmatraders.in",
        City: "Mumbai",
        GSTIN: "27AAACS1429B1ZB",
        CreditLimit: 500000,
        CreditDays: 30,
        Status: "ACTIVE",
        metrics: { score: 85, level: "CRITICAL", totalOutstanding: 482000, maxOverdueDays: 43, brokenPromises: 2, lastContactDays: 12 }
      },
      {
        CustomerID: "CUS-102",
        CustomerCode: "CL-102",
        CustomerName: "Gupta Hardware & Sanitary",
        BusinessName: "Gupta Hardware Store",
        ContactPerson: "Vikas Gupta",
        Phone: "9810022334",
        WhatsApp: "9810022334",
        Email: "vikas@guptahardware.com",
        City: "Delhi",
        GSTIN: "07AAACG2345C1ZA",
        CreditLimit: 350000,
        CreditDays: 45,
        Status: "ACTIVE",
        metrics: { score: 65, level: "HIGH RISK", totalOutstanding: 230000, maxOverdueDays: 28, brokenPromises: 1, lastContactDays: 8 }
      },
      {
        CustomerID: "CUS-103",
        CustomerCode: "CL-103",
        CustomerName: "Agarwal Electricals",
        BusinessName: "Agarwal Wholesale Electric",
        ContactPerson: "Sunil Agarwal",
        Phone: "9845033445",
        WhatsApp: "9845033445",
        Email: "sunil@agarwalelec.in",
        City: "Bengaluru",
        GSTIN: "29AAAAA4567D1ZC",
        CreditLimit: 400000,
        CreditDays: 30,
        Status: "ACTIVE",
        metrics: { score: 40, level: "MEDIUM RISK", totalOutstanding: 140000, maxOverdueDays: 14, brokenPromises: 0, lastContactDays: 4 }
      },
      {
        CustomerID: "CUS-104",
        CustomerCode: "CL-104",
        CustomerName: "Maa Enterprises",
        BusinessName: "Maa Industrial Tools",
        ContactPerson: "Pooja Verma",
        Phone: "9830044556",
        WhatsApp: "9830044556",
        Email: "pooja@maaindustries.in",
        City: "Kolkata",
        GSTIN: "19AAAPV5678E1ZD",
        CreditLimit: 250000,
        CreditDays: 21,
        Status: "ACTIVE",
        metrics: { score: 15, level: "LOW RISK", totalOutstanding: 45000, maxOverdueDays: 0, brokenPromises: 0, lastContactDays: 2 }
      },
      {
        CustomerID: "CUS-105",
        CustomerCode: "CL-105",
        CustomerName: "Krishna Distributors",
        BusinessName: "Krishna Pipes & Fittings",
        ContactPerson: "Gopal Krishna",
        Phone: "9840055667",
        WhatsApp: "9840055667",
        Email: "gopal@krishnapipes.com",
        City: "Chennai",
        GSTIN: "33AAAFK6789F1ZE",
        CreditLimit: 600000,
        CreditDays: 60,
        Status: "ACTIVE",
        metrics: { score: 72, level: "HIGH RISK", totalOutstanding: 310000, maxOverdueDays: 35, brokenPromises: 1, lastContactDays: 15 }
      }
    ];

    const invoices = [
      { InvoiceID: "INV-1001", InvoiceNo: "INV-2026-101", CustomerID: "CUS-101", InvoiceDate: "2026-07-15", DueDate: "2026-08-14", InvoiceAmount: 250000, PaidAmount: 0, OutstandingAmount: 250000, Status: "OVERDUE" },
      { InvoiceID: "INV-1002", InvoiceNo: "INV-2026-102", CustomerID: "CUS-101", InvoiceDate: "2026-08-01", DueDate: "2026-08-31", InvoiceAmount: 232000, PaidAmount: 0, OutstandingAmount: 232000, Status: "OVERDUE" },
      { InvoiceID: "INV-1003", InvoiceNo: "INV-2026-103", CustomerID: "CUS-102", InvoiceDate: "2026-08-05", DueDate: "2026-09-19", InvoiceAmount: 230000, PaidAmount: 0, OutstandingAmount: 230000, Status: "PENDING" },
      { InvoiceID: "INV-1004", InvoiceNo: "INV-2026-104", CustomerID: "CUS-103", InvoiceDate: "2026-08-10", DueDate: "2026-09-09", InvoiceAmount: 140000, PaidAmount: 0, OutstandingAmount: 140000, Status: "PENDING" },
      { InvoiceID: "INV-1005", InvoiceNo: "INV-2026-105", CustomerID: "CUS-104", InvoiceDate: "2026-08-25", DueDate: "2026-09-15", InvoiceAmount: 45000, PaidAmount: 0, OutstandingAmount: 45000, Status: "PENDING" }
    ];

    const payments = [
      { PaymentID: "PAY-501", CustomerID: "CUS-101", CustomerName: "Sharma Traders", Amount: 50000, PaymentMode: "NEFT", PaymentDate: "2026-09-02", ReferenceNo: "N12345678" },
      { PaymentID: "PAY-502", CustomerID: "CUS-104", CustomerName: "Maa Enterprises", Amount: 30000, PaymentMode: "UPI", PaymentDate: "2026-09-03", ReferenceNo: "UPI/324141" }
    ];

    const followups = [
      { FollowUpID: "FUP-301", CustomerID: "CUS-101", FollowUpDate: "2026-09-01", FollowUpType: "CALL", Outcome: "PROMISED", PromiseDate: "2026-09-05", PromiseAmount: 100000, Remarks: "Promised 1 Lakh by Friday" },
      { FollowUpID: "FUP-302", CustomerID: "CUS-102", FollowUpDate: "2026-08-28", FollowUpType: "WHATSAPP", Outcome: "REQUESTED_TIME", Remarks: "Asked for 1 week time" }
    ];

    const dashboard = {
      kpis: {
        totalOutstanding: 1207000,
        overdueAmount: 482000,
        dueTodayAmount: 85000,
        dueThisWeekAmount: 225000,
        collectedThisMonth: 80000,
        collectionEfficiency: 14,
        totalCustomers: 5,
        customersWithOutstanding: 5,
        overdueCustomers: 2,
        highRiskCustomers: 2
      },
      aging: {
        current: {
          label: "Current (Not Due)",
          amount: 415000,
          count: 2,
          customerList: [
            {
              customerId: "CUS-102",
              customerName: "Gupta Hardware & Sanitary",
              customerCode: "CL-102",
              phone: "9810022334",
              whatsApp: "9810022334",
              city: "Delhi",
              riskLevel: "HIGH RISK",
              riskScore: 65,
              amount: 230000,
              invoiceCount: 1,
              maxOverdueDays: 0,
              invoices: [
                { invoiceNo: "INV-2026-103", invoiceDate: "2026-08-05", dueDate: "2026-09-19", amount: 230000, outstanding: 230000, daysOverdue: 0 }
              ]
            },
            {
              customerId: "CUS-103",
              customerName: "Agarwal Electricals",
              customerCode: "CL-103",
              phone: "9845033445",
              whatsApp: "9845033445",
              city: "Bengaluru",
              riskLevel: "MEDIUM RISK",
              riskScore: 40,
              amount: 140000,
              invoiceCount: 1,
              maxOverdueDays: 0,
              invoices: [
                { invoiceNo: "INV-2026-104", invoiceDate: "2026-08-10", dueDate: "2026-09-09", amount: 140000, outstanding: 140000, daysOverdue: 0 }
              ]
            },
            {
              customerId: "CUS-104",
              customerName: "Maa Enterprises",
              customerCode: "CL-104",
              phone: "9830044556",
              whatsApp: "9830044556",
              city: "Kolkata",
              riskLevel: "LOW RISK",
              riskScore: 15,
              amount: 45000,
              invoiceCount: 1,
              maxOverdueDays: 0,
              invoices: [
                { invoiceNo: "INV-2026-105", invoiceDate: "2026-08-25", dueDate: "2026-09-15", amount: 45000, outstanding: 45000, daysOverdue: 0 }
              ]
            }
          ]
        },
        d1_30: {
          label: "1–30 Days Overdue",
          amount: 310000,
          count: 1,
          customerList: [
            {
              customerId: "CUS-105",
              customerName: "Krishna Distributors",
              customerCode: "CL-105",
              phone: "9840055667",
              whatsApp: "9840055667",
              city: "Chennai",
              riskLevel: "HIGH RISK",
              riskScore: 72,
              amount: 310000,
              invoiceCount: 1,
              maxOverdueDays: 22,
              invoices: [
                { invoiceNo: "INV-2026-108", invoiceDate: "2026-07-20", dueDate: "2026-08-14", amount: 310000, outstanding: 310000, daysOverdue: 22 }
              ]
            }
          ]
        },
        d31_60: {
          label: "31–60 Days Overdue",
          amount: 482000,
          count: 2,
          customerList: [
            {
              customerId: "CUS-101",
              customerName: "Sharma Traders",
              customerCode: "CL-101",
              phone: "9820011223",
              whatsApp: "9820011223",
              city: "Mumbai",
              riskLevel: "CRITICAL",
              riskScore: 85,
              amount: 482000,
              invoiceCount: 2,
              maxOverdueDays: 43,
              invoices: [
                { invoiceNo: "INV-2026-101", invoiceDate: "2026-07-15", dueDate: "2026-08-14", amount: 250000, outstanding: 250000, daysOverdue: 43 },
                { invoiceNo: "INV-2026-102", invoiceDate: "2026-08-01", dueDate: "2026-08-31", amount: 232000, outstanding: 232000, daysOverdue: 26 }
              ]
            }
          ]
        },
        d61_90: {
          label: "61–90 Days Overdue",
          amount: 0,
          count: 0,
          customerList: []
        },
        d90_plus: {
          label: "90+ Days Critical",
          amount: 0,
          count: 0,
          customerList: []
        }
      },
      priorityCustomers: customers.slice(0, 3),
      pipeline: {
        outstanding: 1207000,
        contacted: 712000,
        promised: 100000,
        collected: 80000
      },
      recentPayments: payments,
      alerts: [
        { type: "danger", message: "₹4,82,000 is overdue across 2 customer accounts." },
        { type: "warning", message: "Sharma Traders has broken 2 consecutive promises." },
        { type: "info", message: "₹1,00,000 promise is due today from Sharma Traders." }
      ]
    };

    const actions = {
      dueToday: [{ customer: customers[0], reason: "Invoice INV-2026-101 Due", amount: 85000 }],
      overdue: [{ customer: customers[0], reason: "Overdue by 43 days", amount: 482000 }],
      promiseDueToday: [{ customer: customers[0], reason: "Promised ₹1,00,000 today", amount: 100000 }],
      brokenPromises: [{ customer: customers[1], reason: "Promise broken from 25 Aug", amount: 50000 }],
      noContactWeek: [{ customer: customers[4], reason: "No contact in 15 days", amount: 310000 }],
      highRisk: [{ customer: customers[0], reason: "Critical Risk: 85/100", amount: 482000 }]
    };

    return {
      customers,
      invoices,
      payments,
      followups,
      dashboard,
      actions,
      settings: {
        BUSINESS_NAME: "Apex Industrial Supplies",
        CURRENCY: "INR",
        DEFAULT_CREDIT_DAYS: "30"
      },
      users: [
        { UserID: "USR-001", Name: "Business Owner", Email: "admin@collectionsarthi.com", Role: "OWNER", Status: "ACTIVE" },
        { UserID: "USR-002", Name: "Rahul Sharma (Collector)", Email: "rahul@collectionsarthi.com", Role: "COLLECTION_EXECUTIVE", Status: "ACTIVE" }
      ]
    };
  }
};
