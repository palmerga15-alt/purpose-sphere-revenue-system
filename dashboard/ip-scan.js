#!/usr/bin/env node
// ============================================================
// PURPOSEOLOGY IP INTELLIGENCE — TERMINOLOGY COMPLIANCE SCANNER
//
// A real tool, not a UI mockup: scans every Markdown file in this
// repository for phrases that would indicate the internal
// 26-concept framework / Concept Dictionary is being enumerated,
// defined, or reconstructed outside its proprietary, internal-only
// scope (per business-brief.md). Reuses the exact pattern list
// window.IPValidate.IP_LEAK_PATTERNS applies to every record field,
// so the dashboard and this scanner can never disagree about what
// counts as a leak signal.
//
// This scanner reads PUBLIC repo content that is not itself
// sensitive — only the concept framework's substance is sensitive,
// and that substance is never written down in this repo to scan.
// A clean result here is real, not fictional sample data.
//
// Usage:
//   node dashboard/ip-scan.js                 print JSON report to stdout
//   node dashboard/ip-scan.js --write          also write dashboard/ip-scan-report.json
// ============================================================
"use strict";

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.join(__dirname, "..");
const SKIP_DIRS = new Set(["node_modules", ".git", "dashboard/screenshots"]);

global.window = global;
require(path.join(__dirname, "ip-validate.js"));
const { IP_LEAK_PATTERNS } = global.window.IPValidate;

function findMarkdownFiles(dir, out) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = path.relative(REPO_ROOT, path.join(dir, entry.name));
    if (SKIP_DIRS.has(rel) || SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      findMarkdownFiles(full, out);
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      out.push(full);
    }
  }
  return out;
}

// Truncate a matched line to a short, locatable snippet without
// dumping the entire surrounding paragraph — enough to find the
// line, not a wholesale copy of the file's content.
function snippetFor(line, pattern) {
  const m = line.match(pattern);
  const idx = m ? m.index : 0;
  const start = Math.max(0, idx - 20);
  const end = Math.min(line.length, idx + (m ? m[0].length : 0) + 20);
  return (start > 0 ? "…" : "") + line.slice(start, end).trim() + (end < line.length ? "…" : "");
}

function scanFile(filePath) {
  const findings = [];
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split("\n");
  const relPath = path.relative(REPO_ROOT, filePath);
  lines.forEach((line, i) => {
    for (const pattern of IP_LEAK_PATTERNS) {
      if (pattern.test(line)) {
        findings.push({
          file: relPath,
          line: i + 1,
          pattern: pattern.source,
          snippet: snippetFor(line, pattern)
        });
      }
    }
  });
  return findings;
}

function scanRepo() {
  const files = findMarkdownFiles(REPO_ROOT, []);
  let findings = [];
  for (const f of files) findings = findings.concat(scanFile(f));
  return {
    scannedAt: new Date().toISOString(),
    filesScanned: files.length,
    findings,
    clean: findings.length === 0
  };
}

if (require.main === module) {
  const report = scanRepo();
  console.log(JSON.stringify(report, null, 2));
  if (process.argv.includes("--write")) {
    const outPath = path.join(__dirname, "ip-scan-report.json");
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
    console.error(`\nWrote ${outPath}`);
  }
  process.exit(report.clean ? 0 : 1);
}

module.exports = { scanRepo, scanFile, findMarkdownFiles };
