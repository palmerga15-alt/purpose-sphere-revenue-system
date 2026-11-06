// ============================================================
// PURPOSEOLOGY IP INTELLIGENCE — BROWSER INTEGRATION TESTS
// (Playwright/Chromium)
// Prereq: serve the repo root, e.g.  python3 -m http.server 8788
// Run:    node dashboard/tests/ip-browser.test.js
//         (optional) BASE_URL=http://127.0.0.1:8788 node ...
//
// Covers: privacy-locked default shared across Finance, Billing,
// and IP Intelligence · all 5 panels render · manual-local CRUD ·
// the IP_LEAK_PATTERN rejection on local writes · renewal/expiry
// calendar math · ERROR degradation without breaking the rest of
// the Command Center · zero JavaScript errors.
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
const IP_PANELS = ["panel-ip-overview", "panel-ip-registry", "panel-ip-licenses",
  "panel-ip-compliance", "panel-ip-calendar"];

function attachErrorSink(page, errors) {
  page.on("pageerror", e => errors.push(String(e)));
  page.on("console", m => {
    if (m.type() !== "error") return;
    const url = m.location().url || "";
    const txt = m.text() || "";
    if (url.includes("favicon")) return;
    if (/Failed to load resource/i.test(txt)) return;
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
    for (const id of ["ip-section-head", ...IP_PANELS])
      t(`renders #${id}`, await page.locator("#" + id).count() === 1);

    t("default adapter mode is sample", await page.evaluate(() => window.IPAdapter.currentMode()) === "sample");
    t("state is SAMPLE", await page.evaluate(() => window.IPModule.state) === "SAMPLE");

    // Privacy is the SHARED state across all three modules
    t("privacy boots ON", await page.evaluate(() => document.body.classList.contains("privacy")));
    for (const id of IP_PANELS) {
      const sensitiveHidden = !(await page.locator(`#${id} .ip-sensitive`).isVisible());
      const noticeShown = await page.locator(`#${id} .ip-privacy-msg`).isVisible();
      t(`#${id} masked while locked`, sensitiveHidden && noticeShown);
    }

    const toggle = page.locator("#ip-privacy-toggle");
    t("in-section privacy toggle exists", await toggle.count() === 1);
    t("toggle labeled 'Privacy Mode: ON' while locked", (await toggle.innerText()).includes("Privacy Mode: ON"));
    await toggle.click();
    await page.waitForTimeout(120);
    t("clicking toggle turns privacy OFF", await page.evaluate(() => !document.body.classList.contains("privacy")));
    t("all 5 panels' content visible after toggle",
      (await Promise.all(IP_PANELS.map(id => page.locator(`#${id} .ip-sensitive`).isVisible()))).every(Boolean));
    t("this also revealed the Billing section (shared state)",
      await page.locator("#bill-privacy-toggle").innerText().then(x => x.includes("Privacy Mode: OFF")));
    t("this also revealed the Financial Intelligence section (shared state)",
      await page.locator("#fin-privacy-toggle").innerText().then(x => x.includes("Privacy Mode: OFF")));

    await page.locator("#ip-lock-btn").click();
    await page.waitForTimeout(100);
    t("LOCK IP PANELS re-engages privacy", await page.evaluate(() => document.body.classList.contains("privacy")));
    t("toggle syncs to ON after LOCK button", (await toggle.innerText()).includes("Privacy Mode: ON"));
    await toggle.click();
    await page.waitForTimeout(100);

    // ---- compliance scan panel shows a real, clean result ----
    const complianceText = await page.locator("#panel-ip-compliance").innerText();
    t("compliance panel reports CLEAN", complianceText.includes("CLEAN"));
    const scanModel = await page.evaluate(() => window.IPModule.model.scan);
    t("compliance scan model reflects a real, clean scan", scanModel.clean === true && scanModel.filesScanned > 0, scanModel);

    // ---- overview KPIs ----
    const overviewText = await page.locator("#panel-ip-overview").innerText();
    t("overview shows registered marks", overviewText.includes("REGISTERED MARKS"));
    t("overview shows active licenses", overviewText.includes("ACTIVE LICENSES"));

    // ---- manual-local mode: CRUD + the IP_LEAK_PATTERN rejection ----
    await page.evaluate(() => {
      window.IPLocal.eraseAll();
      window.IPAdapter.setMode("manual-local");
    });
    await page.evaluate(() => window.IPModule.rerender());
    await page.waitForTimeout(200);
    t("manual-local renders LOCAL state", await page.evaluate(() => window.IPModule.state) === "LOCAL");
    t("manual-local entry panel present", await page.locator("#panel-ip-entry").count() === 1);

    const assetRes = await page.evaluate(() => window.IPLocal.add("asset", {
      markText: "Test Mark", type: "TRADEMARK", status: "PENDING"
    }));
    t("asset creation accepted", assetRes.ok === true, assetRes);

    const licenseRes = await page.evaluate(() => window.IPLocal.add("license", {
      licenseeName: "Test Licensee", licenseType: "CERTIFIED_PRACTITIONER", status: "ACTIVE",
      expirationDate: "2026-12-01", feeTier: 3495
    }));
    t("license creation accepted", licenseRes.ok === true, licenseRes);

    const leakRes = await page.evaluate(() => window.IPLocal.add("asset", {
      markText: "Test Mark 2", type: "TRADEMARK", status: "PENDING",
      notes: "Concept 3: this defines the internal concept in full."
    }));
    t("IP-leak-pattern local write rejected", leakRes.ok === false && leakRes.errors.some(e => e.code === "IP_LEAK_PATTERN"), leakRes);

    const credRes = await page.evaluate(() => window.IPLocal.add("license", {
      licenseeName: "Test Licensee 2", licenseType: "OTHER", status: "ACTIVE", notes: "token=1234567890"
    }));
    t("credential-like local write rejected", credRes.ok === false && credRes.errors.some(e => e.code === "CREDENTIAL_LIKE"), credRes);

    await page.evaluate(() => window.IPModule.rerender());
    await page.waitForTimeout(150);
    t("new asset appears in local list", (await page.locator("#ip-local-lists").innerText()).includes("Test Mark"));

    // ---- renewal/expiry calendar math ----
    const calModel = await page.evaluate(() => window.IPModule.model.calendar);
    t("calendar includes the license expiry we just added", calModel.some(e => e.type === "LICENSE_EXPIRY" && e.label.includes("Test Licensee")), calModel);

    await page.evaluate(() => { window.IPLocal.eraseAll(); window.IPAdapter.setMode("sample"); });
    await page.evaluate(() => window.IPModule.rerender());
    await page.waitForTimeout(150);
    t("erase local IP data empties the store", await page.evaluate(() => window.IPLocal.count()) === 0);

    // ---- malformed source data: ERROR must not break the Command Center ----
    await page.evaluate(async () => {
      window.__goodIP = window.IP_DATA;
      window.IP_DATA = { schemaVersion: 42, hacked: true };
      await window.IPModule.rerender();
    });
    await page.waitForTimeout(150);
    t("invalid IP data -> ERROR state", await page.evaluate(() => window.IPModule.state) === "ERROR");
    t("rejected payload not rendered", !(await page.locator("#panel-ip-registry").innerHTML()).includes("hacked"));
    t("base Command Center still renders (pipeline)", await page.locator("#panel-pipeline").count() === 1);
    t("Billing module still renders independently", await page.locator("#panel-bill-overview").count() === 1);
    t("Financial Intelligence module still renders independently", await page.locator("#panel-fin-snapshot").count() === 1);
    await page.evaluate(async () => { window.IP_DATA = window.__goodIP; await window.IPModule.rerender(); });
    await page.waitForTimeout(150);
    t("recovers to SAMPLE after restore", await page.evaluate(() => window.IPModule.state) === "SAMPLE");

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
    t("[mobile] all IP panels render",
      (await Promise.all(IP_PANELS.map(id => page.locator("#" + id).count()))).every(c => c === 1));
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
    await page.addInitScript(() => { window.IP_CONFIG = { inactivitySeconds: 1 }; });
    await page.goto(URL, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    await page.locator("#ip-privacy-toggle").click();
    await page.waitForTimeout(100);
    t("inactivity: privacy off before idle", await page.evaluate(() => !document.body.classList.contains("privacy")));
    await page.waitForTimeout(1600);
    t("inactivity relock re-engages privacy after idle", await page.evaluate(() => document.body.classList.contains("privacy")));
    t("inactivity relock syncs toggle label to ON",
      (await page.locator("#ip-privacy-toggle").innerText()).includes("Privacy Mode: ON"));
    t("[inactivity] zero JS errors", errors.length === 0, errors);
    await ctx.close();
  }

  await browser.close();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
