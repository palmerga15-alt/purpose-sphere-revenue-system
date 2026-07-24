// ============================================================
// REVENUE BILLING & ACCOUNTS RECEIVABLE — SAMPLE DATA
// window.BILLING_DATA
//
// FICTIONAL SAMPLE DATA ONLY. This repo publishes to public
// GitHub — no real customer names, contact details, invoice
// numbers, or payment references belong here. Every value below
// is invented for demonstration and must pass BillingValidate.
//
// mode "sample" makes every billing panel badge itself as
// SAMPLE DATA. A live adapter sets mode: "live" + its own label.
// ============================================================
window.BILLING_DATA = {
  schemaVersion: 1,
  generatedAt: "2026-07-24T09:00:00Z",
  source: { mode: "sample", label: "FICTIONAL SAMPLE ENTRIES — NOT REAL CUSTOMER OR PAYMENT DATA" },

  customers: [
    {
      id: "CUST-001",
      name: "Acme Purpose Partners LLC",
      billingContact: "Jordan Reyes",
      billingEmail: "billing@example-acmepurpose.test",
      billingAddress: "100 Example Plaza, Suite 400, Springfield, ST 00000",
      paymentTerms: "Net 30",
      taxExempt: false,
      notes: "Recurring corporate training client — prefers wire transfer."
    },
    {
      id: "CUST-002",
      name: "Northbridge Leadership Institute",
      billingContact: "Sam Okafor",
      billingEmail: "accounts@example-northbridge.test",
      billingAddress: "22 Fictional Ave, Lakeview, ST 00001",
      paymentTerms: "Net 15",
      taxExempt: true,
      notes: "Nonprofit — tax-exempt certificate on file (sample only)."
    },
    {
      id: "CUST-003",
      name: "Harper & Vale Consulting",
      billingContact: "Priya Harper",
      billingEmail: "priya@example-harpervale.test",
      billingAddress: "9 Sample Row, Rivertown, ST 00002",
      paymentTerms: "Due on Receipt",
      taxExempt: false,
      notes: "Slow payer historically — flag for early follow-up."
    }
  ],

  invoices: [
    {
      id: "INV-2026-0101",
      customerId: "CUST-001",
      customerName: "Acme Purpose Partners LLC",
      issueDate: "2026-06-10",
      dueDate: "2026-07-10",
      amount: 15000.00,
      status: null,
      reminderStatus: "NONE",
      followUpDate: "",
      recurring: null,
      notes: "Q3 corporate training engagement, milestone 1 of 2."
    },
    {
      id: "INV-2026-0102",
      customerId: "CUST-002",
      customerName: "Northbridge Leadership Institute",
      issueDate: "2026-07-01",
      dueDate: "2026-07-16",
      amount: 3495.00,
      status: null,
      reminderStatus: "SCHEDULED",
      followUpDate: "2026-07-20",
      recurring: null,
      notes: "Certified Purposeologist cohort seat, single enrollment."
    },
    {
      id: "INV-2026-0103",
      customerId: "CUST-003",
      customerName: "Harper & Vale Consulting",
      issueDate: "2026-06-01",
      dueDate: "2026-06-15",
      amount: 2500.00,
      status: null,
      reminderStatus: "ESCALATED",
      followUpDate: "2026-07-18",
      recurring: null,
      notes: "Discovery/Executive Session — second reminder sent by phone."
    },
    {
      id: "INV-2026-0104",
      customerId: "CUST-001",
      customerName: "Acme Purpose Partners LLC",
      issueDate: "2026-07-15",
      dueDate: "2026-08-14",
      amount: 5000.00,
      status: "sent",
      reminderStatus: "NONE",
      followUpDate: "",
      recurring: "MONTHLY",
      notes: "Monthly retainer — coaching add-on."
    },
    {
      id: "INV-2026-0105",
      customerId: "CUST-002",
      customerName: "Northbridge Leadership Institute",
      issueDate: "2026-07-20",
      dueDate: "2026-08-04",
      amount: 997.00,
      status: "viewed",
      reminderStatus: "NONE",
      followUpDate: "",
      recurring: null,
      notes: "Workshop VIP-tier seat, single attendee."
    },
    {
      id: "INV-2026-0106",
      customerId: "CUST-003",
      customerName: "Harper & Vale Consulting",
      issueDate: "2026-07-05",
      dueDate: "2026-07-20",
      amount: 1800.00,
      status: "draft",
      reminderStatus: "NOT_NEEDED",
      followUpDate: "",
      recurring: null,
      notes: "Draft — awaiting scope sign-off before sending."
    },
    {
      id: "INV-2026-0107",
      customerId: null,
      customerName: "Beacon & Fields Media (sample)",
      issueDate: "2026-04-01",
      dueDate: "2026-04-15",
      amount: 1200.00,
      status: "void",
      reminderStatus: "NOT_NEEDED",
      followUpDate: "",
      recurring: null,
      notes: "Voided — engagement cancelled before delivery."
    },
    {
      id: "INV-2026-0108",
      customerId: "CUST-003",
      customerName: "Harper & Vale Consulting",
      issueDate: "2026-06-01",
      dueDate: "2026-06-15",
      amount: 800.00,
      status: null,
      reminderStatus: "NOT_NEEDED",
      followUpDate: "",
      recurring: null,
      notes: "Paid in full — sample record of a completed collection."
    }
  ],

  payments: [
    {
      id: "PMT-2026-0001",
      invoiceId: "INV-2026-0101",
      paymentDate: "2026-07-05",
      amount: 7500.00,
      method: "Wire Transfer",
      referenceNumber: "SAMPLE-WIRE-REF-118",
      notes: "First of two milestone payments."
    },
    {
      id: "PMT-2026-0002",
      invoiceId: "INV-2026-0103",
      paymentDate: "2026-06-20",
      amount: 1000.00,
      method: "Check",
      referenceNumber: "SAMPLE-CHECK-2291",
      notes: "Partial payment — balance still overdue."
    },
    {
      id: "PMT-2026-0003",
      invoiceId: "INV-2026-0108",
      paymentDate: "2026-06-10",
      amount: 800.00,
      method: "ACH",
      referenceNumber: "SAMPLE-ACH-3391",
      notes: "Paid in full, 9 days after issue."
    }
  ]
};
