# EMR Software: Development Plan

*Built on the "Stages of Software Development" framework from the handwritten notebook ([original transcription](../../recovered/handwritten-notes/stages-of-software-development.md)). The gaps in that page (the missing step 5, the cut-off step 7 and what follows launch) are filled in here and marked **[added]**.*

**Status:** Draft. Stages 1 and 2 need your answers before any real design or coding starts. That's the framework working as intended: you identify the problem before you build anything.

---

## The completed framework at a glance

| # | Stage | Who | Output |
|---|-------|-----|--------|
| 1 | Identify the problem | You | Problem statement |
| 2 | Discovery session | You + developer | Requirements list |
| 3 | Specification document / blueprint | Developer | Written spec |
| 3.5 | Develop the architecture & pick tools | Developer | Architecture plan |
| 4 | Design the user interface (UI) | Designer | Wireframes → final design |
| **5** | **Database design & data security [added]** | Developer | Data model + security plan |
| 6 | Coding & implementation (back up the code) | Developer | Working software |
| **7** | **Quality control: test at every step, then test the whole system [completed]** | QA + real users | Test results, fixes |
| **8** | **Launch / deployment [added]** | Developer | Live system |
| **9** | **Maintenance, support & updates [added]** | Developer | Ongoing improvements |

**Why step 5 is database and security:** It comes after the UI (step 4) and before coding (step 6). That's where a developer designs how the data is stored and protected. In an EMR, this stage matters more than any other, because the data is patients' protected health information.

---

## Stage 1: Identify the Problem

**"I have a problem!"** Fill in these blanks:

- **Who** is the EMR for? (A specific practice type: primary care, behavioral health, chiropractic, therapy, a clinic network, coaches?)
- **What problem** do they have today? (Current software too expensive? Too complicated? Missing features? Still on paper?)
- **What would success look like** in a year? (Number of providers or clinics using it, time saved per visit, revenue?)
- **Is it for your own practice, or a product to sell** to other practices?

> ⚠️ **A boundary to decide on.** Your existing Purposeology offers (see `offers/2026-07-14-purposeology-ai-platform-offer.md`) deliberately say *not clinical, not a mental-health tool*. An EMR is clinical software by definition. Decide whether it's a separate company or brand from Purposeology, so neither one puts the other at risk.

---

## Stage 2: Discovery Session

**Questions to take into the session with the developer:**

1. How many users (providers, staff), and how many patients?
2. Which features are **must-have on day one**, and which can wait? Common EMR features:
   - Patient demographics & registration
   - Scheduling / appointments
   - Clinical notes (SOAP notes, templates)
   - Problem lists, medications, allergies
   - E-prescribing
   - Lab orders & results
   - Billing & insurance claims (diagnosis/procedure coding)
   - Patient portal (patients view records, message the office)
   - Telehealth
   - Reports
3. Does it need to **exchange data** with hospitals, labs, pharmacies or other EMRs?
4. Do your users need a **certified** EMR? (See Stage 3; this one decision changes cost and timeline more than anything else.)
5. What's the budget and timeline?

---

## Stage 3: Specification Document / Blueprint

The spec must cover these EMR-specific requirements on top of the features:

- **HIPAA compliance.** The Privacy Rule, Security Rule and Breach Notification Rule all apply. Every vendor that touches patient data (hosting, email, backups) must sign a **Business Associate Agreement (BAA)**.
- **Certification (decide early).** The federal ONC Health IT Certification Program certifies EHRs. Practices that bill Medicare and want to meet the Promoting Interoperability requirements generally need certified software. If your target users need that, certification becomes a major workstream.
- **Standard medical code sets:** ICD-10 (diagnoses), CPT (procedures; licensed from the AMA), SNOMED CT, LOINC (labs), RxNorm (medications).
- **Interoperability:** HL7 **FHIR** is the current standard for exchanging health data between systems.
- **E-prescribing:** usually through a network such as Surescripts. Prescribing controlled substances (EPCS) adds DEA requirements, including two-factor authentication.

---

## Stage 3.5: Develop the Architecture & Pick Tools

**Location (hosting):** A HIPAA-eligible cloud that signs a BAA, such as AWS, Microsoft Azure or Google Cloud.

**Tools:** You circled **PHP**, which is still a sound choice here, for a specific reason:

> **Strong option: build on OpenEMR.** OpenEMR is a free, open-source, ONC-certified EMR written in **PHP**. Instead of writing an EMR from scratch, a developer can customize it, rebrand it within its license terms (GPL) and add your own features. That can save years and a large amount of money compared with starting from zero.

| Path | Pros | Cons |
|------|------|------|
| **A. Customize OpenEMR (PHP)** | Fastest; already certified; large community | You work within its existing design |
| **B. Build on top of an existing EHR's FHIR API** | Your app adds a niche feature; the big EHR handles compliance | Depends on another vendor |
| **C. Build from scratch** (PHP/Laravel, Node.js, ASP.NET, Ruby on Rails) | Full control, fully your IP | Most expensive and slowest; you carry the full compliance burden |

**Recommendation:** Start with **A or B** unless discovery shows a real reason to build from scratch.

---

## Stage 4: Design the User Interface (UI)

- Wireframes first, in **moqups.com** (still available) or **Figma** (the most common tool today) → then the actual design.
- Design around the **clinician's workflow**: fewer clicks per visit is the main thing doctors want from an EMR.
- Accessibility: readable fonts, good contrast, works on tablets.
- Have 2–3 real clinicians or office staff review the wireframes before any coding.

---

## Stage 5: Database Design & Data Security [added]

- **Data model:** patients, encounters (visits), notes, medications, allergies, problems, orders/results, appointments, billing.
- **Encryption** of all data in storage and in transit.
- **Role-based access:** front desk, nurses, providers and billing each see only what they need (HIPAA's "minimum necessary" standard).
- **Audit logs:** record who viewed or changed every patient record, and when.
- **Backups and disaster recovery:** automatic, encrypted and tested regularly. *(After the past few weeks, this one is personal. Don't let it be an afterthought.)*
- **Strong login security:** multi-factor authentication and automatic logout.

---

## Stage 6: Coding & Implementation

- **Back up the code:** GitHub or Bitbucket, as your note says. *(Cloud9 from your note has since been closed to new AWS customers; GitHub Codespaces is a modern equivalent.)*
- Build in small pieces, starting with the must-haves from Stage 2.
- **Never use real patient data** while developing; use made-up test data.
- **You** should own the code and the repository, not the developer. Put that in the contract. It's your IP.

---

## Stage 7: Quality Control [completed]

*"Address the problem at **each** step"*:

- **At every stage:** check each output against the problem defined in Stage 1.
- **Testing:** automated tests, manual tests and **security testing** (a penetration test by an outside firm before launch).
- **HIPAA risk assessment:** required by the Security Rule.
- **User acceptance testing:** real clinicians use it in a pilot and sign off.

---

## Stage 8: Launch / Deployment [added]

- Start with one **pilot practice**, then expand.
- Train staff; move existing patient records over (data migration).
- Have a support contact ready for launch day.

## Stage 9: Maintenance, Support & Updates [added]

- Security updates, bug fixes, new features, ongoing compliance updates.
- Keep monitoring the backups and audit logs.
- Feedback from users goes back into **Stage 1**, and the cycle repeats.

---

## Next step

Answer the Stage 1 and Stage 2 questions above, roughly is fine. From those answers, the next document is the **Stage 3 Specification**.
