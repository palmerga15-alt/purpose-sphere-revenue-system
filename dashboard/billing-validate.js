// ============================================================
// REVENUE BILLING & ACCOUNTS RECEIVABLE — VALIDATION MODULE
// window.BillingValidate
//
// Reusable validation for the schemaVersion-1 billing data
// contract. EVERY data source (sample file, manual local
// records, secure API responses) passes through validateData()
// before anything renders. Data that fails does not render.
//
// Mirrors dashboard/finance-validate.js's contract-validation
// pattern: property whitelists, required fields, bounded
// amounts/dates, enum checks, duplicate-ID detection, and
// credential-like-string rejection on every string field.
//
// Errors carry field PATHS and codes only — never field VALUES —
// so validation output is always safe to display or log.
// ============================================================
window.BillingValidate = (function () {
  "use strict";

  // ---- canonical contract (schemaVersion 1) ----
  const CONTRACT = {
    schemaVersion: 1,
    sourceModes: ["sample", "manual-local", "live"],
    // Manual workflow states a person sets directly. Everything else
    // (paid / partial / overdue / current) is computed from due date
    // and linked payments — see billing.js effectiveStatus().
    storedInvoiceStatuses: [null, "AUTO", "draft", "sent", "viewed", "void"],
    reminderStatuses: ["NONE", "SCHEDULED", "SENT", "ESCALATED", "NOT_NEEDED"],
    recurringFrequencies: [null, "MONTHLY", "QUARTERLY", "ANNUAL"],
    paymentTerms: ["Due on Receipt", "Net 15", "Net 30", "Net 45", "Net 60", "Custom"],
    paymentMethods: ["Check", "Wire Transfer", "ACH", "Cash", "Card (manual entry)", "Other"],
    // property whitelists — anything unexpected is rejected
    topKeys: ["schemaVersion", "generatedAt", "source", "customers", "invoices", "payments"],
    customerKeys: ["id", "name", "billingContact", "billingEmail", "billingAddress",
      "paymentTerms", "taxExempt", "notes"],
    customerRequired: ["id", "name"],
    invoiceKeys: ["id", "customerId", "customerName", "issueDate", "dueDate", "amount",
      "status", "reminderStatus", "followUpDate", "recurring", "notes"],
    invoiceRequired: ["id", "customerName", "issueDate", "dueDate", "amount"],
    paymentKeys: ["id", "invoiceId", "paymentDate", "amount", "method", "referenceNumber", "notes"],
    paymentRequired: ["id", "invoiceId", "paymentDate", "amount"],
    maxAmount: 10000000
  };

  // ---- primitive checks ----
  const isStr = v => typeof v === "string";
  const isNum = v => typeof v === "number" && isFinite(v);

  function isValidDate(s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s))) return false;
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }

  function isValidAmount(v) {
    return isNum(v) && v >= 0 && v <= CONTRACT.maxAmount;
  }

  // Credential-like content: long digit runs (card/account/routing
  // numbers), key/token/secret markers, base64-ish blobs, IBANs,
  // Stripe/PayPal-style live/test secret key shapes.
  const CRED_PATTERNS = [
    /\d{9,}/,
    /(api[_-]?key|access[_-]?token|client[_-]?secret|password|bearer\s|authorization:)/i,
    /\b[A-Za-z0-9+/]{40,}={0,2}\b/,
    /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/,
    /\b(sk|pk|rk)[-_](live|test|prod)[-_][A-Za-z0-9]{8,}/i
  ];
  function looksCredentialLike(s) {
    return CRED_PATTERNS.some(re => re.test(s));
  }

  // ---- shared helpers ----
  function checkKeys(obj, allowed, path, errs) {
    for (const k of Object.keys(obj || {})) {
      if (!allowed.includes(k)) errs.push({ path: `${path}.${k}`, code: "UNEXPECTED_PROPERTY" });
    }
  }
  function checkRequired(obj, required, path, errs) {
    for (const k of required) {
      const v = obj?.[k];
      if (v === undefined || v === null || v === "") errs.push({ path: `${path}.${k}`, code: "REQUIRED" });
    }
  }
  function checkStrings(obj, path, errs) {
    for (const [k, v] of Object.entries(obj || {})) {
      if (isStr(v) && looksCredentialLike(v)) errs.push({ path: `${path}.${k}`, code: "CREDENTIAL_LIKE" });
      if (isStr(k) && looksCredentialLike(k)) errs.push({ path: `${path}.${k}`, code: "CREDENTIAL_LIKE_KEY" });
    }
  }
  function optDate(v, path, errs) {
    if (v !== undefined && v !== null && v !== "" && !isValidDate(v)) errs.push({ path, code: "INVALID_DATE" });
  }

  // ---- record validators (also used by manual-local CRUD) ----
  function validateCustomer(c, path, errs) {
    checkKeys(c, CONTRACT.customerKeys, path, errs);
    checkRequired(c, CONTRACT.customerRequired, path, errs);
    checkStrings(c, path, errs);
    if (c.paymentTerms !== undefined && c.paymentTerms !== null && c.paymentTerms !== "" &&
      !CONTRACT.paymentTerms.includes(c.paymentTerms)) errs.push({ path: `${path}.paymentTerms`, code: "INVALID_TERMS" });
    if (c.taxExempt !== undefined && typeof c.taxExempt !== "boolean") errs.push({ path: `${path}.taxExempt`, code: "INVALID_BOOLEAN" });
  }

  function validateInvoice(inv, path, errs) {
    checkKeys(inv, CONTRACT.invoiceKeys, path, errs);
    checkRequired(inv, CONTRACT.invoiceRequired, path, errs);
    checkStrings(inv, path, errs);
    if (inv.amount !== undefined && !isValidAmount(inv.amount)) errs.push({ path: `${path}.amount`, code: "INVALID_AMOUNT" });
    if (inv.issueDate !== undefined && !isValidDate(inv.issueDate)) errs.push({ path: `${path}.issueDate`, code: "INVALID_DATE" });
    if (inv.dueDate !== undefined && !isValidDate(inv.dueDate)) errs.push({ path: `${path}.dueDate`, code: "INVALID_DATE" });
    optDate(inv.followUpDate, `${path}.followUpDate`, errs);
    const st = inv.status === undefined ? null : inv.status;
    if (!CONTRACT.storedInvoiceStatuses.includes(st)) errs.push({ path: `${path}.status`, code: "INVALID_STATUS" });
    if (inv.reminderStatus !== undefined && !CONTRACT.reminderStatuses.includes(inv.reminderStatus)) errs.push({ path: `${path}.reminderStatus`, code: "INVALID_REMINDER_STATUS" });
    const rec = inv.recurring === undefined ? null : inv.recurring;
    if (!CONTRACT.recurringFrequencies.includes(rec)) errs.push({ path: `${path}.recurring`, code: "INVALID_FREQUENCY" });
  }

  function validatePayment(p, path, errs) {
    checkKeys(p, CONTRACT.paymentKeys, path, errs);
    checkRequired(p, CONTRACT.paymentRequired, path, errs);
    checkStrings(p, path, errs);
    if (p.amount !== undefined && !isValidAmount(p.amount)) errs.push({ path: `${path}.amount`, code: "INVALID_AMOUNT" });
    if (p.paymentDate !== undefined && !isValidDate(p.paymentDate)) errs.push({ path: `${path}.paymentDate`, code: "INVALID_DATE" });
    if (p.method !== undefined && p.method !== null && p.method !== "" &&
      !CONTRACT.paymentMethods.includes(p.method)) errs.push({ path: `${path}.method`, code: "INVALID_METHOD" });
  }

  const RECORD_VALIDATORS = {
    customer: validateCustomer,
    invoice: validateInvoice,
    payment: validatePayment
  };

  // Validate a single record (manual-local CRUD path).
  function validateRecord(type, record) {
    const errs = [];
    const fn = RECORD_VALIDATORS[type];
    if (!fn) return { ok: false, errors: [{ path: type, code: "UNKNOWN_RECORD_TYPE" }] };
    fn(record, type, errs);
    return { ok: errs.length === 0, errors: errs };
  }

  // Validate a full window.BILLING_DATA-shaped object.
  function validateData(data) {
    const errs = [];
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { ok: false, errors: [{ path: "root", code: "NOT_AN_OBJECT" }] };
    }
    if (data.schemaVersion !== CONTRACT.schemaVersion) errs.push({ path: "schemaVersion", code: "UNSUPPORTED_SCHEMA" });
    checkKeys(data, CONTRACT.topKeys, "root", errs);

    if (!data.source || !CONTRACT.sourceModes.includes(data.source.mode)) errs.push({ path: "source.mode", code: "INVALID_SOURCE_MODE" });
    if (data.source) { checkKeys(data.source, ["mode", "label"], "source", errs); checkStrings(data.source, "source", errs); }
    if (data.generatedAt !== undefined && isNaN(Date.parse(data.generatedAt))) errs.push({ path: "generatedAt", code: "INVALID_DATE" });

    const seenCustIds = new Set();
    (Array.isArray(data.customers) ? data.customers : []).forEach((c, i) => {
      validateCustomer(c, `customers[${i}]`, errs);
      if (c?.id !== undefined) {
        if (seenCustIds.has(c.id)) errs.push({ path: `customers[${i}].id`, code: "DUPLICATE_ID" });
        seenCustIds.add(c.id);
      }
    });
    if (data.customers !== undefined && !Array.isArray(data.customers)) errs.push({ path: "customers", code: "INVALID_LIST" });

    const seenInvIds = new Set();
    (Array.isArray(data.invoices) ? data.invoices : []).forEach((inv, i) => {
      validateInvoice(inv, `invoices[${i}]`, errs);
      if (inv?.id !== undefined) {
        if (seenInvIds.has(inv.id)) errs.push({ path: `invoices[${i}].id`, code: "DUPLICATE_ID" });
        seenInvIds.add(inv.id);
      }
      if (inv?.customerId !== undefined && inv.customerId !== null && inv.customerId !== "" && !seenCustIds.has(inv.customerId)) {
        errs.push({ path: `invoices[${i}].customerId`, code: "UNKNOWN_CUSTOMER" });
      }
    });
    if (data.invoices !== undefined && !Array.isArray(data.invoices)) errs.push({ path: "invoices", code: "INVALID_LIST" });

    const seenPayIds = new Set();
    (Array.isArray(data.payments) ? data.payments : []).forEach((p, i) => {
      validatePayment(p, `payments[${i}]`, errs);
      if (p?.id !== undefined) {
        if (seenPayIds.has(p.id)) errs.push({ path: `payments[${i}].id`, code: "DUPLICATE_ID" });
        seenPayIds.add(p.id);
      }
      if (p?.invoiceId !== undefined && !seenInvIds.has(p.invoiceId)) {
        errs.push({ path: `payments[${i}].invoiceId`, code: "UNKNOWN_INVOICE" });
      }
    });
    if (data.payments !== undefined && !Array.isArray(data.payments)) errs.push({ path: "payments", code: "INVALID_LIST" });

    // Cross-record invariant: no invoice may be overpaid by its linked payments.
    if (Array.isArray(data.invoices) && Array.isArray(data.payments)) {
      const byInvoice = {};
      data.payments.forEach(p => {
        if (p && p.invoiceId !== undefined && isNum(p.amount)) {
          byInvoice[p.invoiceId] = (byInvoice[p.invoiceId] || 0) + p.amount;
        }
      });
      data.invoices.forEach((inv, i) => {
        if (inv && inv.id !== undefined && isNum(inv.amount)) {
          const paid = byInvoice[inv.id] || 0;
          if (paid - inv.amount > 0.001) errs.push({ path: `invoices[${i}].amount`, code: "OVERPAYMENT" });
        }
      });
    }

    return { ok: errs.length === 0, errors: errs };
  }

  return { CONTRACT, validateData, validateRecord, isValidDate, isValidAmount, looksCredentialLike };
})();
