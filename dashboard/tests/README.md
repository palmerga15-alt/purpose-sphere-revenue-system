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

## Latest result

19 validator + 49 browser checks passing, zero JavaScript errors.
