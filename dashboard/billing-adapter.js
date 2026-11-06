// ============================================================
// REVENUE BILLING & ACCOUNTS RECEIVABLE — DATA ADAPTER LAYER
// window.BillingAdapter
//
// Single seam between the UI (billing.js) and every possible
// data source. The UI only ever calls BillingAdapter.load() and
// paints whatever state comes back — switching adapters never
// requires UI changes.
//
// Modes:
//   sample       → dashboard/billing-data.js (fictional, default)
//   manual-local → BillingLocal (this browser's localStorage)
//   secure-api   → BillingApiClient (private authenticated
//                  backend; only available when a deployment
//                  injects window.BILLING_CONFIG.apiEndpoint)
//
// Mode resolution: deployment config > user choice (localStorage,
// a non-sensitive mode string only) > "sample".
//
// EVERY mode's data passes BillingValidate before it may render;
// invalid data yields an ERROR state with no renderable payload.
// ============================================================
window.BillingAdapter = (function () {
  "use strict";

  const MODE_KEY = "ps_billing_mode"; // stores only the mode name — never data
  const MODES = ["sample", "manual-local", "secure-api"];

  function secureAvailable() {
    return !!(window.BillingApiClient && window.BillingApiClient.hasEndpoint());
  }

  function deploymentMode() {
    const c = window.BILLING_CONFIG;
    return (c && MODES.includes(c.mode)) ? c.mode : null;
  }

  function currentMode() {
    const forced = deploymentMode();
    if (forced) return (forced === "secure-api" && !secureAvailable()) ? "sample" : forced;
    try {
      const m = localStorage.getItem(MODE_KEY);
      if (MODES.includes(m)) {
        if (m === "secure-api" && !secureAvailable()) return "sample";
        return m;
      }
    } catch { }
    return "sample";
  }

  function setMode(m) {
    if (!MODES.includes(m)) return false;
    try { localStorage.setItem(MODE_KEY, m); } catch { }
    return true;
  }

  function sampleData() {
    return (typeof window.BILLING_DATA === "object" && window.BILLING_DATA) || null;
  }

  // Validate before render; on failure return ERROR with no payload.
  function validated(data, state) {
    if (!data) return { state: "ERROR", reason: "NO_DATA" };
    const v = window.BillingValidate.validateData(data);
    if (!v.ok) {
      console.warn("[billing] " + state.toLowerCase() + " data rejected — " + v.errors.length + " validation issue(s)");
      return { state: "ERROR", reason: "VALIDATION_FAILED", issueCount: v.errors.length };
    }
    return { state, data };
  }

  async function load() {
    const mode = currentMode();

    if (mode === "manual-local") {
      return validated(window.BillingLocal.assemble(), "LOCAL");
    }

    if (mode === "secure-api" && secureAvailable()) {
      const r = await window.BillingApiClient.fetchData();
      if (r.state === "CONNECTED") return { state: "CONNECTED", data: r.data }; // client already validated
      if (r.state === "SIGNED_OUT") {
        // No live session: fall back to fictional sample data, clearly labeled.
        const fb = validated(sampleData(), "SIGNED_OUT");
        return fb.state === "SIGNED_OUT" ? fb : { state: "SIGNED_OUT", data: null };
      }
      return { state: r.state, reason: r.reason }; // EXPIRED / ERROR — no data renders
    }

    return validated(sampleData(), "SAMPLE");
  }

  return { load, setMode, currentMode, secureAvailable, MODES };
})();
