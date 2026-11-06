// ============================================================
// PURPOSEOLOGY IP INTELLIGENCE — SCANNER UNIT TESTS (Node)
// Run: node dashboard/tests/ip-scan.test.js
//
// Two things must both be true, and this suite checks both:
//   1. Scanning the REAL repository produces zero findings — the
//      repo's own governance/disclaimer language (which legitimately
//      mentions "26 concepts" / "Concept Dictionary" as a restriction,
//      not a definition) must not be flagged.
//   2. The scanner still catches genuine enumeration/definition
//      attempts against synthetic fixtures — it isn't just disabled.
// No browser required.
// ============================================================
const path = require("path");
const fs = require("fs");
const os = require("os");
const { scanRepo, scanFile } = require(path.join(__dirname, "..", "ip-scan.js"));

let pass = 0, fail = 0;
function t(name, cond, detail) {
  if (cond) { pass++; console.log("PASS  " + name); }
  else { fail++; console.log("FAIL  " + name + (detail ? " — " + JSON.stringify(detail) : "")); }
}

// ---- 1. the real repository ----
const real = scanRepo();
t("real repo scan finds markdown files", real.filesScanned > 0, real.filesScanned);
t("real repo scan is clean (governance language is not a false positive)", real.clean === true, real.findings);
t("real repo scan reports zero findings", real.findings.length === 0, real.findings);

// ---- 2. synthetic fixtures: the scanner must still catch real violations ----
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "ip-scan-test-"));
const leakyPath = path.join(tmpDir, "leaky.md");
fs.writeFileSync(leakyPath, [
  "# Internal Notes",
  "",
  "Concept 1: The first distinction is about timing.",
  "Concept Dictionary: here is what each term means in detail.",
  "",
  "## Concept 14",
  "This heading names a specific internal concept.",
  "",
  "1. Concept — this numbered list format also reads as an enumeration attempt.",
  ""
].join("\n"));

const leakyFindings = scanFile(leakyPath);
t("synthetic leaky fixture: numbered 'Concept N:' caught", leakyFindings.some(f => f.line === 3));
t("synthetic leaky fixture: 'Concept Dictionary:' definition caught", leakyFindings.some(f => f.line === 4));
t("synthetic leaky fixture: 'Concept N' heading caught", leakyFindings.some(f => f.line === 6));
t("synthetic leaky fixture: numbered list item caught", leakyFindings.some(f => f.line === 9));
t("synthetic leaky fixture: at least 4 distinct findings", leakyFindings.length >= 4, leakyFindings);

// ---- 3. synthetic clean fixture: legitimate disclaimer language must NOT be flagged ----
const cleanPath = path.join(tmpDir, "clean.md");
fs.writeFileSync(cleanPath, [
  "# Compliance Note",
  "",
  "Never enumerate, define, or reconstruct the internal 26 concepts or Concept Dictionary in outward-facing content.",
  "Only Purpose Fingerprint and Chronos vs. Kairos are cleared for external use.",
  ""
].join("\n"));
const cleanFindings = scanFile(cleanPath);
t("synthetic clean fixture (governance language only) produces zero findings", cleanFindings.length === 0, cleanFindings);

fs.rmSync(tmpDir, { recursive: true, force: true });

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
