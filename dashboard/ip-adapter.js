// ============================================================
// PURPOSEOLOGY IP INTELLIGENCE — DATA ADAPTER LAYER
// window.IPAdapter
//
// Single seam between the UI (ip.js) and every possible data
// source. Mirrors dashboard/finance-adapter.js and
// dashboard/billing-adapter.js exactly.
//
// Modes:
//   sample       → dashboard/ip-data.js (fictional assets/licenses,
//                  real compliance-scan result)
//   manual-local → IPLocal (this browser's localStorage)
//   secure-api   → IPApiClient (private authenticated backend;
//                  only available when a deployment injects
//                  window.IP_CONFIG.apiEndpoint)
//
// EVERY mode's data passes IPValidate before it may render.
// ============================================================
window.IPAdapter = (function () {
  "use strict";

  const MODE_KEY = "ps_ip_mode";
  const MODES = ["sample", "manual-local", "secure-api"];

  function secureAvailable() {
    return !!(window.IPApiClient && window.IPApiClient.hasEndpoint());
  }

  function deploymentMode() {
    const c = window.IP_CONFIG;
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
    return (typeof window.IP_DATA === "object" && window.IP_DATA) || null;
  }

  function validated(data, state) {
    if (!data) return { state: "ERROR", reason: "NO_DATA" };
    const v = window.IPValidate.validateData(data);
    if (!v.ok) {
      console.warn("[ip] " + state.toLowerCase() + " data rejected — " + v.errors.length + " validation issue(s)");
      return { state: "ERROR", reason: "VALIDATION_FAILED", issueCount: v.errors.length };
    }
    return { state, data };
  }

  async function load() {
    const mode = currentMode();

    if (mode === "manual-local") {
      return validated(window.IPLocal.assemble(), "LOCAL");
    }

    if (mode === "secure-api" && secureAvailable()) {
      const r = await window.IPApiClient.fetchData();
      if (r.state === "CONNECTED") return { state: "CONNECTED", data: r.data };
      if (r.state === "SIGNED_OUT") {
        const fb = validated(sampleData(), "SIGNED_OUT");
        return fb.state === "SIGNED_OUT" ? fb : { state: "SIGNED_OUT", data: null };
      }
      return { state: r.state, reason: r.reason };
    }

    return validated(sampleData(), "SAMPLE");
  }

  return { load, setMode, currentMode, secureAvailable, MODES };
})();
