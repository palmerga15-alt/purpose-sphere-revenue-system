# Purpose Sphere Command Center — Adversarial Threat Model

Red-team analysis of the model currently protecting Purposeology Command
Center IP and the creator's personal and financial information — covering
both the Business Financial Intelligence and Purposeology IP Intelligence
modules — with concrete attacker techniques and the counter-strategies that
offset them.

> Scope: this document analyzes weaknesses **as an attacker would**, then
> maps each to a defense. It is a planning artifact, not a claim that the
> system is currently hardened for real data. See "The load-bearing truth"
> below.

## The load-bearing truth

Today, the only thing protecting the creator's real IP and financials is
that **none of it is in the system.** Both modules are public, client-side
code with fictional sample data. Privacy Mode is CSS (`body.privacy` hides
elements); the data is still in page source and `window.IP_DATA` /
`window.FINANCE_DATA`, one DevTools toggle away. The architecture is
*designed* to push every real secret to a future authenticated backend that
does not exist yet.

So the system is safe as a Phase-1 demo precisely because it is empty of
real data. The single most dangerous weakness is not a code flaw — it is the
human temptation to start entering real IP or financial records into a
public, client-side app whose only concealment is presentational. Most of
the counter-strategies below exist to make that one rule survive a busy
human and a future backend.

## Attacker profiles

| Profile | Capability | Motivation |
|---|---|---|
| Opportunistic scraper | Clones public repos, runs secret scanners over full history | Harvest credentials / sellable IP |
| Targeted competitor | OSINT on the creator; patient; will phish | Steal unpublished manuscripts, frameworks, licensing terms |
| Shoulder-surfer / insider | Physical or screen-share proximity to an open tab | Opportunistic viewing of on-screen data |
| Malicious browser extension / XSS | Runs script in the page origin | Read DOM + localStorage, exfiltrate |
| Backend attacker (future) | Hits the authenticated API directly | Token theft/replay, IDOR, bulk exfiltration |
| Supply-chain attacker | Compromises a dependency / host / injected config | Inject exfiltration script |

## Attack surface, techniques, and counter-strategies

### 1. The public repository (softest target, and permanent)

**How they attack.** Clone the repo and scan **git history**, not just the
current tree — one accidental commit of a real manuscript, a bank export, or
a live `ip-config.js` lives forever even after deletion. Automated tooling
(Gitleaks, TruffleHog) runs over every public repo. Commit metadata already
exposes the creator's email, enabling targeted phishing and OSINT.

**Weaknesses.** `.gitignore` stops *accidental staging*, not `git add -f`;
nothing scans commits; a leaked secret survives in history; author email is
a pivot point.

**Counter-strategies.**
- **Commit-time + CI secret scanning** (Gitleaks/TruffleHog) that *blocks*
  the push — move the render-time credential/document-length checks in
  `ip-validate.js` / `finance-validate.js` to a pre-commit hook so bad data
  can't be committed at all.
- Treat any real secret that touches history as **burned**: rotate, don't
  just `git rm`. Capture this in the runbook.
- Keep the real deployment in a **separate private repo**; the public one
  stays a demo forever.
- Scrub the committer email to a `noreply` address to cut the OSINT link.

### 2. Privacy Mode is theater against anyone with the tab

**How they attack.** Open DevTools → read `window.IPModule.model` or
`window.FINANCE_DATA` regardless of the blur; a malicious extension or XSS
reads the DOM and `localStorage` directly; a bystander sees a screen-share.

**Weakness.** Concealment is presentational; the data is fully present
client-side.

**Counter-strategies.**
- Keep Privacy Mode as the shoulder-surf shield it is — but **never let it
  be the boundary for real data.** Real data must arrive already filtered
  from the authenticated backend, so what reaches the browser is only what
  the signed-in user is authorized to see anyway.
- Auto-lock on tab blur / `visibilitychange` (inactivity relock already
  exists).
- Ship a strict **Content-Security-Policy** to blunt XSS and rogue
  extensions.

### 3. The future secure backend (where the real fight moves)

**How they attack.** Steal/replay the bearer token; **IDOR** the sequential
IDs (`IP-001`, `LIC-002`, `PAY-003` are guessable); enumerate the whole
register; hit an unthrottled endpoint to exfiltrate everything; chase
`sourceRef` / `sourceLocation` labels if they are ever wired to real
document links.

**Weaknesses in the current contract seam.** Token-in-closure is good, but
(a) IDs are enumerable, (b) the contract assumes "if it came back, show it"
— no per-record authorization concept, (c) no rate-limit/audit notion, (d)
opaque refs become the exfil path the moment they resolve to real links.

**Counter-strategies.**
- **Server-side authorization per record** — never client-side filtering.
- **Short-lived, rotating tokens**; `HttpOnly`+`Secure`+`SameSite` cookies
  or short-TTL bearers; token binding. Client already drops on 401/403.
- **Non-enumerable UUID IDs** in the live contract so IDOR/enumeration gains
  nothing.
- **Rate limiting + anomaly detection + audit log** (bulk-read alerts).
- Documents: **short-lived, single-use, authorized signed URLs** minted per
  request, never stored, never in the metadata payload. `sourceRef` stays an
  opaque handle only the backend can resolve for an authorized user.

### 4. Supply chain and hosting

**How they attack.** Compromise a dependency, the Pages config, or an
injected analytics/config tag to run an exfiltration script in the page
origin.

**Weakness.** A future build step or injected script is a foothold; today
the dashboard is same-origin scripts only (good).

**Counter-strategies.**
- Keep **zero third-party runtime scripts**; enforce with strict CSP
  (`default-src 'self'`, `object-src 'none'`, tighten inline over time).
- **Subresource Integrity** on any unavoidable external asset.
- Serve the *real* dashboard from **private authenticated hosting** — never
  GitHub Pages.

### 5. Validation — a good gate, scoped honestly

**Strength.** `IPValidate` / `FinanceValidate` reject unexpected properties,
bad enums, duplicate IDs, dangling refs, credential-like strings, and
over-length text (so document bodies can't ride inside "metadata"). This
runs on **every** source, including the future API.

**Weakness attackers probe.** It runs **client-side**, so a hostile backend
or MITM isn't stopped by it — it protects *rendering*, not *data*. Regex
credential detection has false negatives.

**Counter-strategies.**
- Re-run the **same validation server-side** on the backend's egress.
- Treat the client validator as a rendering safety net, not an authorization
  control; keep expanding patterns, but the real barrier is "real secrets
  never enter the payload."

## Prioritized action plan

| Priority | Action | Offsets |
|---|---|---|
| P0 | Never enter real IP/financial data into the public, client-side app | §1, §2 |
| P0 | Pre-commit + CI secret/document scanning that blocks the push | §1 |
| P1 | Separate private repo + private hosting for anything real | §1, §4 |
| P1 | Strict CSP; zero third-party runtime scripts; auto-lock on blur | §2, §4 |
| P1 | Design backend now: per-record authz, UUID IDs, short-lived tokens, rate-limit, audit | §3 |
| P2 | Signed short-lived document URLs; opaque refs only | §3 |
| P2 | Mirror validation server-side; scrub committer email | §1, §5 |

## Bottom line

The model is sound *as a Phase-1 demo* because it holds no real data and
defers every real secret to a backend that doesn't exist yet. Its biggest
exploitable weakness is human, not technical: the temptation to trust CSS
concealment with real information. The highest-leverage defenses are
therefore process — commit-time scanning, a private repo/deployment for real
data, and building the backend's authorization/token/audit discipline
*before* the first real record is ever entered.
