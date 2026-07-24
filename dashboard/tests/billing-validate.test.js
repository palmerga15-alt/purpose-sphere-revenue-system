// ============================================================
// REVENUE BILLING & ACCOUNTS RECEIVABLE — VALIDATION UNIT TESTS (Node)
// Run: node dashboard/tests/billing-validate.test.js
//
// Exercises BillingValidate against the sample data contract and
// a matrix of hostile / malformed inputs. No browser required.
// ============================================================
global.window = global;
const path = require("path");
const DIR = path.join(__dirname, "..");
require(path.join(DIR, "billing-validate.js"));
require(path.join(DIR, "billing-data.js"));

const V = window.BillingValidate;
let pass = 0, fail = 0;
function t(name, cond, detail) {
  if (cond) { pass++; console.log("PASS  " + name); }
  else { fail++; console.log("FAIL  " + name + (detail ? " — " + detail : "")); }
}
const clone = () => JSON.parse(JSON.stringify(window.BILLING_DATA));

// sample data is valid
t("sample billing data valid", V.validateData(window.BILLING_DATA).ok,
  JSON.stringify(V.validateData(window.BILLING_DATA).errors?.slice(0, 5)));

// schema / structure
let d = clone(); d.schemaVersion = 9;
t("wrong schemaVersion rejected", !V.validateData(d).ok);
d = clone(); d.injected = "x";
t("unexpected top-level property rejected", V.validateData(d).errors.some(e => e.code === "UNEXPECTED_PROPERTY"));
t("array root rejected", !V.validateData([]).ok);
t("null root rejected", !V.validateData(null).ok);

// customer rules
d = clone(); delete d.customers[0].name;
t("missing required customer field rejected", V.validateData(d).errors.some(e => e.code === "REQUIRED"));
d = clone(); d.customers[1].id = d.customers[0].id;
t("duplicate customer id rejected", V.validateData(d).errors.some(e => e.code === "DUPLICATE_ID"));
d = clone(); d.customers[0].paymentTerms = "Net 9000";
t("invalid payment terms rejected", V.validateData(d).errors.some(e => e.code === "INVALID_TERMS"));
d = clone(); d.customers[0].taxExempt = "yes";
t("non-boolean taxExempt rejected", V.validateData(d).errors.some(e => e.code === "INVALID_BOOLEAN"));

// invoice rules
d = clone(); d.invoices[0].amount = -5;
t("negative invoice amount rejected", V.validateData(d).errors.some(e => e.code === "INVALID_AMOUNT"));
d = clone(); d.invoices[0].amount = 99999999;
t("over-cap invoice amount rejected", V.validateData(d).errors.some(e => e.code === "INVALID_AMOUNT"));
d = clone(); d.invoices[0].dueDate = "2026-13-40";
t("impossible due date rejected", V.validateData(d).errors.some(e => e.code === "INVALID_DATE"));
d = clone(); d.invoices[0].status = "archived";
t("invalid invoice status rejected", V.validateData(d).errors.some(e => e.code === "INVALID_STATUS"));
d = clone(); d.invoices[0].reminderStatus = "GHOSTED";
t("invalid reminder status rejected", V.validateData(d).errors.some(e => e.code === "INVALID_REMINDER_STATUS"));
d = clone(); d.invoices[0].recurring = "WEEKLY";
t("invalid recurring frequency rejected", V.validateData(d).errors.some(e => e.code === "INVALID_FREQUENCY"));
d = clone(); delete d.invoices[0].customerName;
t("missing required invoice field rejected", V.validateData(d).errors.some(e => e.code === "REQUIRED"));
d = clone(); d.invoices[1].id = d.invoices[0].id;
t("duplicate invoice id rejected", V.validateData(d).errors.some(e => e.code === "DUPLICATE_ID"));
d = clone(); d.invoices[0].customerId = "CUST-DOES-NOT-EXIST";
t("unknown customer reference rejected", V.validateData(d).errors.some(e => e.code === "UNKNOWN_CUSTOMER"));

// payment rules
d = clone(); d.payments[0].amount = -1;
t("negative payment amount rejected", V.validateData(d).errors.some(e => e.code === "INVALID_AMOUNT"));
d = clone(); d.payments[0].paymentDate = "2026-02-30";
t("impossible payment date rejected", V.validateData(d).errors.some(e => e.code === "INVALID_DATE"));
d = clone(); d.payments[0].method = "Suitcase of Cash";
t("invalid payment method rejected", V.validateData(d).errors.some(e => e.code === "INVALID_METHOD"));
d = clone(); d.payments[1].id = d.payments[0].id;
t("duplicate payment id rejected", V.validateData(d).errors.some(e => e.code === "DUPLICATE_ID"));
d = clone(); d.payments[0].invoiceId = "INV-DOES-NOT-EXIST";
t("unknown invoice reference rejected", V.validateData(d).errors.some(e => e.code === "UNKNOWN_INVOICE"));

// cross-record overpayment invariant
d = clone(); d.payments.push({ id: "PMT-OVER", invoiceId: d.invoices[0].id, paymentDate: "2026-07-20", amount: d.invoices[0].amount });
t("overpayment across payments rejected", V.validateData(d).errors.some(e => e.code === "OVERPAYMENT"));
d = clone();
d.payments.push({ id: "PMT-EXACT", invoiceId: d.invoices[1].id, paymentDate: "2026-07-20", amount: d.invoices[1].amount - (d.payments.find(p => p.invoiceId === d.invoices[1].id)?.amount || 0) });
t("payment that exactly zeroes balance is accepted", V.validateData(d).ok, JSON.stringify(V.validateData(d).errors?.slice(0, 5)));

// credential-like content is refused anywhere
d = clone(); d.invoices[0].notes = "acct 1234567890";
t("long digit run rejected", V.validateData(d).errors.some(e => e.code === "CREDENTIAL_LIKE"));
d = clone(); d.customers[0].notes = "api_key=abc";
t("key marker rejected", V.validateData(d).errors.some(e => e.code === "CREDENTIAL_LIKE"));
d = clone(); d.payments[0].referenceNumber = "sk-live-ABCDEFGH12345678";
t("stripe-like key in reference number rejected", V.validateData(d).errors.some(e => e.code === "CREDENTIAL_LIKE"));
d = clone(); d.customers[0].billingAddress = "Card 4111111111111111 Main St";
t("card-shaped digit run in address rejected", V.validateData(d).errors.some(e => e.code === "CREDENTIAL_LIKE"));

// errors never leak values
d = clone(); d.invoices[0].notes = "api_key=supersecretvalue";
t("errors carry no field values", !JSON.stringify(V.validateData(d).errors).includes("supersecretvalue"));

// per-record validator (manual-local CRUD gate)
t("validateRecord accepts good customer", V.validateRecord("customer", clone().customers[0]).ok);
t("validateRecord accepts good invoice", V.validateRecord("invoice", clone().invoices[0]).ok);
t("validateRecord accepts good payment", V.validateRecord("payment", clone().payments[0]).ok);
t("validateRecord rejects unknown type", !V.validateRecord("nonsense", {}).ok);
t("validateRecord rejects credential-like record",
  !V.validateRecord("payment", { ...clone().payments[0], notes: "token=1234567890" }).ok);
t("validateRecord rejects unexpected property",
  !V.validateRecord("customer", { ...clone().customers[0], ssn: "123-45-6789" }).ok);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
