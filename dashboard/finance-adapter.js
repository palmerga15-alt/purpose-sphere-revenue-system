// ============================================================
// FINANCIAL INTELLIGENCE — DATA ADAPTER LAYER (Phase 2)
// window.FinanceAdapter
//
// Single seam between the UI (finance.js) and every possible
// data source. The UI only ever calls FinanceAdapter.load() and
// paints whatever state comes back — switching adapters never
// requires UI changes.
//
// Modes:
//   sample       → dashboard/finance-data.js (fictional, default)
//   manual-local → FinanceLocal (this browser's localStorage)
//   secure-api   → FinanceApiClient (private authenticated
//                  backend; only available when a deployment
//                  injects window.FINANCE_CONFIG.apiEndpoint)
//
// Mode resolution: deployment config > user choice (localStorage,
// a non-sensitive mode string only) > "sample".
//
// EVERY mode's data passes FinanceValidate before it may render;
// invalid data yields an ERROR state with no renderable payload.
// ============================================================
window.FinanceAdapter = (function () {
  "use strict";

  const MODE_KEY = "ps_fin_mode"; // stores only the mode name — never data
  const MODES = ["sample", "manual-local", "secure-api"];

  function secureAvailable() {
    return !!(window.FinanceApiClient && window.FinanceApiClient.hasEndpoint());
  }

  function deploymentMode() {
    const c = window.FINANCE_CONFIG;
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
    return (typeof window.FINANCE_DATA === "object" && window.FINANCE_DATA) || null;
  }

  // Validate before render; on failure return ERROR with no payload.
  function validated(data, state) {
    if (!data) return { state: "ERROR", reason: "NO_DATA" };
    const v = window.FinanceValidate.validateData(data);
    if (!v.ok) {
      console.warn("[finance] " + state.toLowerCase() + " data rejected — " + v.errors.length + " validation issue(s)");
      return { state: "ERROR", reason: "VALIDATION_FAILED", issueCount: v.errors.length };
    }
    return { state, data };
  }

  async function load() {
    const mode = currentMode();

    if (mode === "manual-local") {
      return validated(window.FinanceLocal.assemble(), "LOCAL");
    }

    if (mode === "secure-api" && secureAvailable()) {
      const r = await window.FinanceApiClient.fetchData();
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
