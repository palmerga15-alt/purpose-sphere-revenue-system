// ============================================================
// PURPOSEOLOGY IP INTELLIGENCE — SAMPLE DATA
// window.IP_DATA
//
// ipAssets and licenses below are FICTIONAL SAMPLE DATA ONLY —
// same rule as finance-data.js / billing-data.js. No real filing
// numbers, attorney correspondence, or licensee contact details
// belong here.
//
// complianceScan is DIFFERENT: it is a REAL result from running
// dashboard/ip-scan.js against this repository (see
// dashboard/ip-scan-report.json). Repo markdown isn't sensitive —
// only the 26-concept framework's substance is, and that
// substance is never written down here to scan — so there is
// nothing to fictionalize. "Sample" mode ships the real, current,
// clean scan result; it is not a placeholder.
// ============================================================
window.IP_DATA = {
  schemaVersion: 1,
  generatedAt: "2026-11-06T02:02:55.631Z",
  source: { mode: "sample", label: "FICTIONAL SAMPLE ASSETS/LICENSES — REAL COMPLIANCE SCAN OF THIS REPO" },

  ipAssets: [
    {
      id: "MARK-001",
      markText: "Purposeology",
      type: "TRADEMARK",
      jurisdiction: "US (sample)",
      status: "REGISTERED",
      filingDate: "2022-03-01",
      registrationDate: "2023-01-15",
      renewalDate: "2033-01-15",
      registrationNumber: "SAMPLE-REG-1001",
      notes: "Core brand mark — appears across all outward-facing materials."
    },
    {
      id: "MARK-002",
      markText: "Purpose Fingerprint",
      type: "TRADEMARK",
      jurisdiction: "US (sample)",
      status: "REGISTERED",
      filingDate: "2023-06-10",
      registrationDate: "2024-02-20",
      renewalDate: "2034-02-20",
      registrationNumber: "SAMPLE-REG-1002",
      notes: "One of two cleared outward-facing proprietary terms (the other being Chronos/Kairos, which is not independently trademarked)."
    },
    {
      id: "MARK-003",
      markText: "PurposeQuest International",
      type: "SERVICE_MARK",
      jurisdiction: "US (sample)",
      status: "PENDING",
      filingDate: "2026-05-01",
      registrationDate: "",
      renewalDate: "",
      registrationNumber: "",
      notes: "Filed for the organizational/consulting entity name; office action response due per protection calendar."
    },
    {
      id: "MARK-004",
      markText: "Purpose-ology: The Science of Purpose",
      type: "COPYRIGHT",
      jurisdiction: "US (sample)",
      status: "REGISTERED",
      filingDate: "2021-09-01",
      registrationDate: "2021-11-30",
      renewalDate: "",
      registrationNumber: "SAMPLE-TXU-2001",
      notes: "Book copyright — the published asset used as the fast-action bonus in the webinar funnel."
    },
    {
      id: "MARK-005",
      markText: "Certified Purposeologist",
      type: "SERVICE_MARK",
      jurisdiction: "US (sample)",
      status: "NOT_FILED",
      filingDate: "",
      registrationDate: "",
      renewalDate: "",
      registrationNumber: "",
      notes: "Certification credential name — filing recommended before the certification school's public launch, per the offer spec's pilot-cohort sequencing."
    }
  ],

  licenses: [
    {
      id: "LIC-001",
      licenseeName: "Sample Practitioner Group A (fictional)",
      licenseType: "CORPORATE_DELIVERY_LICENSE",
      grantedDate: "",
      expirationDate: "",
      status: "PENDING",
      territory: "N/A — pilot not yet greenlit",
      feeTier: 12000,
      notes: "Placeholder reflecting the certification-school offer spec's Corporate Delivery License tier; no license has actually been granted yet — the pilot cohort itself has not been greenlit."
    },
    {
      id: "LIC-002",
      licenseeName: "Sample Certified Practitioner B (fictional)",
      licenseType: "CERTIFIED_PRACTITIONER",
      grantedDate: "",
      expirationDate: "",
      status: "PENDING",
      territory: "N/A",
      feeTier: 3495,
      notes: "Illustrates the core certification tier distinct from the Corporate Delivery License — not an actual grant."
    }
  ],

  complianceScan: {
    scannedAt: "2026-11-06T02:02:55.631Z",
    filesScanned: 24,
    findings: [],
    clean: true
  }
};
