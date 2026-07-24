// ============================================================
// FINANCIAL INTELLIGENCE — VALIDATION UNIT TESTS (Node)
// Run: node dashboard/tests/finance-validate.test.js
//
// Exercises FinanceValidate against the sample data contract and
// a matrix of hostile / malformed inputs. No browser required.
// ============================================================
global.window = global;
const path = require("path");
const DIR = path.join(__dirname, "..");
require(path.join(DIR, "finance-validate.js"));
require(path.join(DIR, "finance-data.js"));

const V = window.FinanceValidate;
let pass = 0, fail = 0;
function t(name, cond, detail) {
  if (cond) { pass++; console.log("PASS  " + name); }
  else { fail++; console.log("FAIL  " + name + (detail ? " — " + detail : "")); }
}
const clone = () => JSON.parse(JSON.stringify(window.FINANCE_DATA));

// sample data is valid
t("sample finance data valid", V.validateData(window.FINANCE_DATA).ok,
  JSON.stringify(V.validateData(window.FINANCE_DATA).errors?.slice(0, 5)));

// schema / structure
let d = clone(); d.schemaVersion = 9;
t("wrong schemaVersion rejected", !V.validateData(d).ok);
d = clone(); d.injected = "x";
t("unexpected top-level property rejected", V.validateData(d).errors.some(e => e.code === "UNEXPECTED_PROPERTY"));
t("array root rejected", !V.validateData([]).ok);
t("null root rejected", !V.validateData(null).ok);

// per-record rules
d = clone(); d.payments[0].amount = -5;
t("negative amount rejected", V.validateData(d).errors.some(e => e.code === "INVALID_AMOUNT"));
d = clone(); d.payments[0].amount = 99999999;
t("over-cap amount rejected", V.validateData(d).errors.some(e => e.code === "INVALID_AMOUNT"));
d = clone(); d.payments[0].dueDate = "2026-13-40";
t("impossible date rejected", V.validateData(d).errors.some(e => e.code === "INVALID_DATE"));
d = clone(); d.payments[0].category = "Bribes";
t("invalid category rejected", V.validateData(d).errors.some(e => e.code === "INVALID_CATEGORY"));
d = clone(); d.payments[0].frequency = "HOURLY";
t("invalid frequency rejected", V.validateData(d).errors.some(e => e.code === "INVALID_FREQUENCY"));
d = clone(); delete d.payments[0].vendor;
t("missing required field rejected", V.validateData(d).errors.some(e => e.code === "REQUIRED"));
d = clone(); d.payments[1].id = d.payments[0].id;
t("duplicate payment id rejected", V.validateData(d).errors.some(e => e.code === "DUPLICATE_ID"));

// credential-like content is refused anywhere
d = clone(); d.payments[0].notes = "acct 1234567890";
t("long digit run rejected", V.validateData(d).errors.some(e => e.code === "CREDENTIAL_LIKE"));
d = clone(); d.payments[0].notes = "api_key=abc";
t("key marker rejected", V.validateData(d).errors.some(e => e.code === "CREDENTIAL_LIKE"));
d = clone(); d.subscriptions[0].purpose = "sk-live-ABCDEFGH12345678";
t("stripe-like key rejected", V.validateData(d).errors.some(e => e.code === "CREDENTIAL_LIKE"));

// errors never leak values
d = clone(); d.payments[0].notes = "api_key=supersecretvalue";
t("errors carry no field values", !JSON.stringify(V.validateData(d).errors).includes("supersecretvalue"));

// per-record validator (manual-local CRUD gate)
t("validateRecord accepts good payment", V.validateRecord("payment", clone().payments[0]).ok);
t("validateRecord rejects unknown type", !V.validateRecord("nonsense", {}).ok);
t("validateRecord rejects credential-like record",
  !V.validateRecord("payment", { ...clone().payments[0], notes: "token=1234567890" }).ok);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
