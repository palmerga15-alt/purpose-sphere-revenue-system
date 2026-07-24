// ============================================================
// PURPOSE SPHERE COMMAND CENTER — FINANCIAL INTELLIGENCE MODULE
// Phase 1. Renders the BUSINESS FINANCIAL INTELLIGENCE section:
//   1. Executive Financial Snapshot
//   2. Payment Tracker
//   3. Expense Intelligence
//   4. Subscription Manager
//   5. Revenue Dashboard
//   6. Financial Calendar
//   7. AI Financial Insights (reserved)
//
// Architecture (full detail in dashboard/FINANCE-ARCHITECTURE.md):
//   finance-data.js → data contract only (window.FINANCE_DATA,
//                     fictional sample entries in Phase 1)
//   finance.js      → pure logic + rendering (this file)
//   index.html      → shared HUD chrome; calls
//                     FinanceModule.render(ctx) with its panel
//                     factory and helpers
//
// A future secure authenticated backend replaces finance-data.js
// with a fetch that emits the same window.FINANCE_DATA shape and
// sets source.mode = "live" — nothing in this file or the HTML
// layout changes. No credentials, API keys, or account
// identifiers belong anywhere in this repository.
// ============================================================
window.FinanceModule = (function () {
  "use strict";

  const MS_DAY = 86400000;

  // ---------- pure helpers ----------
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

    // payments + auto status
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

    // sorted table rows: unpaid by nearest due date, then paid (recent first), cancelled last
    const rank = r => isUnpaid(r) ? 0 : (r.st === "PAID" ? 1 : 2);
    const rows = [...payments].sort((a, b) =>
      rank(a) - rank(b) ||
      ((a.due?.getTime() ?? Infinity) - (b.due?.getTime() ?? Infinity)) * (rank(a) === 1 ? -1 : 1));

    // expense intelligence: current-month activity rolled up into reporting groups
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

    // subscriptions + automatic duplicate detection via shared purposeTags
    const subs = (F.subscriptions || []).map(s => ({ ...s }));
    const tagCount = {};
    subs.forEach(s => (s.purposeTags || []).forEach(t => { tagCount[t] = (tagCount[t] || 0) + 1; }));
    subs.forEach(s => { s.dupTags = (s.purposeTags || []).filter(t => tagCount[t] > 1); });
    const dupGroups = Object.keys(tagCount).filter(t => tagCount[t] > 1);
    subs.sort((a, b) => (parseDay(a.renewalDate)?.getTime() ?? Infinity) - (parseDay(b.renewalDate)?.getTime() ?? Infinity));
    const subsMonthly = sum(subs, s => s.monthlyCost);
    const subsAnnual = sum(subs, s => (typeof s.annualCost === "number" ? s.annualCost : (s.monthlyCost || 0) * 12));

    // revenue (placeholder streams until Phase 2 connects real sources)
    const revStreams = (F.revenue && F.revenue.streams) || [];
    const monthlyRevenue = sum(revStreams, s => s.monthTotal);

    // financial calendar: unpaid bills + subscription renewals + configured events
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

    // snapshot + health score
    const outstanding = sum(unpaid, r => r.amount);
    const netCashFlow = monthlyRevenue - monthExpenses;
    // Health score (documented in FINANCE-ARCHITECTURE.md):
    // 100 − 15/overdue payment (cap 30) − 20 if net cash flow ≤ 0
    //     − 5/duplicate subscription group (cap 15)
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

  // ---------- rendering ----------
  function render(ctx) {
    const { panel, grid, esc, money, safe } = ctx;
    const F = (typeof window.FINANCE_DATA === "object" && window.FINANCE_DATA) || null;
    const m = F ? buildModel(F) : null;
    FinanceModule.model = m; // exposed for tests / future adapters

    const sample = F?.source?.mode === "sample";
    const badge = F ? {
      cls: sample ? "badge-sample" : "badge-online",
      text: sample ? "◆ SAMPLE DATA" : "● LIVE DATA"
    } : undefined;
    const monthName = new Date().toLocaleString("en-US", { month: "long" }).toUpperCase();

    // Privacy Mode: each finance panel's content sits inside .fin-sensitive,
    // which body.privacy hides in favor of the .fin-privacy-msg notice.
    const priv = inner => `
      <div class="fin-privacy-msg">🔒 PRIVATE FINANCIAL DATA HIDDEN<span class="sub2">TURN PRIVACY OFF TO VIEW AND MANAGE FINANCES</span></div>
      <div class="fin-sensitive">${inner}</div>`;

    // section header
    safe(() => {
      const head = document.createElement("div");
      head.className = "section-head";
      head.id = "fin-section-head";
      head.innerHTML = `
        <span class="sh-title">◈ BUSINESS FINANCIAL INTELLIGENCE</span>
        <span class="sh-note">PHASE 1 · ${sample ? "FICTIONAL SAMPLE DATA" : "LIVE DATA"} · SECURE-ADAPTER READY</span>`;
      grid.appendChild(head);
    });

    // 1. EXECUTIVE FINANCIAL SNAPSHOT
    safe(() => {
      const card = (cls, val, label, sub) => `
        <div class="fin-card ${cls}">
          <div class="n money">${esc(val)}</div>
          <div class="l">${esc(label)}</div>
          <div class="sub">${esc(sub)}</div>
        </div>`;
      panel({
        id: "panel-fin-snapshot", title: "EXECUTIVE FINANCIAL SNAPSHOT", cls: "wide fin-panel",
        online: !!m, badge,
        bodyHTML: !m ? "" : priv(`
          <div class="fin-cards">
            ${card("c-cash", F.snapshot?.cashAvailable != null ? fmtAmt(F.snapshot.cashAvailable) : "—", "CASH AVAILABLE", F.snapshot?.cashNote || "AWAITING SECURE BANK LINK")}
            ${card("c-paid", fmtAmt(m.monthlyRevenue), "MONTHLY REVENUE", m.revStreams.length + " STREAMS · " + monthName)}
            ${card("c-due7", fmtAmt(m.monthExpenses), "MONTHLY EXPENSES", monthName + " ACTIVITY")}
            ${card(m.netCashFlow >= 0 ? "c-paid" : "c-overdue", fmtAmt(m.netCashFlow), "NET CASH FLOW", "REVENUE − EXPENSES")}
            ${card("c-month", fmtAmt(m.outstanding), "OUTSTANDING PAYMENTS", m.unpaid.length + " UNPAID ITEMS")}
            ${card("c-due7", fmtAmt(sum(m.upcoming30, r => r.amount)), "UPCOMING BILLS", "NEXT 30 DAYS · " + m.upcoming30.length + " ITEMS")}
            ${card(m.health >= 80 ? "c-paid" : m.health >= 60 ? "c-due7" : "c-overdue", m.health + " / 100", "BUSINESS HEALTH SCORE", m.healthBand)}
          </div>`)
      });
    });

    // 2. PAYMENT TRACKER
    safe(() => {
      const card = (cls, val, label, count) => `
        <div class="fin-card ${cls}">
          <div class="n money">${esc(fmtAmt(val))}</div>
          <div class="l">${esc(label)}</div>
          <div class="sub">${count} ${count === 1 ? "PAYMENT" : "PAYMENTS"}</div>
        </div>`;
      panel({
        id: "panel-finance", title: "PAYMENT TRACKER", cls: "wide fin-panel",
        online: !!m, badge,
        bodyHTML: !m ? "" : priv(`
          <div class="fin-cards">
            ${card("c-due7", sum(m.due7, r => r.amount), "DUE NEXT 7 DAYS", m.due7.length)}
            ${card("c-month", sum(m.dueMonth, r => r.amount), "DUE THIS MONTH", m.dueMonth.length)}
            ${card("c-paid", sum(m.paidMonth, r => r.amount), "PAID THIS MONTH", m.paidMonth.length)}
            ${card("c-recur", sum(m.recurringPays, r => r.amount), "MONTHLY RECURRING", m.recurringPays.length)}
            ${card("c-overdue", sum(m.overdue, r => r.amount), "OVERDUE", m.overdue.length)}
          </div>
          <table class="fin-table">
            <tr>
              <th>VENDOR</th><th>EXPENSE</th><th>CATEGORY</th><th>AMOUNT</th><th>DUE DATE</th>
              <th>FREQ</th><th>STATUS</th><th>BUSINESS / PROJECT</th><th>METHOD</th><th>NOTES</th><th>RECEIPT</th>
            </tr>
            ${m.rows.map(r => `
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
              </tr>`).join("")}
          </table>
          <div class="dim fin-footnote">${esc(F.source?.label || "")} · STATUS AUTO-CALCULATED FROM DUE DATE UNLESS MARKED PAID / CANCELLED · NO ACCOUNT NUMBERS OR CREDENTIALS STORED IN THIS MODULE</div>`)
      });
    });

    // 3. EXPENSE INTELLIGENCE
    safe(() => {
      panel({
        id: "panel-fin-expense", title: "EXPENSE INTELLIGENCE", cls: "fin-panel",
        online: !!m, badge,
        bodyHTML: !m ? "" : priv(`
          ${m.byGroup.map(g => `
            <div class="fin-bar-row">
              <div class="fb-label ${g.total ? "white" : "dim"}">${esc(g.name)}</div>
              <div class="fin-bar"><div class="fin-bar-fill" style="width:${g.pctOfMax}%"></div></div>
              <div class="fb-amt">${money(fmtAmt(g.total))}</div>
              <div class="fb-pct dim">${esc(g.pct)}%</div>
            </div>`).join("")}
          <div class="dim fin-footnote">${esc(monthName)} TOTAL ${""}<span class="money">${esc(fmtAmt(m.monthExpenses))}</span> · GROUPED FROM CURRENT-MONTH PAYMENT ACTIVITY</div>`)
      });
    });

    // 4. SUBSCRIPTION MANAGER
    safe(() => {
      panel({
        id: "panel-fin-subs", title: "SUBSCRIPTION MANAGER", cls: "fin-panel",
        online: !!m, badge,
        bodyHTML: !m ? "" : priv(`
          <div class="fin-cards">
            <div class="fin-card c-recur"><div class="n money">${esc(fmtAmt(m.subsMonthly))}</div><div class="l">MONTHLY SUBSCRIPTIONS</div><div class="sub">${m.subs.length} ACTIVE</div></div>
            <div class="fin-card c-month"><div class="n money">${esc(fmtAmt(m.subsAnnual))}</div><div class="l">ANNUALIZED COST</div><div class="sub">ALL SUBSCRIPTIONS</div></div>
            <div class="fin-card ${m.dupGroups.length ? "c-overdue" : "c-paid"}"><div class="n">${m.dupGroups.length}</div><div class="l">POSSIBLE DUPLICATE GROUPS</div><div class="sub">${esc(m.dupGroups.join(" · ").toUpperCase() || "NONE DETECTED")}</div></div>
          </div>
          <table class="fin-table-sm">
            <tr><th>SERVICE</th><th>MO</th><th>YR</th><th>RENEWS</th><th>LAST PAID</th><th>AUTO</th><th>PURPOSE</th></tr>
            ${m.subs.map(s => `
              <tr class="${s.dupTags.length ? "row-dup" : ""}">
                <td class="white">${esc(s.vendor)}${s.dupTags.length ? `<span class="dup-chip">⚠ DUP: ${esc(s.dupTags.join(", ").toUpperCase())}</span>` : ""}</td>
                <td>${money(fmtAmt(s.monthlyCost))}</td>
                <td>${money(fmtAmt(s.annualCost))}</td>
                <td class="dim">${esc(s.renewalDate || "—")}</td>
                <td class="dim">${esc(s.lastPayment || "—")}</td>
                <td class="${s.autoRenew ? "tag-pub" : "tag-unpub"}">${s.autoRenew ? "✓ ON" : "✗ OFF"}</td>
                <td class="dim">${esc(s.purpose || "")}</td>
              </tr>`).join("")}
          </table>`)
      });
    });

    // 5. REVENUE DASHBOARD
    safe(() => {
      panel({
        id: "panel-fin-revenue", title: "REVENUE DASHBOARD", cls: "fin-panel",
        online: !!m, badge,
        bodyHTML: !m ? "" : priv(`
          <div class="stat-row">
            <div class="stat"><div class="n money">${esc(fmtAmt(m.monthlyRevenue))}</div><div class="l">${esc(F.revenue?.period || "THIS MONTH")} · ALL STREAMS</div></div>
          </div>
          <table>
            <tr><th>STREAM</th><th>${esc(F.revenue?.period || "THIS MONTH")}</th><th>SOURCE</th></tr>
            ${m.revStreams.map(s => `
              <tr>
                <td class="white">${esc(s.name)}</td>
                <td>${money(fmtAmt(s.monthTotal))}</td>
                <td><span class="pay-status ${s.source === "SAMPLE" ? "ps-DUE-SOON" : "ps-PAID"}">${esc(s.source || "LIVE")}</span></td>
              </tr>`).join("")}
          </table>
          <div class="dim fin-footnote">PLACEHOLDER STREAMS — PHASE 2 CONNECTS SALES PLATFORMS THROUGH THE SECURE BACKEND ADAPTER</div>`)
      });
    });

    // 6. FINANCIAL CALENDAR
    safe(() => {
      panel({
        id: "panel-fin-calendar", title: "FINANCIAL CALENDAR", cls: "fin-panel",
        online: !!m, badge,
        bodyHTML: !m ? "" : priv(`
          <table>
            <tr><th>DATE</th><th>EVENT</th><th>TYPE</th><th>EST.</th></tr>
            ${m.calendar.map(e => `
              <tr>
                <td class="dim">${esc(e.date)}</td>
                <td class="white">${esc(e.label)}</td>
                <td><span class="ev-chip ev-${esc(e.type)}">${esc(e.type)}</span></td>
                <td>${e.amount != null ? money(fmtAmt(e.amount)) : `<span class="dim">—</span>`}</td>
              </tr>`).join("")}
          </table>
          <div class="dim fin-footnote">BILLS + SUBSCRIPTION RENEWALS DERIVED AUTOMATICALLY · TAX / INSURANCE / ANNUAL DATES FROM CALENDAR CONFIG</div>`)
      });
    });

    // 7. AI FINANCIAL INSIGHTS (reserved for the Phase 3 engine)
    safe(() => {
      const ins = F?.insights || {};
      const local = !m ? [] : [
        m.dupGroups.length ? `${m.dupGroups.length} possible duplicate subscription group${m.dupGroups.length === 1 ? "" : "s"}: ${m.dupGroups.join(", ")}` : null,
        m.overdue.length ? `${m.overdue.length} overdue payment${m.overdue.length === 1 ? "" : "s"} totaling ${fmtAmt(sum(m.overdue, r => r.amount))}` : null,
        m.calendar.length ? `Largest upcoming expense: ${m.calendar.reduce((a, b) => ((b.amount || 0) > (a.amount || 0) ? b : a)).label}` : null,
        "Month-over-month trends require the Phase 2 history feed"
      ].filter(Boolean);
      panel({
        id: "panel-fin-insights", title: "AI FINANCIAL INSIGHTS", cls: "wide fin-panel",
        online: !!F, badge: F ? { cls: "badge-sample", text: "◆ ENGINE " + (ins.engineStatus || "RESERVED") } : undefined,
        bodyHTML: !F ? "" : priv(`
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
      });
    });
  }

  return { render, buildModel, effectiveStatus, model: null };
})();
