// ============================================================
// PURPOSEOLOGY IP INTELLIGENCE — VALIDATION UNIT TESTS (Node)
// Run: node dashboard/tests/ip-validate.test.js
//
// Exercises IPValidate against the sample data contract and a
// matrix of hostile/malformed inputs, including the IP_LEAK_PATTERN
// rule unique to this module. No browser required.
// ============================================================
global.window = global;
const path = require("path");
const DIR = path.join(__dirname, "..");
require(path.join(DIR, "ip-validate.js"));
require(path.join(DIR, "ip-data.js"));

const V = window.IPValidate;
let pass = 0, fail = 0;
function t(name, cond, detail) {
  if (cond) { pass++; console.log("PASS  " + name); }
  else { fail++; console.log("FAIL  " + name + (detail ? " — " + detail : "")); }
}
const clone = () => JSON.parse(JSON.stringify(window.IP_DATA));

// sample data is valid
t("sample IP data valid", V.validateData(window.IP_DATA).ok,
  JSON.stringify(V.validateData(window.IP_DATA).errors?.slice(0, 5)));

// schema / structure
let d = clone(); d.schemaVersion = 9;
t("wrong schemaVersion rejected", !V.validateData(d).ok);
d = clone(); d.injected = "x";
t("unexpected top-level property rejected", V.validateData(d).errors.some(e => e.code === "UNEXPECTED_PROPERTY"));
t("array root rejected", !V.validateData([]).ok);
t("null root rejected", !V.validateData(null).ok);

// asset rules
d = clone(); delete d.ipAssets[0].markText;
t("missing required asset field rejected", V.validateData(d).errors.some(e => e.code === "REQUIRED"));
d = clone(); d.ipAssets[1].id = d.ipAssets[0].id;
t("duplicate asset id rejected", V.validateData(d).errors.some(e => e.code === "DUPLICATE_ID"));
d = clone(); d.ipAssets[0].type = "PATENT";
t("invalid asset type rejected", V.validateData(d).errors.some(e => e.code === "INVALID_TYPE"));
d = clone(); d.ipAssets[0].status = "ON_HOLD";
t("invalid asset status rejected", V.validateData(d).errors.some(e => e.code === "INVALID_STATUS"));
d = clone(); d.ipAssets[0].renewalDate = "2026-13-40";
t("impossible renewal date rejected", V.validateData(d).errors.some(e => e.code === "INVALID_DATE"));

// license rules
d = clone(); delete d.licenses[0].licenseeName;
t("missing required license field rejected", V.validateData(d).errors.some(e => e.code === "REQUIRED"));
d = clone(); d.licenses[0].licenseType = "FRANCHISE";
t("invalid license type rejected", V.validateData(d).errors.some(e => e.code === "INVALID_LICENSE_TYPE"));
d = clone(); d.licenses[0].status = "SUSPENDED";
t("invalid license status rejected", V.validateData(d).errors.some(e => e.code === "INVALID_STATUS"));
d = clone(); d.licenses[0].feeTier = -500;
t("negative fee tier rejected", V.validateData(d).errors.some(e => e.code === "INVALID_AMOUNT"));
d = clone(); d.licenses[1].id = d.licenses[0].id;
t("duplicate license id rejected", V.validateData(d).errors.some(e => e.code === "DUPLICATE_ID"));

// compliance scan shape
d = clone(); d.complianceScan.filesScanned = -1;
t("negative filesScanned rejected", V.validateData(d).errors.some(e => e.code === "INVALID_COUNT"));
d = clone(); d.complianceScan.clean = "yes";
t("non-boolean clean flag rejected", V.validateData(d).errors.some(e => e.code === "INVALID_BOOLEAN"));
d = clone(); d.complianceScan.findings.push({ file: "x.md", line: 0, pattern: "p" });
t("invalid finding line number rejected", V.validateData(d).errors.some(e => e.code === "INVALID_LINE"));

// credential-like content refused anywhere
d = clone(); d.ipAssets[0].notes = "acct 1234567890";
t("long digit run rejected", V.validateData(d).errors.some(e => e.code === "CREDENTIAL_LIKE"));
d = clone(); d.licenses[0].notes = "api_key=abc";
t("key marker rejected", V.validateData(d).errors.some(e => e.code === "CREDENTIAL_LIKE"));

// ---- the rule unique to this module: IP_LEAK_PATTERN ----
d = clone(); d.ipAssets[0].notes = "Concept 1: this is the first distinction, defined in full.";
t("numbered concept definition rejected", V.validateData(d).errors.some(e => e.code === "IP_LEAK_PATTERN"));
d = clone(); d.licenses[0].notes = "Concept Dictionary: here is what each entry means.";
t("concept dictionary definition rejected", V.validateData(d).errors.some(e => e.code === "IP_LEAK_PATTERN"));
d = clone(); d.ipAssets[0].notes = "1. Concept — first in the enumerated list.";
t("numbered list concept enumeration rejected", V.validateData(d).errors.some(e => e.code === "IP_LEAK_PATTERN"));
// the governance-disclaimer phrasing itself (a mere mention, not a definition) must NOT be flagged
d = clone(); d.ipAssets[0].notes = "Never enumerate the internal 26 concepts or Concept Dictionary in outward content.";
t("mere mention of the restriction is NOT flagged (avoids the false-positive this pattern was redesigned to fix)",
  !V.validateData(d).errors.some(e => e.code === "IP_LEAK_PATTERN"), V.validateData(d).errors);

// errors never leak values
d = clone(); d.ipAssets[0].notes = "api_key=supersecretvalue";
t("errors carry no field values", !JSON.stringify(V.validateData(d).errors).includes("supersecretvalue"));

// per-record validator (manual-local CRUD gate)
t("validateRecord accepts good asset", V.validateRecord("asset", clone().ipAssets[0]).ok);
t("validateRecord accepts good license", V.validateRecord("license", clone().licenses[0]).ok);
t("validateRecord rejects unknown type", !V.validateRecord("nonsense", {}).ok);
t("validateRecord rejects IP-leak-pattern record",
  !V.validateRecord("asset", { ...clone().ipAssets[0], notes: "Concept 7: full definition here." }).ok);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
