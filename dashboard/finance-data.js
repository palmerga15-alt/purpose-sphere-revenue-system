// ============================================================
// PURPOSE SPHERE COMMAND CENTER — BUSINESS FINANCE DATA MODULE
//
// SAMPLE DATA ONLY. Every entry below is illustrative so the
// PAYMENT TRACKER panel can be reviewed and styled. Replace the
// `payments` array with real entries (or regenerate this file
// from a secure backend/adapter) when connecting live data.
//
// SECURITY RULES FOR THIS FILE — it ships to the browser:
//   - NEVER put bank credentials, account numbers, routing
//     numbers, card numbers, or banking API keys here.
//   - `paymentMethod` is a label only (e.g. "Business credit
//     card"), never an identifier.
//   - A future live integration should fetch from an
//     authenticated server-side source and emit this same
//     window.FINANCE_DATA shape — the page only reads the shape.
// ============================================================
window.FINANCE_DATA = {
  generatedAt: "2026-07-24T00:00:00Z",

  // mode "sample" makes the panel badge itself as SAMPLE DATA.
  // A live adapter should set mode: "live" and its own label.
  source: { mode: "sample", label: "SAMPLE ENTRIES — NOT LIVE FINANCIAL DATA" },

  categories: [
    "Training & Education",
    "Software & AI Tools",
    "Marketing & Advertising",
    "Business Operations",
    "Travel, Speaking & Events",
    "Website & Technology",
    "Professional Services",
    "Other Business Expenses"
  ],

  // status: leave null/"AUTO" to auto-calc from dueDate
  // (OVERDUE / DUE SOON / DUE). Only "PAID" and "CANCELLED"
  // are honored as manual overrides. paidDate applies to PAID.
  frequencies: ["ONE-TIME", "MONTHLY", "QUARTERLY", "ANNUAL"],
  statuses: ["DUE", "DUE SOON", "PAID", "OVERDUE", "CANCELLED"],

  payments: [
    {
      id: "PAY-001",
      vendor: "Kajabi",
      description: "Course platform subscription",
      category: "Software & AI Tools",
      amount: 149.00,
      dueDate: "2026-07-28",
      frequency: "MONTHLY",
      status: null,
      business: "Purposeologist Certification School",
      paymentMethod: "Business credit card",
      notes: "Evaluate annual plan before renewal",
      receiptRef: "INV-KJB-2026-07"
    },
    {
      id: "PAY-002",
      vendor: "Anthropic",
      description: "Claude subscription — AI work engine",
      category: "Software & AI Tools",
      amount: 100.00,
      dueDate: "2026-08-01",
      frequency: "MONTHLY",
      status: null,
      business: "PurposeQuest International",
      paymentMethod: "Business credit card",
      notes: "Powers revenue-system automation",
      receiptRef: "INV-ANT-2026-08"
    },
    {
      id: "PAY-003",
      vendor: "Constant Contact",
      description: "Email marketing platform (post-trial)",
      category: "Marketing & Advertising",
      amount: 35.00,
      dueDate: "2026-07-31",
      frequency: "MONTHLY",
      status: null,
      business: "PurposeQuest International",
      paymentMethod: "Business credit card",
      notes: "Trial converts — finish email verification first",
      receiptRef: "—"
    },
    {
      id: "PAY-004",
      vendor: "OpusClip",
      description: "Video clip repurposing tool",
      category: "Software & AI Tools",
      amount: 29.00,
      dueDate: "2026-07-20",
      frequency: "MONTHLY",
      status: "PAID",
      paidDate: "2026-07-20",
      business: "Purposeology Content",
      paymentMethod: "Business credit card",
      notes: "",
      receiptRef: "RCPT-OPC-4417"
    },
    {
      id: "PAY-005",
      vendor: "HeyGen",
      description: "AI avatar video subscription",
      category: "Software & AI Tools",
      amount: 39.00,
      dueDate: "2026-07-18",
      frequency: "MONTHLY",
      status: "PAID",
      paidDate: "2026-07-18",
      business: "Purposeology Content",
      paymentMethod: "PayPal",
      notes: "Used for Quick Avatar promo assets",
      receiptRef: "RCPT-HG-9102"
    },
    {
      id: "PAY-006",
      vendor: "Lovable",
      description: "Web app builder workspace",
      category: "Website & Technology",
      amount: 25.00,
      dueDate: "2026-07-26",
      frequency: "MONTHLY",
      status: null,
      business: "Web Properties (7 projects)",
      paymentMethod: "Business credit card",
      notes: "Hosts Alliance Glow + landing pages",
      receiptRef: "INV-LOV-2026-07"
    },
    {
      id: "PAY-007",
      vendor: "Domain Registrar",
      description: "purposeology.ai domain renewal",
      category: "Website & Technology",
      amount: 72.00,
      dueDate: "2026-08-15",
      frequency: "ANNUAL",
      status: null,
      business: "purposeology.ai Platform",
      paymentMethod: "Business credit card",
      notes: "Auto-renew ON — confirm card on file is current",
      receiptRef: "—"
    },
    {
      id: "PAY-008",
      vendor: "Acquisition.com",
      description: "Offers workshop registration",
      category: "Training & Education",
      amount: 499.00,
      dueDate: "2026-07-22",
      frequency: "ONE-TIME",
      status: null,
      business: "PurposeQuest International",
      paymentMethod: "Business credit card",
      notes: "'Last call' email Jul 22 — decide: pay late or skip cohort",
      receiptRef: "—"
    },
    {
      id: "PAY-009",
      vendor: "CPA / Bookkeeper",
      description: "Q3 bookkeeping & filing retainer",
      category: "Professional Services",
      amount: 350.00,
      dueDate: "2026-08-05",
      frequency: "QUARTERLY",
      status: null,
      business: "PurposeQuest International",
      paymentMethod: "Bank transfer (ACH)",
      notes: "Send July receipts before due date",
      receiptRef: "—"
    },
    {
      id: "PAY-010",
      vendor: "Insurance Provider",
      description: "Business liability insurance",
      category: "Business Operations",
      amount: 87.50,
      dueDate: "2026-08-10",
      frequency: "MONTHLY",
      status: null,
      business: "PurposeQuest International",
      paymentMethod: "Bank transfer (ACH)",
      notes: "",
      receiptRef: "—"
    },
    {
      id: "PAY-011",
      vendor: "Registered Agent Service",
      description: "Annual registered agent fee",
      category: "Business Operations",
      amount: 125.00,
      dueDate: "2026-07-15",
      frequency: "ANNUAL",
      status: null,
      business: "PurposeQuest International",
      paymentMethod: "Business credit card",
      notes: "Renewal notice received — not yet paid",
      receiptRef: "—"
    },
    {
      id: "PAY-012",
      vendor: "Airline / Travel",
      description: "Nairobi speaking trip — airfare deposit",
      category: "Travel, Speaking & Events",
      amount: 620.00,
      dueDate: "2026-09-02",
      frequency: "ONE-TIME",
      status: null,
      business: "Global Speaking — Kenya Circuit",
      paymentMethod: "Business credit card",
      notes: "Hold expires if unpaid; hotel block quoted separately",
      receiptRef: "—"
    },
    {
      id: "PAY-013",
      vendor: "LinkedIn Ads",
      description: "July webinar promotion campaign",
      category: "Marketing & Advertising",
      amount: 150.00,
      dueDate: "2026-07-10",
      frequency: "ONE-TIME",
      status: "PAID",
      paidDate: "2026-07-10",
      business: "Purposeology & AI Webinar",
      paymentMethod: "Business credit card",
      notes: "Drove Jul 15 webinar registrations",
      receiptRef: "RCPT-LI-2026-0710"
    },
    {
      id: "PAY-014",
      vendor: "Zoom",
      description: "Pro plan — webinar & coaching calls",
      category: "Software & AI Tools",
      amount: 15.99,
      dueDate: "2026-07-25",
      frequency: "MONTHLY",
      status: null,
      business: "PurposeQuest International",
      paymentMethod: "Business credit card",
      notes: "",
      receiptRef: "INV-ZM-2026-07"
    },
    {
      id: "PAY-015",
      vendor: "Base44",
      description: "Welcome offer — 30% off builder plan",
      category: "Other Business Expenses",
      amount: 45.00,
      dueDate: "2026-07-29",
      frequency: "ONE-TIME",
      status: "CANCELLED",
      business: "—",
      paymentMethod: "—",
      notes: "Declined — overlaps with Lovable",
      receiptRef: "—"
    }
  ]
};
