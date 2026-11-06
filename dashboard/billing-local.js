// ============================================================
// REVENUE BILLING & ACCOUNTS RECEIVABLE — MANUAL LOCAL ENTRY STORE
// window.BillingLocal
//
// Optional browser-local record store for testing and personal
// use. Records live ONLY in this browser's localStorage on this
// device — they are never committed to Git, never written into
// billing-data.js, and never sent anywhere.
//
// LIMITATION (also stated in the UI): localStorage is convenient
// but is NOT an encrypted billing backend. Anyone with access to
// this browser profile can read it. Real customer/invoice/payment
// records belong in the future authenticated backend.
//
// Enforces the same invariant a payment processor would: a
// payment can never push an invoice's recorded payments past its
// total amount (overpayment is rejected, not merely warned about).
// ============================================================
window.BillingLocal = (function () {
  "use strict";

  const KEY = "ps_billing_local_v1";
  const TYPES = ["customer", "invoice", "payment"];
  const EMPTY = () => ({ customers: [], invoices: [], payments: [] });
  const LIST = { customer: "customers", invoice: "invoices", payment: "payments" };

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
    const prefix = { customer: "CUST", invoice: "INV", payment: "PMT" }[type] || "LOC";
    return prefix + "-LOC-" + Date.now().toString(36) + Math.floor(Math.random() * 100);
  }

  // Sum of a payment's contribution toward an invoice, excluding a given
  // payment id (used when updating that same payment).
  function paidSoFar(store, invoiceId, excludePaymentId) {
    return store.payments
      .filter(p => p.invoiceId === invoiceId && p.id !== excludePaymentId)
      .reduce((t, p) => t + (typeof p.amount === "number" ? p.amount : 0), 0);
  }

  // Payment-specific invariants that need store context (which a
  // single-record BillingValidate.validateRecord call cannot see):
  // the invoice must exist locally, and the payment must not overpay it.
  function checkPaymentAgainstInvoice(store, rec, excludePaymentId) {
    const invoice = store.invoices.find(i => i.id === rec.invoiceId);
    if (!invoice) return { ok: false, errors: [{ path: "payment.invoiceId", code: "UNKNOWN_INVOICE" }] };
    if (typeof invoice.amount === "number" && typeof rec.amount === "number") {
      const already = paidSoFar(store, rec.invoiceId, excludePaymentId);
      if (already + rec.amount - invoice.amount > 0.001) {
        return { ok: false, errors: [{ path: "payment.amount", code: "OVERPAYMENT" }] };
      }
    }
    return { ok: true };
  }

  function add(type, record) {
    if (!TYPES.includes(type)) return { ok: false, errors: [{ path: type, code: "UNKNOWN_RECORD_TYPE" }] };
    const rec = { ...record };
    rec.id = rec.id || nextId(type);
    const v = window.BillingValidate.validateRecord(type, rec);
    if (!v.ok) return v;
    const store = read();
    if (type === "payment") {
      const pv = checkPaymentAgainstInvoice(store, rec, null);
      if (!pv.ok) return pv;
    }
    const arr = store[LIST[type]];
    if (rec.id && arr.some(r => r.id === rec.id)) return { ok: false, errors: [{ path: type + ".id", code: "DUPLICATE_ID" }] };
    arr.push(rec);
    if (!write(store)) return { ok: false, errors: [{ path: "storage", code: "WRITE_FAILED" }] };
    return { ok: true, record: rec };
  }

  function update(type, key, record) {
    const rec = { ...record };
    const v = window.BillingValidate.validateRecord(type, rec);
    if (!v.ok) return v;
    const store = read();
    const arr = store[LIST[type]];
    const idx = arr.findIndex((r, i) => (r.id !== undefined ? r.id === key : String(i) === String(key)));
    if (idx < 0) return { ok: false, errors: [{ path: type, code: "NOT_FOUND" }] };
    if (type === "payment") {
      const pv = checkPaymentAgainstInvoice(store, rec, arr[idx].id);
      if (!pv.ok) return pv;
    }
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
    const s = read();
    return {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      source: { mode: "manual-local", label: "LOCAL DEVICE DATA — STORED IN THIS BROWSER ONLY, NOT SYNCED ANYWHERE" },
      customers: s.customers,
      invoices: s.invoices,
      payments: s.payments
    };
  }

  return { KEY, TYPES, read, list, add, update, remove, eraseAll, count, assemble, paidSoFar };
})();
