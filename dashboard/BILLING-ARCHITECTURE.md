# Revenue Billing & Accounts Receivable — Architecture

Executive billing dashboard for PurposeQuest International / Purposeology,
rendered inside the Purpose Sphere Command Center (`dashboard/index.html`),
alongside the Business Financial Intelligence module. This is **Milestone 2**:
a secure, sample-data-first foundation for invoicing, accounts receivable
aging, payment recording, customer billing profiles, a billing calendar, and
a manual collections workflow — with no payment processor or banking
integration in this phase.

## Files

| File | Role | Public? |
|---|---|---|
| `dashboard/billing-data.js` | Sample-data contract (`window.BILLING_DATA`, fictional entries only, `schemaVersion: 1`) | Public — fictional only |
| `dashboard/billing-validate.js` | `BillingValidate` — contract validation; the gatekeeper every source passes before rendering | Public |
| `dashboard/billing-local.js` | `BillingLocal` — optional browser-local record store (localStorage CRUD), enforces the overpayment invariant | Public code; **records stay on the device** |
| `dashboard/billing-api-client.js` | `BillingApiClient` — authenticated fetch client for a future private backend | Public code; **no endpoint, no credentials, no payment processor** |
| `dashboard/billing-adapter.js` | `BillingAdapter` — mode resolution + `load()`; the single seam between UI and data | Public |
| `dashboard/billing.js` | `BillingModule` — model math + rendering + security behaviors | Public |
| `dashboard/billing-config.js` | Deployment-injected config (`window.BILLING_CONFIG`) | **Git-ignored — never committed.** Public build ships without it |
| `dashboard/BILLING-ARCHITECTURE.md` | This document | Public |

Load order: `billing-validate.js` → `billing-data.js` → `billing-local.js` →
`billing-api-client.js` → `billing-adapter.js` → `billing.js` → page script.
This mirrors the Financial Intelligence module's load order exactly (see
`FINANCE-ARCHITECTURE.md`). A private deployment additionally injects
`billing-config.js` before the adapter loads.

This module is **deliberately self-contained** — it does not call into
`finance.js`/`FinanceModule` at runtime, so either module can be removed
independently. The two modules cooperate only through the page-level shared
state described below (`body.privacy`, `window.setPrivacy`).

## Adapter lifecycle

Identical shape to the Financial Intelligence adapter:

```
page load
  └─ BillingModule.render({grid})
       ├─ plants a hidden sentinel in the grid (reserves the section's
       │  position so every later re-render lands in the same place)
       ├─ arms security controls (inactivity relock, lock button)
       └─ rerender()
            ├─ mode = BillingAdapter.currentMode()
            │    deployment config (BILLING_CONFIG.mode)
            │    > user choice (localStorage "ps_billing_mode" — a mode
            │      name only, never data)
            │    > "sample"
            ├─ secure-api mode paints LOADING first
            ├─ BillingAdapter.load() →
            │    sample       → BILLING_DATA         → validate → SAMPLE
            │    manual-local → BillingLocal.assemble() → validate → LOCAL
            │    secure-api   → BillingApiClient.fetchData()
            │                     no endpoint/token → SIGNED_OUT (sample fallback)
            │                     401/403           → EXPIRED (token dropped)
            │                     network/HTTP/bad JSON → ERROR
            │                     200 + valid       → CONNECTED
            └─ paint(state):
                 data states  (SAMPLE / LOCAL / CONNECTED / SIGNED_OUT)
                   → section head + 7 panels (+ entry panel in LOCAL)
                 no-data states (LOADING / EXPIRED / ERROR)
                   → section head + 7 offline panels, no billing content;
                     EXPIRED additionally forces Privacy Mode on
```

Re-renders happen on: mode switch, local-record add/edit/delete/erase, and
explicit `BillingModule.rerender()` calls. The Invoice Manager's search box
and status filter are the one exception — they update the invoice table's
`<tbody>` **in place** rather than triggering a full section re-render, so
the search input never loses focus mid-keystroke.

## Data model (`schemaVersion: 1`)

```
BILLING_DATA = {
  schemaVersion: 1, generatedAt, source: { mode, label },
  customers: [{ id, name, billingContact, billingEmail, billingAddress,
                paymentTerms, taxExempt, notes }],
  invoices:  [{ id, customerId, customerName, issueDate, dueDate, amount,
                status, reminderStatus, followUpDate, recurring, notes }],
  payments:  [{ id, invoiceId, paymentDate, amount, method,
                referenceNumber, notes }]
}
```

**Computed, not stored:** `balanceRemaining` and the display status
(`paid` / `partial` / `overdue` / `current`) are never persisted fields —
they are derived at render time from `amount − Σ(linked payments)` and the
due date, the same way `finance.js` auto-computes `effectiveStatus()` from
due dates. Only the workflow states a person actually sets — `draft`,
`sent`, `viewed`, `void` (or `null`/`"AUTO"` to let the system decide) — are
stored directly on `invoice.status`. This keeps balance and status from ever
drifting out of sync with recorded payments, and gives overpayment
prevention a single, obvious enforcement point: `BillingLocal.add()` /
`.update()` for payment records.

**AR aging** (current, 1–30, 31–60, 61–90, 90+ days overdue) and
**Collections Workflow lanes** (upcoming due, due today, overdue, follow-up
needed, paid) are both computed from this same model on every render — there
is no separate stored bucket state to keep in sync.

**Billing Calendar** events (issued / due / follow-up / recurring) are
likewise derived: issue and due dates come straight from each invoice,
follow-up dates from `invoice.followUpDate`, and recurring dates are
projected forward from `dueDate` by the invoice's `recurring` frequency
(`MONTHLY` ≈ 30 days, `QUARTERLY` ≈ 91 days, `ANNUAL` = 365 days) — there is
no separate recurring-schedule record type in this phase.

## Validation flow

`BillingValidate.validateData()` runs on **every** payload from **every**
source before rendering. Checks: schema version, top-level and per-record
property whitelists (unexpected properties rejected), required fields,
currency amounts (finite numbers, 0 – 10M), `YYYY-MM-DD` date validity,
allowed statuses / reminder statuses / recurring frequencies / payment terms
/ payment methods, duplicate record IDs, unknown customer/invoice references,
credential-like strings (long digit runs, key/token/secret markers,
base64-ish blobs, IBAN/card-shaped strings) in any value, **and a
cross-record overpayment check** — no invoice's linked payments may sum to
more than its `amount`.

Failures produce an ERROR state: **nothing renders**, and the console gets an
issue *count* only — validation errors carry field paths and codes, never
values. `BillingValidate.validateRecord()` reuses the same per-record rules
for manual-local CRUD. The overpayment and unknown-invoice checks that need
store-wide context (not visible to a single-record validator) are enforced
separately in `BillingLocal.add()`/`.update()`, mirroring how duplicate-ID
checks work in `FinanceLocal`.

## Threat boundaries

| Boundary | Control |
|---|---|
| Public repo / GitHub Pages | Only fictional data and public code. Config is git-ignored; validator scans for credential-like strings in every field, including customer address/notes and payment reference numbers. |
| Browser localStorage | Holds only: privacy flag, adapter mode name, and (opt-in) manual-local records. The UI states plainly that localStorage is not an encrypted backend; an erase control with confirmation removes all local records. |
| Session memory | The API token lives in closure memory only and is dropped on 401/403. |
| Network | HTTPS/same-origin endpoints only; token in header, never URL; no query-string data; `no-referrer`. No payment-processor SDK, no card-collection UI, no banking API calls anywhere in this phase. |
| Console / logs / errors | No billing payloads, no customer PII, no tokens — state codes and issue counts only. |
| Shoulder-surfing | Privacy Mode starts ON at every load (shared with Financial Intelligence); a two-way in-section "Privacy Mode: ON/OFF" toggle reveals or hides; re-locks after inactivity (default 300s, configurable), on session expiry, and via the separate LOCK BILLING PANELS button. |
| Overpayment | Enforced at both the validator (cross-record check on full payloads) and the local-store write path (`BillingLocal`) — a payment cannot push an invoice's recorded total past its amount. |
| Malformed/hostile payloads | Contract validation rejects them before render; all rendering escapes HTML. |

## Privacy Mode — shared with Financial Intelligence

Billing does **not** implement a separate privacy system. Every billing
panel wraps sensitive content in `.bill-sensitive`, hidden in favor of a
"PRIVATE BILLING DATA HIDDEN" notice via the same `body.privacy` class the
Financial Intelligence module reads and writes through `window.setPrivacy`.
One global toggle (the header button, or either module's in-section toggle)
locks or unlocks both modules together — there is exactly one privacy state
for the whole Command Center.

Billing additionally provides its own in-section two-way toggle
(`#bill-privacy-toggle`), its own **LOCK BILLING PANELS** button
(`#bill-lock-btn`), and its own inactivity-relock timer
(`BILLING_CONFIG.inactivitySeconds`, default 300s) — deliberately duplicated
rather than calling into `finance.js`, so the module keeps working even if
Financial Intelligence is later removed.

## Sample-to-live transition

Identical path to Financial Intelligence: stand up a private backend serving
the `schemaVersion: 1` contract from authenticated sessions, deploy privately
(not GitHub Pages), inject `billing-config.js` with
`mode: "secure-api"` + `apiEndpoint`, and wire sign-in to
`BillingApiClient.setSessionToken()` + `BillingModule.rerender()`. No UI
files change. **Explicitly out of scope for this phase:** Stripe, PayPal,
Square, or any live banking/payment-processor integration — `BillingApiClient`
is a dormant foundation only.

## Testing

| Suite | Runner | Covers |
|---|---|---|
| `billing-validate.test.js` | `node dashboard/tests/billing-validate.test.js` | Contract validation accept/reject matrix — schema, whitelists, required fields, amount/date bounds, enum values, duplicate IDs, unknown references, overpayment, credential-like strings; confirms error output carries paths/codes but never values. |
| `billing-browser.test.js` | serve the repo root, then `node dashboard/tests/billing-browser.test.js` | Default privacy-locked state (shared with Finance); unlock/relock; all 7 panels render; invoice creation and status transitions (draft → sent/auto → partial → paid, overdue); partial and full payment handling; overpayment rejection; AR aging bucket math; manual-local persistence across reload; malformed-data rejection; zero JavaScript errors. |

See `dashboard/tests/README.md` for exact commands.
