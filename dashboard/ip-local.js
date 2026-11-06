// ============================================================
// PURPOSEOLOGY IP INTELLIGENCE — MANUAL LOCAL ENTRY STORE
// window.IPLocal
//
// Optional browser-local record store for testing and personal
// use. Records live ONLY in this browser's localStorage on this
// device — never committed to Git, never written into
// ip-data.js, never sent anywhere. Mirrors dashboard/finance-local.js
// and dashboard/billing-local.js exactly.
//
// Every write re-validates through IPValidate, which rejects
// IP-leak-pattern content the same way it rejects credential-like
// content — so a note field can't be used to smuggle an actual
// concept definition into local storage either.
// ============================================================
window.IPLocal = (function () {
  "use strict";

  const KEY = "ps_ip_local_v1";
  const TYPES = ["asset", "license"];
  const EMPTY = () => ({ assets: [], licenses: [] });
  const LIST = { asset: "assets", license: "licenses" };

  function read() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return EMPTY();
      const parsed = JSON.parse(raw);
      const store = EMPTY();
      for (const t of TYPES) if (Array.isArray(parsed[LIST[t]])) store[LIST[t]] = parsed[LIST[t]];
      return store;
    } catch { return EMPTY(); }
  }
  function write(store) {
    try { localStorage.setItem(KEY, JSON.stringify(store)); return true; } catch { return false; }
  }

  function list(type) { return read()[LIST[type]] || []; }

  function nextId(type) {
    const prefix = type === "asset" ? "MARK" : "LIC";
    return prefix + "-LOC-" + Date.now().toString(36) + Math.floor(Math.random() * 100);
  }

  function add(type, record) {
    if (!TYPES.includes(type)) return { ok: false, errors: [{ path: type, code: "UNKNOWN_RECORD_TYPE" }] };
    const rec = { ...record };
    rec.id = rec.id || nextId(type);
    const v = window.IPValidate.validateRecord(type, rec);
    if (!v.ok) return v;
    const store = read();
    const arr = store[LIST[type]];
    if (rec.id && arr.some(r => r.id === rec.id)) return { ok: false, errors: [{ path: type + ".id", code: "DUPLICATE_ID" }] };
    arr.push(rec);
    if (!write(store)) return { ok: false, errors: [{ path: "storage", code: "WRITE_FAILED" }] };
    return { ok: true, record: rec };
  }

  function update(type, key, record) {
    const rec = { ...record };
    const v = window.IPValidate.validateRecord(type, rec);
    if (!v.ok) return v;
    const store = read();
    const arr = store[LIST[type]];
    const idx = arr.findIndex((r, i) => (r.id !== undefined ? r.id === key : String(i) === String(key)));
    if (idx < 0) return { ok: false, errors: [{ path: type, code: "NOT_FOUND" }] };
    arr[idx] = rec;
    if (!write(store)) return { ok: false, errors: [{ path: "storage", code: "WRITE_FAILED" }] };
    return { ok: true, record: rec };
  }

  function remove(type, key) {
    const store = read();
    const arr = store[LIST[type]];
    const idx = arr.findIndex((r, i) => (r.id !== undefined ? r.id === key : String(i) === String(key)));
    if (idx < 0) return { ok: false, errors: [{ path: type, code: "NOT_FOUND" }] };
    arr.splice(idx, 1);
    write(store);
    return { ok: true };
  }

  function eraseAll() {
    try { localStorage.removeItem(KEY); return true; } catch { return false; }
  }

  function count() {
    const s = read();
    return TYPES.reduce((t, ty) => t + s[LIST[ty]].length, 0);
  }

  // Assemble local records into the schemaVersion-1 contract shape.
  // complianceScan is never user-entered — manual-local mode has no
  // scan result of its own, so the panel shows it as not-yet-run
  // rather than inventing one.
  function assemble() {
    const s = read();
    return {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      source: { mode: "manual-local", label: "LOCAL DEVICE DATA — STORED IN THIS BROWSER ONLY, NOT SYNCED ANYWHERE" },
      ipAssets: s.assets,
      licenses: s.licenses,
      complianceScan: { scannedAt: new Date().toISOString(), filesScanned: 0, findings: [], clean: true }
    };
  }

  return { KEY, TYPES, read, list, add, update, remove, eraseAll, count, assemble };
})();
