# EMR Software: Stage 3 Specification (Blueprint)

*Stage 3 of the [development plan](emr-development-plan.md). Working name: **[EMR name TBD]**, to be kept as a separate brand from Purposeology™ (see plan, Stage 1 caution).*

**Status:** Draft v1 — 2026-11-12. Items marked ❓ need a decision from you.

---

## 1. Problem statement (Stage 1, as answered)

- **Goals:** (1) a product to **sell**, (2) **built now**, (3) used in **your own practice** first.
- **Markets:** behavioral / mental health, primary care / general, coaches / wellness.
- **Problem to solve:** ❓ Still open: *why will these practices switch to yours?* (Price? Simplicity? A purpose/whole-person focus? Bundled telehealth?) Answering this becomes the sales message.

## 2. Product structure: one system, three editions

One codebase and one database, with features switched on by edition. That way you build once and sell three times.

| Feature | Coaching & Wellness | Behavioral Health | Primary Care |
|---|:-:|:-:|:-:|
| Client/patient records & demographics | ✅ | ✅ | ✅ |
| Scheduling & reminders | ✅ | ✅ | ✅ |
| Session / progress notes (templates) | ✅ | ✅ (SOAP, DAP, BIRP) | ✅ (SOAP) |
| Client/patient portal & secure messaging | ✅ | ✅ | ✅ |
| Telehealth video | ✅ | ✅ | ✅ |
| Self-pay invoicing & card payments | ✅ | ✅ | ✅ |
| Intake forms & e-signature | ✅ | ✅ | ✅ |
| Standardized assessments (PHQ-9, GAD-7) | — | ✅ | ✅ |
| Treatment plans & goals | Goals only | ✅ | ✅ |
| Separately protected psychotherapy notes | — | ✅ | — |
| Diagnoses (ICD-10) | — | ✅ | ✅ |
| Insurance billing & claims (CPT) | — | ✅ | ✅ |
| Problem list, medications, allergies | — | Meds/allergies | ✅ |
| Vitals, immunizations | — | — | ✅ |
| Lab orders & results | — | — | ✅ |
| E-prescribing (incl. controlled substances) | — | Psychiatry only | ✅ |
| Federal (ONC) certification | Not needed | Usually not needed ❓ | Likely needed |

**The same security applies to every edition** (HIPAA-grade encryption, role-based access, audit logs), even for coaches who may not be legally covered by HIPAA. It's simpler to build one way, and it's a selling point.

## 3. Phased roadmap (easiest market first)

| Phase | What ships | Who uses it | Why this order |
|---|---|---|---|
| **1. Core MVP** | Records, scheduling, notes, portal, self-pay billing, security | **Your own practice** (pilot) | Proves it works with real users before anyone pays |
| **2. Coaching & Wellness edition** | Phase 1 + goals, packages | First paying customers | Lowest compliance burden, fastest revenue; matches your existing network |
| **3. Behavioral Health edition** | + assessments, treatment plans, ICD-10, insurance claims, psychotherapy notes | Therapists, counselors | Behavioral health practices often don't need certified software, so entry is easier ❓ to verify |
| **4. Primary Care edition** | + vitals, labs, e-prescribing, ONC certification | Clinics | Highest cost and compliance burden, so it comes last, funded by Phases 2–3 |

## 4. Users and roles

| Role | Can see/do |
|---|---|
| Practice owner/admin | Everything, including settings, users, audit logs |
| Provider (clinician/coach) | Their patients' full charts; write and sign notes |
| Front desk | Demographics, scheduling, payments — **no clinical notes** |
| Billing | Diagnoses/codes and claims — no full note text |
| Patient/client (portal) | Their own appointments, forms, messages, invoices, shared documents |

## 5. Compliance requirements

- **HIPAA** Privacy, Security and Breach Notification Rules; a **BAA** with every vendor that touches patient data (hosting, email/SMS, video, payments where applicable). You also sign BAAs *with your customers*, because you'll be their business associate.
- **Psychotherapy notes** get extra HIPAA protection: stored separately from the rest of the chart and excluded from routine release.
- **42 CFR Part 2** applies if a customer runs a federally assisted substance-use-disorder program; it needs stricter consent handling. ❓ Support this in Phase 3, or exclude those customers?
- **Code sets:** ICD-10-CM (free); **CPT requires a paid AMA license** for software that uses it; PHQ-9 and GAD-7 are free to use.
- **ONC certification** for the Primary Care edition (Phase 4).
- **State laws** on telehealth and record retention vary by state.

## 6. Architecture decision (Stage 3.5)

| | Recommendation |
|---|---|
| **Approach** | ❓ **Build your own core** (recommended, since you'll own 100% of the IP to sell, and after losing your work, owning it matters) vs. customizing OpenEMR (faster for primary care, but GPL-licensed and harder to brand as yours) |
| **Language/framework** | **PHP with Laravel** (you circled PHP; it's mature and widely hired for) |
| **Database** | MySQL 8, encrypted (see `database/schema.sql`) |
| **Hosting** | HIPAA-eligible cloud with a BAA (AWS, Azure or Google Cloud) |
| **Code backup** | GitHub, in a repository **you** own |
| **Video** | A HIPAA-compliant video vendor that signs a BAA (don't build video yourself) |
| **Payments** | Stripe or similar; card data never touches your servers |
| **Interoperability** | HL7 FHIR API (needed for Phase 4) |

## 7. Business model (to validate)

- **Subscription per provider per month**, priced by edition (Coaching < Behavioral < Primary Care).
- For reference, popular behavioral-health practice software has been priced at roughly **$50–$100 per clinician per month** (approximate; to verify with `@agent-market-signal-researcher` before setting prices).
- Optional add-ons: telehealth, insurance claims processing, onboarding/data migration.
- ❓ A "purpose / whole-person" angle could set it apart in the market, but it must be kept separate from clinical claims.

## 8. Non-functional requirements

- Works on desktop and tablet; the portal works on phones.
- A note can be completed in **under 3 minutes**, with few clicks.
- Automatic encrypted backups with **tested** restores; 99.9% uptime target.
- Automatic logout after inactivity; multi-factor login.
- Patients can export their own records.

## 9. Built so far

- ✅ **Stage 4 prototype:** `prototype/index.html`, a clickable mock-up with **made-up data** that demonstrates the editions, roles and the audit log. No real patient data.
- ✅ **Stage 5 database design:** `database/schema.sql`

## 10. Open decisions (❓ summary)
1. Why will practices switch to yours? (Your sales message.)
2. Build your own core (recommended) or customize OpenEMR?
3. Support 42 CFR Part 2 substance-use programs?
4. Product name, and set up a separate company/brand?
5. Hire a developer/agency for production code, and set a budget?
