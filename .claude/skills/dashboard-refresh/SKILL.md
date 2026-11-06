---
name: dashboard-refresh
description: Re-probe every connected tool (Gmail, Google Drive, Dropbox, Lovable, GitHub), regenerate dashboard/data.js with fresh real data and a new AI morning briefing, then commit and push. Use when asked to refresh, update, or rebuild the command center dashboard, or when the 7am daily refresh trigger fires.
---

# Dashboard Refresh

Regenerates `dashboard/data.js` for the Purpose Sphere Command Center (`dashboard/index.html`). The HTML page never changes during a refresh — only the data module.

## Hard rules

1. **Real data only.** Every number in `data.js` must come from a tool call made during this refresh. Never carry forward a stale number without marking its source offline. Never invent values.
2. **Never break the page.** `data.js` must remain valid JS assigning `window.DASHBOARD_DATA`. If generation fails partway, do not commit a partial file.
3. **Failed sources go offline, not missing.** If a tool errors or is disconnected, keep its key in `sources` with `status: "offline"` and omit/keep its data section — the page degrades gracefully either way.

## Procedure

### 1. Probe every source (parallel where possible)

Load tool schemas with ToolSearch first if needed.

| Source key | Probes |
|---|---|
| `gmail` | `mcp__Gmail__search_threads` (`is:unread`, sent last 30d, important unread, and `(invoice OR payment OR booking OR speaking OR workshop OR webinar OR certification) newer_than:14d`), `mcp__Gmail__list_drafts` |
| `gdrive` | `mcp__Google_Drive__list_recent_files` (pageSize 15) |
| `dropbox` | `mcp__Dropbox__who_am_i`, `mcp__Dropbox__list_folder` (root, recursive false), `mcp__Dropbox__list_file_requests` |
| `lovable` | `mcp__Lovable__get_me`, `mcp__Lovable__list_projects` (workspace `b3T7tM2N1pN1xqfM4PTg`, visibility all) |
| `github` | `mcp__github__list_issues`, `mcp__github__list_pull_requests`, `mcp__github__list_commits`, `mcp__github__actions_list` on `palmerga15-alt/purpose-sphere-revenue-system`; also count files in `research/`, `offers/`, `content/` locally |

Record a UTC `probedAt` per source; `status: "online"` only if its probes succeeded.

### 2. Module health (Finance / Billing / IP Intelligence)

These three modules (`finance.js`, `billing.js`, `ip.js`) ship fictional
sample data by design — **never** read their sample numbers (revenue,
invoices, trademark/license records) into the briefing; that would violate
rule 1. Only real, verifiable facts about the modules' own current state
belong in `moduleHealth`:

- **Mode**: check whether `dashboard/finance-config.js` / `billing-config.js`
  / `ip-config.js` exist in the working tree. None are ever committed (see
  `.gitignore`), so the honest answer on this public branch is always
  `"sample"` unless that convention has changed.
- **Test health**: actually run each module's suites fresh this refresh —
  `node dashboard/tests/{finance,billing,ip}-validate.test.js`, and the
  three `*-browser.test.js` suites against a local server (see
  `dashboard/tests/README.md` for exact commands) — and record real
  pass/total counts. Never carry forward a previous run's numbers.
- **IP compliance scan** (only once `ip.js` exists on this branch): run
  `node dashboard/ip-scan.js` fresh and record `{ clean, filesScanned,
  findings }` from its real output.
- **If a module's branch isn't merged into this one yet** (check with
  `git log --oneline -- dashboard/<module>.js`): record
  `status: "built-not-merged"` plus the branch name instead of a mode —
  do not claim it is live if it isn't.

Write/update the `moduleHealth` object with a `verifiedAt` timestamp per
entry.

### 3. Write the briefing

Read `business-brief.md` for strategic priorities. Then write `briefing` with:
- `date` (long-form weekday date), `headline` (one sentence, the single most urgent thing), `summary` (2–3 sentences).
- 4–6 `actions`, priority-ordered by revenue urgency, each with `title`, `detail` (specific: names, dates, day-counts of idleness, file paths), and `sources` — the array of source keys the action cross-references. Prefer actions that connect two tools (e.g., a repo offer spec with no matching Gmail outbound).
- 1–2 additional low-priority entries appended at the end, after the revenue-urgency-ordered ones, surfacing anything notable from step 2's `moduleHealth` (e.g. a module still sample-only, or a built-but-unmerged module) — operational/informational, not revenue-urgent, so they always sort last.

Signals worth flagging every time: unsent drafts and how long they've been idle, bounced outreach, unpublished-but-finished Lovable projects, offer specs with no outbound email activity, verification/blocker emails, warm threads gone quiet >2 weeks.

### 4. Regenerate data.js

Overwrite `dashboard/data.js` keeping the exact existing schema (sources,
moduleHealth, briefing, pipeline, gmail, gdrive, dropbox, lovable, github).
Update the top-level `generatedAt` only when the external-source probes in
step 1 actually ran; if only `moduleHealth` was refreshed, update its own
per-entry `verifiedAt` fields instead and leave the top-level `generatedAt`
alone — it should only ever reflect when gmail/gdrive/dropbox/lovable/github
were actually re-probed. Wrap any dollar amount in the data as a `money`
field value so the privacy blur catches it — never put dollar figures in
plain `note`/`detail` strings.

### 5. Verify, commit, push

```bash
node -e "global.window={};require('/home/user/purpose-sphere-revenue-system/dashboard/data.js');const d=window.DASHBOARD_DATA;if(!d.sources||!d.briefing||!d.moduleHealth)process.exit(1);console.log('OK',Object.keys(d))"
```

Only if that passes: commit `dashboard/data.js` with message `Refresh command center data + morning briefing (<date>)` and push with `git push -u origin claude/command-center-dashboard-1sutu5` (retry up to 4x with 2s/4s/8s/16s backoff on network failure).
