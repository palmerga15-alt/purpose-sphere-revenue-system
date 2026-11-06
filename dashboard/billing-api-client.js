// ============================================================
// REVENUE BILLING & ACCOUNTS RECEIVABLE — SECURE API CLIENT
// window.BillingApiClient
//
// Foundation for fetching real billing data from a private,
// authenticated backend. This repository ships NO backend, NO
// endpoint, and NO credentials, and integrates NO payment
// processor (no Stripe, PayPal, Square, or banking APIs):
//
//   - The endpoint comes only from window.BILLING_CONFIG, which
//     a private deployment injects at deploy time (the public
//     GitHub Pages build has none, so this client stays idle
//     and the dashboard uses sample data).
//   - The session token lives only in this module's closure —
//     in-memory for the tab session. It is never written to
//     localStorage, cookies, URLs, or query parameters.
//   - Billing payloads and tokens are NEVER logged. Errors
//     surface as short state codes only.
//   - Every response is validated against the schemaVersion-1
//     contract (BillingValidate) before it may render; anything
//     malformed is rejected and nothing sensitive is shown.
//
// States returned by fetchData():
//   SIGNED_OUT | LOADING (caller-side) | CONNECTED | EXPIRED | ERROR
// ============================================================
window.BillingApiClient = (function () {
  "use strict";

  let token = null; // secure session memory only — never persisted

  function endpoint() {
    const c = window.BILLING_CONFIG;
    const url = c && typeof c.apiEndpoint === "string" ? c.apiEndpoint : null;
    if (!url) return null;
    // HTTPS or same-origin relative paths only; anything else is refused.
    if (url.startsWith("/")) return url;
    if (/^https:\/\//i.test(url)) return url;
    return null;
  }

  function setSessionToken(t) { token = (typeof t === "string" && t) ? t : null; }
  function clearSession() { token = null; }
  function hasSession() { return !!token; }
  function hasEndpoint() { return !!endpoint(); }

  async function fetchData() {
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

    const v = window.BillingValidate.validateData(json);
    if (!v.ok) {
      // Payload is rejected and discarded. Log a count only — never the payload.
      console.warn("[billing] secure response rejected — " + v.errors.length + " validation issue(s)");
      return { state: "ERROR", reason: "VALIDATION_FAILED", issueCount: v.errors.length };
    }
    return { state: "CONNECTED", data: json };
  }

  return { fetchData, setSessionToken, clearSession, hasSession, hasEndpoint };
})();
