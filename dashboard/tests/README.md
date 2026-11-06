# Financial Intelligence — Tests

Automated tests for the Business Financial Intelligence module.

## Validator unit tests (no browser)

```bash
node dashboard/tests/finance-validate.test.js
```

Runs `FinanceValidate` against the sample contract and a matrix of
malformed / hostile inputs. Confirms invalid data is rejected and that
validation errors carry field paths and codes only — never values.

## Browser integration tests (Playwright / Chromium)

```bash
# 1. serve the repository root
python3 -m http.server 8788

# 2. in another shell
node dashboard/tests/finance-browser.test.js
```

Environment overrides (optional):

- `BASE_URL` — default `http://127.0.0.1:8788`
- `CHROMIUM_PATH` — default `/opt/pw-browsers/chromium`

Requires the `playwright` package on the Node module path.

Covers: all panels render · Privacy Mode boots locked and masks every
sensitive financial field across all 7 panels · manual + inactivity relock ·
`sample` / `manual-local` / `secure-api` adapter modes (with a routed
secure-api test double for CONNECTED and 401→EXPIRED, checking the token
never lands in a URL) · disconnected/ERROR degradation that leaves the base
Command Center working · desktop + mobile layouts · zero JavaScript errors.

## Latest result (Financial Intelligence)

19 validator + 63 browser checks passing, zero JavaScript errors.
Browser suite includes the two-way "Privacy Mode: ON/OFF" toggle: default
locked state, unlock, re-lock, panel visibility, manual-local mode, LOCK
button sync, header-control sync, and inactivity relock.

## Revenue Billing & Accounts Receivable

```bash
node dashboard/tests/billing-validate.test.js
```

```bash
python3 -m http.server 8788      # 1. serve the repository root
node dashboard/tests/billing-browser.test.js   # 2. in another shell
```

Same environment overrides as above (`BASE_URL`, `CHROMIUM_PATH`).

Covers: default privacy-locked state (shared with Financial Intelligence,
one toggle governs both) · unlock/relock via the section toggle and LOCK
button · all 7 panels render · Invoice Manager search/filter updates the
table in place without losing input focus · invoice status transitions
(auto-computed draft → overdue → partial → paid) · overpayment rejection ·
AR aging bucket math cross-checked against the outstanding balance ·
manual-local CRUD and persistence across a full page reload · malformed/
credential-like data rejected before render or local save · disconnected/
ERROR degradation that leaves the rest of the Command Center (including
Financial Intelligence) working · desktop + mobile layouts · inactivity
relock · zero JavaScript errors.

### Latest result (Revenue Billing & Accounts Receivable)

36 validator + 67 browser checks passing, zero JavaScript errors.
