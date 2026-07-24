# Business Financial Intelligence — Architecture

Phase 1 of the executive financial dashboard for PurposeQuest International /
Purposeology, rendered inside the Purpose Sphere Command Center
(`dashboard/index.html`).

## Files

| File | Role |
|---|---|
| `dashboard/finance-data.js` | **Data contract only.** Assigns `window.FINANCE_DATA`. Phase 1 ships fictional sample entries; no logic. |
| `dashboard/finance.js` | **Logic + rendering.** `window.FinanceModule` derives every displayed number in `buildModel()` and renders all seven panels via `render(ctx)`. No data lives here. |
| `dashboard/index.html` | **Shared HUD chrome.** Provides the panel factory, escaping/money helpers, grid, and Privacy Mode toggle. Calls `FinanceModule.render({ panel, grid, esc, money, safe })` once, in section order. |
| `dashboard/FINANCE-ARCHITECTURE.md` | This document. |

Load order: `data.js` → `finance-data.js` → `finance.js` → inline page script.

## Panels (Phase 1)

1. **Executive Financial Snapshot** — Cash Available (placeholder until a
   secure bank link exists), Monthly Revenue, Monthly Expenses, Net Cash Flow,
   Outstanding Payments, Upcoming Bills (30 days), Business Health Score.
2. **Payment Tracker** — full payment table; status auto-calculated from due
   date (`OVERDUE` / `DUE SOON` ≤ 7 days / `DUE`) unless manually `PAID` or
   `CANCELLED`; unpaid rows sorted by nearest due date.
3. **Expense Intelligence** — current-month activity rolled up into eight
   reporting groups (mapping in `FINANCE_DATA.categoryGroups`), with totals,
   percentages, and bars.
4. **Subscription Manager** — monthly/annual cost, renewal, last payment,
   auto-renew, purpose. Duplicate detection: two or more subscriptions sharing
   a `purposeTags` entry are flagged as a possible duplicate group.
5. **Revenue Dashboard** — eight placeholder streams (books, speaking,
   coaching, certification, digital, webinar, membership, consulting) marked
   `SAMPLE` until Phase 2 feeds them.
6. **Financial Calendar** — merges unpaid bills and subscription renewals
   (derived automatically) with configured events (`calendarEvents`: quarterly
   taxes, insurance, annual items), sorted by date.
7. **AI Financial Insights** — reserved panel. `insights.planned` lists the
   future engine's capabilities (shown as STANDBY slots); `insights.items` is
   the write target for the Phase 3 engine and renders as findings when
   non-empty. Until then, rule-based "local signals" (duplicates, overdue,
   largest upcoming expense) preview the panel.

## Business Health Score

Deterministic, computed in `buildModel()`:

```
100
− 15 per overdue payment            (capped at −30)
− 20 if net cash flow ≤ 0
−  5 per duplicate subscription group (capped at −15)
− 10 if bills due within 7 days exceed 50% of monthly revenue
```

Bands: ≥ 80 STRONG (green) · ≥ 60 STABLE (amber) · < 60 NEEDS ATTENTION (red).

## Privacy Mode

Reuses the existing header toggle (`body.privacy`, persisted in
`localStorage`). Every finance panel wraps its content in `.fin-sensitive`
and carries a `.fin-privacy-msg` notice. CSS in `index.html`:

```css
body.privacy .fin-panel .fin-sensitive  { display: none; }
body.privacy .fin-panel .fin-privacy-msg { display: block; }
```

With privacy ON, all amounts, vendors, due dates, payment methods, notes, and
project names disappear and each panel shows **PRIVATE FINANCIAL DATA
HIDDEN**. Toggling OFF restores everything instantly (pure CSS, no re-render).
Note this is a *viewing* shield only — data in `finance-data.js` is still in
the page source, which is exactly why only fictional data may ever ship there.

## Future phases — connecting live data securely

The UI contract is `window.FINANCE_DATA` + `FinanceModule.render()`. To go
live **nothing in the layout changes**; only the data supply does:

- **Phase 2 — secure backend adapter.** Replace the static
  `finance-data.js` include with an authenticated fetch (session-based, HTTPS)
  to a private backend that aggregates real payments/subscriptions/revenue
  server-side and responds with the same JSON shape
  (`schemaVersion: 1`). Set `source.mode = "live"` — every panel's badge
  flips from `◆ SAMPLE DATA` to `● LIVE DATA` automatically. The public
  GitHub Pages copy keeps shipping fictional data.
- **Phase 3 — banking / accounting integrations.** The backend (never the
  browser) talks to banking APIs and accounting systems; tokens and account
  identifiers live only in that backend's secret store. The AI insights
  engine writes findings into `insights.items`.

## Hard security rules

- No credentials, API keys, tokens, account numbers, routing numbers, or card
  numbers anywhere in this repository — frontend or docs.
- No real vendors, amounts, dates, or notes in `finance-data.js` while the
  repo/site is public.
- `paymentMethod` is a display label, never an identifier.
- Live data must only ever arrive via an authenticated server-side adapter.
