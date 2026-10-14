# Product Blueprint — Phase 0 Reference + Current Product Context

**Source of truth:** `psmedia-blueprint-deck.pptx`, Master Blueprint Phase 0, Version 2.0, marked Confidential/Frozen by its owner.  
**Purpose:** Preserve the original strategic decisions and separate them from later implementation findings.  
**Updated:** 2026-10-14

> The original Phase 0 uses the working name psmedia. The owner has said the future public brand should be different. Therefore, psmedia is retained only when describing the historical source; it is not proposed as the final public brand. The suggested replacement name has not been legally or domain-cleared.

## 1. Mission and vision — source-derived

The mission in Phase 0 is to turn scattered business data into precise decisions, executable actions and measurable growth for Iranian businesses.

The five-year vision is a standard operating system for growing Iranian businesses to decide, execute and grow. It is explicitly **not merely a marketing tool or reporting dashboard**: it is management intelligence that tells the manager what to do and why. Expansion to regional markets is a result of success in Iran, not a prerequisite.

## 2. Market problem — source-derived

1. **Scattered data:** Instagram, Telegram, website and sales data live separately, so there is no complete picture.
2. **Marketing without measurable outcomes:** spend occurs while ROI and accountability remain unclear.
3. **Intuition-led decisions:** managers lack time for analysis, global tools may not fit Persian/local conditions, and reliable Iranian benchmarks are missing.

## 3. Value proposition — source-derived

The intended shift is from not knowing where budget went, receiving agency reports without sales outcomes, and not knowing what to do tomorrow — to knowing which action has the greatest effect, allocating budget based on actual outcomes, and giving the team a clear weekly direction and rationale.

The core promise is a 24/7 management advisor fed by the customer's real business data. This is the target vision, not a claim that every capability already exists in the current dashboard.

## 4. Target customer — source-derived

### Primary persona, v1: Iranian SMB CEO «Ali»
- Growing Iranian business with 10–100 employees.
- Monthly revenue assumption: 500 million to 5 billion toman.
- Willingness-to-pay assumption: 5–15 million toman/month.
- CEO is the decision maker and wants a fast decision cycle.

These are hypotheses from the frozen blueprint and must be validated; they are not independently verified market statistics.

### Secondary persona, v1.5: agency «Sara»
- Marketing agency with 2–15 people.
- White-label model is contemplated for v1.5.

### Explicit v1 out of scope
- Enterprise organizations with more than 500 employees.
- Markets outside Iran.
- Government entities.
- Pre-revenue businesses.

## 5. Revenue model — source-derived hypotheses

| Layer | Concept | Intended timing | Blueprint assumption |
|---|---|---|---|
| T1 | Starter / Growth / Scale subscription | v1 | 3–20 million toman/month; 60% mix |
| T2 | Shared Success / performance fee on incremental growth | v1.5 | 25% mix |
| T3 | Agency revenue share (agency sells, platform provides infrastructure) | v2 | 30% revenue share; 10% mix |
| T4 | Iranian marketing benchmark Data API, per call | v3 | 5% mix |

Phase 0 also sets ambitious financial targets including ARR $720K at 12 months, CAC below $500, LTV above $3,000 and gross margin above 70%. Treat these as goals, not actual performance or a validated forecast.

## 6. What customers pay for — source-derived service model

The blueprint lists nine daily services:
1. Daily Intelligence Brief
2. Business Advisor
3. Monitoring Engine
4. Strategy Engine
5. Content Intelligence
6. Performance Dashboard
7. AI Memory
8. Automation Engine
9. Executive Reports

The positioning is subscription to an intelligent manager working alongside the business, not merely a software interface.

## 7. Competitive advantages — source-derived hypotheses

- **Iranian Data Moat:** local CPL/CPA/ROI benchmarks, expected to take 2–3 years to build.
- **Localization Depth:** local market, culture, calendar and purchasing behavior.
- **Learning System:** the data → recommendation → outcome flywheel.
- **Outcome Orientation:** measure business outcomes rather than activity.

These are intended moats, not yet proven advantages.

## 8. North Star and success metrics — source-derived

**North Star Metric: Weekly Active Decisions** — the number of decisions customers execute based on the platform's recommendations each week.

Phase 0 targets:
- Month 6: 5 decisions/customer/week.
- Month 12: 12 decisions/customer/week.
- Year 2: 20 decisions/customer/week.

The frozen deck also contains target metrics for business, product and AI performance, including MRR, churn, NRR, LTV, activation, WAU/MAU, AI acceptance, AI cost per customer, daily brief completion, time to first value/insight and prompt success. These are target metrics, not measured current values. Before operational use, definitions, calculation windows and baseline data must be specified.

## 9. Twelve design principles — source-derived

1. AI First
2. Human in the Loop
3. Security by Design
4. API First
5. Modular Architecture
6. Explainable AI
7. Observable Everything
8. Automation Before Manual
9. Customer Owns Data
10. Simplicity Over Complexity
11. Build for Scale
12. Performance First

The deck sets formal targets of page load under 2 seconds and AI calls under 10 seconds. Measure these under a defined test environment before claiming compliance.

## 10. Data strategy — source-derived

- Opt-in only: customers know which data is collected and why.
- Customer ownership: full export should remain available.
- Anonymized aggregation: platform-wide benchmarks are built from anonymized data.

Intended data domains include campaign KPI performance (CPL, CPA, ROI, CTR), strategy outcomes, industry benchmarks, content performance, decision patterns and growth patterns. Any benchmark requires appropriate consent, data governance and anonymization; no cross-customer use should be assumed without those controls.

## 11. Definition of success — source-derived Year 5 target

The blueprint's Year 5 vision lists 1,000+ active businesses, automated Daily Brief with 65%+ execution, de facto standard status in Iran, a 50-person outcome-oriented team, ARR $10–15M with NRR above 120%, and a leading brand for intelligent decisions. These are aspirational goals, not current results.

## 12. Explicit product boundaries — source-derived

Phase 0 says the product is **not**:
- A full CRM.
- A graphic design tool.
- A publishing scheduler.
- A replacement for the sales team.
- A replacement for the CEO.
- A prettier-looking ChatGPT.

The purpose is to move managers from intuition-led to data-led decisions. Each feature must improve a customer KPI, be understandable in under three minutes per page, and improve sales or reduce costs; otherwise it should not be built.

## 13. AI Constitution — source-derived

Every AI output must:
- Explain why a recommendation is made.
- Provide a confidence score.
- Admit when there is insufficient data.
- Distinguish facts from hypotheses.
- Never fabricate a KPI.

Operationally, these rules imply source lineage, data freshness, uncertainty handling, and human approval for consequential external actions.

## 14. User journey and success loop — source-derived

**User journey:** Entry → connect channels → analyze → readiness → strategy → execution → monitor → optimize → review.

**Success loop:** Data → AI analysis → recommendation → execution → business result → new data → smarter AI → better recommendation.

The loop is a strategic hypothesis. The product must track recommendation acceptance and outcomes before claiming that use itself improves model quality.

## 15. Golden rule — source-derived

Every feature must answer: **“Will this help the manager make a better decision today?”** If not, it should not be built.

If only one capability remains, the frozen blueprint names it “AI Business Manager.”

## 16. Current implementation context — verified separately from Phase 0

The existing GitHub application is a sales management dashboard, including login, roles, leads, pipeline, team/KPI views, reports, and Excel/backup code. It is the current starting point, not the complete Phase 0 vision. The current public landing page is also sales-focused and should eventually be aligned to the platform-wide position after brand screening.

A static audit identified a checklist persistence concern, security-review items around the legacy `public.users` table and `is_crm_manager()`, and unverified browser/deployment tests. Details are in `TECHNICAL_AUDIT_2026-10-14.md`.

## 17. Brand status

- The original deck uses psmedia as a working name.
- The owner wants a different public brand name.
- A previous conversation recommended «فروش‌نگر» as a possible name, but it is too sales-specific for the full platform and has not been approved as final.
- Do not replace public branding, login branding or identifiers until a brand broad enough for the AI Business Manager vision is screened for name collisions, domain availability and trademark risk.
- Keep existing technical identifiers and Supabase auth identifiers unchanged unless a separate migration plan proves it necessary.

## 18. Implementation interpretation and constraints

The original Phase 0 is frozen. This document preserves its decisions and does not silently rewrite its scope. The owner's later vision includes stronger integration with social channels, advertising and controlled operational execution; those are to be reconciled through Phase 1 product definition rather than treated as already-approved implementation details.

Before feature work:
- Verify database backup/restore.
- Map auth, roles, RLS, Edge Functions and localStorage behavior.
- Test existing workflows in a safe environment.
- Make code changes on isolated branches and retain rollback commits.
- Never clear localStorage or modify production data during code-only work.
- Do not make destructive schema/security changes without dependency review and verified restore path.
