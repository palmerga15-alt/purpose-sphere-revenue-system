# Purposeology IP Intelligence — Architecture (Phase 1)

> ## ⏸ Status: INTENTIONALLY DEFERRED
>
> This module is **complete for Phase 1 but intentionally paused.** Per
> current product direction, the immediate priority is to complete,
> stabilize, test, document, and merge the **Business Financial
> Intelligence** module. The IP Intelligence module remains in the codebase
> as a **deferred capability** and is the designated *next* major
> development focus once the financial work is merged.
>
> While deferred:
> - **No new features** are added to this module.
> - **Only critical defects** are fixed.
> - It must **not interfere** with the Financial Intelligence module
>   (verified: both render together with zero JavaScript errors; the IP
>   section renders after the finance section via its own grid sentinel and
>   shares only the read-only Privacy Mode toggle).
> - When work resumes, it continues on the **same secure architecture**
>   described below.

Executive intellectual-property dashboard for PurposeQuest International /
Purposeology, rendered inside the Purpose Sphere Command Center
(`dashboard/index.html`) directly below the Business Financial Intelligence
section, and built on the same architectural principles: public UI code,
fictional sample data only, a modular adapter layer, strict validation,
shared Privacy Mode, and a designed-in seam for a future secure
authenticated backend.

**Phase 1 scope:** panels, sample data, validation, adapter contract, and
Privacy Mode. No document repository is connected, no real Purposeology IP
content exists anywhere in this repository, and manual-local entry ships in
a later phase.

## Files

| File | Role | Public? |
|---|---|---|
| `dashboard/ip-data.js` | Sample-data contract (`window.IP_DATA`, fictional records only, `schemaVersion: 1`) | Public — fictional only |
| `dashboard/ip-validate.js` | `IPValidate` — contract validation; the gatekeeper every source passes before rendering | Public |
| `dashboard/ip-adapter.js` | `IPAdapter` — mode resolution + `load()` + in-module secure API client; the single seam between UI and data | Public code; **no endpoint, no credentials** |
| `dashboard/ip.js` | `IPModule` — model math + rendering + security behaviors | Public |
| `dashboard/ip-config.js` | Deployment-injected config (`window.IP_CONFIG`) | **Git-ignored — never committed.** Public build ships without it |
| `dashboard/IP-ARCHITECTURE.md` | This document | Public |

Load order (after the finance module): `ip-validate.js` → `ip-data.js` →
`ip-adapter.js` → `ip.js` → page script calls `IPModule.render({grid})`.
(A private deployment additionally injects `ip-config.js` before the
adapter loads.)

## Panels

1. **IP Executive Snapshot** — total assets, drafts, published, protected,
   registered trademarks, copyright registrations, licensing opportunities,
   legal/renewal actions due (overdue or within 90 days).
2. **Intellectual Property Asset Register** — all 18 tracked fields per
   asset, with lifecycle-status and confidentiality chips.
3. **Protection & Registration Tracker** — copyrights, trademark
   applications and renewals, domains, licensing agreements, permissions,
   publication records, legal reviews; deadlines bucketed and highlighted
   at 30 / 60 / 90 days, overdue items flagged.
4. **Version & Provenance Tracker** — current version, original creation
   date, last revision, creator, contributors, approval status, source
   location (opaque private-storage label), related versions.
5. **Licensing Intelligence** — licensable assets, current licensees,
   territory, usage rights, dates, revenue model, restrictions, status.
6. **IP Calendar** — filings, renewals, publications, legal-review
   deadlines, license expirations, and trademark deadlines combined,
   sorted chronologically with urgency chips.

## Controlled vocabularies (schemaVersion 1)

- **Asset types (20):** Book, Manuscript, Framework, Methodology,
  Assessment, Training Curriculum, Certification Material, Course, Webinar,
  Research Paper, White Paper, Keynote, Presentation, Trademark, Brand
  Asset, Visual Asset, Audio or Video, AI Prompt or Workflow, Licensing
  Package, Contract or Permission.
- **Lifecycle statuses (8):** Concept, Draft, Internal Review, Legal
  Review, Protected, Published, Licensed, Archived.
- **Confidentiality levels (5):** Public, Internal, Confidential,
  Restricted, Legal Hold.
- Copyright / trademark / licensing / approval / protection / license
  statuses and revenue models are enumerated in
  `IPValidate.CONTRACT`; anything outside the enums is rejected.

## Adapter lifecycle

```
page load
  └─ IPModule.render({grid})
       ├─ plants a hidden sentinel in the grid (reserves the section's
       │  position so every re-render lands in the same place)
       └─ rerender()
            ├─ mode = IPAdapter.currentMode()
            │    deployment config (IP_CONFIG.mode)
            │    > user choice (localStorage "ps_ip_mode" — a mode
            │      name only, never data)
            │    > "sample"                       ← DEFAULT
            │    unavailable modes resolve back to "sample"
            ├─ secure-api mode paints LOADING first
            ├─ IPAdapter.load() →
            │    sample       → IP_DATA               → validate → SAMPLE
            │    manual-local → IPLocal.assemble()    → validate → LOCAL
            │                   (IPLocal ships in a later phase)
            │    secure-api   → in-module secure client
            │                     no endpoint/token → SIGNED_OUT (sample fallback)
            │                     401/403           → EXPIRED (token dropped, panels relock)
            │                     network/HTTP/bad JSON → ERROR
            │                     200 + valid       → CONNECTED
            └─ paint(state):
                 data states  (SAMPLE / LOCAL / CONNECTED / SIGNED_OUT)
                   → section head + 6 panels
                 no-data states (LOADING / EXPIRED / ERROR)
                   → section head + 6 offline panels, no IP content;
                     EXPIRED additionally forces Privacy Mode on
```

The UI never changes shape between adapters — only the state chip, badges,
and data differ. Switching a data source never requires UI changes.

## Validation flow

`IPValidate.validateData()` runs on **every** payload from **every** source
before rendering. Checks: schema version, top-level and per-record property
whitelists (unexpected properties rejected), required fields, `YYYY-MM-DD`
date validity, all controlled-vocabulary enums, duplicate record IDs,
dangling `assetId` references, credential-like strings (long digit runs,
key/token/secret markers, base64 blobs, IBAN shapes) in any value, and a
**maximum text length (400 chars) on every string field** so document-length
content — manuscript text, curriculum modules, assessment questions,
contract language — can never masquerade as metadata.

Failures produce an ERROR state: **nothing renders**, and the console gets
an issue *count* only — validation errors carry field paths and codes,
never values. `IPValidate.validateRecord()` reuses the same rules per
record for the future manual-local CRUD path.

## Privacy Mode

Reuses the shared header toggle (`body.privacy`), which starts **ON at
every page load** (set by the page script). Every IP panel wraps its entire
content in `.ip-sensitive`, hidden in favor of a

> **PRIVATE PURPOSEOLOGY IP HIDDEN**

notice via pure CSS. Because the whole panel body is wrapped, everything
the brief requires concealed is concealed: asset titles, descriptions,
creator names, source references, licensing parties, legal notes,
registration references, and unpublished product names. Toggling Privacy
Mode off restores the content instantly. The section header adds a
**LOCK IP PANELS** button (Privacy Mode on immediately), and an EXPIRED
secure session also forces Privacy Mode on. The finance module's shared
inactivity relock re-engages Privacy Mode for the whole page, IP panels
included.

**Visual privacy is not data security.** Privacy Mode is a
shoulder-surfing shield: the data is still present in the page source and
in `ip-data.js`. That is exactly why the public repository may only ever
contain fictional metadata — anything truly sensitive must live behind the
authenticated backend, never in this repo, where CSS is the only thing
"protecting" it.

## Security requirements (what may never be committed)

The public repository may contain **only fictional metadata and UI code**.
Never commit: manuscript text, framework details, curriculum content,
assessment questions, proprietary research, registration credentials or
real registration numbers, legal documents, contracts, private file links,
API keys, or authentication tokens.

Enforcement layers:

| Boundary | Control |
|---|---|
| Public repo / GitHub Pages | Only fictional data and public code. `ip-config.js` and proprietary-document patterns are git-ignored; the validator rejects credential-like and document-length strings. |
| References | `sourceRef`, `registrationRef`, and `sourceLocation` are **opaque labels** resolved only inside private storage — never URLs, file paths, or real numbers. |
| Browser localStorage | Holds only the privacy flag and the adapter mode name. Never IP data in Phase 1. |
| Session memory | The future API token lives in adapter closure memory only and is dropped on 401/403. |
| Network | HTTPS/same-origin endpoints only; token in `Authorization` header, never URL; `no-store`, `no-referrer`, `credentials: omit`. |
| Console / logs / errors | No IP payloads, no tokens, no titles — state codes and issue counts only. |
| Shoulder-surfing | Privacy Mode starts ON, LOCK IP PANELS button, relock on inactivity and session expiry. |
| Malformed/hostile payloads | Contract validation rejects them before render; all rendering escapes HTML. |

## Future secure backend (Phase 2+)

The adapter contract is designed so an authenticated backend can return
authorized IP metadata **without changing the UI**:

1. Stand up a private backend serving `GET <endpoint>` with the
   `schemaVersion: 1` JSON contract, `source.mode: "live"`; responses must
   pass `IPValidate` untouched (so: display labels only, no registration
   numbers, no document content, no links).
2. Deploy the dashboard privately (not GitHub Pages) and inject
   `ip-config.js`: `window.IP_CONFIG = { mode: "secure-api", apiEndpoint: "/api/ip" }`.
3. Wire the deployment's sign-in to `IPAdapter.setSessionToken(token)` +
   `IPModule.rerender()`. The backend must return `401` on expiry — the
   client relies on it to drop the token and relock the panels.
4. Badges flip to `● LIVE DATA`, the chip reads SECURELY CONNECTED, and no
   UI file changes. The public Pages copy keeps showing samples.

**Actual documents** (manuscripts, curricula, assessments, contracts) are
never served through this contract at all. They belong in private
encrypted storage; the backend should expose them only as short-lived,
authorized, per-request links generated after authentication — the
dashboard stores and displays nothing but the opaque `sourceRef` labels.

## Phase 1 test checklist (verified before merge)

- All six IP panels render with the section header, zero JavaScript errors.
- Privacy Mode (default ON) conceals all sensitive IP metadata behind
  "PRIVATE PURPOSEOLOGY IP HIDDEN"; toggling reveals it; LOCK IP PANELS
  re-conceals it.
- Invalid data is rejected: bad enums, bad dates, unexpected properties,
  duplicate IDs, credential-like strings, over-long text → ERROR state,
  nothing renders.
- Sample mode works and is the default; unavailable modes fall back to it.
- Deadlines sort chronologically; 30/60/90-day windows and overdue items
  are highlighted.
- Confidentiality levels render with the correct chips.
- Adapter states paint correctly (SAMPLE and the no-data ERROR path).
- Repository scan finds no proprietary content, credentials, or private
  links.
