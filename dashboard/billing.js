// ============================================================
// PURPOSE SPHERE COMMAND CENTER — REVENUE BILLING &
// ACCOUNTS RECEIVABLE MODULE (Milestone 2)
//
// Renders the REVENUE BILLING & ACCOUNTS RECEIVABLE section from
// whatever the adapter layer supplies:
//
//   BillingValidate  → schema/contract validation (gatekeeper)
//   BillingLocal     → browser-local manual records
//   BillingApiClient → secure authenticated backend client
//   BillingAdapter   → mode resolution + load()
//   BillingModule    → this file: model math + rendering only
//
// The UI paints one of these states and never needs changes when
// the data source switches:
//   SAMPLE | LOCAL | CONNECTED | SIGNED_OUT | LOADING | EXPIRED | ERROR
//
// Security behaviors owned here (mirrors dashboard/finance.js):
//   - re-render in place (panels swap between the same grid
//     anchors; layout identical in every mode)
//   - "LOCK BILLING PANELS" button → Privacy Mode on
//   - inactivity relock (BILLING_CONFIG.inactivitySeconds, 300s
//     default) → Privacy Mode on
//   - EXPIRED session → panels relock automatically, no data
//   - no billing values, customer PII, or tokens in logs, URLs,
//     or errors
//   - Privacy Mode is the SAME shared body.privacy state the
//     Financial Intelligence module uses — one toggle governs
//     both. Billing does not invent a parallel privacy system.
//
// Full architecture: dashboard/BILLING-ARCHITECTURE.md
// ============================================================
window.BillingModule = (function () {
  "use strict";

  const MS_DAY = 86400000;
  const FOLLOWUP_WINDOW_DAYS = 14; // "upcoming due" lookahead for Collections Workflow

  // ---------- pure helpers ----------
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money = v => v ? `<span class="money">${esc(v)}</span>` : "";
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
  const round2 = n => Math.round((n + Number.EPSILON) * 100) / 100;

  // Effective invoice status: void/draft are manual and final; paid/overdue/
  // partial are computed from linked payments and the due date; sent/viewed
  // are the manual workflow states used when nothing else applies yet.
  function effectiveStatus(inv, paid, balance, daysPastDue) {
    const manual = String(inv.status || "").toLowerCase();
    if (manual === "void") return "void";
    if (manual === "draft") return "draft";
    if (balance <= 0.001) return "paid";
    if (daysPastDue !== null && daysPastDue > 0) return "overdue";
    if (paid > 0) return "partial";
    if (manual === "viewed") return "viewed";
    return "sent";
  }

  // ---------- model: every number the panels show, derived in one place ----------
  function buildModel(F) {
    const today = startOfToday();
    const daysBetween = (a, b) => (a && b) ? Math.round((b - a) / MS_DAY) : null;

    const paymentsByInvoice = {};
    (F.payments || []).forEach(p => {
      (paymentsByInvoice[p.invoiceId] = paymentsByInvoice[p.invoiceId] || []).push(p);
    });

    const invoices = (F.invoices || []).map(inv => {
      const pays = (paymentsByInvoice[inv.id] || []).slice()
        .sort((a, b) => (parseDay(a.paymentDate)?.getTime() ?? 0) - (parseDay(b.paymentDate)?.getTime() ?? 0));
      const paid = round2(sum(pays, p => p.amount));
      const balance = Math.max(0, round2((typeof inv.amount === "number" ? inv.amount : 0) - paid));
      const due = parseDay(inv.dueDate);
      const issue = parseDay(inv.issueDate);
      const daysPastDue = due ? Math.round((today - due) / MS_DAY) : null;
      const st = effectiveStatus(inv, paid, balance, daysPastDue);
      let daysToPay = null;
      if (st === "paid" && pays.length && issue) {
        const completedDate = parseDay(pays[pays.length - 1].paymentDate);
        daysToPay = daysBetween(issue, completedDate);
      }
      return { ...inv, pays, paid, balance, due, issue, daysPastDue, st, daysToPay };
    });

    const active = invoices.filter(i => i.st !== "void" && i.st !== "draft");
    const totalInvoiced = round2(sum(active, i => i.amount));
    const totalCollected = round2(sum(active, i => i.paid));
    const outstanding = round2(sum(active, i => i.balance));
    const overdueLane = active.filter(i => i.st === "overdue");
    const overdueBalance = round2(sum(overdueLane, i => i.balance));
    const paidLane = active.filter(i => i.st === "paid");
    const paidWithDays = paidLane.filter(i => i.daysToPay !== null);
    const avgDaysToPayment = paidWithDays.length
      ? Math.round((sum(paidWithDays, i => i.daysToPay) / paidWithDays.length) * 10) / 10 : null;
    const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 1000) / 10 : null;

    // ---- AR aging (unpaid balance only, bucketed by days past due) ----
    const unpaidActive = active.filter(i => i.balance > 0);
    const BUCKETS = [
      { key: "current", label: "CURRENT", test: d => d === null || d <= 0 },
      { key: "b1_30", label: "1–30 DAYS OVERDUE", test: d => d > 0 && d <= 30 },
      { key: "b31_60", label: "31–60 DAYS OVERDUE", test: d => d > 30 && d <= 60 },
      { key: "b61_90", label: "61–90 DAYS OVERDUE", test: d => d > 60 && d <= 90 },
      { key: "b90p", label: "90+ DAYS OVERDUE", test: d => d > 90 }
    ];
    const aging = BUCKETS.map(b => {
      const rows = unpaidActive.filter(i => b.test(i.daysPastDue));
      return { ...b, total: round2(sum(rows, i => i.balance)), count: rows.length };
    });
    const agingTotal = round2(sum(aging, b => b.total));
    const maxBucket = Math.max(1, ...aging.map(b => b.total));
    aging.forEach(b => { b.pctOfMax = Math.round((b.total / maxBucket) * 100); });

    // ---- Collections Workflow lanes ----
    const upcomingDue = unpaidActive.filter(i => i.daysPastDue !== null && i.daysPastDue < 0 && i.daysPastDue >= -FOLLOWUP_WINDOW_DAYS);
    const dueToday = unpaidActive.filter(i => i.daysPastDue === 0);
    const followUp = active.filter(i => {
      if (i.balance <= 0) return false;
      const fu = parseDay(i.followUpDate);
      const scheduledDue = i.reminderStatus === "SCHEDULED" && fu && fu.getTime() <= today.getTime();
      const overdueUnflagged = i.st === "overdue" && (!i.reminderStatus || i.reminderStatus === "NONE");
      return scheduledDue || overdueUnflagged;
    });

    // ---- Billing calendar (issue / due / follow-up / recurring) ----
    const FREQ_DAYS = { MONTHLY: 30, QUARTERLY: 91, ANNUAL: 365 };
    const events = [];
    active.forEach(i => {
      if (i.issue) events.push({ date: i.issueDate, d: i.issue, label: `${i.customerName} — issued`, type: "ISSUED", amount: i.amount });
      if (i.balance > 0 && i.due) events.push({ date: i.dueDate, d: i.due, label: `${i.customerName} — ${esc(i.id || "")} due`, type: i.st === "overdue" ? "OVERDUE" : "DUE", amount: i.balance });
      const fu = parseDay(i.followUpDate);
      if (fu) events.push({ date: i.followUpDate, d: fu, label: `${i.customerName} — follow-up`, type: "FOLLOW-UP", amount: i.balance });
      if (i.recurring && FREQ_DAYS[i.recurring] && i.due) {
        const next = new Date(i.due.getTime() + FREQ_DAYS[i.recurring] * MS_DAY);
        if (next.getTime() > today.getTime()) {
          const iso = next.toISOString().slice(0, 10);
          events.push({ date: iso, d: next, label: `${i.customerName} — next ${i.recurring.toLowerCase()} billing`, type: "RECURRING", amount: i.amount });
        }
      }
    });
    events.sort((a, b) => (a.d?.getTime() ?? Infinity) - (b.d?.getTime() ?? Infinity));
    const windowStart = new Date(today.getTime() - 30 * MS_DAY);
    const calendar = events.filter(e => e.d && e.d.getTime() >= windowStart.getTime()).slice(0, 16);

    return {
      today, invoices, active, totalInvoiced, totalCollected, outstanding,
      overdueBalance, avgDaysToPayment, collectionRate,
      aging, agingTotal, upcomingDue, dueToday, overdueLane, followUp, paidLane,
      calendar
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
    EXPIRED: "SESSION EXPIRED — REAUTHENTICATE WITH THE SECURE BACKEND TO RESUME<br>NO BILLING DATA IS DISPLAYED",
    ERROR: "DATA UNAVAILABLE — SOURCE FAILED OR WAS REJECTED BY VALIDATION<br>NOTHING RENDERS UNTIL A VALID PAYLOAD ARRIVES",
    LOADING: "ESTABLISHING SECURE CONNECTION…"
  };

  // ---------- module state ----------
  let grid = null, sentinel = null, nodes = [];
  let securityArmed = false, inactivityTimer = null, privacyObserver = null;
  let entryType = "invoice", editKey = null;
  let invSearch = "", invStatusFilter = "ALL";

  const PANEL_TITLES = [
    ["panel-bill-overview", "BILLING OVERVIEW", "wide"],
    ["panel-bill-invoices", "INVOICE MANAGER", "wide"],
    ["panel-bill-aging", "ACCOUNTS RECEIVABLE AGING", ""],
    ["panel-bill-payments", "PAYMENT RECORDING", "wide"],
    ["panel-bill-customers", "CUSTOMER BILLING PROFILES", ""],
    ["panel-bill-calendar", "BILLING CALENDAR", ""],
    ["panel-bill-collections", "COLLECTIONS WORKFLOW", "wide"]
  ];

  function makePanel({ id, title, cls = "", badge, bodyHTML, offlineMsg }) {
    const el = document.createElement("section");
    el.className = `panel bill-panel ${cls}`;
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

  // Privacy Mode: content sits inside .bill-sensitive, hidden by body.privacy
  // in favor of the .bill-privacy-msg notice — the SAME shared body.privacy
  // state the Financial Intelligence module reads/writes.
  const priv = inner => `
    <div class="bill-privacy-msg">🔒 PRIVATE BILLING DATA HIDDEN<span class="sub2">CLICK “PRIVACY MODE: ON” IN THE SECTION HEADER ABOVE TO REVEAL AND MANAGE BILLING</span></div>
    <div class="bill-sensitive">${inner}</div>`;

  // ---------- privacy state helpers (reuses window.setPrivacy) ----------
  const isPrivacyOn = () => document.body.classList.contains("privacy");
  function setPrivacy(on) {
    if (window.setPrivacy) window.setPrivacy(!!on);
    else document.body.classList.toggle("privacy", !!on); // defensive fallback
  }
  function syncPrivacyToggle() {
    const btn = document.getElementById("bill-privacy-toggle");
    if (!btn) return;
    const on = isPrivacyOn();
    btn.textContent = on ? "🔒 Privacy Mode: ON" : "🔓 Privacy Mode: OFF";
    btn.classList.toggle("on", on);
    btn.classList.toggle("off", !on);
    btn.setAttribute("aria-pressed", String(on));
    btn.title = on ? "Billing data is hidden — click to reveal" : "Billing data is visible — click to hide";
  }

  // ---------- section header w/ privacy + connection-status controls ----------
  function makeHead(state) {
    const meta = STATE_META[state] || STATE_META.ERROR;
    const mode = window.BillingAdapter.currentMode();
    const secure = window.BillingAdapter.secureAvailable();
    const head = document.createElement("div");
    head.className = "section-head bill-section-head";
    head.id = "bill-section-head";
    head.innerHTML = `
      <span class="sh-title bill-sh-title">◈ REVENUE BILLING &amp; ACCOUNTS RECEIVABLE</span>
      <span class="fin-controls">
        <span class="fin-state-chip ${meta.chipCls}" id="bill-state-chip">${esc(meta.chip)}</span>
        <button class="fin-mode-btn ${mode === "sample" ? "active" : ""}" data-mode="sample" title="Fictional demo data from the public repo">SAMPLE</button>
        <button class="fin-mode-btn ${mode === "manual-local" ? "active" : ""}" data-mode="manual-local" title="Records stored only in this browser">LOCAL</button>
        ${secure ? `<button class="fin-mode-btn ${mode === "secure-api" ? "active" : ""}" data-mode="secure-api" title="Private authenticated backend">SECURE</button>` : ""}
        <button class="fin-privacy-toggle" id="bill-privacy-toggle" aria-pressed="true"></button>
        <button class="fin-lock-btn" id="bill-lock-btn" title="Hide billing panels immediately">🔒 LOCK BILLING PANELS</button>
      </span>`;
    return head;
  }

  // ---------- data-panel builders ----------
  function buildDataPanels(F, m, badge) {
    const out = [];
    const card = (cls, val, label, sub) => `
      <div class="fin-card bill-card ${cls}">
        <div class="n money">${esc(val)}</div>
        <div class="l">${esc(label)}</div>
        <div class="sub">${esc(sub)}</div>
      </div>`;

    // 1. billing overview
    out.push(makePanel({
      id: "panel-bill-overview", title: "BILLING OVERVIEW", cls: "wide", badge,
      bodyHTML: priv(`
        <div class="fin-cards">
          ${card("c-month", fmtAmt(m.totalInvoiced), "TOTAL INVOICED", m.active.length + " ACTIVE INVOICES")}
          ${card("c-paid", fmtAmt(m.totalCollected), "TOTAL COLLECTED", "ALL RECORDED PAYMENTS")}
          ${card("c-due7", fmtAmt(m.outstanding), "OUTSTANDING BALANCE", (m.active.length - m.paidLane.length) + " UNPAID / PARTIAL")}
          ${card("c-overdue", fmtAmt(m.overdueBalance), "OVERDUE BALANCE", m.overdueLane.length + " INVOICE(S)")}
          ${card("c-recur", m.avgDaysToPayment != null ? m.avgDaysToPayment + " DAYS" : "—", "AVG DAYS TO PAYMENT", m.paidLane.length + " PAID INVOICE(S)")}
          ${card(m.collectionRate != null && m.collectionRate >= 80 ? "c-paid" : "c-due7", m.collectionRate != null ? m.collectionRate + "%" : "—", "COLLECTION RATE", "COLLECTED ÷ INVOICED")}
        </div>`)
    }));

    // 2. invoice manager (search + status filter + table)
    const invRow = r => `
      <tr data-inv-row="${esc(r.id || "")}">
        <td class="white">${esc(r.id || "—")}</td>
        <td class="white">${esc(r.customerName)}</td>
        <td class="dim">${esc(r.issueDate || "—")}</td>
        <td class="${r.st === "overdue" ? "white" : "dim"}">${esc(r.dueDate || "—")}</td>
        <td>${money(fmtAmt(r.amount))}</td>
        <td><span class="bill-status bs-${esc(r.st)}">${esc(r.st.toUpperCase())}</span></td>
        <td>${money(fmtAmt(r.balance))}</td>
        <td class="dim">${esc(r.notes || "")}</td>
      </tr>`;
    out.push(makePanel({
      id: "panel-bill-invoices", title: "INVOICE MANAGER", cls: "wide", badge,
      bodyHTML: priv(`
        <div class="bill-filter-bar">
          <input class="fin-input bill-search" id="bill-inv-search" type="text" placeholder="SEARCH INVOICE #, CUSTOMER, OR NOTES…" value="${esc(invSearch)}">
          <select class="fin-input" id="bill-inv-status">
            ${["ALL", "draft", "sent", "viewed", "partial", "paid", "overdue", "void"].map(s =>
              `<option value="${s}" ${invStatusFilter === s ? "selected" : ""}>${s === "ALL" ? "ALL STATUSES" : s.toUpperCase()}</option>`).join("")}
          </select>
        </div>
        <table class="fin-table bill-table">
          <tr><th>INVOICE #</th><th>CUSTOMER</th><th>ISSUE DATE</th><th>DUE DATE</th><th>AMOUNT</th><th>STATUS</th><th>BALANCE</th><th>NOTES</th></tr>
          <tbody id="bill-inv-tbody">${(filterInvoices(m.invoices).length ? filterInvoices(m.invoices).map(invRow).join("") : `<tr><td colspan="8" class="dim">NO INVOICES MATCH THE CURRENT FILTER</td></tr>`)}</tbody>
        </table>
        <div class="dim fin-footnote">${esc(F.source?.label || "")} · STATUS AUTO-CALCULATED FROM DUE DATE AND LINKED PAYMENTS UNLESS MARKED DRAFT / VOID</div>`)
    }));

    // 3. AR aging
    out.push(makePanel({
      id: "panel-bill-aging", title: "ACCOUNTS RECEIVABLE AGING", badge,
      bodyHTML: priv(`
        ${m.aging.map(b => `
          <div class="fin-bar-row bill-bar-row">
            <div class="fb-label ${b.total ? "white" : "dim"}">${esc(b.label)}</div>
            <div class="fin-bar"><div class="fin-bar-fill bill-bar-fill-${esc(b.key)}" style="width:${b.pctOfMax}%"></div></div>
            <div class="fb-amt">${money(fmtAmt(b.total))}</div>
            <div class="fb-pct dim">${b.count}</div>
          </div>`).join("")}
        <div class="dim fin-footnote">TOTAL OUTSTANDING <span class="money">${esc(fmtAmt(m.agingTotal))}</span> · BUCKETED BY DAYS PAST DUE ON UNPAID BALANCE</div>`)
    }));

    // 4. payment recording (history)
    const payments = (F.payments || []).slice().sort((a, b) => (parseDay(b.paymentDate)?.getTime() ?? 0) - (parseDay(a.paymentDate)?.getTime() ?? 0));
    const invById = {};
    m.invoices.forEach(i => { invById[i.id] = i; });
    out.push(makePanel({
      id: "panel-bill-payments", title: "PAYMENT RECORDING", cls: "wide", badge,
      bodyHTML: priv(`
        <table class="fin-table">
          <tr><th>DATE</th><th>INVOICE #</th><th>CUSTOMER</th><th>AMOUNT</th><th>METHOD</th><th>REFERENCE</th><th>NOTES</th></tr>
          ${payments.length ? payments.map(p => `
            <tr>
              <td class="dim">${esc(p.paymentDate)}</td>
              <td class="white">${esc(p.invoiceId || "—")}</td>
              <td class="dim">${esc(invById[p.invoiceId]?.customerName || "—")}</td>
              <td>${money(fmtAmt(p.amount))}</td>
              <td class="dim">${esc(p.method || "—")}</td>
              <td class="dim">${esc(p.referenceNumber || "—")}</td>
              <td class="dim">${esc(p.notes || "")}</td>
            </tr>`).join("") : `<tr><td colspan="7" class="dim">NO PAYMENTS RECORDED IN THIS SOURCE YET</td></tr>`}
        </table>
        <div class="dim fin-footnote">SWITCH TO LOCAL MODE BELOW TO MANUALLY RECORD A PAYMENT · OVERPAYMENT BEYOND AN INVOICE'S REMAINING BALANCE IS REJECTED · NO CARD NUMBERS, BANK ACCOUNT NUMBERS, OR PROCESSOR CREDENTIALS ARE EVER STORED — REFERENCE NUMBERS ARE LABELS ONLY</div>`)
    }));

    // 5. customer billing profiles
    out.push(makePanel({
      id: "panel-bill-customers", title: "CUSTOMER BILLING PROFILES", badge,
      bodyHTML: priv(`
        <table class="fin-table-sm bill-cust-table">
          <tr><th>CUSTOMER</th><th>CONTACT</th><th>EMAIL</th><th>TERMS</th><th>TAX-EXEMPT</th></tr>
          ${(F.customers || []).length ? (F.customers || []).map(c => `
            <tr>
              <td class="white">${esc(c.name)}${c.billingAddress ? `<div class="dim bill-subline">${esc(c.billingAddress)}</div>` : ""}${c.notes ? `<div class="dim bill-subline">${esc(c.notes)}</div>` : ""}</td>
              <td class="dim">${esc(c.billingContact || "—")}</td>
              <td class="dim">${esc(c.billingEmail || "—")}</td>
              <td class="dim">${esc(c.paymentTerms || "—")}</td>
              <td class="${c.taxExempt ? "tag-pub" : "tag-unpub"}">${c.taxExempt ? "✓ EXEMPT" : "✗ TAXABLE"}</td>
            </tr>`).join("") : `<tr><td colspan="5" class="dim">NO CUSTOMER PROFILES IN THIS SOURCE YET</td></tr>`}
        </table>`)
    }));

    // 6. billing calendar
    const TYPE_CHIP = { ISSUED: "ev-ANNUAL", DUE: "ev-BILL", OVERDUE: "ev-TAX", "FOLLOW-UP": "ev-RENEWAL", RECURRING: "ev-DOMAIN" };
    out.push(makePanel({
      id: "panel-bill-calendar", title: "BILLING CALENDAR", badge,
      bodyHTML: priv(`
        <table>
          <tr><th>DATE</th><th>EVENT</th><th>TYPE</th><th>AMOUNT</th></tr>
          ${m.calendar.length ? m.calendar.map(e => `
            <tr>
              <td class="dim">${esc(e.date)}</td>
              <td class="white">${esc(e.label)}</td>
              <td><span class="ev-chip ${TYPE_CHIP[e.type] || "ev-EVENT"}">${esc(e.type)}</span></td>
              <td>${e.amount != null ? money(fmtAmt(e.amount)) : `<span class="dim">—</span>`}</td>
            </tr>`).join("") : `<tr><td colspan="4" class="dim">NO BILLING EVENTS IN THIS WINDOW</td></tr>`}
        </table>
        <div class="dim fin-footnote">ISSUE / DUE / FOLLOW-UP / RECURRING DATES DERIVED FROM INVOICES · WINDOW: LAST 30 DAYS THROUGH ALL UPCOMING</div>`)
    }));

    // 7. collections workflow
    const lane = (title, cls, rows, emptyMsg) => `
      <div class="bill-lane">
        <div class="bill-lane-head"><span class="white">${esc(title)}</span><span class="dim">${rows.length}</span></div>
        ${rows.length ? rows.slice(0, 8).map(r => `
          <div class="bill-lane-row ${cls}">
            <span class="white">${esc(r.customerName)}</span>
            <span class="dim">${esc(r.id || "")}</span>
            <span>${money(fmtAmt(r.balance))}</span>
          </div>`).join("") : `<div class="dim bill-lane-empty">${esc(emptyMsg)}</div>`}
      </div>`;
    out.push(makePanel({
      id: "panel-bill-collections", title: "COLLECTIONS WORKFLOW", cls: "wide", badge,
      bodyHTML: priv(`
        <div class="bill-lanes">
          ${lane("UPCOMING DUE", "ln-upcoming", m.upcomingDue, "NONE DUE IN THE NEXT " + FOLLOWUP_WINDOW_DAYS + " DAYS")}
          ${lane("DUE TODAY", "ln-today", m.dueToday, "NONE DUE TODAY")}
          ${lane("OVERDUE", "ln-overdue", m.overdueLane, "NONE OVERDUE")}
          ${lane("FOLLOW-UP NEEDED", "ln-followup", m.followUp, "NONE FLAGGED FOR FOLLOW-UP")}
          ${lane("PAID", "ln-paid", m.paidLane, "NONE PAID YET")}
        </div>
        <div class="dim fin-footnote">REMINDER STATUS IS A MANUAL LABEL SET PER INVOICE — NO AUTOMATED EMAIL SENDING IN THIS PHASE</div>`)
    }));

    return out;
  }

  // ---------- invoice search/filter (in-place tbody update, no full re-render) ----------
  function filterInvoices(rows) {
    const q = invSearch.trim().toLowerCase();
    return rows
      .filter(r => invStatusFilter === "ALL" || r.st === invStatusFilter)
      .filter(r => !q || [r.id, r.customerName, r.notes].some(v => String(v || "").toLowerCase().includes(q)))
      .sort((a, b) => {
        const rank = r => (r.st === "overdue" || r.st === "partial" || r.st === "sent" || r.st === "viewed") ? 0 : (r.st === "paid" ? 1 : 2);
        return rank(a) - rank(b) || ((a.due?.getTime() ?? Infinity) - (b.due?.getTime() ?? Infinity));
      });
  }
  function renderInvoiceTbody() {
    const tbody = document.getElementById("bill-inv-tbody");
    if (!tbody || !BillingModule.model) return;
    const rows = filterInvoices(BillingModule.model.invoices);
    tbody.innerHTML = rows.length ? rows.map(r => `
      <tr data-inv-row="${esc(r.id || "")}">
        <td class="white">${esc(r.id || "—")}</td>
        <td class="white">${esc(r.customerName)}</td>
        <td class="dim">${esc(r.issueDate || "—")}</td>
        <td class="${r.st === "overdue" ? "white" : "dim"}">${esc(r.dueDate || "—")}</td>
        <td>${money(fmtAmt(r.amount))}</td>
        <td><span class="bill-status bs-${esc(r.st)}">${esc(r.st.toUpperCase())}</span></td>
        <td>${money(fmtAmt(r.balance))}</td>
        <td class="dim">${esc(r.notes || "")}</td>
      </tr>`).join("") : `<tr><td colspan="8" class="dim">NO INVOICES MATCH THE CURRENT FILTER</td></tr>`;
  }
  function wireInvoiceFilters(panelEl) {
    const search = panelEl.querySelector("#bill-inv-search");
    const status = panelEl.querySelector("#bill-inv-status");
    search?.addEventListener("input", () => { invSearch = search.value; renderInvoiceTbody(); });
    status?.addEventListener("change", () => { invStatusFilter = status.value; renderInvoiceTbody(); });
  }

  // ---------- manual local entry panel ----------
  const ENTRY_FIELDS = {
    customer: [
      { key: "name", label: "CUSTOMER / COMPANY NAME", kind: "text", required: true },
      { key: "billingContact", label: "BILLING CONTACT", kind: "text" },
      { key: "billingEmail", label: "BILLING EMAIL", kind: "text" },
      { key: "billingAddress", label: "BILLING ADDRESS", kind: "text" },
      { key: "paymentTerms", label: "PAYMENT TERMS", kind: "select", options: () => window.BillingValidate.CONTRACT.paymentTerms },
      { key: "taxExempt", label: "TAX-EXEMPT", kind: "checkbox" },
      { key: "notes", label: "INTERNAL NOTES", kind: "text" }
    ],
    invoice: [
      { key: "customerName", label: "CUSTOMER NAME", kind: "text", required: true },
      { key: "customerId", label: "CUSTOMER ID (OPTIONAL LINK)", kind: "text" },
      { key: "issueDate", label: "ISSUE DATE", kind: "date", required: true },
      { key: "dueDate", label: "DUE DATE", kind: "date", required: true },
      { key: "amount", label: "AMOUNT (USD)", kind: "number", required: true },
      { key: "status", label: "WORKFLOW STATUS", kind: "select", options: () => ["AUTO", "draft", "sent", "viewed", "void"] },
      { key: "reminderStatus", label: "REMINDER STATUS", kind: "select", options: () => window.BillingValidate.CONTRACT.reminderStatuses },
      { key: "followUpDate", label: "FOLLOW-UP DATE", kind: "date" },
      { key: "recurring", label: "RECURRING", kind: "select", options: () => ["NONE", "MONTHLY", "QUARTERLY", "ANNUAL"] },
      { key: "notes", label: "NOTES", kind: "text" }
    ],
    payment: [
      { key: "invoiceId", label: "INVOICE # (MUST EXIST LOCALLY)", kind: "text", required: true },
      { key: "paymentDate", label: "PAYMENT DATE", kind: "date", required: true },
      { key: "amount", label: "AMOUNT (USD)", kind: "number", required: true },
      { key: "method", label: "PAYMENT METHOD", kind: "select", options: () => window.BillingValidate.CONTRACT.paymentMethods },
      { key: "referenceNumber", label: "REFERENCE NUMBER (LABEL ONLY)", kind: "text" },
      { key: "notes", label: "NOTES", kind: "text" }
    ]
  };
  const TYPE_LABELS = { customer: "CUSTOMER PROFILE", invoice: "INVOICE", payment: "PAYMENT" };

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
    const items = window.BillingLocal.list(type);
    if (!items.length) return "";
    const title = r => type === "customer" ? r.name : type === "invoice" ? `${r.id || "(new)"} — ${r.customerName}` : `${r.id || "(new)"} → ${r.invoiceId}`;
    const amt = r => fmtAmt(type === "payment" ? r.amount : type === "invoice" ? r.amount : null);
    const when = r => r.issueDate || r.paymentDate || "";
    return `
      <div class="fin-local-group">${esc(TYPE_LABELS[type])}S</div>
      ${items.map((r, i) => {
        const key = r.id !== undefined ? r.id : String(i);
        return `
        <div class="fin-local-row">
          <span class="white">${esc(title(r))}</span>
          <span>${amt(r) !== "—" ? money(amt(r)) : ""}</span>
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
      const items = window.BillingLocal.list(entryType);
      editRecord = items.find((r, i) => (r.id !== undefined ? r.id === editKey : String(i) === editKey)) || null;
    }
    return makePanel({
      id: "panel-bill-entry", title: "MANUAL LOCAL ENTRY — LOCAL TO THIS DEVICE", cls: "wide",
      badge: { cls: "badge-local", text: "◆ LOCAL TO THIS DEVICE" },
      bodyHTML: priv(`
        <div class="fin-local-note">⚠ RECORDS ENTERED HERE ARE STORED ONLY IN THIS BROWSER'S LOCAL STORAGE ON THIS DEVICE.
        THEY ARE NEVER COMMITTED TO GIT, NEVER WRITTEN TO billing-data.js, AND NEVER SENT TO ANY SERVER.
        BROWSER-LOCAL STORAGE IS CONVENIENT FOR TESTING AND PERSONAL USE, BUT IT IS <span class="white">NOT AN ENCRYPTED BILLING BACKEND</span> —
        ANYONE WITH ACCESS TO THIS BROWSER PROFILE CAN READ IT. A PAYMENT CANNOT BE RECORDED PAST AN INVOICE'S REMAINING BALANCE — OVERPAYMENT IS REJECTED.</div>
        <div class="fin-entry-bar">
          <label class="fin-field"><span class="fin-field-label">RECORD TYPE</span>
            <select class="fin-input" id="bill-entry-type">
              ${Object.keys(ENTRY_FIELDS).map(t => `<option value="${t}" ${t === entryType ? "selected" : ""}>${esc(TYPE_LABELS[t])}</option>`).join("")}
            </select>
          </label>
          <span class="dim" id="bill-entry-mode">${editing ? "EDITING EXISTING RECORD" : "ADDING NEW RECORD"}</span>
        </div>
        <div class="fin-form" id="bill-entry-fields">${entryFormFields(entryType, editRecord)}</div>
        <div class="fin-entry-actions">
          <button class="fin-sm-btn primary" id="bill-entry-save">${editing ? "✓ UPDATE RECORD" : "+ ADD RECORD"}</button>
          ${editing ? `<button class="fin-sm-btn" id="bill-entry-cancel">CANCEL EDIT</button>` : ""}
          <span class="fin-entry-err" id="bill-entry-err"></span>
        </div>
        <div id="bill-local-lists">
          ${["customer", "invoice", "payment"].map(localList).join("")}
        </div>
        <div class="fin-entry-actions" style="margin-top:14px">
          <button class="fin-sm-btn danger" id="bill-erase-btn">⨯ ERASE LOCAL BILLING DATA</button>
          <span class="dim">REMOVES EVERY LOCALLY STORED RECORD FROM THIS BROWSER — CANNOT BE UNDONE</span>
        </div>`)
    });
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
      } else if (f.key === "status") {
        rec[f.key] = v === "AUTO" ? null : v;
      } else if (f.key === "recurring") {
        rec[f.key] = v === "NONE" ? null : v;
      } else rec[f.key] = v;
    }
    if (entryType === "invoice" && rec.status === undefined) rec.status = null;
    return rec;
  }

  const ERR_TEXT = {
    REQUIRED: "is required", INVALID_AMOUNT: "must be a valid amount",
    INVALID_DATE: "must be a valid date", INVALID_STATUS: "has an invalid status",
    INVALID_REMINDER_STATUS: "has an invalid reminder status", INVALID_FREQUENCY: "has an invalid recurring frequency",
    INVALID_TERMS: "has invalid payment terms", INVALID_METHOD: "has an invalid payment method",
    INVALID_BOOLEAN: "must be true or false", CREDENTIAL_LIKE: "looks like a credential or account number — not allowed",
    DUPLICATE_ID: "duplicates an existing record id", UNEXPECTED_PROPERTY: "is not an allowed field",
    UNKNOWN_INVOICE: "does not match any locally stored invoice", OVERPAYMENT: "would exceed the invoice's remaining balance"
  };
  function showErrors(panelEl, errors) {
    const el = panelEl.querySelector("#bill-entry-err");
    if (!el) return;
    el.textContent = errors.slice(0, 3).map(e =>
      `${e.path.split(".").pop()} ${ERR_TEXT[e.code] || "is invalid"}`).join(" · ");
  }

  function wireEntryPanel(panelEl) {
    panelEl.querySelector("#bill-entry-type")?.addEventListener("change", ev => {
      entryType = ev.target.value; editKey = null;
      rerender();
    });
    panelEl.querySelector("#bill-entry-save")?.addEventListener("click", () => {
      const rec = readForm(panelEl);
      const res = editKey !== null
        ? window.BillingLocal.update(entryType, editKey, { ...rec, id: typeof editKey === "string" ? editKey : rec.id })
        : window.BillingLocal.add(entryType, rec);
      if (!res.ok) { showErrors(panelEl, res.errors); return; }
      editKey = null;
      rerender();
    });
    panelEl.querySelector("#bill-entry-cancel")?.addEventListener("click", () => { editKey = null; rerender(); });
    panelEl.querySelector("#bill-erase-btn")?.addEventListener("click", () => {
      const n = window.BillingLocal.count();
      const ok = window.confirm(
        `Erase ALL locally stored billing data on this device?\n\n${n} record(s) will be permanently deleted from this browser. This cannot be undone.`);
      if (!ok) return;
      window.BillingLocal.eraseAll();
      editKey = null;
      rerender();
    });
    panelEl.querySelectorAll("[data-act]").forEach(btn => btn.addEventListener("click", () => {
      const { act, type, key } = btn.dataset;
      if (act === "edit") { entryType = type; editKey = key; rerender(); }
      if (act === "del") { window.BillingLocal.remove(type, key); if (editKey === key) editKey = null; rerender(); }
    }));
  }

  // ---------- security controls ----------
  function lock() { setPrivacy(true); }                 // immediate hide
  function unlock() { setPrivacy(false); }              // reveal
  function togglePrivacy() { setPrivacy(!isPrivacyOn()); }

  function initSecurity() {
    if (securityArmed) return;
    securityArmed = true;
    if (window.MutationObserver && !privacyObserver) {
      privacyObserver = new MutationObserver(syncPrivacyToggle);
      privacyObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    }
    const secs = (window.BILLING_CONFIG && Number(window.BILLING_CONFIG.inactivitySeconds)) || 300;
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
      BillingModule.model = m;
      els.push(...buildDataPanels(res.data, m, meta.badge));
      if (state === "LOCAL") els.push(buildEntryPanel());
    } else {
      BillingModule.model = null;
      const msg = OFFLINE_MSG[state] || OFFLINE_MSG.ERROR;
      for (const [id, title, cls] of PANEL_TITLES) els.push(makePanel({ id, title, cls, badge: meta.badge, offlineMsg: msg }));
      if (state === "EXPIRED") lock();
    }

    els.forEach(el => grid.insertBefore(el, sentinel));
    nodes = els;
    BillingModule.state = state;

    const head = els[0];
    head.querySelectorAll(".fin-mode-btn").forEach(btn => btn.addEventListener("click", () => {
      window.BillingAdapter.setMode(btn.dataset.mode);
      editKey = null;
      rerender();
    }));
    head.querySelector("#bill-privacy-toggle")?.addEventListener("click", togglePrivacy);
    head.querySelector("#bill-lock-btn")?.addEventListener("click", lock);
    syncPrivacyToggle();

    const invPanel = els.find(e => e.id === "panel-bill-invoices");
    if (invPanel) wireInvoiceFilters(invPanel);
    const entry = els.find(e => e.id === "panel-bill-entry");
    if (entry) wireEntryPanel(entry);
  }

  async function rerender() {
    if (window.BillingAdapter.currentMode() === "secure-api") paint({ state: "LOADING" });
    const res = await window.BillingAdapter.load();
    paint(res);
  }

  async function render(opts) {
    grid = (opts && opts.grid) || document.getElementById("grid");
    if (!sentinel) {
      sentinel = document.createElement("div");
      sentinel.id = "bill-anchor";
      sentinel.style.display = "none";
      grid.appendChild(sentinel);
      initSecurity();
    }
    await rerender();
  }

  return { render, rerender, buildModel, effectiveStatus, model: null, state: null };
})();
