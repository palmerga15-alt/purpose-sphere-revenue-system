// ============================================================
// FINANCIAL INTELLIGENCE — VALIDATION MODULE (Phase 2)
// window.FinanceValidate
//
// Reusable validation for the schemaVersion-1 finance data
// contract. EVERY data source (sample file, manual local
// records, secure API responses) passes through validateData()
// before anything renders. Data that fails does not render.
//
// Errors carry field PATHS and codes only — never field VALUES —
// so validation output is always safe to display or log.
// ============================================================
window.FinanceValidate = (function () {
  "use strict";

  // ---- canonical contract (schemaVersion 1) ----
  const CONTRACT = {
    schemaVersion: 1,
    sourceModes: ["sample", "manual-local", "live"],
    categories: [
      "Training & Education", "Software & AI Tools", "Marketing & Advertising",
      "Business Operations", "Travel, Speaking & Events", "Website & Technology",
      "Professional Services", "Other Business Expenses"
    ],
    frequencies: ["ONE-TIME", "MONTHLY", "QUARTERLY", "ANNUAL"],
    statuses: ["DUE", "DUE SOON", "PAID", "OVERDUE", "CANCELLED"],
    // stored payment status: computed statuses are never stored
    storedStatuses: [null, "AUTO", "PAID", "CANCELLED"],
    expenseGroups: [
      "Software & AI", "Marketing", "Training & Education", "Business Operations",
      "Travel & Speaking", "Technology", "Contractors", "Miscellaneous"
    ],
    categoryGroups: {
      "Software & AI Tools": "Software & AI",
      "Marketing & Advertising": "Marketing",
      "Training & Education": "Training & Education",
      "Business Operations": "Business Operations",
      "Travel, Speaking & Events": "Travel & Speaking",
      "Website & Technology": "Technology",
      "Professional Services": "Contractors",
      "Other Business Expenses": "Miscellaneous"
    },
    calendarTypes: ["BILL", "RENEWAL", "TAX", "INSURANCE", "DOMAIN", "ANNUAL", "EVENT"],
    revenueStreams: [
      "Book Sales", "Speaking Revenue", "Coaching Revenue", "Certification Revenue",
      "Digital Products", "Webinar Revenue", "Membership Revenue", "Consulting Revenue"
    ],
    // property whitelists — anything unexpected is rejected
    topKeys: ["schemaVersion", "generatedAt", "source", "snapshot", "categories",
      "frequencies", "statuses", "payments", "expenseGroups", "categoryGroups",
      "subscriptions", "revenue", "calendarEvents", "insights"],
    paymentKeys: ["id", "vendor", "description", "category", "amount", "dueDate",
      "frequency", "status", "paidDate", "business", "paymentMethod", "notes",
      "receiptRef", "calendarType"],
    paymentRequired: ["id", "vendor", "description", "category", "amount", "dueDate", "frequency"],
    subKeys: ["id", "vendor", "description", "monthlyCost", "annualCost", "renewalDate",
      "lastPayment", "autoRenew", "purpose", "purposeTags"],
    subRequired: ["id", "vendor", "monthlyCost"],
    streamKeys: ["name", "monthTotal", "source"],
    streamRequired: ["name", "monthTotal"],
    calKeys: ["date", "label", "type", "amountEstimate"],
    calRequired: ["date", "label", "type"],
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
  // numbers), key/token/secret markers, base64-ish blobs, IBANs.
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

  // ---- record validators (also used by manual-local CRUD) ----
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
  function optAmount(v, path, errs) {
    if (v !== undefined && v !== null && !isValidAmount(v)) errs.push({ path, code: "INVALID_AMOUNT" });
  }

  function validatePayment(p, path, errs, categories) {
    checkKeys(p, CONTRACT.paymentKeys, path, errs);
    checkRequired(p, CONTRACT.paymentRequired, path, errs);
    checkStrings(p, path, errs);
    if (p.amount !== undefined && !isValidAmount(p.amount)) errs.push({ path: `${path}.amount`, code: "INVALID_AMOUNT" });
    if (p.dueDate !== undefined && !isValidDate(p.dueDate)) errs.push({ path: `${path}.dueDate`, code: "INVALID_DATE" });
    optDate(p.paidDate, `${path}.paidDate`, errs);
    if (p.frequency !== undefined && !CONTRACT.frequencies.includes(p.frequency)) errs.push({ path: `${path}.frequency`, code: "INVALID_FREQUENCY" });
    const st = p.status === undefined ? null : p.status;
    if (!CONTRACT.storedStatuses.includes(st)) errs.push({ path: `${path}.status`, code: "INVALID_STATUS" });
    const cats = categories || CONTRACT.categories;
    if (p.category !== undefined && !cats.includes(p.category)) errs.push({ path: `${path}.category`, code: "INVALID_CATEGORY" });
    if (p.calendarType !== undefined && !CONTRACT.calendarTypes.includes(p.calendarType)) errs.push({ path: `${path}.calendarType`, code: "INVALID_TYPE" });
  }

  function validateSubscription(s, path, errs) {
    checkKeys(s, CONTRACT.subKeys, path, errs);
    checkRequired(s, CONTRACT.subRequired, path, errs);
    checkStrings(s, path, errs);
    if (s.monthlyCost !== undefined && !isValidAmount(s.monthlyCost)) errs.push({ path: `${path}.monthlyCost`, code: "INVALID_AMOUNT" });
    optAmount(s.annualCost, `${path}.annualCost`, errs);
    optDate(s.renewalDate, `${path}.renewalDate`, errs);
    optDate(s.lastPayment, `${path}.lastPayment`, errs);
    if (s.autoRenew !== undefined && typeof s.autoRenew !== "boolean") errs.push({ path: `${path}.autoRenew`, code: "INVALID_BOOLEAN" });
    if (s.purposeTags !== undefined && (!Array.isArray(s.purposeTags) || !s.purposeTags.every(isStr))) errs.push({ path: `${path}.purposeTags`, code: "INVALID_TAGS" });
  }

  function validateStream(s, path, errs) {
    checkKeys(s, CONTRACT.streamKeys, path, errs);
    checkRequired(s, CONTRACT.streamRequired, path, errs);
    checkStrings(s, path, errs);
    if (s.monthTotal !== undefined && !isValidAmount(s.monthTotal)) errs.push({ path: `${path}.monthTotal`, code: "INVALID_AMOUNT" });
  }

  function validateCalendarEvent(e, path, errs) {
    checkKeys(e, CONTRACT.calKeys, path, errs);
    checkRequired(e, CONTRACT.calRequired, path, errs);
    checkStrings(e, path, errs);
    if (e.date !== undefined && !isValidDate(e.date)) errs.push({ path: `${path}.date`, code: "INVALID_DATE" });
    if (e.type !== undefined && !CONTRACT.calendarTypes.includes(e.type)) errs.push({ path: `${path}.type`, code: "INVALID_TYPE" });
    optAmount(e.amountEstimate, `${path}.amountEstimate`, errs);
  }

  const RECORD_VALIDATORS = {
    payment: validatePayment,
    subscription: validateSubscription,
    revenue: validateStream,
    calendar: validateCalendarEvent
  };

  // Validate a single record (manual-local CRUD path).
  function validateRecord(type, record) {
    const errs = [];
    const fn = RECORD_VALIDATORS[type];
    if (!fn) return { ok: false, errors: [{ path: type, code: "UNKNOWN_RECORD_TYPE" }] };
    fn(record, type, errs);
    return { ok: errs.length === 0, errors: errs };
  }

  // Validate a full window.FINANCE_DATA-shaped object.
  function validateData(data) {
    const errs = [];
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { ok: false, errors: [{ path: "root", code: "NOT_AN_OBJECT" }] };
    }
    if (data.schemaVersion !== CONTRACT.schemaVersion) errs.push({ path: "schemaVersion", code: "UNSUPPORTED_SCHEMA" });
    checkKeys(data, CONTRACT.topKeys, "root", errs);

    if (!data.source || !CONTRACT.sourceModes.includes(data.source.mode)) errs.push({ path: "source.mode", code: "INVALID_SOURCE_MODE" });
    if (data.source) { checkKeys(data.source, ["mode", "label"], "source", errs); checkStrings(data.source, "source", errs); }
    if (data.snapshot) {
      checkKeys(data.snapshot, ["cashAvailable", "cashNote"], "snapshot", errs);
      optAmount(data.snapshot.cashAvailable, "snapshot.cashAvailable", errs);
      checkStrings(data.snapshot, "snapshot", errs);
    }
    if (data.generatedAt !== undefined && isNaN(Date.parse(data.generatedAt))) errs.push({ path: "generatedAt", code: "INVALID_DATE" });

    for (const listKey of ["categories", "frequencies", "statuses", "expenseGroups"]) {
      const v = data[listKey];
      if (v !== undefined && (!Array.isArray(v) || !v.every(isStr))) errs.push({ path: listKey, code: "INVALID_LIST" });
    }

    const seenIds = new Set();
    const dupCheck = (id, path) => {
      if (id === undefined || id === null) return;
      if (seenIds.has(id)) errs.push({ path, code: "DUPLICATE_ID" });
      seenIds.add(id);
    };

    (Array.isArray(data.payments) ? data.payments : []).forEach((p, i) => {
      validatePayment(p, `payments[${i}]`, errs, data.categories);
      dupCheck(p?.id, `payments[${i}].id`);
    });
    if (data.payments !== undefined && !Array.isArray(data.payments)) errs.push({ path: "payments", code: "INVALID_LIST" });

    (Array.isArray(data.subscriptions) ? data.subscriptions : []).forEach((s, i) => {
      validateSubscription(s, `subscriptions[${i}]`, errs);
      dupCheck(s?.id, `subscriptions[${i}].id`);
    });
    if (data.subscriptions !== undefined && !Array.isArray(data.subscriptions)) errs.push({ path: "subscriptions", code: "INVALID_LIST" });

    if (data.revenue !== undefined) {
      checkKeys(data.revenue, ["period", "streams"], "revenue", errs);
      (Array.isArray(data.revenue?.streams) ? data.revenue.streams : []).forEach((s, i) =>
        validateStream(s, `revenue.streams[${i}]`, errs));
    }

    (Array.isArray(data.calendarEvents) ? data.calendarEvents : []).forEach((e, i) =>
      validateCalendarEvent(e, `calendarEvents[${i}]`, errs));

    if (data.insights !== undefined) {
      checkKeys(data.insights, ["engineStatus", "planned", "items"], "insights", errs);
      (Array.isArray(data.insights?.planned) ? data.insights.planned : []).forEach((p, i) => {
        checkKeys(p, ["name", "desc"], `insights.planned[${i}]`, errs);
        checkStrings(p, `insights.planned[${i}]`, errs);
      });
      (Array.isArray(data.insights?.items) ? data.insights.items : []).forEach((it, i) => {
        if (isStr(it)) { if (looksCredentialLike(it)) errs.push({ path: `insights.items[${i}]`, code: "CREDENTIAL_LIKE" }); }
        else { checkKeys(it, ["text", "type"], `insights.items[${i}]`, errs); checkStrings(it, `insights.items[${i}]`, errs); }
      });
    }

    if (data.categoryGroups !== undefined) {
      for (const [k, v] of Object.entries(data.categoryGroups || {})) {
        if (!isStr(v)) errs.push({ path: `categoryGroups.${k}`, code: "INVALID_MAPPING" });
      }
    }

    return { ok: errs.length === 0, errors: errs };
  }

  return { CONTRACT, validateData, validateRecord, isValidDate, isValidAmount, looksCredentialLike };
})();
