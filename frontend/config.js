/**
 * CollectionSarthi - Client Configuration
 * To connect to your deployment, update BASE_URL with your Apps Script Web App URL.
 */
const API_CONFIG = {
  // Replace with your Google Apps Script Web App deployment URL:
  // e.g., "https://script.google.com/macros/s/AKfycbx.../exec"
  BASE_URL: "https://script.google.com/macros/s/AKfycbxb5M_J2xil83-qeK08FKkllcUeTKhug6eMeLq_ALZ_qzYuWyri_z6w8pWqGg_di2k/exec", 
  
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
  supportPhone: "+91 98765 43210",
  primaryColor: "#4f46e5"
};
