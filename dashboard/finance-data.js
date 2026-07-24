// ============================================================
// PURPOSE SPHERE COMMAND CENTER — FINANCIAL INTELLIGENCE DATA
// Phase 1 data contract for the BUSINESS FINANCIAL INTELLIGENCE
// section. Consumed by dashboard/finance.js.
//
// FICTIONAL SAMPLE DATA ONLY. This repo publishes to public
// GitHub Pages, so every vendor, project, amount, date, and
// note below is invented for layout/demo purposes and matches
// no real transaction.
//
// FUTURE PHASES: a secure, authenticated server-side adapter
// replaces this file by emitting the exact same shape into
// window.FINANCE_DATA (and setting source.mode = "live").
// The UI (finance.js) reads only this shape and never changes.
// See dashboard/FINANCE-ARCHITECTURE.md.
//
// SECURITY RULES FOR THIS FILE — it ships to the browser:
//   - NEVER put bank credentials, account numbers, routing
//     numbers, card numbers, or banking/accounting API keys
//     anywhere in this repository.
//   - NEVER put real vendors, real amounts, real due dates,
//     or real notes here while the repo/site is public.
//   - `paymentMethod` is a label only (e.g. "Business credit
//     card"), never an identifier.
// ============================================================
window.FINANCE_DATA = {
  schemaVersion: 1,
  generatedAt: "2026-07-24T00:00:00Z",

  // mode "sample" makes every finance panel badge itself as
  // SAMPLE DATA. A live adapter sets mode: "live" + own label.
  source: { mode: "sample", label: "FICTIONAL SAMPLE ENTRIES — NOT REAL FINANCIAL DATA" },

  // ---- 1. EXECUTIVE SNAPSHOT ----
  // cashAvailable stays null until a secure bank link exists
  // (Phase 2+). Everything else is derived by finance.js from
  // the payments / subscriptions / revenue sections below.
  snapshot: {
    cashAvailable: null,
    cashNote: "AWAITING SECURE BANK LINK (PHASE 2)"
  },

  // ---- 2. PAYMENT TRACKER ----
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
      vendor: "LearnSphere Academy",
      description: "Leadership masterclass subscription",
      category: "Training & Education",
      amount: 129.00,
      dueDate: "2026-07-28",
      frequency: "MONTHLY",
      status: null,
      business: "Project Alpha Coaching",
      paymentMethod: "Business credit card",
      notes: "Evaluate annual plan before renewal",
      receiptRef: "INV-LSA-2026-07"
    },
    {
      id: "PAY-002",
      vendor: "Acme AI Suite",
      description: "AI writing & automation tools",
      category: "Software & AI Tools",
      amount: 89.00,
      dueDate: "2026-08-01",
      frequency: "MONTHLY",
      status: null,
      business: "Demo Ventures LLC",
      paymentMethod: "Business credit card",
      notes: "Seat count review next cycle",
      receiptRef: "INV-ACME-2026-08"
    },
    {
      id: "PAY-003",
      vendor: "MailBloom",
      description: "Email marketing platform",
      category: "Marketing & Advertising",
      amount: 42.00,
      dueDate: "2026-07-31",
      frequency: "MONTHLY",
      status: null,
      business: "Demo Ventures LLC",
      paymentMethod: "Business credit card",
      notes: "Trial converts at end of month",
      receiptRef: "—"
    },
    {
      id: "PAY-004",
      vendor: "ClipCraft Studio",
      description: "Video editing & clip tool",
      category: "Software & AI Tools",
      amount: 24.00,
      dueDate: "2026-07-20",
      frequency: "MONTHLY",
      status: "PAID",
      paidDate: "2026-07-20",
      business: "Project Beacon Media",
      paymentMethod: "Business credit card",
      notes: "",
      receiptRef: "RCPT-CCS-1104"
    },
    {
      id: "PAY-005",
      vendor: "AvatarWorks",
      description: "AI presenter video subscription",
      category: "Software & AI Tools",
      amount: 35.00,
      dueDate: "2026-07-18",
      frequency: "MONTHLY",
      status: "PAID",
      paidDate: "2026-07-18",
      business: "Project Beacon Media",
      paymentMethod: "PayPal",
      notes: "Used for demo promo assets",
      receiptRef: "RCPT-AVW-2287"
    },
    {
      id: "PAY-006",
      vendor: "SiteForge",
      description: "Web app builder workspace",
      category: "Website & Technology",
      amount: 25.00,
      dueDate: "2026-07-26",
      frequency: "MONTHLY",
      status: null,
      business: "Web Properties (Demo)",
      paymentMethod: "Business credit card",
      notes: "Hosts landing page prototypes",
      receiptRef: "INV-SF-2026-07"
    },
    {
      id: "PAY-007",
      vendor: "Domain Registrar",
      description: "example-brand.com domain renewal",
      category: "Website & Technology",
      amount: 68.00,
      dueDate: "2026-08-15",
      frequency: "ANNUAL",
      status: null,
      business: "Demo Platform Project",
      paymentMethod: "Business credit card",
      notes: "Auto-renew ON — confirm card on file",
      receiptRef: "—",
      calendarType: "DOMAIN"
    },
    {
      id: "PAY-008",
      vendor: "SummitWorks Events",
      description: "Offers workshop registration",
      category: "Training & Education",
      amount: 450.00,
      dueDate: "2026-07-22",
      frequency: "ONE-TIME",
      status: null,
      business: "Demo Ventures LLC",
      paymentMethod: "Business credit card",
      notes: "Registration window passed — decide: pay late or skip",
      receiptRef: "—"
    },
    {
      id: "PAY-009",
      vendor: "Ledger & Co CPA",
      description: "Q3 bookkeeping & filing retainer",
      category: "Professional Services",
      amount: 325.00,
      dueDate: "2026-08-05",
      frequency: "QUARTERLY",
      status: null,
      business: "Demo Ventures LLC",
      paymentMethod: "Bank transfer (ACH)",
      notes: "Send July receipts before due date",
      receiptRef: "—"
    },
    {
      id: "PAY-010",
      vendor: "ShieldSure Insurance",
      description: "Business liability insurance",
      category: "Business Operations",
      amount: 92.50,
      dueDate: "2026-08-10",
      frequency: "MONTHLY",
      status: null,
      business: "Demo Ventures LLC",
      paymentMethod: "Bank transfer (ACH)",
      notes: "",
      receiptRef: "—"
    },
    {
      id: "PAY-011",
      vendor: "Example Agent Services",
      description: "Annual registered agent fee",
      category: "Business Operations",
      amount: 119.00,
      dueDate: "2026-07-15",
      frequency: "ANNUAL",
      status: null,
      business: "Demo Ventures LLC",
      paymentMethod: "Business credit card",
      notes: "Renewal notice received — not yet paid",
      receiptRef: "—",
      calendarType: "ANNUAL"
    },
    {
      id: "PAY-012",
      vendor: "Horizon Travel Co",
      description: "Conference trip — airfare deposit",
      category: "Travel, Speaking & Events",
      amount: 580.00,
      dueDate: "2026-09-02",
      frequency: "ONE-TIME",
      status: null,
      business: "Speaking Circuit (Demo)",
      paymentMethod: "Business credit card",
      notes: "Fare hold expires if unpaid",
      receiptRef: "—"
    },
    {
      id: "PAY-013",
      vendor: "BrightReach Ads",
      description: "July webinar promotion campaign",
      category: "Marketing & Advertising",
      amount: 140.00,
      dueDate: "2026-07-10",
      frequency: "ONE-TIME",
      status: "PAID",
      paidDate: "2026-07-10",
      business: "Demo Webinar Launch",
      paymentMethod: "Business credit card",
      notes: "Drove mid-July registrations",
      receiptRef: "RCPT-BRA-2026-0710"
    },
    {
      id: "PAY-014",
      vendor: "MeetStream",
      description: "Pro plan — webinars & coaching calls",
      category: "Software & AI Tools",
      amount: 18.99,
      dueDate: "2026-07-25",
      frequency: "MONTHLY",
      status: null,
      business: "Demo Ventures LLC",
      paymentMethod: "Business credit card",
      notes: "",
      receiptRef: "INV-MS-2026-07"
    },
    {
      id: "PAY-015",
      vendor: "PixelKit Pro",
      description: "Design plugin bundle — intro offer",
      category: "Other Business Expenses",
      amount: 45.00,
      dueDate: "2026-07-29",
      frequency: "ONE-TIME",
      status: "CANCELLED",
      business: "—",
      paymentMethod: "—",
      notes: "Declined — overlaps with existing tools",
      receiptRef: "—"
    },
    {
      id: "PAY-016",
      vendor: "SupplyBox",
      description: "Office & shipping supplies",
      category: "Other Business Expenses",
      amount: 32.75,
      dueDate: "2026-07-08",
      frequency: "ONE-TIME",
      status: "PAID",
      paidDate: "2026-07-08",
      business: "Demo Ventures LLC",
      paymentMethod: "Business credit card",
      notes: "",
      receiptRef: "RCPT-SB-0708"
    },
    {
      id: "PAY-017",
      vendor: "BrightPen Writing Services",
      description: "Ghostwriting contractor — monthly invoice",
      category: "Professional Services",
      amount: 220.00,
      dueDate: "2026-08-20",
      frequency: "MONTHLY",
      status: null,
      business: "Project Beacon Media",
      paymentMethod: "Bank transfer (ACH)",
      notes: "Contractor invoice, NET-30 terms",
      receiptRef: "—"
    }
  ],

  // ---- 3. EXPENSE INTELLIGENCE ----
  // Payment categories roll up into these reporting groups.
  expenseGroups: [
    "Software & AI",
    "Marketing",
    "Training & Education",
    "Business Operations",
    "Travel & Speaking",
    "Technology",
    "Contractors",
    "Miscellaneous"
  ],
  categoryGroups: {
    "Software & AI Tools": "Software & AI",
    "Marketing & Advertising": "Marketing",
    "Training & Education": "Training & Education",
    "Business Operations": "Business Operations",
    "Travel, Speaking & Events": "Travel & Speaking",
    "Website & Technology": "Technology",
    "Professional Services": "Contractors",
    "Other Business Expenses": "Miscellaneous"
  },

  // ---- 4. SUBSCRIPTION MANAGER ----
  // purposeTags drive automatic duplicate detection: two or
  // more active subscriptions sharing a tag are flagged as
  // possible duplicates.
  subscriptions: [
    {
      id: "SUB-001", vendor: "Acme AI Suite", description: "AI writing & automation tools",
      monthlyCost: 89.00, annualCost: 890.00, renewalDate: "2026-08-01", lastPayment: "2026-07-01",
      autoRenew: true, purpose: "AI-assisted writing and workflow automation", purposeTags: ["ai-writing"]
    },
    {
      id: "SUB-002", vendor: "QuillGenius", description: "AI writing assistant",
      monthlyCost: 29.00, annualCost: 290.00, renewalDate: "2026-08-09", lastPayment: "2026-07-09",
      autoRenew: true, purpose: "AI drafting for newsletters", purposeTags: ["ai-writing"]
    },
    {
      id: "SUB-003", vendor: "ClipCraft Studio", description: "Video editing & clip tool",
      monthlyCost: 24.00, annualCost: 240.00, renewalDate: "2026-08-20", lastPayment: "2026-07-20",
      autoRenew: true, purpose: "Short-form video production", purposeTags: ["video"]
    },
    {
      id: "SUB-004", vendor: "AvatarWorks", description: "AI presenter video subscription",
      monthlyCost: 35.00, annualCost: 350.00, renewalDate: "2026-08-18", lastPayment: "2026-07-18",
      autoRenew: true, purpose: "AI avatar promo videos", purposeTags: ["video"]
    },
    {
      id: "SUB-005", vendor: "MeetStream", description: "Webinars & coaching calls",
      monthlyCost: 18.99, annualCost: 189.90, renewalDate: "2026-08-25", lastPayment: "2026-07-25",
      autoRenew: true, purpose: "Live webinar delivery", purposeTags: ["meetings"]
    },
    {
      id: "SUB-006", vendor: "SiteForge", description: "Web app builder workspace",
      monthlyCost: 25.00, annualCost: 250.00, renewalDate: "2026-08-26", lastPayment: "2026-07-26",
      autoRenew: true, purpose: "Landing page prototypes", purposeTags: ["web-hosting"]
    },
    {
      id: "SUB-007", vendor: "MailBloom", description: "Email marketing platform",
      monthlyCost: 42.00, annualCost: 420.00, renewalDate: "2026-08-31", lastPayment: null,
      autoRenew: true, purpose: "Email sequences & broadcasts", purposeTags: ["email-marketing"]
    },
    {
      id: "SUB-008", vendor: "LearnSphere Academy", description: "Leadership masterclass",
      monthlyCost: 129.00, annualCost: 1290.00, renewalDate: "2026-08-28", lastPayment: "2026-06-28",
      autoRenew: false, purpose: "Executive skill development", purposeTags: ["training"]
    },
    {
      id: "SUB-009", vendor: "ShieldSure Insurance", description: "Business liability policy",
      monthlyCost: 92.50, annualCost: 1110.00, renewalDate: "2026-10-01", lastPayment: "2026-07-10",
      autoRenew: true, purpose: "Liability coverage", purposeTags: ["insurance"]
    }
  ],

  // ---- 5. REVENUE DASHBOARD ----
  // Placeholder streams. Phase 2 connects real sales platforms
  // through the secure backend; the shape stays identical.
  revenue: {
    period: "THIS MONTH",
    streams: [
      { name: "Book Sales",            monthTotal: 1240.00, source: "SAMPLE" },
      { name: "Speaking Revenue",      monthTotal: 2500.00, source: "SAMPLE" },
      { name: "Coaching Revenue",      monthTotal: 1800.00, source: "SAMPLE" },
      { name: "Certification Revenue", monthTotal: 950.00,  source: "SAMPLE" },
      { name: "Digital Products",      monthTotal: 430.00,  source: "SAMPLE" },
      { name: "Webinar Revenue",       monthTotal: 380.00,  source: "SAMPLE" },
      { name: "Membership Revenue",    monthTotal: 620.00,  source: "SAMPLE" },
      { name: "Consulting Revenue",    monthTotal: 1500.00, source: "SAMPLE" }
    ]
  },

  // ---- 6. FINANCIAL CALENDAR ----
  // Extra dated events beyond bills/renewals (which finance.js
  // derives automatically from payments + subscriptions).
  calendarEvents: [
    { date: "2026-09-15", label: "Q3 estimated quarterly taxes", type: "TAX",       amountEstimate: 1200.00 },
    { date: "2026-10-01", label: "Business insurance annual policy renewal", type: "INSURANCE", amountEstimate: 1110.00 },
    { date: "2026-11-05", label: "LearnSphere annual-plan decision point", type: "ANNUAL", amountEstimate: null },
    { date: "2027-01-15", label: "Q4 estimated quarterly taxes", type: "TAX",       amountEstimate: 1200.00 }
  ],

  // ---- 7. AI FINANCIAL INSIGHTS ----
  // Reserved for a future AI analysis engine (Phase 3). The
  // engine will write findings into `items` using the same
  // shape finance.js already renders. Until then finance.js
  // shows locally-computed signals (duplicates, overdue, large
  // upcoming expenses) as a preview.
  insights: {
    engineStatus: "RESERVED",
    planned: [
      { name: "Unusual spending detection", desc: "Flag out-of-pattern transactions" },
      { name: "Expense growth trends",      desc: "Categories rising month over month" },
      { name: "Duplicate subscriptions",    desc: "Overlapping tools doing the same job" },
      { name: "Savings opportunities",      desc: "Annual-plan & consolidation suggestions" },
      { name: "Monthly trend report",       desc: "Cash-flow trajectory & seasonality" },
      { name: "Large expense radar",        desc: "Big bills approaching in 90 days" }
    ],
    items: []
  }
};
