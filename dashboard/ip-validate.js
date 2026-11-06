// ============================================================
// PURPOSEOLOGY IP INTELLIGENCE — VALIDATION MODULE
// window.IPValidate
//
// Reusable validation for the schemaVersion-1 IP intelligence
// contract (trademark/copyright assets + license records).
// EVERY data source passes through validateData() before
// rendering. Mirrors dashboard/finance-validate.js and
// dashboard/billing-validate.js: property whitelists, required
// fields, bounded dates, enum checks, duplicate-ID detection, and
// credential-like-string rejection on every string field.
//
// ADDITIONAL RULE UNIQUE TO THIS MODULE: every string field is
// also checked against IP_LEAK_PATTERNS — phrases that would
// indicate someone is enumerating or describing the internal
// 26-concept framework / Concept Dictionary. This module tracks
// IP *administration* (marks, licenses, filing dates) and never
// the IP's actual substance, so any such phrase is rejected
// before it can render or be saved locally, regardless of source.
//
// Errors carry field PATHS and codes only — never field VALUES —
// so validation output is always safe to display or log.
// ============================================================
window.IPValidate = (function () {
  "use strict";

  // ---- canonical contract (schemaVersion 1) ----
  const CONTRACT = {
    schemaVersion: 1,
    sourceModes: ["sample", "manual-local", "live"],
    assetTypes: ["TRADEMARK", "SERVICE_MARK", "COPYRIGHT", "TRADE_DRESS"],
    assetStatuses: ["NOT_FILED", "PENDING", "REGISTERED", "ABANDONED", "EXPIRED"],
    licenseTypes: ["CORPORATE_DELIVERY_LICENSE", "CERTIFIED_PRACTITIONER", "OTHER"],
    licenseStatuses: ["ACTIVE", "EXPIRED", "REVOKED", "PENDING"],
    // property whitelists — anything unexpected is rejected
    topKeys: ["schemaVersion", "generatedAt", "source", "ipAssets", "licenses", "complianceScan"],
    assetKeys: ["id", "markText", "type", "jurisdiction", "status", "filingDate",
      "registrationDate", "renewalDate", "registrationNumber", "notes"],
    assetRequired: ["id", "markText", "type", "status"],
    licenseKeys: ["id", "licenseeName", "licenseType", "grantedDate", "expirationDate",
      "status", "territory", "feeTier", "notes"],
    licenseRequired: ["id", "licenseeName", "licenseType", "status"],
    scanKeys: ["scannedAt", "filesScanned", "findings", "clean"],
    findingKeys: ["file", "line", "pattern", "snippet"],
    findingRequired: ["file", "line", "pattern"],
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

  // Credential-like content: long digit runs, key/token/secret markers,
  // base64-ish blobs, IBANs — same shared rule as Finance/Billing.
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

  // IP-leak content: phrases that would indicate an individual
  // internal concept is being DEFINED or ENUMERATED, as opposed to
  // merely referenced as an off-limits construct. This distinction
  // matters in practice: the repo's own agent instructions and
  // compliance disclaimers legitimately say things like "never
  // enumerate the internal 26 concepts or Concept Dictionary" —
  // that governance language is safe and necessary, and an earlier,
  // naive version of this pattern list (bare "26 concepts" /
  // "concept dictionary" mentions) flagged every one of those
  // disclaimers as a false positive when run against this repo.
  // These patterns instead target actual definition/enumeration
  // shapes — "Concept 1: ...", a "Concept N" heading, a numbered
  // concept list, or "Concept Dictionary:" followed by defining
  // content — which a mere reminder-that-they're-off-limits never
  // takes. Only cleared terms (Purpose Fingerprint, Chronos/Kairos,
  // the five-stage journey) are safe outward-facing regardless.
  const IP_LEAK_PATTERNS = [
    /\bconcept\s*#?\s*\d{1,2}\s*[:\-–—]\s*\S/i,
    /^#{1,6}\s*concept\s*#?\s*\d{1,2}\b/im,
    // Colon only here, not em-dash: "Concept Dictionary:" reads as a
    // definition opener in English; "Concept Dictionary — they are
    // proprietary" is just a clause break and produced false positives
    // against this repo's own legitimate disclaimer language.
    /\bconcept\s*dictionary\s*:\s*\S/i,
    /^\s*\d{1,2}[.)]\s*concept\b/im
  ];
  function looksLikeIPLeak(s) {
    return IP_LEAK_PATTERNS.some(re => re.test(s));
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
      if (isStr(v) && looksLikeIPLeak(v)) errs.push({ path: `${path}.${k}`, code: "IP_LEAK_PATTERN" });
      if (isStr(k) && (looksCredentialLike(k) || looksLikeIPLeak(k))) errs.push({ path: `${path}.${k}`, code: "CREDENTIAL_LIKE_KEY" });
    }
  }
  function optDate(v, path, errs) {
    if (v !== undefined && v !== null && v !== "" && !isValidDate(v)) errs.push({ path, code: "INVALID_DATE" });
  }

  // ---- record validators (also used by manual-local CRUD) ----
  function validateAsset(a, path, errs) {
    checkKeys(a, CONTRACT.assetKeys, path, errs);
    checkRequired(a, CONTRACT.assetRequired, path, errs);
    checkStrings(a, path, errs);
    if (a.type !== undefined && !CONTRACT.assetTypes.includes(a.type)) errs.push({ path: `${path}.type`, code: "INVALID_TYPE" });
    if (a.status !== undefined && !CONTRACT.assetStatuses.includes(a.status)) errs.push({ path: `${path}.status`, code: "INVALID_STATUS" });
    optDate(a.filingDate, `${path}.filingDate`, errs);
    optDate(a.registrationDate, `${path}.registrationDate`, errs);
    optDate(a.renewalDate, `${path}.renewalDate`, errs);
  }

  function validateLicense(l, path, errs) {
    checkKeys(l, CONTRACT.licenseKeys, path, errs);
    checkRequired(l, CONTRACT.licenseRequired, path, errs);
    checkStrings(l, path, errs);
    if (l.licenseType !== undefined && !CONTRACT.licenseTypes.includes(l.licenseType)) errs.push({ path: `${path}.licenseType`, code: "INVALID_LICENSE_TYPE" });
    if (l.status !== undefined && !CONTRACT.licenseStatuses.includes(l.status)) errs.push({ path: `${path}.status`, code: "INVALID_STATUS" });
    optDate(l.grantedDate, `${path}.grantedDate`, errs);
    optDate(l.expirationDate, `${path}.expirationDate`, errs);
    if (l.feeTier !== undefined && l.feeTier !== null && !(isNum(l.feeTier) && l.feeTier >= 0 && l.feeTier <= CONTRACT.maxAmount)) {
      errs.push({ path: `${path}.feeTier`, code: "INVALID_AMOUNT" });
    }
  }

  function validateFinding(f, path, errs) {
    checkKeys(f, CONTRACT.findingKeys, path, errs);
    checkRequired(f, CONTRACT.findingRequired, path, errs);
    checkStrings(f, path, errs);
    if (f.line !== undefined && !(isNum(f.line) && f.line >= 1)) errs.push({ path: `${path}.line`, code: "INVALID_LINE" });
  }

  const RECORD_VALIDATORS = { asset: validateAsset, license: validateLicense };

  // Validate a single record (manual-local CRUD path).
  function validateRecord(type, record) {
    const errs = [];
    const fn = RECORD_VALIDATORS[type];
    if (!fn) return { ok: false, errors: [{ path: type, code: "UNKNOWN_RECORD_TYPE" }] };
    fn(record, type, errs);
    return { ok: errs.length === 0, errors: errs };
  }

  // Validate a full window.IP_DATA-shaped object.
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

    const seenAssetIds = new Set();
    (Array.isArray(data.ipAssets) ? data.ipAssets : []).forEach((a, i) => {
      validateAsset(a, `ipAssets[${i}]`, errs);
      if (a?.id !== undefined) {
        if (seenAssetIds.has(a.id)) errs.push({ path: `ipAssets[${i}].id`, code: "DUPLICATE_ID" });
        seenAssetIds.add(a.id);
      }
    });
    if (data.ipAssets !== undefined && !Array.isArray(data.ipAssets)) errs.push({ path: "ipAssets", code: "INVALID_LIST" });

    const seenLicenseIds = new Set();
    (Array.isArray(data.licenses) ? data.licenses : []).forEach((l, i) => {
      validateLicense(l, `licenses[${i}]`, errs);
      if (l?.id !== undefined) {
        if (seenLicenseIds.has(l.id)) errs.push({ path: `licenses[${i}].id`, code: "DUPLICATE_ID" });
        seenLicenseIds.add(l.id);
      }
    });
    if (data.licenses !== undefined && !Array.isArray(data.licenses)) errs.push({ path: "licenses", code: "INVALID_LIST" });

    if (data.complianceScan !== undefined) {
      checkKeys(data.complianceScan, CONTRACT.scanKeys, "complianceScan", errs);
      if (data.complianceScan.scannedAt !== undefined && isNaN(Date.parse(data.complianceScan.scannedAt))) {
        errs.push({ path: "complianceScan.scannedAt", code: "INVALID_DATE" });
      }
      if (data.complianceScan.filesScanned !== undefined && !(isNum(data.complianceScan.filesScanned) && data.complianceScan.filesScanned >= 0)) {
        errs.push({ path: "complianceScan.filesScanned", code: "INVALID_COUNT" });
      }
      if (data.complianceScan.clean !== undefined && typeof data.complianceScan.clean !== "boolean") {
        errs.push({ path: "complianceScan.clean", code: "INVALID_BOOLEAN" });
      }
      (Array.isArray(data.complianceScan.findings) ? data.complianceScan.findings : []).forEach((f, i) =>
        validateFinding(f, `complianceScan.findings[${i}]`, errs));
      if (data.complianceScan.findings !== undefined && !Array.isArray(data.complianceScan.findings)) {
        errs.push({ path: "complianceScan.findings", code: "INVALID_LIST" });
      }
    }

    return { ok: errs.length === 0, errors: errs };
  }

  return { CONTRACT, validateData, validateRecord, isValidDate, looksCredentialLike, looksLikeIPLeak, IP_LEAK_PATTERNS };
})();
