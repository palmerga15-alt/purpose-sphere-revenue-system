// ============================================================
// PURPOSE SPHERE COMMAND CENTER — FINANCIAL INTELLIGENCE MODULE
// Phase 2. Renders the BUSINESS FINANCIAL INTELLIGENCE section
// from whatever the adapter layer supplies:
//
//   FinanceValidate  → schema/contract validation (gatekeeper)
//   FinanceLocal     → browser-local manual records
//   FinanceApiClient → secure authenticated backend client
//   FinanceAdapter   → mode resolution + load()
//   FinanceModule    → this file: model math + rendering only
//
// The UI paints one of these states and never needs changes when
// the data source switches:
//   SAMPLE | LOCAL | CONNECTED | SIGNED_OUT | LOADING | EXPIRED | ERROR
//
// Security behaviors owned here:
//   - re-render in place (panels swap between the same grid
//     anchors; layout identical in every mode)
//   - "LOCK FINANCIAL PANELS" button → Privacy Mode on
//   - inactivity relock (FINANCE_CONFIG.inactivitySeconds, 300s
//     default) → Privacy Mode on
//   - EXPIRED session → panels relock automatically, no data
//   - no financial values or tokens in logs, URLs, or errors
//
// Full architecture: dashboard/FINANCE-ARCHITECTURE.md
// ============================================================
window.FinanceModule = (function () {
  "use strict";

  const MS_DAY = 86400000;

  // ---------- pure helpers ----------
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = v => v ? `<span class="money">${esc(v)}</span>` : "";
  const safe = (fn, fb = "") => { try { return fn(); } catch (e) { console.error("[finance] render step failed"); return fb; } };
  const parseDay = s => {
    const [y, m, d] = String(s || "").split("-").map(Number);
    return (y && m && d) ? new Date(y, m - 1, d) : null;
  };
  const startOfToday = () => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate());
  };
  const fmtAmt = n => (typeof n === "number")
    ? "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : "—";
  const sum = (list, f) => list.reduce((t, x) => t + (typeof f(x) === "number" ? f(x) : 0), 0);

  // Status auto-calcs from due date; only manual PAID / CANCELLED override it.
  function effectiveStatus(p, today) {
    const manual = String(p.status || "").toUpperCase();
    if (manual === "PAID" || manual === "CANCELLED") return manual;
    const due = parseDay(p.dueDate);
    if (!due) return "DUE";
    const days = Math.round((due - today) / MS_DAY);
    if (days < 0) return "OVERDUE";
    if (days <= 7) return "DUE SOON";
    return "DUE";
  }

  // ---------- model: every number the panels show, derived in one place ----------
  function buildModel(F) {
    const today = startOfToday();
    const daysUntil = d => d ? Math.round((d - today) / MS_DAY) : null;
    const inThisMonth = d => d && d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth();

    const payments = (F.payments || []).map(p => ({
      ...p, st: effectiveStatus(p, today), due: parseDay(p.dueDate)
    }));
    const isUnpaid = r => r.st !== "PAID" && r.st !== "CANCELLED";
    const unpaid = payments.filter(isUnpaid);
    const overdue = unpaid.filter(r => r.st === "OVERDUE");
    const due7 = unpaid.filter(r => { const d = daysUntil(r.due); return d !== null && d >= 0 && d <= 7; });
    const dueMonth = unpaid.filter(r => inThisMonth(r.due));
    const paidMonth = payments.filter(r => r.st === "PAID" && inThisMonth(parseDay(r.paidDate) || r.due));
    const recurringPays = payments.filter(r => r.st !== "CANCELLED" && String(r.frequency).toUpperCase() === "MONTHLY");
    const upcoming30 = unpaid.filter(r => { const d = daysUntil(r.due); return d !== null && d >= 0 && d <= 30; });

    const rank = r => isUnpaid(r) ? 0 : (r.st === "PAID" ? 1 : 2);
    const rows = [...payments].sort((a, b) =>
      rank(a) - rank(b) ||
      ((a.due?.getTime() ?? Infinity) - (b.due?.getTime() ?? Infinity)) * (rank(a) === 1 ? -1 : 1));

    const groups = F.expenseGroups || [];
    const mapCat = F.categoryGroups || {};
    const monthActivity = payments.filter(r => r.st !== "CANCELLED" &&
      inThisMonth(r.st === "PAID" ? (parseDay(r.paidDate) || r.due) : r.due));
    const byGroup = groups.map(name => ({
      name,
      total: sum(monthActivity.filter(p => (mapCat[p.category] || "Miscellaneous") === name), p => p.amount)
    }));
    const monthExpenses = sum(byGroup, g => g.total);
    const maxGroup = Math.max(1, ...byGroup.map(g => g.total));
    byGroup.forEach(g => {
      g.pct = monthExpenses ? Math.round((g.total / monthExpenses) * 1000) / 10 : 0;
      g.pctOfMax = Math.round((g.total / maxGroup) * 100);
    });

    const subs = (F.subscriptions || []).map(s => ({ ...s }));
    const tagCount = {};
    subs.forEach(s => (s.purposeTags || []).forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; }));
    subs.forEach(s => { s.dupTags = (s.purposeTags || []).filter(t => tagCount[t] > 1); });
    const dupGroups = Object.keys(tagCount).filter(t => tagCount[t] > 1);
    subs.sort((a, b) => (parseDay(a.renewalDate)?.getTime() ?? Infinity) - (parseDay(b.renewalDate)?.getTime() ?? Infinity));
    const subsMonthly = sum(subs, s => s.monthlyCost);
    const subsAnnual = sum(subs, s => (typeof s.annualCost === "number" ? s.annualCost : (s.monthlyCost || 0) * 12));

    const revStreams = (F.revenue && F.revenue.streams) || [];
    const monthlyRevenue = sum(revStreams, s => s.monthTotal);

    const events = [];
    unpaid.forEach(r => events.push({
      date: r.dueDate, d: r.due, label: `${r.vendor} — ${r.description}`,
      type: r.calendarType || "BILL", amount: r.amount
    }));
    subs.forEach(s => {
      const d = parseDay(s.renewalDate);
      if (d && daysUntil(d) >= 0) events.push({
        date: s.renewalDate, d, label: `${s.vendor} renewal${s.autoRenew ? " (auto)" : ""}`,
        type: "RENEWAL", amount: s.monthlyCost
      });
    });
    (F.calendarEvents || []).forEach(e => {
      const d = parseDay(e.date);
      if (d && daysUntil(d) >= 0) events.push({ date: e.date, d, label: e.label, type: e.type || "EVENT", amount: e.amountEstimate });
    });
    events.sort((a, b) => (a.d?.getTime() ?? Infinity) - (b.d?.getTime() ?? Infinity));
    const calendar = events.filter(e => e.d && daysUntil(e.d) >= 0).slice(0, 12);

    const outstanding = sum(unpaid, r => r.amount);
    const netCashFlow = monthlyRevenue - monthExpenses;
    // Health score (documented in FINANCE-ARCHITECTURE.md):
    // 100 − 15/overdue (cap 30) − 20 if net ≤ 0 − 5/dup group (cap 15)
    //     − 10 if bills due in 7 days exceed half of monthly revenue
    let health = 100;
    health -= Math.min(30, overdue.length * 15);
    if (netCashFlow <= 0) health -= 20;
    health -= Math.min(15, dupGroups.length * 5);
    if (sum(due7, r => r.amount) > monthlyRevenue * 0.5) health -= 10;
    health = Math.max(0, health);
    const healthBand = health >= 80 ? "STRONG" : health >= 60 ? "STABLE" : "NEEDS ATTENTION";

    return {
      today, payments, rows, unpaid, overdue, due7, dueMonth, paidMonth, recurringPays, upcoming30,
      byGroup, monthExpenses, subs, dupGroups, subsMonthly, subsAnnual,
      revStreams, monthlyRevenue, calendar, outstanding, netCashFlow, health, healthBand
    };
  }

  // ---------- adapter-state presentation ----------
  const STATE_META = {
    SAMPLE:     { chip: "SAMPLE DATA",              chipCls: "st-sample", badge: { cls: "badge-sample", text: "◆ SAMPLE DATA" } },
    LOCAL:      { chip: "MANUAL LOCAL DATA",        chipCls: "st-local",  badge: { cls: "badge-local",  text: "◆ LOCAL DEVICE DATA" } },
    CONNECTED:  { chip: "SECURELY CONNECTED",       chipCls: "st-live",   badge: { cls: "badge-online", text: "● LIVE DATA" } },
    SIGNED_OUT: { chip: "SIGNED OUT · SAMPLE SHOWN", chipCls: "st-sample", badge: { cls: "badge-sample", text: "◆ SAMPLE DATA" } },
    LOADING:    { chip: "CONNECTING…",              chipCls: "st-local",  badge: { cls: "badge-sample", text: "◌ LOADING" } },
    EXPIRED:    { chip: "SESSION EXPIRED",          chipCls: "st-err",    badge: { cls: "badge-offline", text: "○ LOCKED" } },
    ERROR:      { chip: "CONNECTION ERROR",         chipCls: "st-err",    badge: { cls: "badge-offline", text: "○ NO DATA" } }
  };
  const OFFLINE_MSG = {
    EXPIRED: "SESSION EXPIRED — REAUTHENTICATE WITH THE SECURE BACKEND TO RESUME<br>NO FINANCIAL DATA IS DISPLAYED",
    ERROR: "DATA UNAVAILABLE — SOURCE FAILED OR WAS REJECTED BY VALIDATION<br>NOTHING RENDERS UNTIL A VALID PAYLOAD ARRIVES",
    LOADING: "ESTABLISHING SECURE CONNECTION…"
  };

  // ---------- module state ----------
  let grid = null, sentinel = null, nodes = [];
  let securityArmed = false, inactivityTimer = null;
  let entryType = "payment", editKey = null;

  const PANEL_TITLES = [
    ["panel-fin-snapshot", "EXECUTIVE FINANCIAL SNAPSHOT", "wide"],
    ["panel-finance", "PAYMENT TRACKER", "wide"],
    ["panel-fin-expense", "EXPENSE INTELLIGENCE", ""],
    ["panel-fin-subs", "SUBSCRIPTION MANAGER", ""],
    ["panel-fin-revenue", "REVENUE DASHBOARD", ""],
    ["panel-fin-calendar", "FINANCIAL CALENDAR", ""],
    ["panel-fin-insights", "AI FINANCIAL INSIGHTS", "wide"]
  ];

  function makePanel({ id, title, cls = "", badge, bodyHTML, offlineMsg }) {
    const el = document.createElement("section");
    el.className = `panel fin-panel ${cls}`;
    el.id = id;
    const badgeHTML = badge ? `<span class="panel-badge ${esc(badge.cls)}">${esc(badge.text)}</span>` : "";
    el.innerHTML = `
      <div class="panel-head">
        <span class="panel-title">${esc(title)}</span>
        ${badgeHTML}
      </div>
      <div class="panel-body">${offlineMsg !== undefined
        ? `<div class="panel-offline-msg">${offlineMsg}</div>`
        : bodyHTML}</div>`;
    return el;
  }

  // Privacy Mode: content sits inside .fin-sensitive, hidden by body.privacy
  // in favor of the .fin-privacy-msg notice.
  const priv = inner => `
    <div class="fin-privacy-msg">🔒 PRIVATE FINANCIAL DATA HIDDEN<span class="sub2">TURN PRIVACY OFF TO VIEW AND MANAGE FINANCES</span></div>
    <div class="fin-sensitive">${inner}</div>`;

  // ---------- section header w/ connection-status control ----------
  function makeHead(state) {
    const meta = STATE_META[state] || STATE_META.ERROR;
    const mode = window.FinanceAdapter.currentMode();
    const secure = window.FinanceAdapter.secureAvailable();
    const head = document.createElement("div");
    head.className = "section-head";
    head.id = "fin-section-head";
    head.innerHTML = `
      <span class="sh-title">◈ BUSINESS FINANCIAL INTELLIGENCE</span>
      <span class="fin-controls">
        <span class="fin-state-chip ${meta.chipCls}" id="fin-state-chip">${esc(meta.chip)}</span>
        <button class="fin-mode-btn ${mode === "sample" ? "active" : ""}" data-mode="sample" title="Fictional demo data from the public repo">SAMPLE</button>
        <button class="fin-mode-btn ${mode === "manual-local" ? "active" : ""}" data-mode="manual-local" title="Records stored only in this browser">LOCAL</button>
        ${secure ? `<button class="fin-mode-btn ${mode === "secure-api" ? "active" : ""}" data-mode="secure-api" title="Private authenticated backend">SECURE</button>` : ""}
        <button class="fin-lock-btn" id="fin-lock-btn" title="Enable Privacy Mode immediately">🔒 LOCK FINANCIAL PANELS</button>
      </span>`;
    return head;
  }

  // ---------- data-panel builders (Phase 1 layout, unchanged) ----------
  function buildDataPanels(F, m, badge) {
    const out = [];
    const monthName = new Date().toLocaleString("en-US", { month: "long" }).toUpperCase();
    const finCard = (cls, val, label, sub) => `
      <div class="fin-card ${cls}">
        <div class="n money">${esc(val)}</div>
        <div class="l">${esc(label)}</div>
        <div class="sub">${esc(sub)}</div>
      </div>`;

    // 1. snapshot
    out.push(makePanel({
      id: "panel-fin-snapshot", title: "EXECUTIVE FINANCIAL SNAPSHOT", cls: "wide", badge,
      bodyHTML: priv(`
        <div class="fin-cards">
          ${finCard("c-cash", F.snapshot?.cashAvailable != null ? fmtAmt(F.snapshot.cashAvailable) : "—", "CASH AVAILABLE", F.snapshot?.cashNote || "AWAITING SECURE BANK LINK")}
          ${finCard("c-paid", fmtAmt(m.monthlyRevenue), "MONTHLY REVENUE", m.revStreams.length + " STREAMS · " + monthName)}
          ${finCard("c-due7", fmtAmt(m.monthExpenses), "MONTHLY EXPENSES", monthName + " ACTIVITY")}
          ${finCard(m.netCashFlow >= 0 ? "c-paid" : "c-overdue", fmtAmt(m.netCashFlow), "NET CASH FLOW", "REVENUE − EXPENSES")}
          ${finCard("c-month", fmtAmt(m.outstanding), "OUTSTANDING PAYMENTS", m.unpaid.length + " UNPAID ITEMS")}
          ${finCard("c-due7", fmtAmt(sum(m.upcoming30, r => r.amount)), "UPCOMING BILLS", "NEXT 30 DAYS · " + m.upcoming30.length + " ITEMS")}
          ${finCard(m.health >= 80 ? "c-paid" : m.health >= 60 ? "c-due7" : "c-overdue", m.health + " / 100", "BUSINESS HEALTH SCORE", m.healthBand)}
        </div>`)
    }));

    // 2. payment tracker
    const trkCard = (cls, val, label, count) => `
      <div class="fin-card ${cls}">
        <div class="n money">${esc(fmtAmt(val))}</div>
        <div class="l">${esc(label)}</div>
        <div class="sub">${count} ${count === 1 ? "PAYMENT" : "PAYMENTS"}</div>
      </div>`;
    out.push(makePanel({
      id: "panel-finance", title: "PAYMENT TRACKER", cls: "wide", badge,
      bodyHTML: priv(`
        <div class="fin-cards">
          ${trkCard("c-due7", sum(m.due7, r => r.amount), "DUE NEXT 7 DAYS", m.due7.length)}
          ${trkCard("c-month", sum(m.dueMonth, r => r.amount), "DUE THIS MONTH", m.dueMonth.length)}
          ${trkCard("c-paid", sum(m.paidMonth, r => r.amount), "PAID THIS MONTH", m.paidMonth.length)}
          ${trkCard("c-recur", sum(m.recurringPays, r => r.amount), "MONTHLY RECURRING", m.recurringPays.length)}
          ${trkCard("c-overdue", sum(m.overdue, r => r.amount), "OVERDUE", m.overdue.length)}
        </div>
        <table class="fin-table">
          <tr>
            <th>VENDOR</th><th>EXPENSE</th><th>CATEGORY</th><th>AMOUNT</th><th>DUE DATE</th>
            <th>FREQ</th><th>STATUS</th><th>BUSINESS / PROJECT</th><th>METHOD</th><th>NOTES</th><th>RECEIPT</th>
          </tr>
          ${m.rows.length ? m.rows.map(r => `
            <tr class="${r.st === "CANCELLED" ? "row-cancelled" : ""}">
              <td class="white">${esc(r.vendor)}</td>
              <td class="dim">${esc(r.description)}</td>
              <td class="dim">${esc(r.category)}</td>
              <td>${money(fmtAmt(r.amount))}</td>
              <td class="${r.st === "OVERDUE" ? "white" : "dim"}">${esc(r.dueDate || "—")}${r.st === "PAID" && r.paidDate ? ` <span class="dim">· pd ${esc(r.paidDate)}</span>` : ""}</td>
              <td class="dim">${esc(r.frequency || "—")}</td>
              <td><span class="pay-status ps-${esc(r.st.replace(" ", "-"))}">${esc(r.st)}</span></td>
              <td class="dim">${esc(r.business || "—")}</td>
              <td class="dim">${esc(r.paymentMethod || "—")}</td>
              <td class="dim">${esc(r.notes || "")}</td>
              <td class="dim">${esc(r.receiptRef || "—")}</td>
            </tr>`).join("") : `<tr><td colspan="11" class="dim">NO RECORDS IN THIS SOURCE YET</td></tr>`}
        </table>
        <div class="dim fin-footnote">${esc(F.source?.label || "")} · STATUS AUTO-CALCULATED FROM DUE DATE UNLESS MARKED PAID / CANCELLED · NO ACCOUNT NUMBERS OR CREDENTIALS STORED IN THIS MODULE</div>`)
    }));

    // 3. expense intelligence
    out.push(makePanel({
      id: "panel-fin-expense", title: "EXPENSE INTELLIGENCE", badge,
      bodyHTML: priv(`
        ${m.byGroup.map(g => `
          <div class="fin-bar-row">
            <div class="fb-label ${g.total ? "white" : "dim"}">${esc(g.name)}</div>
            <div class="fin-bar"><div class="fin-bar-fill" style="width:${g.pctOfMax}%"></div></div>
            <div class="fb-amt">${money(fmtAmt(g.total))}</div>
            <div class="fb-pct dim">${esc(g.pct)}%</div>
          </div>`).join("")}
        <div class="dim fin-footnote">${esc(monthName)} TOTAL <span class="money">${esc(fmtAmt(m.monthExpenses))}</span> · GROUPED FROM CURRENT-MONTH PAYMENT ACTIVITY</div>`)
    }));

    // 4. subscription manager
    out.push(makePanel({
      id: "panel-fin-subs", title: "SUBSCRIPTION MANAGER", badge,
      bodyHTML: priv(`
        <div class="fin-cards">
          <div class="fin-card c-recur"><div class="n money">${esc(fmtAmt(m.subsMonthly))}</div><div class="l">MONTHLY SUBSCRIPTIONS</div><div class="sub">${m.subs.length} ACTIVE</div></div>
          <div class="fin-card c-month"><div class="n money">${esc(fmtAmt(m.subsAnnual))}</div><div class="l">ANNUALIZED COST</div><div class="sub">ALL SUBSCRIPTIONS</div></div>
          <div class="fin-card ${m.dupGroups.length ? "c-overdue" : "c-paid"}"><div class="n">${m.dupGroups.length}</div><div class="l">POSSIBLE DUPLICATE GROUPS</div><div class="sub">${esc(m.dupGroups.join(" · ").toUpperCase() || "NONE DETECTED")}</div></div>
        </div>
        <table class="fin-table-sm">
          <tr><th>SERVICE</th><th>MO</th><th>YR</th><th>RENEWS</th><th>LAST PAID</th><th>AUTO</th><th>PURPOSE</th></tr>
          ${m.subs.length ? m.subs.map(s => `
            <tr class="${s.dupTags.length ? "row-dup" : ""}">
              <td class="white">${esc(s.vendor)}${s.dupTags.length ? `<span class="dup-chip">⚠ DUP: ${esc(s.dupTags.join(", ").toUpperCase())}</span>` : ""}</td>
              <td>${money(fmtAmt(s.monthlyCost))}</td>
              <td>${money(fmtAmt(s.annualCost))}</td>
              <td class="dim">${esc(s.renewalDate || "—")}</td>
              <td class="dim">${esc(s.lastPayment || "—")}</td>
              <td class="${s.autoRenew ? "tag-pub" : "tag-unpub"}">${s.autoRenew ? "✓ ON" : "✗ OFF"}</td>
              <td class="dim">${esc(s.purpose || "")}</td>
            </tr>`).join("") : `<tr><td colspan="7" class="dim">NO SUBSCRIPTIONS IN THIS SOURCE YET</td></tr>`}
        </table>`)
    }));

    // 5. revenue dashboard
    out.push(makePanel({
      id: "panel-fin-revenue", title: "REVENUE DASHBOARD", badge,
      bodyHTML: priv(`
        <div class="stat-row">
          <div class="stat"><div class="n money">${esc(fmtAmt(m.monthlyRevenue))}</div><div class="l">${esc(F.revenue?.period || "THIS MONTH")} · ALL STREAMS</div></div>
        </div>
        <table>
          <tr><th>STREAM</th><th>${esc(F.revenue?.period || "THIS MONTH")}</th><th>SOURCE</th></tr>
          ${m.revStreams.length ? m.revStreams.map(s => `
            <tr>
              <td class="white">${esc(s.name)}</td>
              <td>${money(fmtAmt(s.monthTotal))}</td>
              <td><span class="pay-status ${s.source === "SAMPLE" ? "ps-DUE-SOON" : s.source === "LOCAL" ? "ps-DUE" : "ps-PAID"}">${esc(s.source || "LIVE")}</span></td>
            </tr>`).join("") : `<tr><td colspan="3" class="dim">NO REVENUE ENTRIES IN THIS SOURCE YET</td></tr>`}
        </table>
        <div class="dim fin-footnote">PHASE 3 CONNECTS SALES PLATFORMS THROUGH THE SECURE BACKEND ADAPTER</div>`)
    }));

    // 6. financial calendar
    out.push(makePanel({
      id: "panel-fin-calendar", title: "FINANCIAL CALENDAR", badge,
      bodyHTML: priv(`
        <table>
          <tr><th>DATE</th><th>EVENT</th><th>TYPE</th><th>EST.</th></tr>
          ${m.calendar.length ? m.calendar.map(e => `
            <tr>
              <td class="dim">${esc(e.date)}</td>
              <td class="white">${esc(e.label)}</td>
              <td><span class="ev-chip ev-${esc(e.type)}">${esc(e.type)}</span></td>
              <td>${e.amount != null ? money(fmtAmt(e.amount)) : `<span class="dim">—</span>`}</td>
            </tr>`).join("") : `<tr><td colspan="4" class="dim">NO UPCOMING FINANCIAL EVENTS IN THIS SOURCE</td></tr>`}
        </table>
        <div class="dim fin-footnote">BILLS + SUBSCRIPTION RENEWALS DERIVED AUTOMATICALLY · TAX / INSURANCE / ANNUAL DATES FROM CALENDAR CONFIG</div>`)
    }));

    // 7. ai insights
    const ins = F.insights || {};
    const local = [
      m.dupGroups.length ? `${m.dupGroups.length} possible duplicate subscription group${m.dupGroups.length === 1 ? "" : "s"}: ${m.dupGroups.join(", ")}` : null,
      m.overdue.length ? `${m.overdue.length} overdue payment${m.overdue.length === 1 ? "" : "s"} totaling ${fmtAmt(sum(m.overdue, r => r.amount))}` : null,
      m.calendar.length ? `Largest upcoming expense: ${m.calendar.reduce((a, b) => ((b.amount || 0) > (a.amount || 0) ? b : a)).label}` : null,
      "Month-over-month trends require the Phase 3 history feed"
    ].filter(Boolean);
    out.push(makePanel({
      id: "panel-fin-insights", title: "AI FINANCIAL INSIGHTS", cls: "wide",
      badge: { cls: "badge-sample", text: "◆ ENGINE " + (ins.engineStatus || "RESERVED") },
      bodyHTML: priv(`
        <div class="ai-slots">
          ${(ins.planned || []).map(p => `
            <div class="ai-slot">
              <div class="ai-slot-head"><span class="white">${esc(p.name)}</span><span class="pay-status ps-DUE-SOON">STANDBY</span></div>
              <div class="dim">${esc(p.desc)}</div>
            </div>`).join("")}
        </div>
        ${(ins.items || []).length ? `
          <table style="margin-top:12px"><tr><th>AI FINDINGS</th></tr>
          ${ins.items.map(i => `<tr><td class="dim">${esc(i.text || i)}</td></tr>`).join("")}</table>` : ""}
        <div class="ai-local">
          <div class="ai-local-head">LOCAL SIGNALS (RULE-BASED PREVIEW — NOT AI)</div>
          ${local.map(t => `<div class="alert-line"><span class="alert-type alert-ACTION">SIGNAL</span><span class="dim">${esc(t)}</span></div>`).join("")}
        </div>`)
    }));

    return out;
  }

  // ---------- manual local entry panel ----------
  const ENTRY_FIELDS = {
    payment: [
      { key: "vendor", label: "VENDOR", kind: "text", required: true },
      { key: "description", label: "EXPENSE DESCRIPTION", kind: "text", required: true },
      { key: "category", label: "CATEGORY", kind: "select", options: () => window.FinanceValidate.CONTRACT.categories, required: true },
      { key: "amount", label: "AMOUNT (USD)", kind: "number", required: true },
      { key: "dueDate", label: "DUE DATE", kind: "date", required: true },
      { key: "frequency", label: "FREQUENCY", kind: "select", options: () => window.FinanceValidate.CONTRACT.frequencies, required: true },
      { key: "status", label: "STATUS", kind: "select", options: () => ["AUTO", "PAID", "CANCELLED"] },
      { key: "paidDate", label: "PAID DATE (IF PAID)", kind: "date" },
      { key: "business", label: "BUSINESS / PROJECT", kind: "text" },
      { key: "paymentMethod", label: "PAYMENT METHOD (LABEL ONLY)", kind: "text" },
      { key: "notes", label: "NOTES", kind: "text" },
      { key: "receiptRef", label: "RECEIPT REF", kind: "text" }
    ],
    subscription: [
      { key: "vendor", label: "SERVICE", kind: "text", required: true },
      { key: "description", label: "DESCRIPTION", kind: "text" },
      { key: "monthlyCost", label: "MONTHLY COST (USD)", kind: "number", required: true },
      { key: "annualCost", label: "ANNUAL COST (USD)", kind: "number" },
      { key: "renewalDate", label: "RENEWAL DATE", kind: "date" },
      { key: "lastPayment", label: "LAST PAYMENT DATE", kind: "date" },
      { key: "autoRenew", label: "AUTO-RENEW", kind: "checkbox" },
      { key: "purpose", label: "BUSINESS PURPOSE", kind: "text" },
      { key: "purposeTags", label: "PURPOSE TAGS (COMMA-SEPARATED)", kind: "text" }
    ],
    revenue: [
      { key: "name", label: "REVENUE STREAM", kind: "select", options: () => window.FinanceValidate.CONTRACT.revenueStreams, required: true },
      { key: "monthTotal", label: "THIS MONTH (USD)", kind: "number", required: true }
    ],
    calendar: [
      { key: "date", label: "DATE", kind: "date", required: true },
      { key: "label", label: "EVENT LABEL", kind: "text", required: true },
      { key: "type", label: "TYPE", kind: "select", options: () => window.FinanceValidate.CONTRACT.calendarTypes, required: true },
      { key: "amountEstimate", label: "ESTIMATED AMOUNT (USD)", kind: "number" }
    ]
  };
  const TYPE_LABELS = { payment: "PAYMENT / EXPENSE", subscription: "SUBSCRIPTION", revenue: "REVENUE ENTRY", calendar: "CALENDAR ITEM" };

  function fieldInput(f, value) {
    const v = value === undefined || value === null ? "" : value;
    if (f.kind === "select") {
      const opts = f.options();
      return `<select class="fin-input" data-key="${esc(f.key)}">${opts.map(o =>
        `<option value="${esc(o)}" ${String(v) === o ? "selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
    }
    if (f.kind === "checkbox") {
      return `<label class="fin-check"><input type="checkbox" data-key="${esc(f.key)}" ${v ? "checked" : ""}> YES</label>`;
    }
    const type = f.kind === "number" ? "number" : f.kind === "date" ? "date" : "text";
    return `<input class="fin-input" type="${type}" ${f.kind === "number" ? 'step="0.01" min="0"' : ""} data-key="${esc(f.key)}" value="${esc(v)}">`;
  }

  function entryFormFields(type, record) {
    return ENTRY_FIELDS[type].map(f => `
      <label class="fin-field">
        <span class="fin-field-label">${esc(f.label)}${f.required ? " *" : ""}</span>
        ${fieldInput(f, record ? record[f.key] : undefined)}
      </label>`).join("");
  }

  function localList(type) {
    const items = window.FinanceLocal.list(type);
    if (!items.length) return "";
    const title = r => type === "payment" ? `${r.vendor} — ${r.description}` :
      type === "subscription" ? `${r.vendor}` :
      type === "revenue" ? `${r.name}` : `${r.label}`;
    const amt = r => fmtAmt(type === "payment" ? r.amount : type === "subscription" ? r.monthlyCost :
      type === "revenue" ? r.monthTotal : r.amountEstimate);
    const when = r => r.dueDate || r.renewalDate || r.date || "";
    return `
      <div class="fin-local-group">${esc(TYPE_LABELS[type])}S</div>
      ${items.map((r, i) => {
        const key = r.id !== undefined ? r.id : String(i);
        return `
        <div class="fin-local-row">
          <span class="white">${esc(title(r))}</span>
          <span>${money(amt(r))}</span>
          <span class="dim">${esc(when(r))}</span>
          <span class="fin-row-actions">
            <button class="fin-sm-btn" data-act="edit" data-type="${esc(type)}" data-key="${esc(key)}">EDIT</button>
            <button class="fin-sm-btn danger" data-act="del" data-type="${esc(type)}" data-key="${esc(key)}">DELETE</button>
          </span>
        </div>`;
      }).join("")}`;
  }

  function buildEntryPanel() {
    const editing = editKey !== null;
    let editRecord = null;
    if (editing) {
      const items = window.FinanceLocal.list(entryType);
      editRecord = items.find((r, i) => (r.id !== undefined ? r.id === editKey : String(i) === editKey)) || null;
    }
    const el = makePanel({
      id: "panel-fin-entry", title: "MANUAL LOCAL ENTRY — LOCAL TO THIS DEVICE", cls: "wide",
      badge: { cls: "badge-local", text: "◆ LOCAL TO THIS DEVICE" },
      bodyHTML: priv(`
        <div class="fin-local-note">⚠ RECORDS ENTERED HERE ARE STORED ONLY IN THIS BROWSER'S LOCAL STORAGE ON THIS DEVICE.
        THEY ARE NEVER COMMITTED TO GIT, NEVER WRITTEN TO finance-data.js, AND NEVER SENT TO ANY SERVER.
        BROWSER-LOCAL STORAGE IS CONVENIENT FOR TESTING AND PERSONAL USE, BUT IT IS <span class="white">NOT AN ENCRYPTED FINANCIAL BACKEND</span> —
        ANYONE WITH ACCESS TO THIS BROWSER PROFILE CAN READ IT. USE THE SECURE BACKEND (PHASE 3) FOR REAL RECORDS.</div>
        <div class="fin-entry-bar">
          <label class="fin-field"><span class="fin-field-label">RECORD TYPE</span>
            <select class="fin-input" id="fin-entry-type">
              ${Object.keys(ENTRY_FIELDS).map(t => `<option value="${t}" ${t === entryType ? "selected" : ""}>${esc(TYPE_LABELS[t])}</option>`).join("")}
            </select>
          </label>
          <span class="dim" id="fin-entry-mode">${editing ? "EDITING EXISTING RECORD" : "ADDING NEW RECORD"}</span>
        </div>
        <div class="fin-form" id="fin-entry-fields">${entryFormFields(entryType, editRecord)}</div>
        <div class="fin-entry-actions">
          <button class="fin-sm-btn primary" id="fin-entry-save">${editing ? "✓ UPDATE RECORD" : "+ ADD RECORD"}</button>
          ${editing ? `<button class="fin-sm-btn" id="fin-entry-cancel">CANCEL EDIT</button>` : ""}
          <span class="fin-entry-err" id="fin-entry-err"></span>
        </div>
        <div id="fin-local-lists">
          ${["payment", "subscription", "revenue", "calendar"].map(localList).join("")}
        </div>
        <div class="fin-entry-actions" style="margin-top:14px">
          <button class="fin-sm-btn danger" id="fin-erase-btn">⨯ ERASE LOCAL FINANCIAL DATA</button>
          <span class="dim">REMOVES EVERY LOCALLY STORED RECORD FROM THIS BROWSER — CANNOT BE UNDONE</span>
        </div>`)
    });
    return el;
  }

  function readForm(panelEl) {
    const rec = {};
    for (const f of ENTRY_FIELDS[entryType]) {
      const input = panelEl.querySelector(`[data-key="${f.key}"]`);
      if (!input) continue;
      if (f.kind === "checkbox") { rec[f.key] = !!input.checked; continue; }
      let v = input.value.trim();
      if (v === "") continue;
      if (f.kind === "number") {
        const n = Number(v);
        rec[f.key] = isFinite(n) ? n : v; // invalid numbers are caught by validation
      } else if (f.key === "purposeTags") {
        rec[f.key] = v.split(",").map(s => s.trim()).filter(Boolean);
      } else if (f.key === "status") {
        rec[f.key] = v === "AUTO" ? null : v;
      } else rec[f.key] = v;
    }
    if (entryType === "payment" && rec.status === undefined) rec.status = null;
    return rec;
  }

  const ERR_TEXT = {
    REQUIRED: "is required", INVALID_AMOUNT: "must be a valid amount",
    INVALID_DATE: "must be a valid date", INVALID_FREQUENCY: "has an invalid frequency",
    INVALID_STATUS: "has an invalid status", INVALID_CATEGORY: "has an invalid category",
    INVALID_TYPE: "has an invalid type", CREDENTIAL_LIKE: "looks like a credential or account number — not allowed",
    DUPLICATE_ID: "duplicates an existing record id", UNEXPECTED_PROPERTY: "is not an allowed field"
  };
  function showErrors(panelEl, errors) {
    const el = panelEl.querySelector("#fin-entry-err");
    if (!el) return;
    el.textContent = errors.slice(0, 3).map(e =>
      `${e.path.split(".").pop()} ${ERR_TEXT[e.code] || "is invalid"}`).join(" · ");
  }

  function wireEntryPanel(panelEl) {
    panelEl.querySelector("#fin-entry-type")?.addEventListener("change", ev => {
      entryType = ev.target.value; editKey = null;
      rerender();
    });
    panelEl.querySelector("#fin-entry-save")?.addEventListener("click", () => {
      const rec = readForm(panelEl);
      const res = editKey !== null
        ? window.FinanceLocal.update(entryType, editKey, { ...rec, id: typeof editKey === "string" && editKey.startsWith("LOC-") ? editKey : rec.id })
        : window.FinanceLocal.add(entryType, rec);
      if (!res.ok) { showErrors(panelEl, res.errors); return; }
      editKey = null;
      rerender();
    });
    panelEl.querySelector("#fin-entry-cancel")?.addEventListener("click", () => { editKey = null; rerender(); });
    panelEl.querySelector("#fin-erase-btn")?.addEventListener("click", () => {
      const n = window.FinanceLocal.count();
      const ok = window.confirm(
        `Erase ALL locally stored financial data on this device?\n\n${n} record(s) will be permanently deleted from this browser. This cannot be undone.`);
      if (!ok) return;
      window.FinanceLocal.eraseAll();
      editKey = null;
      rerender();
    });
    panelEl.querySelectorAll("[data-act]").forEach(btn => btn.addEventListener("click", () => {
      const { act, type, key } = btn.dataset;
      if (act === "edit") { entryType = type; editKey = key; rerender(); }
      if (act === "del") { window.FinanceLocal.remove(type, key); if (editKey === key) editKey = null; rerender(); }
    }));
  }

  // ---------- security controls ----------
  function lock() { if (window.setPrivacy) window.setPrivacy(true); }

  function initSecurity() {
    if (securityArmed) return;
    securityArmed = true;
    // Inactivity relock: privacy re-engages after a configurable quiet period.
    const secs = (window.FINANCE_CONFIG && Number(window.FINANCE_CONFIG.inactivitySeconds)) || 300;
    const rearm = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(lock, secs * 1000);
    };
    ["mousemove", "keydown", "click", "scroll", "touchstart"].forEach(ev =>
      document.addEventListener(ev, rearm, { passive: true }));
    rearm();
  }

  // ---------- render lifecycle ----------
  function clearNodes() {
    nodes.forEach(n => n.remove());
    nodes = [];
  }

  function paint(res) {
    clearNodes();
    const state = res.state;
    const meta = STATE_META[state] || STATE_META.ERROR;
    const els = [makeHead(state)];

    if (res.data) {
      const m = buildModel(res.data);
      FinanceModule.model = m;
      els.push(...buildDataPanels(res.data, m, meta.badge));
      if (state === "LOCAL") els.push(buildEntryPanel());
    } else {
      FinanceModule.model = null;
      const msg = OFFLINE_MSG[state] || OFFLINE_MSG.ERROR;
      for (const [id, title, cls] of PANEL_TITLES) els.push(makePanel({ id, title, cls, badge: meta.badge, offlineMsg: msg }));
      if (state === "EXPIRED") lock(); // expired session relocks the panels
    }

    els.forEach(el => grid.insertBefore(el, sentinel));
    nodes = els;
    FinanceModule.state = state;

    // wire controls
    const head = els[0];
    head.querySelectorAll(".fin-mode-btn").forEach(btn => btn.addEventListener("click", () => {
      window.FinanceAdapter.setMode(btn.dataset.mode);
      editKey = null;
      rerender();
    }));
    head.querySelector("#fin-lock-btn")?.addEventListener("click", lock);
    const entry = els.find(e => e.id === "panel-fin-entry");
    if (entry) wireEntryPanel(entry);
  }

  async function rerender() {
    if (window.FinanceAdapter.currentMode() === "secure-api") paint({ state: "LOADING" });
    const res = await window.FinanceAdapter.load();
    paint(res);
  }

  async function render(opts) {
    grid = (opts && opts.grid) || document.getElementById("grid");
    if (!sentinel) {
      // Sentinel reserves the section's position in the grid so re-renders
      // in any adapter state land in exactly the same place.
      sentinel = document.createElement("div");
      sentinel.id = "fin-anchor";
      sentinel.style.display = "none";
      grid.appendChild(sentinel);
      initSecurity();
    }
    await rerender();
  }

  return { render, rerender, buildModel, effectiveStatus, model: null, state: null };
})();
