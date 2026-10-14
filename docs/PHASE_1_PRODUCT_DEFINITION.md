# Phase 1 — Product Definition (working specification)

**Status:** Working specification derived from the frozen Phase 0 blueprint and the current implementation audit. It does not override the Phase 0 source.  
**Date:** 2026-10-14

## 1. Product decision

Build toward an **AI Business Manager**: management intelligence that helps a business leader decide what to do next, why, and how to measure the outcome. Do not optimize for feature count or build a general-purpose CRM.

The current sales dashboard is treated as an existing operational module and a source of real implementation lessons. Stabilizing it is a prerequisite, not the definition of the full product.

## 2. Initial customer and market

Primary v1 customer from Phase 0:
- CEO of a growing Iranian SMB with 10–100 employees.
- Phase 0 revenue assumption: 500 million to 5 billion toman/month.
- Phase 0 willingness-to-pay assumption: 5–15 million toman/month.
- Fast decision-maker who needs to understand outcomes across business channels.

Secondary v1.5 customer: a 2–15-person marketing agency using a contemplated white-label model.

Out of scope for v1 per frozen Phase 0: enterprise businesses above 500 employees, non-Iran markets, government entities and pre-revenue businesses.

These are product hypotheses from the owner's blueprint, not verified market research. Validate them through interviews and paid-pilot evidence.

## 3. Core user job

“Every day, help me understand what is happening in my business, identify the highest-impact next action, explain why it matters, and help me verify whether the action worked.”

## 4. MVP outcome and North Star

**North Star:** Weekly Active Decisions — number of decisions a customer executes based on platform recommendations each week.

Phase 0 targets:
- Month 6: 5 decisions/customer/week.
- Month 12: 12 decisions/customer/week.
- Year 2: 20 decisions/customer/week.

Do not report this metric until a decision event has a stable definition. Proposed event lifecycle:
1. Recommendation created with source and rationale.
2. Recommendation shown to a named user.
3. User accepts, rejects, or defers it.
4. If accepted, an action is assigned with owner and due date.
5. Execution status and outcome are recorded.
6. Outcome is reviewed and linked back to the recommendation.

A recommendation is not counted as an executed decision merely because it was viewed or accepted.

## 5. Candidate v1 capabilities

### P0 — Trust and data foundation
- Secure workspace/user identity and role boundaries.
- Explicit, revocable data-source connection permissions.
- Data source registry with last-sync time, scope and error state.
- Audit trail for sensitive actions.
- Customer data export and documented deletion/retention policy.
- Clear separation between observed facts, calculations, assumptions and AI recommendations.

### P0 — Daily Intelligence Brief
- Summarize important changes from connected, validated data.
- Identify anomalies and opportunities without inventing missing metrics.
- State what changed, why it may matter, the recommended next action, supporting evidence and confidence.
- Show data freshness and a clear “insufficient data” state.

### P0 — Business Advisor / recommendation lifecycle
- Recommendation list ranked by potential impact and urgency.
- Rationale and source links for each recommendation.
- Accept / reject / defer, with reason optionally captured.
- Assign owner, due date and status.
- Record result and review whether the recommendation worked.

### P0 — Monitoring and executive reporting
- Track a small, defined set of business metrics.
- Alert on meaningful changes, thresholds or stale data.
- Produce concise executive reports and weekly review.
- No ROI, attribution or forecast claims unless the available data supports the calculation.

### Later candidates, not automatic v1 commitments
- Content Intelligence.
- Strategy Engine.
- AI Memory across sessions.
- Automation Engine with approval and audit controls.
- Performance Dashboard beyond the initial set of metrics.
- Agency white-label mode (Phase 0 v1.5).
- Shared Success fees (v1.5), agency revenue share (v2), benchmark Data API (v3).

The nine daily services in Phase 0 are the target service model; not all must be implemented in the first release.

## 6. Explicit non-goals

Per frozen Phase 0:
- Do not build a full CRM as the core product.
- Do not build a graphic design tool.
- Do not build a publishing scheduler.
- Do not replace the customer's sales team or CEO.
- Do not build a generic chatbot with a new interface.
- Do not build a feature unless it improves a customer KPI and helps the manager make a better decision.

Connect to specialist tools where feasible rather than rebuilding them without validated demand.

## 7. Data and integration requirements

For every source connector, document:
- Provider and data scope requested.
- OAuth/token storage method and least-privilege permissions.
- Consent and revocation behavior.
- Data schema, source timestamp, ingestion timestamp and freshness window.
- Rate limits, pagination, retry strategy and partial-failure handling.
- Metric definitions and attribution limitations.
- Export, deletion and retention behavior.
- Test fixtures and a safe way to test without production records.

Start with only one or two sources selected after customer interviews and technical access review. Do not assume that social networks or ad platforms expose all required data through their APIs.

## 8. AI output contract

Every recommendation or AI-generated brief must:
- Explain the rationale.
- Include a confidence score or an explicit uncertainty label.
- State when data is insufficient or stale.
- Separate verified facts from hypotheses and predictions.
- Never fabricate a KPI, source, event or attribution result.
- Identify evidence used and the time window.
- Suggest an action and success measure.
- Require human confirmation before public publishing, budget changes, destructive operations or other consequential external actions.

## 9. UX and performance acceptance

From Phase 0:
- A page should be understandable in under three minutes.
- Simplicity beats more features.
- AI proposes; a human decides.
- Security by design, API-first, modular architecture, explainability, observability, automation before manual work, customer data ownership, scalability and performance are non-negotiable.
- Page load target: under 2 seconds.
- AI call target: under 10 seconds.

Define the test environment and measurement method before treating these as release gates.

## 10. Commercial model — hypothesis only

- T1 subscription (Starter/Growth/Scale): 3M–20M toman/month, target 60% mix.
- T2 shared-success performance fee: contemplated for v1.5, target 25% mix.
- T3 agency revenue share: contemplated for v2, 30% revenue share and 10% mix.
- T4 benchmark Data API: contemplated for v3, target 5% mix.

These are blueprint assumptions, not approved prices or validated unit economics. Test willingness to pay, costs, support load, gross margin, CAC and retention before implementation locks pricing.

## 11. Current dashboard stabilization workstream

The existing dashboard has login, profiles/roles, lead CRUD, pipeline, team, KPI, reports, Excel/CSV and local backup/restore code. It does not yet implement the full product described above.

Before further product features:
1. Verify database backup and restoration capability.
2. Test auth and role boundaries.
3. Verify checklist toggle/save/reload behavior in a dedicated test browser; the Save handler now persists to the existing per-user key.
4. Test lead ownership and CRUD permissions.
5. Validate KPI math, report access and Excel round-trip.
6. Inspect public login abuse controls and legacy user-table dependencies.
7. Verify the actual GitHub Pages deployment.

The automated static smoke test and the two existing static CRM/Supabase workflows passed on the checklist-fix branch. They are not end-to-end tests.

## 12. Definition of done for each MVP feature

- User job and decision improved are documented.
- Data source and permissions are known.
- UI has loading, empty, stale-data and error states.
- Metric calculation and time window are testable.
- Role checks are enforced server-side, not only hidden in the UI.
- AI output cites evidence and uncertainty.
- Consequential actions have confirmation, audit trail and safe failure behavior.
- Acceptance tests pass in staging.
- Export/rollback and operational monitoring are defined.
- The feature has a measurable customer KPI and does not contradict the Phase 0 golden rule.

## 13. Immediate next backlog

1. Complete safe static checks and inspect CI failures.
2. Verify a database restore point without changing production data.
3. Test current app in a dedicated test browser/account.
4. Verify the checklist save/reload behavior in a dedicated test browser.
5. Review the public login bridge for rate limiting and abuse protection.
6. Review public.users dependencies and the is_crm_manager() grants; prepare, but do not yet apply, a least-privilege plan.
7. Decide the first one or two integrations only after access feasibility and customer value are established.
8. Screen the future brand independently of the sales module before changing login/public branding.
