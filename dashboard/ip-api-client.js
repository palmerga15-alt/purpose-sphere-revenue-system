// ============================================================
// PURPOSEOLOGY IP INTELLIGENCE — SECURE API CLIENT
// window.IPApiClient
//
// Foundation for fetching real IP intelligence data from a
// private, authenticated backend. This repository ships NO
// backend, NO endpoint, and NO credentials. Mirrors
// dashboard/finance-api-client.js and dashboard/billing-api-client.js
// exactly: endpoint comes only from window.IP_CONFIG (injected by
// a private deployment, never committed); the session token lives
// only in this module's closure, never persisted; every response
// is validated before it may render.
//
// States returned by fetchData():
//   SIGNED_OUT | LOADING (caller-side) | CONNECTED | EXPIRED | ERROR
// ============================================================
window.IPApiClient = (function () {
  "use strict";

  let token = null; // secure session memory only — never persisted

  function endpoint() {
    const c = window.IP_CONFIG;
    const url = c && typeof c.apiEndpoint === "string" ? c.apiEndpoint : null;
    if (!url) return null;
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
      res = await fetch(url, {
        method: "GET",
        headers: { "Authorization": "Bearer " + token, "Accept": "application/json" },
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer"
      });
    } catch {
      return { state: "ERROR", reason: "NETWORK" };
    }
    if (res.status === 401 || res.status === 403) {
      clearSession();
      return { state: "EXPIRED", reason: "HTTP_" + res.status };
    }
    if (!res.ok) return { state: "ERROR", reason: "HTTP_" + res.status };

    let json;
    try { json = await res.json(); }
    catch { return { state: "ERROR", reason: "NOT_JSON" }; }

    const v = window.IPValidate.validateData(json);
    if (!v.ok) {
      console.warn("[ip] secure response rejected — " + v.errors.length + " validation issue(s)");
      return { state: "ERROR", reason: "VALIDATION_FAILED", issueCount: v.errors.length };
    }
    return { state: "CONNECTED", data: json };
  }

  return { fetchData, setSessionToken, clearSession, hasSession, hasEndpoint };
})();
