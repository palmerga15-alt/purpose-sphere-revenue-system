// ============================================================
// FINANCIAL INTELLIGENCE — BROWSER INTEGRATION TESTS (Playwright/Chromium)
// Prereq: serve the repo root, e.g.  python3 -m http.server 8788
// Run:    node dashboard/tests/finance-browser.test.js
//         (optional) BASE_URL=http://127.0.0.1:8788 node ...
//
// Covers: all panels render · Privacy Mode boots locked and masks
// every sensitive financial field across all 7 panels · manual +
// inactivity relock · sample / manual-local / secure-api adapter
// modes · disconnected (ERROR) degradation without breaking the
// Command Center · desktop + mobile layouts · zero console errors.
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
const FIN_PANELS = ["panel-fin-snapshot", "panel-finance", "panel-fin-expense",
  "panel-fin-subs", "panel-fin-revenue", "panel-fin-calendar", "panel-fin-insights"];

function attachErrorSink(page, errors) {
  // Real JavaScript errors only. The browser also emits console "error"
  // entries for network responses (e.g. the intentional 401 from the
  // secure-api expiry test double) and favicon 404s — those are not JS
  // errors, so they are filtered out here.
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
    for (const id of ["fin-section-head", ...FIN_PANELS])
      t(`renders #${id}`, await page.locator("#" + id).count() === 1);

    t("default adapter mode is sample", await page.evaluate(() => window.FinanceAdapter.currentMode()) === "sample");
    t("state is SAMPLE", await page.evaluate(() => window.FinanceModule.state) === "SAMPLE");

    // Privacy boots ON and masks EVERY finance panel
    t("privacy boots ON", await page.evaluate(() => document.body.classList.contains("privacy")));
    for (const id of FIN_PANELS) {
      const sensitiveHidden = !(await page.locator(`#${id} .fin-sensitive`).isVisible());
      const noticeShown = await page.locator(`#${id} .fin-privacy-msg`).isVisible();
      t(`#${id} masked while locked`, sensitiveHidden && noticeShown);
    }
    const locked = await page.evaluate(() => document.body.innerText);
    t("vendors concealed while locked", !locked.includes("LearnSphere Academy"));
    t("amounts blurred class present", await page.locator("body.privacy .money").count() > 0);

    // ---- BUG FIX: in-section two-way "Privacy Mode" toggle ----
    const toggle = page.locator("#fin-privacy-toggle");
    t("in-section privacy toggle exists", await toggle.count() === 1);
    t("toggle labeled 'Privacy Mode: ON' while locked", (await toggle.innerText()).includes("Privacy Mode: ON"));
    t("toggle has .on class while locked", (await toggle.getAttribute("class")).includes("on"));

    // clicking the toggle must REVEAL (this is the reported broken flow)
    await toggle.click();
    await page.waitForTimeout(120);
    t("clicking toggle turns privacy OFF", await page.evaluate(() => !document.body.classList.contains("privacy")));
    t("toggle relabels to 'Privacy Mode: OFF'", (await toggle.innerText()).includes("Privacy Mode: OFF"));
    const open = await page.evaluate(() => document.body.innerText);
    t("vendors revealed after toggle", open.includes("LearnSphere Academy"));
    t("all 7 panels' content visible after toggle",
      (await Promise.all(FIN_PANELS.map(id => page.locator(`#${id} .fin-sensitive`).isVisible()))).every(Boolean));

    // clicking again must RE-LOCK
    await toggle.click();
    await page.waitForTimeout(120);
    t("clicking toggle again turns privacy ON", await page.evaluate(() => document.body.classList.contains("privacy")));
    t("toggle relabels to 'Privacy Mode: ON'", (await toggle.innerText()).includes("Privacy Mode: ON"));
    t("panels masked again after re-lock", !(await page.locator("#panel-finance .fin-sensitive").isVisible()));

    // reveal again via the toggle for the following checks
    await toggle.click();
    await page.waitForTimeout(100);
    t("toggle reveal works a second time", await page.evaluate(() => !document.body.classList.contains("privacy")));

    // separate LOCK button still performs an immediate hide, and keeps the toggle in sync
    await page.locator("#fin-lock-btn").click();
    await page.waitForTimeout(100);
    t("LOCK FINANCIAL PANELS re-engages privacy", await page.evaluate(() => document.body.classList.contains("privacy")));
    t("toggle syncs to ON after LOCK button", (await toggle.innerText()).includes("Privacy Mode: ON"));

    // header global toggle stays in sync with the in-section toggle
    await page.evaluate(() => window.setPrivacy(false));
    await page.waitForTimeout(100);
    t("in-section toggle syncs when header control changes privacy", (await toggle.innerText()).includes("Privacy Mode: OFF"));

    // ---- manual-local mode ----
    await page.evaluate(() => {
      window.FinanceLocal.eraseAll();
      window.FinanceAdapter.setMode("manual-local");
    });
    let addRes = await page.evaluate(() => window.FinanceLocal.add("payment", {
      vendor: "Test Vendor", description: "Unit-test expense", category: "Software & AI Tools",
      amount: 42, dueDate: "2026-08-15", frequency: "MONTHLY", status: null
    }));
    t("manual-local add accepts valid record", addRes.ok === true, addRes);
    let badRes = await page.evaluate(() => window.FinanceLocal.add("payment", {
      vendor: "Bad", description: "x", category: "Software & AI Tools",
      amount: 1, dueDate: "2026-08-15", frequency: "MONTHLY", notes: "api_key=1234567890"
    }));
    t("manual-local rejects credential-like record", badRes.ok === false);
    await page.evaluate(() => window.FinanceModule.rerender());
    await page.waitForTimeout(150);
    t("manual-local renders LOCAL state", await page.evaluate(() => window.FinanceModule.state) === "LOCAL");
    // the two-way toggle must work in manual-local mode too — start from a known locked state
    await page.evaluate(() => window.setPrivacy(true));
    await page.waitForTimeout(100);
    t("[manual-local] toggle present & labeled ON", (await page.locator("#fin-privacy-toggle").innerText()).includes("Privacy Mode: ON"));
    await page.locator("#fin-privacy-toggle").click();
    await page.waitForTimeout(120);
    t("[manual-local] toggle reveals local data", await page.evaluate(() => !document.body.classList.contains("privacy")));
    t("manual-local record appears in tracker", (await page.locator("#panel-finance").innerText()).includes("Test Vendor"));
    t("manual-local entry panel present", await page.locator("#panel-fin-entry").count() === 1);
    await page.evaluate(() => { window.FinanceLocal.eraseAll(); window.FinanceAdapter.setMode("sample"); });

    // ---- secure-api mode: CONNECTED then EXPIRED ----
    const livePayload = await page.evaluate(() => {
      const d = JSON.parse(JSON.stringify(window.FINANCE_DATA));
      d.source = { mode: "live", label: "LIVE (test double)" };
      return JSON.stringify(d);
    });
    let tokenSeenInUrl = false;
    await page.route("**/api/finance-test", route => {
      const req = route.request();
      if ((req.url() || "").includes("test-token")) tokenSeenInUrl = true;
      const auth = req.headers()["authorization"] || "";
      if (page.__mode401) return route.fulfill({ status: 401, contentType: "application/json", body: "{}" });
      if (!auth.startsWith("Bearer ")) return route.fulfill({ status: 401, contentType: "application/json", body: "{}" });
      return route.fulfill({ status: 200, contentType: "application/json", body: livePayload });
    });
    await page.evaluate(() => {
      window.FINANCE_CONFIG = { apiEndpoint: "/api/finance-test" };
      window.FinanceApiClient.setSessionToken("test-token");
      window.FinanceAdapter.setMode("secure-api");
    });
    t("secure-api available once endpoint injected", await page.evaluate(() => window.FinanceAdapter.secureAvailable()) === true);
    await page.evaluate(() => window.FinanceModule.rerender());
    await page.waitForTimeout(250);
    t("secure-api CONNECTED with valid live payload", await page.evaluate(() => window.FinanceModule.state) === "CONNECTED");
    t("token never placed in request URL", tokenSeenInUrl === false);
    await page.evaluate(() => window.setPrivacy(false));
    t("connected live badge shown", (await page.locator("#panel-fin-snapshot").innerHTML()).includes("LIVE DATA"));

    // expire the session -> the endpoint now answers 401 -> EXPIRED + auto relock
    page.__mode401 = true;
    await page.evaluate(() => window.FinanceApiClient.setSessionToken("test-token"));
    await page.evaluate(() => window.FinanceModule.rerender());
    await page.waitForTimeout(250);
    t("secure-api EXPIRED on 401", await page.evaluate(() => window.FinanceModule.state) === "EXPIRED");
    t("EXPIRED forces privacy relock", await page.evaluate(() => document.body.classList.contains("privacy")));
    t("no financial model rendered when EXPIRED", await page.evaluate(() => window.FinanceModule.model) === null);
    await page.unroute("**/api/finance-test");
    await page.evaluate(() => { delete window.FINANCE_CONFIG; window.FinanceAdapter.setMode("sample"); window.FinanceModule.rerender(); });

    // ---- disconnected / unavailable: ERROR must not break the Command Center ----
    await page.evaluate(async () => {
      window.__good = window.FINANCE_DATA;
      window.FINANCE_DATA = { schemaVersion: 42, hacked: true };
      await window.FinanceModule.rerender();
    });
    await page.waitForTimeout(150);
    t("invalid/disconnected data -> ERROR state", await page.evaluate(() => window.FinanceModule.state) === "ERROR");
    t("rejected payload not rendered", !(await page.locator("#panel-finance").innerHTML()).includes("hacked"));
    t("base Command Center still renders (pipeline)", await page.locator("#panel-pipeline").count() === 1);
    t("base Command Center still renders (briefing)", await page.locator("#panel-briefing").count() === 1);
    await page.evaluate(async () => { window.FINANCE_DATA = window.__good; await window.FinanceModule.rerender(); });
    t("recovers to SAMPLE after restore", await page.evaluate(() => window.FinanceModule.state) === "SAMPLE");

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
    t("[mobile] all finance panels render",
      (await Promise.all(FIN_PANELS.map(id => page.locator("#" + id).count()))).every(c => c === 1));
    // no horizontal overflow of the body on a phone viewport
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
    await page.addInitScript(() => { window.FINANCE_CONFIG = { inactivitySeconds: 1 }; });
    await page.goto(URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    // reveal via the in-section toggle, then go idle
    await page.locator("#fin-privacy-toggle").click();
    await page.waitForTimeout(100);
    t("inactivity: privacy off before idle", await page.evaluate(() => !document.body.classList.contains("privacy")));
    // stay completely idle past the 1s inactivity window
    await page.waitForTimeout(1600);
    t("inactivity relock re-engages privacy after idle", await page.evaluate(() => document.body.classList.contains("privacy")));
    t("inactivity relock syncs toggle label to ON",
      (await page.locator("#fin-privacy-toggle").innerText()).includes("Privacy Mode: ON"));
    t("[inactivity] zero JS errors", errors.length === 0, errors);
    await ctx.close();
  }

  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
