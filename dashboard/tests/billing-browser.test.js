// ============================================================
// REVENUE BILLING & ACCOUNTS RECEIVABLE — BROWSER INTEGRATION TESTS
// (Playwright/Chromium)
// Prereq: serve the repo root, e.g.  python3 -m http.server 8788
// Run:    node dashboard/tests/billing-browser.test.js
//         (optional) BASE_URL=http://127.0.0.1:8788 node ...
//
// Covers: default privacy-locked state (shared with Financial
// Intelligence) · unlock/relock via the section toggle and LOCK
// button · all 7 panels render · invoice creation and status
// transitions (draft/sent -> partial -> paid, overdue) · partial
// and full payment handling · overpayment rejection · AR aging
// bucket math · manual-local persistence across reload ·
// malformed-data rejection without breaking the Command Center ·
// zero JavaScript errors.
// ============================================================
const { chromium } = require("playwright");
const BASE = process.env.BASE_URL || "http://127.0.0.1:8788";
const URL = BASE + "/dashboard/index.html";
const EXEC = process.env.CHROMIUM_PATH || "/opt/pw-browsers/chromium";

let pass = 0, fail = 0;
function t(name, cond, detail) {
  if (cond) { pass++; console.log("PASS  " + name); }
  else { fail++; console.log("FAIL  " + name + (detail ? " — " + JSON.stringify(detail) : "")); }
}
const BILL_PANELS = ["panel-bill-overview", "panel-bill-invoices", "panel-bill-aging",
  "panel-bill-payments", "panel-bill-customers", "panel-bill-calendar", "panel-bill-collections"];

function attachErrorSink(page, errors) {
  page.on("pageerror", e => errors.push(String(e)));
  page.on("console", m => {
    if (m.type() !== "error") return;
    const url = m.location().url || "";
    const txt = m.text() || "";
    if (url.includes("favicon")) return;
    if (/Failed to load resource/i.test(txt)) return; // network status log, not a JS error
    errors.push(txt);
  });
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC });

  // ---------- desktop scenario ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const page = await ctx.newPage();
    const errors = [];
    attachErrorSink(page, errors);
    await page.goto(URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);

    t("zero JS errors on load", errors.length === 0, errors);
    for (const id of ["bill-section-head", ...BILL_PANELS])
      t(`renders #${id}`, await page.locator("#" + id).count() === 1);

    t("default adapter mode is sample", await page.evaluate(() => window.BillingAdapter.currentMode()) === "sample");
    t("state is SAMPLE", await page.evaluate(() => window.BillingModule.state) === "SAMPLE");

    // Privacy is the SHARED state — boots ON and masks every billing panel too
    t("privacy boots ON", await page.evaluate(() => document.body.classList.contains("privacy")));
    for (const id of BILL_PANELS) {
      const sensitiveHidden = !(await page.locator(`#${id} .bill-sensitive`).isVisible());
      const noticeShown = await page.locator(`#${id} .bill-privacy-msg`).isVisible();
      t(`#${id} masked while locked`, sensitiveHidden && noticeShown);
    }
    const locked = await page.evaluate(() => document.body.innerText);
    t("customer names concealed while locked", !locked.includes("Acme Purpose Partners"));

    // in-section two-way privacy toggle, scoped to the billing section
    const toggle = page.locator("#bill-privacy-toggle");
    t("in-section privacy toggle exists", await toggle.count() === 1);
    t("toggle labeled 'Privacy Mode: ON' while locked", (await toggle.innerText()).includes("Privacy Mode: ON"));

    await toggle.click();
    await page.waitForTimeout(120);
    t("clicking toggle turns privacy OFF", await page.evaluate(() => !document.body.classList.contains("privacy")));
    const open = await page.evaluate(() => document.body.innerText);
    t("customer names revealed after toggle", open.includes("Acme Purpose Partners"));
    t("all 7 panels' content visible after toggle",
      (await Promise.all(BILL_PANELS.map(id => page.locator(`#${id} .bill-sensitive`).isVisible()))).every(Boolean));
    t("this also revealed the Financial Intelligence section (shared state)",
      await page.locator("#fin-privacy-toggle").innerText().then(x => x.includes("Privacy Mode: OFF")));

    // separate LOCK button
    await page.locator("#bill-lock-btn").click();
    await page.waitForTimeout(100);
    t("LOCK BILLING PANELS re-engages privacy", await page.evaluate(() => document.body.classList.contains("privacy")));
    t("toggle syncs to ON after LOCK button", (await toggle.innerText()).includes("Privacy Mode: ON"));
    await toggle.click();
    await page.waitForTimeout(100);

    // ---- Billing Overview KPI sanity ----
    const overviewText = await page.locator("#panel-bill-overview").innerText();
    t("overview shows total invoiced", overviewText.includes("TOTAL INVOICED"));
    t("overview shows collection rate", overviewText.includes("COLLECTION RATE"));
    t("overview shows avg days to payment", overviewText.includes("AVG DAYS TO PAYMENT"));

    // ---- AR aging bucket math against the known sample dataset ----
    const aging = await page.evaluate(() => window.BillingModule.model.aging.map(b => ({ key: b.key, total: b.total, count: b.count })));
    const byKey = Object.fromEntries(aging.map(b => [b.key, b]));
    t("aging buckets present for all 5 ranges", aging.length === 5, aging);
    t("aging bucket totals are non-negative numbers", aging.every(b => typeof b.total === "number" && b.total >= 0));
    const agingTotal = await page.evaluate(() => window.BillingModule.model.agingTotal);
    const outstanding = await page.evaluate(() => window.BillingModule.model.outstanding);
    t("aging bucket total equals outstanding balance", Math.abs(agingTotal - outstanding) < 0.01, { agingTotal, outstanding });
    t("31-60 bucket captures the known overdue partial invoice (INV-2026-0103)", byKey.b31_60.count === 1 && byKey.b31_60.total > 0, byKey);

    // ---- Invoice Manager: search/filter don't lose input focus ----
    await page.fill("#bill-inv-search", "Harper");
    await page.waitForTimeout(150);
    const rows = await page.locator("#bill-inv-tbody tr").allInnerTexts();
    t("search filters to matching customer only", rows.length > 0 && rows.every(r => r.includes("Harper")), rows);
    t("search input keeps focus after filtering (in-place tbody update)",
      await page.evaluate(() => document.activeElement.id) === "bill-inv-search");
    await page.fill("#bill-inv-search", "");
    await page.selectOption("#bill-inv-status", "overdue");
    await page.waitForTimeout(150);
    const overdueRows = await page.locator("#bill-inv-tbody tr").allInnerTexts();
    t("status filter shows only overdue invoices", overdueRows.length > 0 && overdueRows.every(r => r.includes("OVERDUE")), overdueRows);
    await page.selectOption("#bill-inv-status", "ALL");

    // ---- manual-local mode: full CRUD + invoice status transitions + payments ----
    await page.evaluate(() => {
      window.BillingLocal.eraseAll();
      window.BillingAdapter.setMode("manual-local");
    });
    await page.evaluate(() => window.BillingModule.rerender());
    await page.waitForTimeout(200);
    t("manual-local renders LOCAL state", await page.evaluate(() => window.BillingModule.state) === "LOCAL");
    t("manual-local entry panel present", await page.locator("#panel-bill-entry").count() === 1);

    // create a customer
    const custRes = await page.evaluate(() => window.BillingLocal.add("customer", { name: "Unit Test Customer", paymentTerms: "Net 30" }));
    t("customer creation accepted", custRes.ok === true, custRes);

    // create an invoice (no explicit status -> AUTO)
    const today = await page.evaluate(() => new Date().toISOString().slice(0, 10));
    const pastDue = await page.evaluate(() => { const d = new Date(); d.setDate(d.getDate() - 10); return d.toISOString().slice(0, 10); });
    const invRes = await page.evaluate((pastDue) => window.BillingLocal.add("invoice", {
      customerName: "Unit Test Customer", issueDate: "2026-01-01", dueDate: pastDue, amount: 1000, status: null
    }), pastDue);
    t("invoice creation accepted", invRes.ok === true, invRes);
    const invId = invRes.record.id;

    await page.evaluate(() => window.BillingModule.rerender());
    await page.waitForTimeout(150);
    let invModel = await page.evaluate((id) => window.BillingModule.model.invoices.find(i => i.id === id), invId);
    t("newly created unpaid past-due invoice computes as OVERDUE", invModel.st === "overdue", invModel);

    // partial payment
    const partialRes = await page.evaluate((id) => window.BillingLocal.add("payment", { invoiceId: id, paymentDate: "2026-07-01", amount: 400 }), invId);
    t("partial payment accepted", partialRes.ok === true, partialRes);
    await page.evaluate(() => window.BillingModule.rerender());
    await page.waitForTimeout(150);
    invModel = await page.evaluate((id) => window.BillingModule.model.invoices.find(i => i.id === id), invId);
    // still overdue (unpaid balance + past due date takes priority over partial in the display-status ranking)
    t("partially paid + overdue invoice keeps OVERDUE status", invModel.st === "overdue" && invModel.balance === 600, invModel);

    // overpayment attempt: remaining balance is 600, try to pay 900
    const overpayRes = await page.evaluate((id) => window.BillingLocal.add("payment", { invoiceId: id, paymentDate: "2026-07-02", amount: 900 }), invId);
    t("overpayment beyond remaining balance rejected", overpayRes.ok === false && overpayRes.errors.some(e => e.code === "OVERPAYMENT"), overpayRes);

    // full remaining payment -> PAID
    const finalRes = await page.evaluate((id) => window.BillingLocal.add("payment", { invoiceId: id, paymentDate: "2026-07-02", amount: 600 }), invId);
    t("final payment completing the balance accepted", finalRes.ok === true, finalRes);
    await page.evaluate(() => window.BillingModule.rerender());
    await page.waitForTimeout(150);
    invModel = await page.evaluate((id) => window.BillingModule.model.invoices.find(i => i.id === id), invId);
    t("fully paid invoice computes as PAID with zero balance", invModel.st === "paid" && invModel.balance === 0, invModel);

    // malformed record rejected before it can ever be saved locally
    const badRes = await page.evaluate(() => window.BillingLocal.add("invoice", {
      customerName: "x", issueDate: "2026-01-01", dueDate: "2026-01-15", amount: 10, notes: "acct 1234567890"
    }));
    t("malformed/credential-like local record rejected", badRes.ok === false && badRes.errors.some(e => e.code === "CREDENTIAL_LIKE"), badRes);

    // ---- manual-local persistence across reload ----
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const persistedMode = await page.evaluate(() => window.BillingAdapter.currentMode());
    const persistedCount = await page.evaluate(() => window.BillingLocal.count());
    t("adapter mode persists across reload", persistedMode === "manual-local", persistedMode);
    t("local records persist across reload", persistedCount >= 3, persistedCount);
    const persistedInvoice = await page.evaluate((id) => window.BillingLocal.list("invoice").find(i => i.id === id), invId);
    t("specific invoice survives reload with correct id", !!persistedInvoice, persistedInvoice);

    // clean up local state
    await page.evaluate(() => { window.BillingLocal.eraseAll(); window.BillingAdapter.setMode("sample"); });
    await page.evaluate(() => window.BillingModule.rerender());
    await page.waitForTimeout(150);
    t("erase local billing data empties the store", await page.evaluate(() => window.BillingLocal.count()) === 0);

    // ---- malformed source data: ERROR must not break the Command Center ----
    await page.evaluate(async () => {
      window.__goodBilling = window.BILLING_DATA;
      window.BILLING_DATA = { schemaVersion: 42, hacked: true };
      await window.BillingModule.rerender();
    });
    await page.waitForTimeout(150);
    t("invalid billing data -> ERROR state", await page.evaluate(() => window.BillingModule.state) === "ERROR");
    t("rejected payload not rendered", !(await page.locator("#panel-bill-invoices").innerHTML()).includes("hacked"));
    t("base Command Center still renders (pipeline)", await page.locator("#panel-pipeline").count() === 1);
    t("Financial Intelligence module still renders independently", await page.locator("#panel-fin-snapshot").count() === 1);
    await page.evaluate(async () => { window.BILLING_DATA = window.__goodBilling; await window.BillingModule.rerender(); });
    await page.waitForTimeout(150);
    t("recovers to SAMPLE after restore", await page.evaluate(() => window.BillingModule.state) === "SAMPLE");

    t("zero JS errors after all desktop interactions", errors.length === 0, errors);
    await ctx.close();
  }

  // ---------- mobile scenario ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage();
    const errors = [];
    attachErrorSink(page, errors);
    await page.goto(URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    t("[mobile] zero JS errors", errors.length === 0, errors);
    t("[mobile] all billing panels render",
      (await Promise.all(BILL_PANELS.map(id => page.locator("#" + id).count()))).every(c => c === 1));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    t("[mobile] body has no horizontal overflow", overflow <= 2, { overflow });
    t("[mobile] privacy boots ON", await page.evaluate(() => document.body.classList.contains("privacy")));
    await ctx.close();
  }

  // ---------- inactivity relock scenario (short timer) ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } });
    const page = await ctx.newPage();
    const errors = [];
    attachErrorSink(page, errors);
    await page.addInitScript(() => { window.BILLING_CONFIG = { inactivitySeconds: 1 }; });
    await page.goto(URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    await page.locator("#bill-privacy-toggle").click();
    await page.waitForTimeout(100);
    t("inactivity: privacy off before idle", await page.evaluate(() => !document.body.classList.contains("privacy")));
    await page.waitForTimeout(1600);
    t("inactivity relock re-engages privacy after idle", await page.evaluate(() => document.body.classList.contains("privacy")));
    t("inactivity relock syncs toggle label to ON",
      (await page.locator("#bill-privacy-toggle").innerText()).includes("Privacy Mode: ON"));
    t("[inactivity] zero JS errors", errors.length === 0, errors);
    await ctx.close();
  }

  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
