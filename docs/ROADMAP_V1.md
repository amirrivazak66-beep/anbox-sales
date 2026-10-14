# Product Roadmap v1 — proposed sequence

This roadmap follows the supplied Master Blueprint Phase 0 and the owner's clarified vision of a platform broader than sales. Future capabilities below are not claims that those capabilities already exist.

## Phase 0 — Protect and understand the current product
- [ ] Code backup and rollback commit documented.
- [ ] Database backup/restore path verified.
- [ ] Schema, RLS, policies, Edge Functions, localStorage keys and data flows mapped.
- [ ] Live deployment version confirmed.
- [ ] Core end-to-end test matrix run and results recorded.

**Exit criteria:** known risks documented, restore path verified, and critical flows tested.

## Phase 1 — Stabilize the current application
1. Validate authentication and role boundaries.
2. Verify lead ownership, manager assignment and CRUD policies.
3. Test KPI math and date boundaries.
4. Verify/fix checklist persistence after confirming intended behavior.
5. Test reports, pipeline, Excel import/export and JSON backup/restore.
6. Resolve security findings through isolated changes with rollback plans.

**Exit criteria:** no known critical data-loss/security issue and key flows pass acceptance tests.

## Phase 2 — Product definition and UX foundation
- Confirm ideal customer profile and first-release user jobs.
- Define shared concepts: workspace/business, members/roles, channels, campaigns, leads, tasks, metrics, decisions and recommendations.
- Define navigation, module boundaries, permission matrix and user flows.
- Define audit log, data freshness, error states and permissions.
- Establish a brand-independent design system.

**Exit criteria:** reviewed product requirements, data dictionary, permission matrix, user flows and UX prototype.

## Phase 3 — Decision intelligence MVP
- Unified management summary based only on available, validated data.
- Daily/weekly brief with source references and freshness labels.
- Prioritized recommendations with rationale and confidence.
- Actions/tasks with owner, due date, approval and result.
- Recommendation outcome tracking.

**Exit criteria:** pilot users confirm decisions are more useful/faster and can trace metrics to a source.

## Phase 4 — Marketing and advertising intelligence
Start with one or two high-value, accessible data sources selected after customer discovery.
- Connectors/imports with explicit permissions.
- Campaign/channel performance and cost tracking.
- CPL/CPA/ROI only where data supports valid attribution.
- Content/social performance summaries.
- Cross-channel reporting and alerts.

**Exit criteria:** connector reliability, freshness and metric definitions documented; no unsupported ROI claims.

## Phase 5 — Controlled agents and automation
- Begin with drafting and analysis.
- Require human approval for public publishing, budget changes and sensitive actions.
- Add least-privilege tool access, run logs, retries, rollback and spend limits.
- Monitor successful execution and business outcomes.

**Exit criteria:** each agent has a narrow purpose, permissions, audit trail, failure mode and measurable success metric.

## Phase 6 — Scale and commercial model
- Validate subscription tiers with customers.
- Consider agency/multi-workspace support only after permission isolation is proven.
- Consider anonymized benchmarks only with appropriate consent, governance and sample quality.
- Add APIs/partner distribution where value is proven.

## Brand workstream — parallel, not a blocker
- Define brand attributes and naming criteria.
- Generate distinctive, non-descriptive names.
- Screen pronunciation, competing marks, domains and relevant trademark registers.
- Choose only after preliminary screening; obtain professional legal review before registration.
- Keep internal repository identifiers until a migration plan is approved.

## Working rules
- Never change production data during a code-only audit.
- No destructive database change without verified backup, dependency mapping and explicit approval.
- Do not clear localStorage or overwrite the dashboard backup.
- Develop each feature in a branch, review, test and release only after acceptance.
- Test dashboard, leads, team, pipeline, reports and settings after relevant changes.
- Record commit SHA and verify the actual deployed site after release.

## Current blockers / unknowns
- Browser-based end-to-end tests have not yet been completed.
- Database backup/restore was not verified.
- Edge Function source and secret handling need deeper review.
- Initial release scope and first marketing connectors require product validation.