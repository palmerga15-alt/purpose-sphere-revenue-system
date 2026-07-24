// ============================================================
// PURPOSEOLOGY IP INTELLIGENCE — VALIDATION MODULE (Phase 1)
// window.IPValidate
//
// Reusable validation for the schemaVersion-1 IP metadata
// contract. EVERY data source (sample file, future local
// records, future secure API responses) passes validateData()
// before anything renders. Data that fails does not render.
//
// This module also enforces the repository's METADATA-ONLY rule:
//   - credential-like strings (registration numbers, keys,
//     tokens, long digit runs) are rejected
//   - over-long text fields are rejected, so manuscript text,
//     curriculum content, assessment questions, or contract
//     language can never ride along inside "metadata"
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

    assetTypes: [
      "Book", "Manuscript", "Framework", "Methodology", "Assessment",
      "Training Curriculum", "Certification Material", "Course", "Webinar",
      "Research Paper", "White Paper", "Keynote", "Presentation",
      "Trademark", "Brand Asset", "Visual Asset", "Audio or Video",
      "AI Prompt or Workflow", "Licensing Package", "Contract or Permission"
    ],
    lifecycleStatuses: [
      "Concept", "Draft", "Internal Review", "Legal Review",
      "Protected", "Published", "Licensed", "Archived"
    ],
    confidentialityLevels: ["Public", "Internal", "Confidential", "Restricted", "Legal Hold"],

    copyrightStatuses: ["NOT-FILED", "PENDING", "REGISTERED", "N/A"],
    trademarkStatuses: ["NONE", "FILED", "REGISTERED", "RENEWAL-DUE", "N/A"],
    licensingStatuses: ["NOT-LICENSABLE", "AVAILABLE", "LICENSED", "EXCLUSIVELY-LICENSED", "EXPIRED"],
    approvalStatuses: ["DRAFT", "PENDING-REVIEW", "APPROVED", "LEGAL-APPROVED"],

    protectionTypes: [
      "COPYRIGHT", "TRADEMARK-APPLICATION", "TRADEMARK-RENEWAL", "DOMAIN",
      "LICENSE-AGREEMENT", "PERMISSION", "PUBLICATION", "LEGAL-REVIEW"
    ],
    protectionStatuses: [
      "PLANNED", "FILED", "PENDING", "REGISTERED", "ACTIVE",
      "RENEWAL-DUE", "IN-REVIEW", "EXPIRED"
    ],
    licenseStatuses: ["ACTIVE", "IN-NEGOTIATION", "PENDING", "EXPIRED", "TERMINATED"],
    revenueModels: ["FLAT-FEE", "ROYALTY", "REVENUE-SHARE", "SUBSCRIPTION", "PER-SEAT", "HYBRID"],

    // property whitelists — anything unexpected is rejected
    topKeys: ["schemaVersion", "generatedAt", "source", "assetTypes",
      "lifecycleStatuses", "confidentialityLevels", "assets", "protections", "licenses"],
    assetKeys: ["id", "title", "type", "description", "status", "confidentiality",
      "creator", "owningBusiness", "creationDate", "publicationDate", "version",
      "copyrightStatus", "trademarkStatus", "licensingStatus", "relatedProduct",
      "renewalDate", "sourceRef", "notes", "provenance"],
    assetRequired: ["id", "title", "type", "status", "confidentiality"],
    provenanceKeys: ["originalCreationDate", "lastRevisionDate", "contributors",
      "approvalStatus", "sourceLocation", "relatedVersions"],
    protectionKeys: ["id", "assetId", "type", "label", "jurisdiction",
      "registrationRef", "filedDate", "dueDate", "status", "notes"],
    protectionRequired: ["id", "type", "label", "status"],
    licenseKeys: ["id", "assetId", "licensee", "territory", "usageRights",
      "startDate", "endDate", "renewalDate", "revenueModel", "restrictions", "status"],
    licenseRequired: ["id", "licensee", "status"],

    // metadata-only guard: no field may carry document-length text
    maxTextLength: 400
  };

  // ---- primitive checks ----
  const isStr = v => typeof v === "string";

  function isValidDate(s) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s))) return false;
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }

  // Credential-like content: long digit runs (registration/serial/
  // account numbers), key/token/secret markers, base64-ish blobs, IBANs.
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

  // ---- shared record checks ----
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
      if (isStr(v)) {
        if (looksCredentialLike(v)) errs.push({ path: `${path}.${k}`, code: "CREDENTIAL_LIKE" });
        if (v.length > CONTRACT.maxTextLength) errs.push({ path: `${path}.${k}`, code: "TEXT_TOO_LONG" });
      }
      if (isStr(k) && looksCredentialLike(k)) errs.push({ path: `${path}.${k}`, code: "CREDENTIAL_LIKE_KEY" });
    }
  }
  function optDate(v, path, errs) {
    if (v !== undefined && v !== null && v !== "" && !isValidDate(v)) errs.push({ path, code: "INVALID_DATE" });
  }
  function optEnum(v, allowed, path, errs, code) {
    if (v !== undefined && v !== null && v !== "" && !allowed.includes(v)) errs.push({ path, code });
  }
  function optStrList(v, path, errs) {
    if (v === undefined) return;
    if (!Array.isArray(v) || !v.every(isStr)) { errs.push({ path, code: "INVALID_LIST" }); return; }
    v.forEach((s, i) => {
      if (looksCredentialLike(s)) errs.push({ path: `${path}[${i}]`, code: "CREDENTIAL_LIKE" });
      if (s.length > CONTRACT.maxTextLength) errs.push({ path: `${path}[${i}]`, code: "TEXT_TOO_LONG" });
    });
  }

  // ---- record validators ----
  function validateAsset(a, path, errs, lists) {
    checkKeys(a, CONTRACT.assetKeys, path, errs);
    checkRequired(a, CONTRACT.assetRequired, path, errs);
    checkStrings(a, path, errs);
    optEnum(a.type, lists.assetTypes, `${path}.type`, errs, "INVALID_ASSET_TYPE");
    optEnum(a.status, lists.lifecycleStatuses, `${path}.status`, errs, "INVALID_STATUS");
    optEnum(a.confidentiality, lists.confidentialityLevels, `${path}.confidentiality`, errs, "INVALID_CONFIDENTIALITY");
    optEnum(a.copyrightStatus, CONTRACT.copyrightStatuses, `${path}.copyrightStatus`, errs, "INVALID_COPYRIGHT_STATUS");
    optEnum(a.trademarkStatus, CONTRACT.trademarkStatuses, `${path}.trademarkStatus`, errs, "INVALID_TRADEMARK_STATUS");
    optEnum(a.licensingStatus, CONTRACT.licensingStatuses, `${path}.licensingStatus`, errs, "INVALID_LICENSING_STATUS");
    optDate(a.creationDate, `${path}.creationDate`, errs);
    optDate(a.publicationDate, `${path}.publicationDate`, errs);
    optDate(a.renewalDate, `${path}.renewalDate`, errs);
    if (a.provenance !== undefined) {
      const p = a.provenance, pp = `${path}.provenance`;
      if (!p || typeof p !== "object" || Array.isArray(p)) { errs.push({ path: pp, code: "NOT_AN_OBJECT" }); return; }
      checkKeys(p, CONTRACT.provenanceKeys, pp, errs);
      checkStrings(p, pp, errs);
      optDate(p.originalCreationDate, `${pp}.originalCreationDate`, errs);
      optDate(p.lastRevisionDate, `${pp}.lastRevisionDate`, errs);
      optEnum(p.approvalStatus, CONTRACT.approvalStatuses, `${pp}.approvalStatus`, errs, "INVALID_APPROVAL_STATUS");
      optStrList(p.contributors, `${pp}.contributors`, errs);
      optStrList(p.relatedVersions, `${pp}.relatedVersions`, errs);
    }
  }

  function validateProtection(p, path, errs) {
    checkKeys(p, CONTRACT.protectionKeys, path, errs);
    checkRequired(p, CONTRACT.protectionRequired, path, errs);
    checkStrings(p, path, errs);
    optEnum(p.type, CONTRACT.protectionTypes, `${path}.type`, errs, "INVALID_TYPE");
    optEnum(p.status, CONTRACT.protectionStatuses, `${path}.status`, errs, "INVALID_STATUS");
    optDate(p.filedDate, `${path}.filedDate`, errs);
    optDate(p.dueDate, `${path}.dueDate`, errs);
  }

  function validateLicense(l, path, errs) {
    checkKeys(l, CONTRACT.licenseKeys, path, errs);
    checkRequired(l, CONTRACT.licenseRequired, path, errs);
    checkStrings(l, path, errs);
    optEnum(l.status, CONTRACT.licenseStatuses, `${path}.status`, errs, "INVALID_STATUS");
    optEnum(l.revenueModel, CONTRACT.revenueModels, `${path}.revenueModel`, errs, "INVALID_REVENUE_MODEL");
    optDate(l.startDate, `${path}.startDate`, errs);
    optDate(l.endDate, `${path}.endDate`, errs);
    optDate(l.renewalDate, `${path}.renewalDate`, errs);
  }

  const RECORD_VALIDATORS = {
    asset: (r, path, errs) => validateAsset(r, path, errs, CONTRACT),
    protection: validateProtection,
    license: validateLicense
  };

  // Validate a single record (used by future manual-local CRUD).
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

    for (const listKey of ["assetTypes", "lifecycleStatuses", "confidentialityLevels"]) {
      const v = data[listKey];
      if (v !== undefined && (!Array.isArray(v) || !v.every(isStr))) errs.push({ path: listKey, code: "INVALID_LIST" });
    }
    const lists = {
      assetTypes: Array.isArray(data.assetTypes) ? data.assetTypes : CONTRACT.assetTypes,
      lifecycleStatuses: Array.isArray(data.lifecycleStatuses) ? data.lifecycleStatuses : CONTRACT.lifecycleStatuses,
      confidentialityLevels: Array.isArray(data.confidentialityLevels) ? data.confidentialityLevels : CONTRACT.confidentialityLevels
    };

    const dupCheck = (seen, id, path) => {
      if (id === undefined || id === null) return;
      if (seen.has(id)) errs.push({ path, code: "DUPLICATE_ID" });
      seen.add(id);
    };
    const assetIds = new Set(), protIds = new Set(), licIds = new Set();

    (Array.isArray(data.assets) ? data.assets : []).forEach((a, i) => {
      validateAsset(a, `assets[${i}]`, errs, lists);
      dupCheck(assetIds, a?.id, `assets[${i}].id`);
    });
    if (data.assets !== undefined && !Array.isArray(data.assets)) errs.push({ path: "assets", code: "INVALID_LIST" });

    (Array.isArray(data.protections) ? data.protections : []).forEach((p, i) => {
      validateProtection(p, `protections[${i}]`, errs);
      dupCheck(protIds, p?.id, `protections[${i}].id`);
      if (p?.assetId != null && !assetIds.has(p.assetId)) errs.push({ path: `protections[${i}].assetId`, code: "UNKNOWN_ASSET_REF" });
    });
    if (data.protections !== undefined && !Array.isArray(data.protections)) errs.push({ path: "protections", code: "INVALID_LIST" });

    (Array.isArray(data.licenses) ? data.licenses : []).forEach((l, i) => {
      validateLicense(l, `licenses[${i}]`, errs);
      dupCheck(licIds, l?.id, `licenses[${i}].id`);
      if (l?.assetId != null && !assetIds.has(l.assetId)) errs.push({ path: `licenses[${i}].assetId`, code: "UNKNOWN_ASSET_REF" });
    });
    if (data.licenses !== undefined && !Array.isArray(data.licenses)) errs.push({ path: "licenses", code: "INVALID_LIST" });

    return { ok: errs.length === 0, errors: errs };
  }

  return { CONTRACT, validateData, validateRecord, isValidDate, looksCredentialLike };
})();
