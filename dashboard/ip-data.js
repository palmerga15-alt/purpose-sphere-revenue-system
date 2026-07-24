// ============================================================
// PURPOSEOLOGY IP INTELLIGENCE — SAMPLE DATA (Phase 1)
// schemaVersion-1 data contract for the PURPOSEOLOGY IP
// INTELLIGENCE section. Consumed by dashboard/ip.js through
// dashboard/ip-adapter.js.
//
// FICTIONAL SAMPLE DATA ONLY. This repo publishes to public
// GitHub Pages, so every title, creator, business, date,
// reference, licensee, and note below is invented for
// layout/demo purposes and describes no real intellectual
// property, person, or agreement.
//
// FUTURE PHASES: a secure, authenticated backend replaces this
// file by emitting the exact same shape (source.mode = "live").
// The UI (ip.js) reads only this shape and never changes.
// See dashboard/IP-ARCHITECTURE.md.
//
// SECURITY RULES FOR THIS FILE — it ships to the browser:
//   - METADATA ONLY. Never put manuscript text, framework
//     details, curriculum content, assessment questions,
//     proprietary research, or contract language here.
//   - Never put real registration numbers, credentials, legal
//     documents, or private file links here. `sourceRef` and
//     `registrationRef` are opaque labels resolved only inside
//     private storage — never URLs, paths, or real numbers.
//   - Never describe real unpublished Purposeology products
//     here while the repo/site is public.
// ============================================================
window.IP_DATA = {
  schemaVersion: 1,
  generatedAt: "2026-07-24T00:00:00Z",

  // mode "sample" makes every IP panel badge itself as SAMPLE
  // DATA. A live adapter sets mode: "live" + its own label.
  source: { mode: "sample", label: "FICTIONAL SAMPLE IP RECORDS — NOT REAL INTELLECTUAL PROPERTY" },

  assetTypes: [
    "Book", "Manuscript", "Framework", "Methodology", "Assessment",
    "Training Curriculum", "Certification Material", "Course", "Webinar",
    "Research Paper", "White Paper", "Keynote", "Presentation",
    "Trademark", "Brand Asset", "Visual Asset", "Audio or Video",
    "AI Prompt or Workflow", "Licensing Package", "Contract or Permission"
  ],
  lifecycleStatuses: [
    "Concept", "Draft", "Internal Review", "Legal Review",
    "Protected", "Published", "Licensed", "Archived"
  ],
  confidentialityLevels: ["Public", "Internal", "Confidential", "Restricted", "Legal Hold"],

  // ---- INTELLECTUAL PROPERTY ASSET REGISTER (fictional) ----
  assets: [
    {
      id: "IP-001",
      title: "The Compass Principle (Sample Book)",
      type: "Book",
      description: "Fictional flagship book on purpose-driven decision frameworks",
      status: "Published",
      confidentiality: "Public",
      creator: "A. Sample-Author",
      owningBusiness: "Demo Purposeology Press LLC",
      creationDate: "2023-02-10",
      publicationDate: "2024-05-01",
      version: "2nd Edition",
      copyrightStatus: "REGISTERED",
      trademarkStatus: "N/A",
      licensingStatus: "AVAILABLE",
      relatedProduct: "Sample Keynote Series",
      renewalDate: null,
      sourceRef: "VAULT-BOOK-A1",
      notes: "Sample record — translation rights under discussion",
      provenance: {
        originalCreationDate: "2023-02-10",
        lastRevisionDate: "2026-03-18",
        contributors: ["A. Sample-Author", "E. Demo-Editor"],
        approvalStatus: "LEGAL-APPROVED",
        sourceLocation: "PRIVATE-VAULT (label only)",
        relatedVersions: ["1st Edition (archived)"]
      }
    },
    {
      id: "IP-002",
      title: "Fictional Successor Manuscript",
      type: "Manuscript",
      description: "Sample in-progress manuscript metadata — no text stored",
      status: "Draft",
      confidentiality: "Restricted",
      creator: "A. Sample-Author",
      owningBusiness: "Demo Purposeology Press LLC",
      creationDate: "2025-11-04",
      publicationDate: null,
      version: "Draft 4",
      copyrightStatus: "NOT-FILED",
      trademarkStatus: "N/A",
      licensingStatus: "NOT-LICENSABLE",
      relatedProduct: "Unannounced (hidden in Privacy Mode)",
      renewalDate: null,
      sourceRef: "VAULT-MSS-B7",
      notes: "Sample record — target legal review Q4",
      provenance: {
        originalCreationDate: "2025-11-04",
        lastRevisionDate: "2026-07-15",
        contributors: ["A. Sample-Author"],
        approvalStatus: "DRAFT",
        sourceLocation: "PRIVATE-VAULT (label only)",
        relatedVersions: ["Draft 1-3 (superseded)"]
      }
    },
    {
      id: "IP-003",
      title: "Quadrant Clarity Framework (Sample)",
      type: "Framework",
      description: "Fictional four-quadrant coaching framework — metadata only",
      status: "Protected",
      confidentiality: "Confidential",
      creator: "Demo Methods Team",
      owningBusiness: "Sample PurposeQuest Holdings",
      creationDate: "2022-06-20",
      publicationDate: null,
      version: "3.1",
      copyrightStatus: "REGISTERED",
      trademarkStatus: "FILED",
      licensingStatus: "AVAILABLE",
      relatedProduct: "Sample Certification Track",
      renewalDate: "2026-10-15",
      sourceRef: "VAULT-FRM-C2",
      notes: "Sample record — licensing package in build",
      provenance: {
        originalCreationDate: "2022-06-20",
        lastRevisionDate: "2026-05-30",
        contributors: ["Demo Methods Team", "R. Example-Reviewer"],
        approvalStatus: "APPROVED",
        sourceLocation: "PRIVATE-VAULT (label only)",
        relatedVersions: ["2.0", "3.0"]
      }
    },
    {
      id: "IP-004",
      title: "Purpose Readiness Assessment (Sample)",
      type: "Assessment",
      description: "Fictional 40-item readiness instrument — questions stored privately",
      status: "Legal Review",
      confidentiality: "Restricted",
      creator: "Demo Methods Team",
      owningBusiness: "Sample PurposeQuest Holdings",
      creationDate: "2024-09-12",
      publicationDate: null,
      version: "1.4",
      copyrightStatus: "PENDING",
      trademarkStatus: "NONE",
      licensingStatus: "NOT-LICENSABLE",
      relatedProduct: "Sample Certification Track",
      renewalDate: null,
      sourceRef: "VAULT-ASM-D9",
      notes: "Sample record — psychometric review underway",
      provenance: {
        originalCreationDate: "2024-09-12",
        lastRevisionDate: "2026-06-22",
        contributors: ["Demo Methods Team"],
        approvalStatus: "PENDING-REVIEW",
        sourceLocation: "PRIVATE-VAULT (label only)",
        relatedVersions: ["1.0-1.3 (superseded)"]
      }
    },
    {
      id: "IP-005",
      title: "Certified Practitioner Curriculum (Sample)",
      type: "Training Curriculum",
      description: "Fictional 12-module certification curriculum — content stored privately",
      status: "Licensed",
      confidentiality: "Confidential",
      creator: "Demo Curriculum Guild",
      owningBusiness: "Sample PurposeQuest Holdings",
      creationDate: "2023-01-30",
      publicationDate: "2024-01-15",
      version: "2024.2",
      copyrightStatus: "REGISTERED",
      trademarkStatus: "NONE",
      licensingStatus: "LICENSED",
      relatedProduct: "Sample Certification Track",
      renewalDate: "2026-09-10",
      sourceRef: "VAULT-CUR-E3",
      notes: "Sample record — two demo licensees active",
      provenance: {
        originalCreationDate: "2023-01-30",
        lastRevisionDate: "2026-04-08",
        contributors: ["Demo Curriculum Guild", "A. Sample-Author"],
        approvalStatus: "LEGAL-APPROVED",
        sourceLocation: "PRIVATE-VAULT (label only)",
        relatedVersions: ["2024.1"]
      }
    },
    {
      id: "IP-006",
      title: "PURPOSEOLOGY DEMO MARK",
      type: "Trademark",
      description: "Fictional word mark for the sample brand family",
      status: "Protected",
      confidentiality: "Public",
      creator: "Sample Brand Office",
      owningBusiness: "Sample PurposeQuest Holdings",
      creationDate: "2021-03-05",
      publicationDate: null,
      version: "—",
      copyrightStatus: "N/A",
      trademarkStatus: "REGISTERED",
      licensingStatus: "AVAILABLE",
      relatedProduct: "All sample programs",
      renewalDate: "2026-08-20",
      sourceRef: "VAULT-TM-F1",
      notes: "Sample record — renewal window opening",
      provenance: {
        originalCreationDate: "2021-03-05",
        lastRevisionDate: "2021-03-05",
        contributors: ["Sample Brand Office"],
        approvalStatus: "LEGAL-APPROVED",
        sourceLocation: "PRIVATE-VAULT (label only)",
        relatedVersions: []
      }
    },
    {
      id: "IP-007",
      title: "Purpose & AI Webinar Master Deck (Sample)",
      type: "Webinar",
      description: "Fictional webinar deck and recording metadata",
      status: "Published",
      confidentiality: "Internal",
      creator: "A. Sample-Author",
      owningBusiness: "Demo Purposeology Press LLC",
      creationDate: "2026-06-01",
      publicationDate: "2026-07-15",
      version: "1.0",
      copyrightStatus: "NOT-FILED",
      trademarkStatus: "N/A",
      licensingStatus: "AVAILABLE",
      relatedProduct: "Sample Webinar Series",
      renewalDate: null,
      sourceRef: "VAULT-WBN-G4",
      notes: "Sample record — replay hosted privately",
      provenance: {
        originalCreationDate: "2026-06-01",
        lastRevisionDate: "2026-07-14",
        contributors: ["A. Sample-Author", "Demo Media Crew"],
        approvalStatus: "APPROVED",
        sourceLocation: "PRIVATE-VAULT (label only)",
        relatedVersions: []
      }
    },
    {
      id: "IP-008",
      title: "Coaching Prompt Library (Sample)",
      type: "AI Prompt or Workflow",
      description: "Fictional curated AI prompt/workflow set — prompts stored privately",
      status: "Internal Review",
      confidentiality: "Confidential",
      creator: "Demo AI Lab",
      owningBusiness: "Sample PurposeQuest Holdings",
      creationDate: "2026-02-18",
      publicationDate: null,
      version: "0.9",
      copyrightStatus: "NOT-FILED",
      trademarkStatus: "NONE",
      licensingStatus: "NOT-LICENSABLE",
      relatedProduct: "Sample AI Platform",
      renewalDate: null,
      sourceRef: "VAULT-AI-H6",
      notes: "Sample record — review before productizing",
      provenance: {
        originalCreationDate: "2026-02-18",
        lastRevisionDate: "2026-07-02",
        contributors: ["Demo AI Lab"],
        approvalStatus: "PENDING-REVIEW",
        sourceLocation: "PRIVATE-VAULT (label only)",
        relatedVersions: []
      }
    },
    {
      id: "IP-009",
      title: "Corporate Training Licensing Package (Sample)",
      type: "Licensing Package",
      description: "Fictional bundled license offering for enterprise training",
      status: "Legal Review",
      confidentiality: "Internal",
      creator: "Sample Brand Office",
      owningBusiness: "Sample PurposeQuest Holdings",
      creationDate: "2026-04-25",
      publicationDate: null,
      version: "1.0-rc",
      copyrightStatus: "NOT-FILED",
      trademarkStatus: "NONE",
      licensingStatus: "AVAILABLE",
      relatedProduct: "Sample Corporate Program",
      renewalDate: null,
      sourceRef: "VAULT-LIC-J2",
      notes: "Sample record — counsel reviewing terms",
      provenance: {
        originalCreationDate: "2026-04-25",
        lastRevisionDate: "2026-07-20",
        contributors: ["Sample Brand Office", "Demo Counsel LLP"],
        approvalStatus: "PENDING-REVIEW",
        sourceLocation: "PRIVATE-VAULT (label only)",
        relatedVersions: []
      }
    },
    {
      id: "IP-010",
      title: "Legacy Seminar Workbook (Sample)",
      type: "Course",
      description: "Fictional retired workbook kept for provenance",
      status: "Archived",
      confidentiality: "Internal",
      creator: "Demo Curriculum Guild",
      owningBusiness: "Demo Purposeology Press LLC",
      creationDate: "2019-05-14",
      publicationDate: "2019-09-01",
      version: "1.2",
      copyrightStatus: "REGISTERED",
      trademarkStatus: "N/A",
      licensingStatus: "EXPIRED",
      relatedProduct: "Retired sample seminar",
      renewalDate: null,
      sourceRef: "VAULT-ARC-K8",
      notes: "Sample record — superseded by IP-005",
      provenance: {
        originalCreationDate: "2019-05-14",
        lastRevisionDate: "2021-08-10",
        contributors: ["Demo Curriculum Guild"],
        approvalStatus: "APPROVED",
        sourceLocation: "PRIVATE-VAULT (label only)",
        relatedVersions: ["1.0", "1.1"]
      }
    }
  ],

  // ---- PROTECTION & REGISTRATION TRACKER (fictional) ----
  // registrationRef values are opaque sample labels — real
  // registration numbers must never appear in this repository.
  protections: [
    {
      id: "PR-001", assetId: "IP-006", type: "TRADEMARK-RENEWAL",
      label: "PURPOSEOLOGY DEMO MARK — renewal filing",
      jurisdiction: "US (sample)", registrationRef: "TM-REF-SAMPLE-A",
      filedDate: "2021-03-05", dueDate: "2026-08-20", status: "RENEWAL-DUE",
      notes: "Sample record — inside 30-day action window"
    },
    {
      id: "PR-002", assetId: "IP-003", type: "TRADEMARK-APPLICATION",
      label: "Quadrant Clarity mark — office action response",
      jurisdiction: "US (sample)", registrationRef: "TM-REF-SAMPLE-B",
      filedDate: "2026-01-12", dueDate: "2026-09-10", status: "PENDING",
      notes: "Sample record — response drafted"
    },
    {
      id: "PR-003", assetId: "IP-004", type: "COPYRIGHT",
      label: "Purpose Readiness Assessment — registration",
      jurisdiction: "US (sample)", registrationRef: "CR-REF-SAMPLE-C",
      filedDate: "2026-06-30", dueDate: "2026-10-15", status: "FILED",
      notes: "Sample record — awaiting certificate"
    },
    {
      id: "PR-004", assetId: null, type: "DOMAIN",
      label: "purposeology-demo.example — registration renewal",
      jurisdiction: "—", registrationRef: "DOM-REF-SAMPLE-D",
      filedDate: "2021-07-01", dueDate: "2026-07-30", status: "RENEWAL-DUE",
      notes: "Sample record — auto-renew off"
    },
    {
      id: "PR-005", assetId: "IP-005", type: "LICENSE-AGREEMENT",
      label: "Curriculum license — Demo Institute agreement review",
      jurisdiction: "US (sample)", registrationRef: "LA-REF-SAMPLE-E",
      filedDate: "2025-09-01", dueDate: "2026-09-01", status: "ACTIVE",
      notes: "Sample record — annual review clause"
    },
    {
      id: "PR-006", assetId: "IP-001", type: "PERMISSION",
      label: "Third-party excerpt permission — 2nd edition",
      jurisdiction: "—", registrationRef: "PM-REF-SAMPLE-F",
      filedDate: "2024-02-20", dueDate: null, status: "ACTIVE",
      notes: "Sample record — perpetual permission on file"
    },
    {
      id: "PR-007", assetId: "IP-001", type: "PUBLICATION",
      label: "The Compass Principle — 2nd edition publication record",
      jurisdiction: "—", registrationRef: "PB-REF-SAMPLE-G",
      filedDate: "2024-05-01", dueDate: null, status: "REGISTERED",
      notes: "Sample record"
    },
    {
      id: "PR-008", assetId: "IP-009", type: "LEGAL-REVIEW",
      label: "Corporate licensing package — counsel sign-off",
      jurisdiction: "—", registrationRef: "LR-REF-SAMPLE-H",
      filedDate: "2026-07-01", dueDate: "2026-12-05", status: "IN-REVIEW",
      notes: "Sample record — outside the 90-day window"
    },
    {
      id: "PR-009", assetId: "IP-002", type: "LEGAL-REVIEW",
      label: "Successor manuscript — pre-publication clearance",
      jurisdiction: "—", registrationRef: "LR-REF-SAMPLE-I",
      filedDate: "2026-05-15", dueDate: "2026-07-18", status: "IN-REVIEW",
      notes: "Sample record — deliberately overdue for demo"
    }
  ],

  // ---- LICENSING INTELLIGENCE (fictional) ----
  licenses: [
    {
      id: "LIC-001", assetId: "IP-005",
      licensee: "Demo Leadership Institute",
      territory: "North America (sample)",
      usageRights: "Deliver certification cohorts; no derivative works",
      startDate: "2025-09-01", endDate: "2027-08-31", renewalDate: "2027-06-01",
      revenueModel: "ROYALTY",
      restrictions: "No sublicensing; co-branding requires approval",
      status: "ACTIVE"
    },
    {
      id: "LIC-002", assetId: "IP-005",
      licensee: "Sample Coaching Collective",
      territory: "EU (sample)",
      usageRights: "Internal trainer enablement only",
      startDate: "2026-01-15", endDate: "2026-08-15", renewalDate: "2026-08-01",
      revenueModel: "FLAT-FEE",
      restrictions: "No public delivery; translation rights excluded",
      status: "ACTIVE"
    },
    {
      id: "LIC-003", assetId: "IP-003",
      licensee: "Fictional Corp University",
      territory: "Global (sample)",
      usageRights: "Framework use inside internal leadership program",
      startDate: null, endDate: null, renewalDate: null,
      revenueModel: "PER-SEAT",
      restrictions: "Terms in negotiation",
      status: "IN-NEGOTIATION"
    },
    {
      id: "LIC-004", assetId: "IP-010",
      licensee: "Retired Demo Partner",
      territory: "US (sample)",
      usageRights: "Workbook reprint rights (lapsed)",
      startDate: "2019-10-01", endDate: "2021-09-30", renewalDate: null,
      revenueModel: "FLAT-FEE",
      restrictions: "—",
      status: "EXPIRED"
    }
  ]
};
