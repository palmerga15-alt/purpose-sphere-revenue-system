# Business Financial Intelligence — Architecture

Executive financial dashboard for PurposeQuest International / Purposeology,
rendered inside the Purpose Sphere Command Center (`dashboard/index.html`).
Phase 1 built the UI; **Phase 2 adds the secure data-adapter foundation** so
real financial data can arrive later without UI changes — and without any
sensitive information ever entering this public repository.

## Files

| File | Role | Public? |
|---|---|---|
| `dashboard/finance-data.js` | Sample-data contract (`window.FINANCE_DATA`, fictional entries only, `schemaVersion: 1`) | Public — fictional only |
| `dashboard/finance-validate.js` | `FinanceValidate` — contract validation; the gatekeeper every source passes before rendering | Public |
| `dashboard/finance-local.js` | `FinanceLocal` — optional browser-local record store (localStorage CRUD) | Public code; **records stay on the device** |
| `dashboard/finance-api-client.js` | `FinanceApiClient` — authenticated fetch client for a future private backend | Public code; **no endpoint, no credentials** |
| `dashboard/finance-adapter.js` | `FinanceAdapter` — mode resolution + `load()`; the single seam between UI and data | Public |
| `dashboard/finance.js` | `FinanceModule` — model math + rendering + security behaviors | Public |
| `dashboard/finance-config.js` | Deployment-injected config (`window.FINANCE_CONFIG`) | **Git-ignored — never committed.** Public build ships without it |
| `dashboard/FINANCE-ARCHITECTURE.md` | This document | Public |

Load order: `finance-validate.js` → `finance-data.js` → `finance-local.js` →
`finance-api-client.js` → `finance-adapter.js` → `finance.js` → page script.
(A private deployment additionally injects `finance-config.js` before the
adapter loads.)

## Adapter lifecycle

```
page load
  └─ FinanceModule.render({grid})
       ├─ plants a hidden sentinel in the grid (reserves the section's
       │  position so every later re-render lands in the same place)
       ├─ arms security controls (inactivity relock, lock button)
       └─ rerender()
            ├─ mode = FinanceAdapter.currentMode()
            │    deployment config (FINANCE_CONFIG.mode)
            │    > user choice (localStorage "ps_fin_mode" — a mode
            │      name only, never data)
            │    > "sample"
            ├─ secure-api mode paints LOADING first
            ├─ FinanceAdapter.load() →
            │    sample       → FINANCE_DATA        → validate → SAMPLE
            │    manual-local → FinanceLocal.assemble() → validate → LOCAL
            │    secure-api   → FinanceApiClient.fetchData()
            │                     no endpoint/token → SIGNED_OUT (sample fallback)
            │                     401/403           → EXPIRED (token dropped)
            │                     network/HTTP/bad JSON → ERROR
            │                     200 + valid       → CONNECTED
            └─ paint(state):
                 data states  (SAMPLE / LOCAL / CONNECTED / SIGNED_OUT)
                   → section head + 7 panels (+ entry panel in LOCAL)
                 no-data states (LOADING / EXPIRED / ERROR)
                   → section head + 7 offline panels, no financial content;
                     EXPIRED additionally forces Privacy Mode on
```

Re-renders happen on: mode switch, local-record add/edit/delete/erase, and
explicit `FinanceModule.rerender()` calls (e.g. after sign-in). The UI never
changes shape between adapters — only the state chip, badges, and data differ.

## Authentication flow (secure-api)

1. A private deployment injects `finance-config.js`:
   `window.FINANCE_CONFIG = { mode: "secure-api", apiEndpoint: "/api/finance", inactivitySeconds: 300 }`.
   Endpoints must be HTTPS or same-origin paths; anything else is refused.
2. The deployment's sign-in flow obtains a session token and hands it to
   `FinanceApiClient.setSessionToken(token)`. The token lives **only in module
   closure memory** for the tab session — never in localStorage, cookies
   managed by this code, URLs, or query strings.
3. `fetchData()` sends the token in the `Authorization: Bearer` header with
   `cache: no-store`, `credentials: omit`, `referrerPolicy: no-referrer`.
4. `401`/`403` → the token is dropped immediately, state becomes EXPIRED, and
   the financial panels re-lock (Privacy Mode forced on). Re-authentication is
   the deployment's job; afterwards it calls `setSessionToken` +
   `FinanceModule.rerender()`.
5. Signed out (no endpoint or no token) → clearly-labeled fictional sample
   data renders instead.

## Validation flow

`FinanceValidate.validateData()` runs on **every** payload from **every**
source before rendering. Checks: schema version, top-level and per-record
property whitelists (unexpected properties rejected), required fields,
currency amounts (finite numbers, 0 – 10 M), `YYYY-MM-DD` date validity,
allowed statuses / frequencies / categories / calendar types, duplicate
record IDs, and credential-like strings (long digit runs, key/token/secret
markers, base64 blobs, IBAN shapes) in any value.

Failures produce an ERROR state: **nothing renders**, and the console gets an
issue *count* only — validation errors carry field paths and codes, never
values. `FinanceValidate.validateRecord()` reuses the same rules for
manual-local CRUD, so invalid records can't even be saved locally.

## Threat boundaries

| Boundary | Control |
|---|---|
| Public repo / GitHub Pages | Only fictional data and public code. Config and financial exports are git-ignored; validator + tests scan for credential-like strings. |
| Browser localStorage | Holds only: privacy flag, adapter mode name, and (opt-in) manual-local records. The UI states plainly that localStorage is not an encrypted backend; an erase control with confirmation removes all local records. |
| Session memory | The API token lives in closure memory only and is dropped on 401/403. |
| Network | HTTPS/same-origin endpoints only; token in header, never URL; no query-string data; `no-referrer`. |
| Console / logs / errors | No financial payloads, no tokens, no vendor names — state codes and issue counts only. |
| Shoulder-surfing | Privacy Mode starts ON at every load, re-locks after inactivity (default 300 s, configurable), on session expiry, and via the LOCK FINANCIAL PANELS button. |
| Malformed/hostile payloads | Contract validation rejects them before render; all rendering escapes HTML. |

## Public vs private components

**Public (this repo):** all `dashboard/*.js` code, fictional sample data,
this documentation. Safe to serve from GitHub Pages.

**Private (future, separate infrastructure — never in this repo):** the
authenticated backend that aggregates real accounts, its credentials and
tokens, `finance-config.js`, and any real financial records. The backend owns
bank/accounting API access (Phase 3); the browser never holds banking
credentials.

## Sample-to-live transition

1. Stand up a private backend that serves the `schemaVersion: 1` contract
   from authenticated sessions (see Deployment requirements).
2. Deploy the dashboard privately (not GitHub Pages) and inject
   `finance-config.js` with `mode: "secure-api"` and the endpoint.
3. Wire the deployment's sign-in to `FinanceApiClient.setSessionToken()` +
   `FinanceModule.rerender()`.
4. Done — badges flip to `● LIVE DATA`, the chip reads SECURELY CONNECTED,
   and no UI file changes. The public Pages copy keeps showing samples.

## Local-storage limitations (manual-local mode)

Browser localStorage is unencrypted, per-profile, and readable by anyone
with device access or by other code running on the same origin. It is
suitable for testing and light personal use only — the UI repeats this
warning. Records never leave the device, are never committed, and can be
fully erased with the confirmed “ERASE LOCAL FINANCIAL DATA” control.
Clearing site data also deletes them — there is no backup.

## Deployment requirements for the future private backend

- Serves `GET <endpoint>` returning the `schemaVersion: 1` JSON contract with
  `source.mode: "live"`; responses must pass `FinanceValidate` untouched.
- Authenticates every request (session token in `Authorization` header);
  returns `401` for expired/invalid sessions (the client relies on this to
  re-lock).
- HTTPS only; short-lived tokens; no tokens in URLs or logs.
- Aggregates bank/accounting sources server-side; secrets live in the
  backend's secret store, never in the response payload or the browser.
- Hosts the dashboard privately; the public repo remains sample-only.
- Strips or never includes account numbers and identifiers — the validator
  rejects credential-like strings by design, so the backend must send display
  labels only.

## Business Health Score

Deterministic, computed in `FinanceModule.buildModel()`:

```
100
− 15 per overdue payment              (capped at −30)
− 20 if net cash flow ≤ 0
−  5 per duplicate subscription group (capped at −15)
− 10 if bills due within 7 days exceed 50% of monthly revenue
```

Bands: ≥ 80 STRONG (green) · ≥ 60 STABLE (amber) · < 60 NEEDS ATTENTION (red).

## Privacy Mode

Reuses the header toggle (`body.privacy`). Every finance panel wraps content
in `.fin-sensitive`, hidden in favor of a “PRIVATE FINANCIAL DATA HIDDEN”
notice via pure CSS — toggling off restores instantly. Phase 2 additions:
starts ON at every page load, inactivity relock, manual lock button, and
automatic relock on session expiry. This is a viewing shield, not encryption
— which is exactly why only fictional data may ship in the public repo.
