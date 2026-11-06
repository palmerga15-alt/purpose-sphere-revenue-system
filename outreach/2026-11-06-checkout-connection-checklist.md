# Checklist: Connect One Working Checkout

**Date prepared:** 2026-11-06
**Why this exists:** Across every status snapshot in this repo since July 2026, "checkout not connected" is the one blocker that has stopped every offer version (free webinar → paid $47–$97 webinar → Starter Kit) from converting to actual revenue. `dashboard/revenue-operations.json`'s own financial-record hierarchy names the intended stack:

> Podia records the order → Stripe processes payment → bank settles funds → accounting system classifies it → Command Center displays a sanitized summary.

This checklist is scoped to the **first link only**: get one product sellable. Everything else in that chain can follow once money is moving.

---

## Step 0 — Pick the one product to sell first

Don't connect checkout for everything at once. Per the Romulus weekly-priorities doc, the standing #1 priority is the **Purpose Discovery webinar ($47–$97)** — pick that, or whichever single offer is closest to done. Confirm:
- [ ] Title and promise are final
- [ ] Price is final (within the approved $47–$97 range, or current equivalent)
- [ ] Date/delivery platform (if a live event) is locked

## Step 1 — Choose the platform

Two realistic options, both already named in `dashboard/revenue-operations.json`:

| Option | Good fit if... | Setup time |
|---|---|---|
| **Podia** | You want registration + checkout + delivery (replay hosting, email, digital product delivery) in one place, with minimal custom code. | Hours |
| **Stripe Payment Link / Checkout** (standalone) | You already have a landing page (e.g., a Lovable site) and just need a "Buy Now" button. | Under an hour for a single product |

**Recommendation: Stripe Payment Link if a landing page already exists (several Lovable projects were already built — reuse one); Podia if you want registration + delivery handled for you.** Either satisfies the revenue-ops doc's architecture; don't build both.

## Step 2 — Connect it (Stripe path, fastest)

1. [ ] Log into (or create) a Stripe account for the relevant legal entity.
2. [ ] Products → Add Product → name it exactly as the offer's final title; set the $47–$97 price.
3. [ ] Create a **Payment Link** for that product (no code required).
4. [ ] Set the post-payment redirect to a confirmation/thank-you page with access instructions (webinar link, replay access, or Starter Kit download).
5. [ ] Enable automatic receipt emails in Stripe settings.
6. [ ] Put the Payment Link on the existing landing page (the unpublished Lovable pages flagged back in July — "Alliance Glow," "Galfred Palmer Landing" — are candidates if still relevant) and **publish it**.

## Step 2 — Connect it (Podia path)

1. [ ] Create/confirm the Podia account.
2. [ ] Create the product (webinar registration or digital download), set price.
3. [ ] Connect a payment processor inside Podia (it wraps Stripe/PayPal under the hood).
4. [ ] Build the registration/sales page using Podia's page builder.
5. [ ] Set up the confirmation email with access instructions.
6. [ ] Publish and get the live URL.

## Step 3 — Prove it works before promoting it

- [ ] Run one test transaction yourself (Stripe test mode, or a real $1 product if testing live) and confirm the money actually lands and the confirmation email actually arrives.
- [ ] Confirm the access/delivery step works (you can actually get into the webinar, or actually receive the download).

## Step 4 — Wire it to the sales-record discipline already defined

Once checkout is live, every sale should get a sales record per `dashboard/revenue-operations.json`'s own rules — this is what turns a Stripe payment into something the Friday financial review can actually report on:
- [ ] Record ID, revenue category (`R03 — Public Workshops and Seminars` for the webinar), financial status (`F04 — Collected` once payment clears), amount, evidence source (Stripe transaction ID), date.
- [ ] Do **not** blend this with pipeline/projected numbers — the revenue-ops doc is explicit that F01–F04 statuses must never be added together into a single "revenue" figure.

## Step 5 — Only then, promote

Sending traffic to a checkout that doesn't exist yet (or that silently fails) is worse than not promoting at all — it burns the one email list / outreach pass this business has. Confirm Steps 1–4 are done before resuming the Constant Contact / chamber-outreach / social promotion threads that were flagged as blocked back in July.

---

## What this checklist deliberately does not cover

- Choosing between Stripe and Podia for the *other* three offers (Starter Kit, AI With Purpose Workshop, Purpose-Centered AI Alignment Workshop™) — do this once for one product first.
- Connecting the bank-reconciliation or accounting-system layers — those come after checkout exists and money is actually moving.
- Any actual account creation or credential entry — that requires DrG's own logins and cannot be done on his behalf here.
