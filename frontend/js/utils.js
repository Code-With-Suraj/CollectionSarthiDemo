/**
 * CollectionSarthi - Frontend Utilities & Indian SMB Helpers
 */

const Utils = {
  /**
   * Format number as Indian Rupee (e.g., ₹ 4,82,000)
   */
  formatCurrency: function(num, compact) {
    const val = Number(num) || 0;
    if (compact) {
      if (Math.abs(val) >= 10000000) {
        return "₹" + (val / 10000000).toFixed(2) + " Cr";
      }
      if (Math.abs(val) >= 100000) {
        return "₹" + (val / 100000).toFixed(2) + " L";
      }
      if (Math.abs(val) >= 1000) {
        return "₹" + (val / 1000).toFixed(1) + " K";
      }
    }
    return "₹ " + val.toLocaleString("en-IN");
  },

  /**
   * Format date into readable string (e.g. 05 Sep 2026)
   */
  formatDate: function(dateStr) {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const day = String(d.getDate()).padStart(2, "0");
      const month = months[d.getMonth()];
      const year = d.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (e) {
      return String(dateStr);
    }
  },

  /**
   * Calculate difference in days from today (positive = overdue)
   */
  getOverdueDays: function(dueDateStr) {
    if (!dueDateStr) return 0;
    const due = new Date(dueDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffTime = today - due;
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  },

  /**
   * Generate Risk Badge HTML
   */
  getRiskBadge: function(level, score) {
    const s = score !== undefined ? ` (${score}/100)` : "";
    switch (level) {
      case "CRITICAL":
        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold badge-risk-critical"><span class="w-1.5 h-1.5 mr-1.5 rounded-full bg-red-600"></span>CRITICAL${s}</span>`;
      case "HIGH RISK":
        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold badge-risk-high"><span class="w-1.5 h-1.5 mr-1.5 rounded-full bg-orange-500"></span>HIGH RISK${s}</span>`;
      case "MEDIUM RISK":
        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold badge-risk-medium"><span class="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-500"></span>MEDIUM RISK${s}</span>`;
      default:
        return `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold badge-risk-low"><span class="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-500"></span>LOW RISK${s}</span>`;
    }
  },

  /**
   * Generate Invoice Status Badge HTML
   */
  getStatusBadge: function(status) {
    switch (status) {
      case "PAID":
        return `<span class="px-2 py-0.5 text-xs font-medium rounded-md badge-status-paid">PAID</span>`;
      case "PARTIAL":
        return `<span class="px-2 py-0.5 text-xs font-medium rounded-md badge-status-partial">PARTIAL</span>`;
      case "OVERDUE":
        return `<span class="px-2 py-0.5 text-xs font-medium rounded-md badge-status-overdue">OVERDUE</span>`;
      default:
        return `<span class="px-2 py-0.5 text-xs font-medium rounded-md badge-status-pending">PENDING</span>`;
    }
  },

  /**
   * Generate unique RequestID for idempotency check
   */
  generateRequestId: function(prefix) {
    return (prefix || "REQ") + "-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);
  },

  /**
   * Generate WhatsApp Deep Link
   */
  getWhatsAppUrl: function(phone, message) {
    if (!phone) return "#";
    let clean = String(phone).replace(/\D/g, "");
    if (clean.length === 10) {
      clean = "91" + clean;
    }
    const encoded = encodeURIComponent(message || "Hello");
    return `https://wa.me/${clean}?text=${encoded}`;
  },

  /**
   * Generate Tel link for mobile calls
   */
  getTelUrl: function(phone) {
    if (!phone) return "#";
    return `tel:${String(phone).replace(/\D/g, "")}`;
  },

  /**
   * Debounce helper
   */
  debounce: function(func, wait) {
    let timeout;
    return function(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml: function(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  /**
   * Export Array of Objects to CSV File
   */
  exportToCsv: function(filename, rows) {
    if (!rows || !rows.length) return;
    const separator = ",";
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      "\n" +
      rows.map(row => {
        return keys.map(k => {
          let cell = row[k] === null || row[k] === undefined ? "" : row[k];
          cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
          if (cell.search(/("|,|\n)/g) >= 0) {
            cell = `"${cell}"`;
          }
          return cell;
        }).join(separator);
      }).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename + ".csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
