// ============================================================
// PURPOSEOLOGY IP INTELLIGENCE — DATA ADAPTER LAYER (Phase 1)
// window.IPAdapter
//
// Single seam between the UI (ip.js) and every possible data
// source. The UI only ever calls IPAdapter.load() and paints
// whatever state comes back — switching adapters never requires
// UI changes.
//
// Modes:
//   sample       → dashboard/ip-data.js (fictional, DEFAULT)
//   manual-local → browser-local record store (window.IPLocal —
//                  ships in a later phase; until it exists the
//                  mode resolves back to sample)
//   secure-api   → private authenticated backend (only available
//                  when a deployment injects
//                  window.IP_CONFIG.apiEndpoint; the public
//                  build ships no endpoint and no credentials)
//
// Mode resolution: deployment config > user choice (localStorage,
// a non-sensitive mode string only) > "sample".
//
// Secure client rules (mirrors FinanceApiClient):
//   - endpoint must be HTTPS or a same-origin path
//   - the session token lives ONLY in this module's closure —
//     never localStorage, cookies, URLs, or query strings
//   - 401/403 drops the token immediately → EXPIRED
//   - payloads and tokens are never logged; errors are codes only
//
// EVERY mode's data passes IPValidate before it may render;
// invalid data yields an ERROR state with no renderable payload.
// ============================================================
window.IPAdapter = (function () {
  "use strict";

  const MODE_KEY = "ps_ip_mode"; // stores only the mode name — never data
  const MODES = ["sample", "manual-local", "secure-api"];

  // ---- secure client (in-module; idle until a deployment configures it) ----
  let token = null; // session memory only — never persisted

  function endpoint() {
    const c = window.IP_CONFIG;
    const url = c && typeof c.apiEndpoint === "string" ? c.apiEndpoint : null;
    if (!url) return null;
    // HTTPS or same-origin relative paths only; anything else is refused.
    if (url.startsWith("/")) return url;
    if (/^https:\/\//i.test(url)) return url;
    return null;
  }
  function setSessionToken(t) { token = (typeof t === "string" && t) ? t : null; }
  function clearSession() { token = null; }
  function secureAvailable() { return !!endpoint(); }
  function localAvailable() { return !!window.IPLocal; }

  async function fetchSecure() {
    const url = endpoint();
    if (!url) return { state: "SIGNED_OUT", reason: "NO_ENDPOINT" };
    if (!token) return { state: "SIGNED_OUT", reason: "NO_SESSION" };
    let res;
    try {
      // Token travels only in the Authorization header — never in the URL.
      res = await fetch(url, {
        method: "GET",
        headers: { "Authorization": "Bearer " + token, "Accept": "application/json" },
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer"
      });
    } catch {
      return { state: "ERROR", reason: "NETWORK" }; // no error object logged — may echo URLs/headers
    }
    if (res.status === 401 || res.status === 403) {
      clearSession(); // expired/invalid session: drop the token immediately
      return { state: "EXPIRED", reason: "HTTP_" + res.status };
    }
    if (!res.ok) return { state: "ERROR", reason: "HTTP_" + res.status };
    let json;
    try { json = await res.json(); }
    catch { return { state: "ERROR", reason: "NOT_JSON" }; }
    const v = window.IPValidate.validateData(json);
    if (!v.ok) {
      // Payload is rejected and discarded. Log a count only — never the payload.
      console.warn("[ip] secure response rejected — " + v.errors.length + " validation issue(s)");
      return { state: "ERROR", reason: "VALIDATION_FAILED", issueCount: v.errors.length };
    }
    return { state: "CONNECTED", data: json };
  }

  // ---- mode resolution ----
  function deploymentMode() {
    const c = window.IP_CONFIG;
    return (c && MODES.includes(c.mode)) ? c.mode : null;
  }

  function available(m) {
    if (m === "manual-local") return localAvailable();
    if (m === "secure-api") return secureAvailable();
    return true;
  }

  function currentMode() {
    const forced = deploymentMode();
    if (forced) return available(forced) ? forced : "sample";
    try {
      const m = localStorage.getItem(MODE_KEY);
      if (MODES.includes(m)) return available(m) ? m : "sample";
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

  // Validate before render; on failure return ERROR with no payload.
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

    if (mode === "manual-local" && localAvailable()) {
      return validated(window.IPLocal.assemble(), "LOCAL");
    }

    if (mode === "secure-api" && secureAvailable()) {
      const r = await fetchSecure();
      if (r.state === "CONNECTED") return r; // already validated
      if (r.state === "SIGNED_OUT") {
        // No live session: fall back to fictional sample data, clearly labeled.
        const fb = validated(sampleData(), "SIGNED_OUT");
        return fb.state === "SIGNED_OUT" ? fb : { state: "SIGNED_OUT", data: null };
      }
      return { state: r.state, reason: r.reason }; // EXPIRED / ERROR — no data renders
    }

    return validated(sampleData(), "SAMPLE");
  }

  return { load, setMode, currentMode, secureAvailable, localAvailable, setSessionToken, clearSession, MODES };
})();
