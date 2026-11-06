# Purposeology IP Intelligence — Architecture

Milestone 3 for the Purpose Sphere Command Center. Tracks IP **administration**
— trademark/copyright status, licensing records, and a terminology compliance
scan of this repository's own content — and never the IP's actual substance.

## The one rule everything else serves

Per `business-brief.md`: "The underlying 26-concept framework and Concept
Dictionary are proprietary and internal-only — never enumerated, defined, or
reconstructed in outward-facing content." This module exists to help *protect*
that boundary, so it is held to a stricter standard than Financial Intelligence
or Billing: it must never store, display, or reconstruct the framework's
substance itself, not even as sample/placeholder data. Only the terms the
brief already clears for outward use — **Purpose Fingerprint™**, **Chronos vs.
Kairos**, and the five-stage journey (find, focus, form, follow, fruition) —
are safe to reference anywhere in this module.

## Files

| File | Role | Public? |
|---|---|---|
| `dashboard/ip-data.js` | `window.IP_DATA` — fictional sample trademark/license records; `complianceScan` is a **real** result (see below) | Public |
| `dashboard/ip-validate.js` | `IPValidate` — contract validation; also the single source of truth for `IP_LEAK_PATTERNS` | Public |
| `dashboard/ip-local.js` | `IPLocal` — optional browser-local record store | Public code; **records stay on the device** |
| `dashboard/ip-api-client.js` | `IPApiClient` — authenticated fetch client for a future private backend | Public code; **no endpoint, no credentials** |
| `dashboard/ip-adapter.js` | `IPAdapter` — mode resolution + `load()` | Public |
| `dashboard/ip.js` | `IPModule` — model math + rendering + security behaviors | Public |
| `dashboard/ip-scan.js` | Standalone Node CLI — the real terminology compliance scanner | Public, and actually run against this repo (see below) |
| `dashboard/ip-scan-report.json` | Latest real scan output, committed (safe: it is a count of clean markdown, not a secret) | Public |
| `dashboard/ip-config.js` | Deployment-injected config (`window.IP_CONFIG`) | **Git-ignored — never committed** |
| `dashboard/IP-ARCHITECTURE.md` | This document | Public |

Load order: `ip-validate.js` → `ip-data.js` → `ip-local.js` → `ip-api-client.js`
→ `ip-adapter.js` → `ip.js` → page script. Identical shape to Finance and
Billing, and fully independent of both at runtime — removing either does not
affect this module.

## Why `ip-scan.js` is different from everything else in this dashboard

Finance and Billing both ship *fictional* sample data because real financial
and customer records are sensitive. Repo markdown is not sensitive in the same
way — the only thing that would make it sensitive is if someone wrote the
actual 26 concepts into it, which (by the brief's own rule) never happens. So
there is nothing to fictionalize: `ip-scan.js` is a real tool that actually
walks every `.md` file in this repository and checks it against
`IPValidate.IP_LEAK_PATTERNS`. The "sample" adapter mode ships this tool's
real, current output, not a placeholder.

```bash
node dashboard/ip-scan.js            # print the report
node dashboard/ip-scan.js --write    # also write dashboard/ip-scan-report.json
```

### Pattern design — a documented dead end, not hidden

The first version of `IP_LEAK_PATTERNS` matched bare mentions of "26 concepts"
and "Concept Dictionary." Run against this actual repository, it produced
**25 false positives** — every one of them was this repo's own legitimate
compliance language (the agent instructions and offer specs that say, in
effect, "never enumerate the internal 26 concepts or Concept Dictionary").
Naming the restriction is not the same as violating it, and a bare-keyword
scanner cannot tell the difference.

The patterns were narrowed to target the *shape* of an actual definition or
enumeration attempt instead of a mere mention: the word "concept," a number,
and an immediately following colon or dash with content after it (a numbered
label introducing a definition); a Markdown heading literally titled with the
word "concept" plus a number; the phrase naming the internal dictionary
followed by a colon and content (**colon only, not em-dash** — an em-dash
version also produced false positives against this repo's own prose, where
the dash is just a clause break, not a definition opener); and a numbered
list item that starts with the word "concept." (Deliberately described here
rather than spelled out as literal matching text — this document would
otherwise trip its own scanner the same way the first pattern version tripped
over this repo's compliance language. See `dashboard/ip-validate.js` for the
exact regular expressions.)

Re-run against this repository: **0 findings** (down from 25), while still
catching all four shapes above against a synthetic "leaky" fixture. See the
test suite for both the real-repo and synthetic-fixture checks.

### Scope and limits

This is a heuristic linter, not a content firewall. It flags shapes that look
like definition/enumeration attempts in Markdown prose; it does not parse
meaning, does not scan non-Markdown files, and a determined bad actor could
still phrase a leak around it. Its job is to catch an accidental slip during
normal content writing — exactly the same role `offer-architect` and
`content-angle-strategist`'s own stated rules already play by instruction —
not to replace human judgment about what's safe to publish.

## Data model (`schemaVersion: 1`)

```
IP_DATA = {
  schemaVersion: 1, generatedAt, source: { mode, label },
  ipAssets: [{ id, markText, type, jurisdiction, status,
               filingDate, registrationDate, renewalDate,
               registrationNumber, notes }],
  licenses: [{ id, licenseeName, licenseType, grantedDate,
               expirationDate, status, territory, feeTier, notes }],
  complianceScan: { scannedAt, filesScanned, findings, clean }
}
```

`type` ∈ `TRADEMARK | SERVICE_MARK | COPYRIGHT | TRADE_DRESS`. `status` (asset)
∈ `NOT_FILED | PENDING | REGISTERED | ABANDONED | EXPIRED`. `licenseType` ∈
`CORPORATE_DELIVERY_LICENSE | CERTIFIED_PRACTITIONER | OTHER` (the first two
map directly to the pricing tiers already defined in
`offers/2026-07-14-online-purposeologist-certification-school.md`). `status`
(license) ∈ `ACTIVE | EXPIRED | REVOKED | PENDING`.

**Computed, not stored:** renewal/expiry urgency (`renewalSoon`, `renewalPast`,
`expiringSoon`) and the IP Protection Calendar are all derived at render time
from `renewalDate`/`expirationDate` against today's date — the same
"auto-compute from dates, manual fields are the exception" pattern Billing
uses for invoice status.

## Validation flow

`IPValidate.validateData()` runs on every payload before rendering: schema
version, property whitelists, required fields, date validity, enum checks,
duplicate IDs, and credential-like-string rejection — identical to
Finance/Billing. **This module adds one more check no other module has:**
every string field is also tested against `IP_LEAK_PATTERNS`, and any match
is rejected with code `IP_LEAK_PATTERN`. This applies everywhere a string can
enter the system — sample data, a secure-api response, and critically, every
manual-local CRUD write (`IPLocal.add`/`.update`), so a note field can't be
used to smuggle a concept definition into local storage either.

## Threat boundaries

Same table as `BILLING-ARCHITECTURE.md`/`FINANCE-ARCHITECTURE.md` — public
repo ships only fictional asset/license data and public code; `ip-config.js`
is git-ignored; localStorage holds only local records (IP-leak-checked on
every write) and non-sensitive mode/privacy flags; the API client's token
lives in closure memory only; no payment processor or banking integration;
Privacy Mode is the shared `body.privacy` state (one toggle governs Finance,
Billing, and IP Intelligence together) with its own in-section toggle, LOCK
button, and inactivity relock. The one boundary unique to this module: the
`IP_LEAK_PATTERN` check, enforced at every write path, not just display.

## Testing

| Suite | Runner | Covers |
|---|---|---|
| `ip-validate.test.js` | `node dashboard/tests/ip-validate.test.js` | Contract validation accept/reject matrix, including the `IP_LEAK_PATTERN` rule specifically. |
| `ip-scan.test.js` | `node dashboard/tests/ip-scan.test.js` | Runs the real scanner against this actual repository (asserts 0 findings) and against synthetic leaky/clean fixtures (asserts the scanner still catches real violations). |
| `ip-browser.test.js` | serve the repo root, then `node dashboard/tests/ip-browser.test.js` | Shared privacy-lock state across all three modules, all 5 panels render, manual-local CRUD with the leak-pattern rejection, renewal/expiry calendar math, ERROR degradation, zero JavaScript errors. |
