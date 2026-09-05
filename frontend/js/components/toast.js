/**
 * CollectionSarthi - Toast Notification Component
 */

const Toast = {
  container: null,

  init: function() {
    this.container = document.getElementById("toast-container");
  },

  show: function(message, type = "info", duration = 4000) {
    if (!this.container) this.init();
    if (!this.container) return;

    const toast = document.createElement("div");
    toast.className = `flex items-center w-full max-w-sm p-4 mb-3 rounded-lg shadow-lg text-sm transition-all duration-300 transform translate-y-2 opacity-0 ${this.getTypeStyles(type)}`;

    let icon = "";
    switch (type) {
      case "success":
        icon = `<svg class="w-5 h-5 text-emerald-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`;
        break;
      case "error":
        icon = `<svg class="w-5 h-5 text-red-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`;
        break;
      case "warning":
        icon = `<svg class="w-5 h-5 text-amber-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`;
        break;
      default:
        icon = `<svg class="w-5 h-5 text-indigo-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`;
    }

    toast.innerHTML = `
      ${icon}
      <div class="flex-1 font-medium">${Utils.escapeHtml(message)}</div>
      <button class="ml-2 text-slate-400 hover:text-slate-600 focus:outline-none" onclick="this.parentElement.remove()">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
    `;

    this.container.appendChild(toast);

    // Trigger enter animation
    setTimeout(() => {
      toast.classList.remove("translate-y-2", "opacity-0");
      toast.classList.add("translate-y-0", "opacity-100");
    }, 10);

    // Auto dismiss
    setTimeout(() => {
      toast.classList.add("opacity-0", "translate-y-2");
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  getTypeStyles: function(type) {
    switch (type) {
      case "success": return "bg-white text-slate-800 border-l-4 border-emerald-500";
      case "error": return "bg-white text-slate-800 border-l-4 border-red-500";
      case "warning": return "bg-white text-slate-800 border-l-4 border-amber-500";
      default: return "bg-white text-slate-800 border-l-4 border-indigo-500";
    }
  },

  success: function(msg) { this.show(msg, "success"); },
  error: function(msg) { this.show(msg, "error", 5000); },
  warning: function(msg) { this.show(msg, "warning"); },
  info: function(msg) { this.show(msg, "info"); }
};
