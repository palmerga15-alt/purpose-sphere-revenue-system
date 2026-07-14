# Offer Spec: purposeology.ai — AI-Powered Purposeology Delivery Layer

**Date prepared:** 2026-07-14
**Pipeline stage:** offer-architect (stage 2 of market-signal-researcher → offer-architect → content-angle-strategist)
**Strategic priority addressed:** #5 — "purposeology.ai — the long-term, highest-impact goal: productizing Purposeology™ as an AI-powered platform"
**Grounded in:** `business-brief.md` (root); `/research/2026-07-purposeology-ai-platform.md` (dedicated market research for this priority — the primary source for all demand, competitive, trust, and pricing claims below); and the four upstream offer specs this priority sits downstream of and converges: `/offers/2026-07-15-purposeology-ai-webinar-offer-suite.md` (#1), `/offers/2026-07-14-online-purposeologist-certification-school.md` (#2), `/offers/2026-07-14-global-speaking-keynote-offer.md` (#3), `/offers/2026-07-14-fortune-500-corporate-training-offer.md` (#4).

---

## Offer Name

**purposeology.ai — Guided Discovery Layer** (working name; the MVP itself is referred to below as the **Purposeology Guide** to distinguish the near-term proof point from the eventual branded platform. Titles and copy are content-angle-strategist's job, not architected here.)

## Summary

An AI-delivered guide that walks users through the public-facing Purposeology™ five-stage journey (find, focus, form, follow, fruition) using DrG Alfred Palmer's own published and delivered content as its grounding material — not a generative "AI life coach" that produces someone's purpose on demand. This is the long-term convergence point of the whole pipeline: it can eventually run on the certification school's teachable facilitation method (#2), route corporate users toward the Fortune 500 meaning-and-retention pitch (#4), and use the webinar/workshop funnel (#1) as both its content source and its distribution channel. Per the brief's own sequencing and the Purpose Council's proof-before-new-fronts guidance, this spec treats purposeology.ai as **the priority to prove cheaply now, not build fully now** — the bulk of this document is about what a minimal, near-zero-build proof point looks like, with the fuller platform vision explicitly sequenced behind it.

**Research grounding note:** the dedicated market-signal report for this priority exists and is used throughout (`/research/2026-07-purposeology-ai-platform.md`). Where this spec goes beyond that report's findings, it is flagged explicitly as a design decision or open gap, not presented as researched.

## The Load-Bearing Design Constraint: Conduit, Not Source

The research report's central finding is that AI-and-purpose products are not inherently distrusted — trust is measurably high (54% of practicing Christians would trust AI's advice on meaning/purpose) — but trust collapses sharply and specifically the moment AI is positioned as the *authority/source* of someone's meaning rather than a *doorway* to it. This has to be a constraint on what the product is allowed to do, not just how it's marketed. Concretely, at every point where a generic AI life-coach app would just generate an answer, the Purposeology Guide behaves differently:

| Moment | What a generic AI purpose app does | What the Purposeology Guide does instead |
|---|---|---|
| User answers a few prompts about their life/interests | Generates a "Massive Transformative Purpose" statement or personality-style verdict ("Your purpose is to be a healer") | Reflects the user's own words back through the **find**-stage lens DrG teaches, names which stage of the journey they're in, and asks the next guiding question — it never issues a completed purpose statement on the AI's own authority |
| User asks the AI to "just tell me my purpose" | Complies, producing a confident, generic-sounding declaration | Explicitly declines to originate the answer; explains (briefly, once, not preachy) that Purposeology treats this as something a person arrives at through the process, not something an algorithm assigns, and redirects to the next stage-appropriate step |
| User reaches what would be the **fruition** stage — the culmination/declaration of purpose | An AI life-coach app would complete the arc autonomously (final output, done) | **Human-gated by design.** The Guide does not issue a fruition-stage declaration. It tells the user they've reached the point where the framework calls for a real conversation — a workshop, a certified Purposeologist (once that bench exists, see below), or DrG's own materials — and hands off there. Fruition is never an AI output. |
| User signals distress, crisis, or a mental-health-adjacent need | Varies by app; some (Woebot-era tools) attempted therapeutic engagement directly | The Guide explicitly does not attempt clinical/therapeutic engagement. It redirects to appropriate human/professional resources. This is a deliberate brand-safety and liability boundary, not just a UX choice — Purposeology is a meaning/calling framework, not a mental-health treatment product, and should not be positioned or built as one. |
| User asks the AI to speak "as DrG" in the first person | A "Text With Jesus"-style product would let the persona speak in first person as the authority figure | **The Guide never role-plays as DrG.** It identifies itself as a guide trained on DrG Alfred Palmer's Purposeology framework, not as DrG himself. This directly avoids the specific backlash pattern the research documents (Text With Jesus was criticized for the *authority-impersonation* framing, not for existing) |
| Knowledge base / grounding | Generic LLM training data plus a system prompt | Restricted to DrG's own published and delivered content (books, webinar/workshop transcripts, the public-facing five-stage framework, Chronos/Kairos, Purpose Fingerprint™) — mirroring the curated-corpus pattern used by faith-specific AI apps (FaithGPT, Gospel Bots) for grounding and citation. **The internal 26-concept framework and Concept Dictionary are never in the knowledge base or the system prompt in any user-facing or user-extractable form.** |

This table is the offer's actual product spec, not marketing language — content-angle-strategist should describe the *experience* this produces, but the behavioral constraints themselves belong here.

## Who It's For

Maps to the brief's existing audience segments — no new segment introduced:

- **Individuals in transition** (career/faith/midlife/post-military) — the primary user, and the same segment the webinar/workshop funnel already targets; this product is a natural extension of that funnel's "find"-stage taste, not a new audience acquisition motion.
- **Faith-adjacent / spiritual-but-not-religious users** — the segment the research's trust data most directly concerns (54% trust, but conditional on the conduit framing above).
- **Veterans** — consistent with the report's "translate your edge" framing already used in the webinar/workshop specs, not an anxiety-relief pitch.
- **Corporate/organizational users** — a roadmap-only, not-now segment (see Enterprise Roadmap below), tied to priority #4's Fortune 500 meaning/retention pitch once that priority has its own pilot proof.
- **Psychology-adjacent institutions** — not a direct MVP user, but a plausible referral/partnership channel later, consistent with how the brief already lists this segment as an existing cold-outreach target.

## Monetization Model: Hybrid, Free-Funnel-First — Not a Standalone Paid Subscription at Launch

The research names two viable precedent patterns and one structural caution, and this spec chooses among them deliberately:

- **Diamandis pattern (MyPurposeFinder):** free AI tool as top-of-funnel lead capture into a paid, higher-ticket offering.
- **Manson pattern ("Purpose"):** standalone $19.99–20/mo subscription, built on an existing author brand.
- **Woebot/Wysa caution:** pure consumer-subscription AI for deeply personal topics is not self-evidently durable standalone — Woebot shut its consumer app down in 2025; Wysa kept growing by anchoring to clinical/enterprise credibility instead.

**Decision: adopt the Diamandis pattern first — free, funnel-anchored — not the Manson pattern, and explicitly not yet.** Rationale:

1. Purposeology already has exactly the funnel infrastructure the Diamandis model requires and Manson's product doesn't rely on: an active webinar (#1), a paid workshop (#1), and a certification-school waitlist (#2) already built or in motion. A free AI tool that feeds those is reusing existing infrastructure, not building new monetization infrastructure from zero.
2. The Woebot caution applies most directly to a *standalone paid subscription launched cold*, which is precisely what the Manson pattern would require here — untested, no existing subscription billing infrastructure, no data yet on Purposeology-specific willingness to pay.
3. This keeps the offer inside the Purpose Council's proof-before-new-fronts guidance: a free tool tied to an existing funnel is an extension of proof already being built (the webinar/workshop funnel), not a new revenue-infrastructure front (subscription billing, app-store presence, recurring-revenue operations).

**A paid subscription tier is not ruled out — it is sequenced as a later decision, made only after the free tool validates engagement and funnel lift.** If pursued later, $19.99–20/mo (Manson) and the broader $9.99–20/mo consumer-AI-coaching band (Google AI Health Coach $9.99/mo, Rocky.ai <$15/mo, Mindvalley ~$16.58/mo) are the external reference points — explicitly flagged as benchmarks, not validated prices for this product; no data exists yet on what Purposeology's specific audience would pay or how it would convert/churn (see Research Gaps).

## Format / Form Factor — Pick One Concrete Initial Version, Not Everything At Once

**MVP form factor: a text-based conversational guide, delivered as a simple web-embedded chat interface on an owned page (not a native mobile app, not a custom-trained model).** Two build options exist at this tier, both far below "build a platform":

1. **Owned website chat widget (recommended primary MVP).** A thin wrapper around an off-the-shelf LLM API, constrained by a detailed system prompt encoding the conduit-not-source behavior above, grounded only in DrG's existing content (book, webinar/workshop transcripts, public five-stage framework). Embedded on an owned page (e.g., a post-webinar or post-workshop follow-up page), gated behind an email capture so it feeds the same funnel infrastructure the webinar/workshop already built, and skinned in Royal Purple #4B0082 / Gold #FFD700. Requires light development work (API integration, hosting, a simple front-end) but no fine-tuning, no custom model, no app-store submission, no subscription billing.
2. **Parallel low-cost test: a public custom GPT (OpenAI GPT Store) or equivalent.** Near-zero build cost, usable to gauge raw engagement and interest quickly. Trade-off to flag explicitly: it cannot capture email addresses or route users into the owned funnel, requires the user to have their own ChatGPT account (added friction, especially for less tech-forward segments like some faith-adjacent or veteran users), and offers weaker brand-visual control (lives inside ChatGPT's own UI, not Purple/Gold branded). Useful as a cheap parallel signal, not a substitute for option 1.

**Recommendation: build option 1 as the actual MVP** (it's the one that ties to the funnel and preserves brand control), optionally run option 2 in parallel for near-zero-cost engagement signal. **Neither requires a native app, a custom-trained model, or new monetization infrastructure** — this is the "smallest viable version," not a scaled-down version of the eventual platform.

**Eventual vision (explicitly not the near-term build):** a branded native/web app (`purposeology.ai`) with persistent user memory across sessions, deeper personalization, a practitioner-directory integration for live escalation, and potentially an enterprise deployment tier. This is real, and it's the "long-term, highest-impact" framing the brief uses — but per the Purpose Council's stated priority (strengthen proof and delivery infrastructure before opening new build fronts), and given this is explicitly the last-sequenced priority in the brief's own ordering, **this spec does not recommend building the full platform now.** The MVP above is the thing to build; the platform is the thing to plan for once the MVP validates engagement and once upstream priorities (#1–#4) have their own proof points in hand.

## Pricing / Packaging

| Tier | Price | Status |
|---|---|---|
| **MVP: Purposeology Guide (web chat widget)** | **Free**, gated behind email capture | Deliberate choice, grounded in the Diamandis funnel precedent and the Woebot standalone-subscription caution — not a placeholder pending validation, but the recommended near-term model itself |
| **Parallel test: public GPT** | Free | Near-zero-cost engagement signal only; does not feed the owned funnel |
| **Future paid subscription tier (not now)** | **Placeholder — external benchmark only, not validated for Purposeology:** $9.99–20/mo, in line with the Manson ($19.99–20/mo), Google AI Health Coach ($9.99/mo), Rocky.ai (<$15/mo), Mindvalley (~$16.58/mo) range | To be considered only after the free MVP produces real engagement and funnel-conversion data; no research exists on Purposeology-specific willingness to pay |
| **Future enterprise tier (roadmap only)** | Not priced here | Dependent on priority #4 (Fortune 500 corporate training) producing its own pilot proof first — see Enterprise Roadmap below; enterprise AI-coaching pricing is opaque/"price on request" industry-wide per the research, so no benchmark exists to anchor a number even directionally |

## Human-in-the-Loop: Certified Purposeologists as the Escalation/Quality Layer

The certification-school offer spec already flags this exact tie-in: "a defined, teachable five-stage facilitation method... is the clearest existing asset to eventually encode into an AI-guided product," and separately names certified graduates as "a pool of trained humans-in-the-loop if the platform needs credentialed practitioners for quality or escalation purposes down the line." This spec makes that concrete:

- **At MVP stage: the human escalation point is DrG himself, or a very small trained team — not a certified-practitioner bench.** The certification school (#2) is currently recommended only at pilot-cohort scale (10–20 people, informally assessed) per its own offer spec; there is no licensed, quality-controlled bench to route users to yet. This is a real, current limitation, not a formality — flagged explicitly so it isn't assumed solved.
- **Escalation triggers (design-level, not exhaustive):** a user reaching the fruition-stage handoff (see table above), a user expressing repeated distress or a need the AI is not built to address, or a user explicitly requesting deeper human engagement. Each of these routes to a human touchpoint — currently DrG/team, later a certified-practitioner bench once #2 scales beyond pilot.
- **Once the certification school's Corporate Delivery License or a comparable individual-practitioner tier matures**, certified Purposeologists become the natural staffing layer for this escalation function at scale — the same "DrG cannot personally staff this at scale" logic already used in the #2 and #4 specs applies here. This is future sequencing, not a near-term dependency for the MVP.

## Deliverables and Outcomes (Five-Stage Framing, No Internal Concepts Exposed)

- Users move through a guided, conversational version of **find** — naming what's pulling at them, reflected back through the framework rather than generated for them.
- A structured bridge into **focus** — the AI helps the user articulate a direction in their own words, citing the framework stage they're working in.
- An explicit, named boundary at **form/follow** — the Guide can support early structuring of next steps but is transparent that deeper, sustained work (workshop, certification-adjacent guidance, or ongoing human support) is where this continues.
- **Fruition is never an AI-issued output** — users who reach this point are handed off to a human touchpoint, by design (see constraint table above).
- Every user, regardless of depth reached, receives a named next step into the existing funnel: workshop enrollment, certification-school waitlist, or (for corporate users, later) a Discovery/Executive Session lead per the #4 offer.

## Path to / From Adjacent Priorities

- **From priority #1 (webinar/workshop):** the MVP's content grounding *is* the existing webinar/workshop/book content — no new authored content is required to stand up the MVP. The MVP is also distributed through the existing funnel (post-webinar/workshop follow-up), not a new acquisition channel.
- **To priority #1:** the Guide's own CTA loop feeds users back into workshop enrollment and the certification-school waitlist, exactly as the webinar/workshop funnel already does — this product doesn't replace that funnel, it extends its reach and gives it an always-on, low-cost touchpoint between live events.
- **From/to priority #2 (certification school):** the school's teachable five-stage facilitation method is the clearest content asset to eventually encode more deeply into the product (already flagged in that spec); in the other direction, certified graduates are the long-term human-escalation bench this product will need once it scales past DrG's personal availability.
- **To priority #4 (Fortune 500 corporate training) — Enterprise Roadmap (explicitly not now):** the research's Woebot/Wysa finding suggests durable AI-for-personal-topics products often pair with either a strong personal-brand funnel (which purposeology.ai has via #1/#2) or a clinical/enterprise anchor (which #4 could eventually provide). An enterprise deployment of the Guide — e.g., embedded inside a corporate AI-adoption engagement, helping employees connect an organization's AI rollout to personal/team meaning — is a plausible future tier, directly extending the #4 offer's "meaning gives you the reason to use AI" pitch to individual employees at scale. **This is roadmap-only:** priority #4 itself has no pilot account yet (per its own offer spec), so an enterprise purposeology.ai tier has no proof to build on and should not be built or priced until #4 produces its own pilot data.

## Dependencies / Assets Needed

**Already exists / reusable — no new authored content required for the MVP:**
- DrG's published book, webinar VSL/"New Reveal" content, and (once delivered) the July 22 workshop content — the actual grounding material for the Guide's knowledge base.
- The public-facing five-stage framework and the two externally-safe named distinctions (Chronos/Kairos, Purpose Fingerprint™) — already treated as outward-facing per the brief.
- Existing email/funnel infrastructure (per the #1 offer spec) that the MVP's email-gated capture can plug into directly.
- Brand visual assets (Royal Purple/Gold) reusable for the widget's UI.

**Still needed — real build items, small but not zero:**
- Light development work to build and host the web chat widget (API integration, a simple branded front-end, email-capture gating).
- A carefully written system prompt encoding the conduit-not-source behavioral constraints in this spec (the table above needs to become actual prompt engineering, tested for failure modes — e.g., does the model actually decline to "just tell me my purpose" reliably, or does it need explicit few-shot examples/guardrails to hold that line under adversarial or repeated user pressure).
- A decision on which LLM API to build on (not specified here — a technical/vendor decision, not an offer-architecture one).
- Basic monitoring: someone (DrG or a small team) needs to actually receive and respond to escalations flagged by the Guide (fruition-stage handoffs, distress signals) — this is an operational commitment, not just a technical build.
- If option 2 (public GPT) is also pursued: minimal additional effort, but a decision on whether to also invest there given its funnel limitations.

## Explicit Council Guidance Flag — This Is the Priority to Prove Cheaply, Not Build Fully

Priority #5 is both the brief's "long-term, highest-impact goal" and its last-sequenced priority, sitting behind #1–#4 in the stated order. Combined with the Purpose Council's guidance to strengthen proof and delivery infrastructure before opening new build fronts, this spec's central recommendation is: **do not build the full platform now.** The MVP described above (a web-embedded chat widget grounded in existing content, free, funnel-gated) is deliberately sized to be smaller and cheaper than any other build-item in this five-offer pipeline — smaller than the certification school's curriculum/LMS build, smaller than the speaking offer's video/reference-asset production, and far smaller than the Fortune 500 offer's enterprise sales infrastructure. That sizing is intentional: it lets the Council get a first read on whether "AI-delivered Purposeology" actually engages users and feeds the funnel, without committing to subscription billing, app-store operations, or platform engineering before priorities #1–#4 have their own proof in hand.

**If the Council wants to sequence even this MVP behind #1–#4 fully resolving first, that is a legitimate, more conservative reading of "prove before you build" — this spec presents the MVP as the lowest-risk version of priority #5 available, not as an argument that it must happen concurrently with the other four.**

## Research Gaps — Not Filled Here

- **No quantified subscription conversion or churn data exists for any comparable app** (Manson's "Purpose," MyPurposeFinder, Rocky.ai, or the broader AI-life-coach category) — the research report notes pricing benchmarks but not conversion/retention figures. Any future subscription-tier business case needs this closed before committing real pricing.
- **No data on what Purposeology's own audience would pay, or whether the free-funnel model actually lifts workshop/certification conversion** — this is exactly what the MVP is meant to generate, not something available yet.
- **Enterprise AI-coaching pricing is opaque industry-wide** ("price on request" across the board per the research) — no benchmark exists for a future purposeology.ai enterprise tier; this compounds the #4 offer's own flagged gap on Fortune 500 procurement norms.
- **The Puck News article on Mark Manson's app pricing was only search-summary corroborated, not independently fetched**, and the full Barna Group report was not independently fetched (though corroborated across four secondary sources) — both are treated as reliable per the research report's own caveats, but are flagged again here since this spec leans on both.
- **No usability/safety testing exists yet on whether the conduit-not-source system-prompt constraints actually hold under real user behavior** (e.g., adversarial prompting, repeated "just tell me" requests, users in genuine crisis) — this is a build-and-test gap, not a market-research gap, but it's a precondition for launching even the MVP responsibly.

These should route back to market-signal-researcher only if the Council wants pricing/conversion data closed before deciding whether to pursue a future paid tier — they are not blockers for building the free MVP described above.

## Brand-Standard Compliance Check

- Colors: not specified here as implementation (a design/dev decision) — the chat widget's UI must use Royal Purple #4B0082 / Gold #FFD700 only, never Navy and Gold.
- Name used throughout: "DrG Alfred Palmer," no credentials, no "Dr." forms — and the Guide must never role-play as DrG in the first person (see constraint table above), only identify as a guide trained on his framework.
- Geography: no geography claim is made in this spec since the product is digital/national-to-global in scope; if any future enterprise or in-person-hybrid version references geography, it should follow the DMV-as-operational-base, Camden-NJ-as-origin framing already used elsewhere in this pipeline.
- No internal 26-concept framework or Concept Dictionary terms appear anywhere in this spec, in the product's proposed knowledge base, or in its system-prompt design — all deliverables and outcomes are described at the five-stage-journey level plus the two already-external distinctions (Chronos/Kairos, Purpose Fingerprint™).
