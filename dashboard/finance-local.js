// ============================================================
// FINANCIAL INTELLIGENCE — MANUAL LOCAL ENTRY STORE (Phase 2)
// window.FinanceLocal
//
// Optional browser-local record store for testing and personal
// use. Records live ONLY in this browser's localStorage on this
// device — they are never committed to Git, never written into
// finance-data.js, and never sent anywhere.
//
// LIMITATION (also stated in the UI): localStorage is convenient
// but is NOT an encrypted financial backend. Anyone with access
// to this browser profile can read it. Real records belong in
// the future authenticated backend (Phase 3).
// ============================================================
window.FinanceLocal = (function () {
  "use strict";

  const KEY = "ps_finance_local_v1";
  const TYPES = ["payment", "subscription", "revenue", "calendar"];
  const EMPTY = () => ({ payments: [], subscriptions: [], revenue: [], calendar: [] });
  const LIST = { payment: "payments", subscription: "subscriptions", revenue: "revenue", calendar: "calendar" };

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
    return "LOC-" + type.toUpperCase().slice(0, 3) + "-" + Date.now().toString(36) + Math.floor(Math.random() * 100);
  }

  function add(type, record) {
    if (!TYPES.includes(type)) return { ok: false, errors: [{ path: type, code: "UNKNOWN_RECORD_TYPE" }] };
    const rec = { ...record };
    if (type === "payment" || type === "subscription") rec.id = rec.id || nextId(type);
    const v = window.FinanceValidate.validateRecord(type, rec);
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
    const v = window.FinanceValidate.validateRecord(type, rec);
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
  function assemble() {
    const C = window.FinanceValidate.CONTRACT;
    const s = read();
    return {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      source: { mode: "manual-local", label: "LOCAL DEVICE DATA — STORED IN THIS BROWSER ONLY, NOT SYNCED ANYWHERE" },
      snapshot: { cashAvailable: null, cashNote: "AWAITING SECURE BANK LINK (PHASE 3)" },
      categories: [...C.categories],
      frequencies: [...C.frequencies],
      statuses: [...C.statuses],
      payments: s.payments,
      expenseGroups: [...C.expenseGroups],
      categoryGroups: { ...C.categoryGroups },
      subscriptions: s.subscriptions,
      revenue: {
        period: "THIS MONTH",
        streams: s.revenue.map(r => ({ name: r.name, monthTotal: r.monthTotal, source: "LOCAL" }))
      },
      calendarEvents: s.calendar,
      insights: {
        engineStatus: "RESERVED",
        planned: (window.FINANCE_DATA && window.FINANCE_DATA.insights && window.FINANCE_DATA.insights.planned) || [],
        items: []
      }
    };
  }

  return { KEY, TYPES, read, list, add, update, remove, eraseAll, count, assemble };
})();
