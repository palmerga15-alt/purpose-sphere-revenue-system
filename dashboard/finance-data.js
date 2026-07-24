// ============================================================
// PURPOSE SPHERE COMMAND CENTER — BUSINESS FINANCE DATA MODULE
//
// FICTIONAL SAMPLE DATA ONLY. This repo publishes to public
// GitHub Pages, so every vendor, project, amount, date, and
// note below is invented for layout/demo purposes and matches
// no real transaction. Replace this file's output with a real
// feed only via a secure server-side adapter — never by
// committing real financial details here.
//
// SECURITY RULES FOR THIS FILE — it ships to the browser:
//   - NEVER put bank credentials, account numbers, routing
//     numbers, card numbers, or banking API keys here.
//   - NEVER put real vendors, real amounts, real due dates,
//     or real notes here while the repo/site is public.
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
  source: { mode: "sample", label: "FICTIONAL SAMPLE ENTRIES — NOT REAL FINANCIAL DATA" },

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
      receiptRef: "—"
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
      receiptRef: "—"
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
    }
  ]
};
