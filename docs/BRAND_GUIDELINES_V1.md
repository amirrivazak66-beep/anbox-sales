# ManagerNegar (مدیرنگر) — Brand Guidelines v1

**Status:** Provisional working identity, implemented in the public landing page and dashboard chrome on 2026-10-14.  
**Legal status:** Not cleared. Exact-name search returned no results in the limited web search performed, which is not proof of trademark, company-name or domain availability. Do not claim registration or exclusivity.

## 1. Brand name

- Persian wordmark: **مدیرنگر**
- Working Latin transliteration: **ModirNegar** / **ManagerNegar**
- Product descriptor: **هوش مدیریتی کسب‌وکار**
- Login subtitle: **دستیار هوشمند مدیر کسب‌وکار**
- Core product category: AI Business Manager / management intelligence.
- Initial implemented module: sales team management.

The name is deliberately broader than «فروش‌نگر» because the Phase 0 vision is management intelligence across business decisions, not only sales. This is a strategic working choice, not a final legal naming opinion.

## 2. Positioning

**Promise:** Turn scattered business data into better decisions, executable actions and measurable outcomes.

The current public website must accurately describe the live feature set. Until integrations and AI recommendations are implemented and tested, marketing copy must not imply that cross-channel intelligence or autonomous agents are already active. Describe sales management as the first module.

## 3. Logo concept

The current mark is a hand-coded inline SVG so it remains crisp at small and large sizes:
- Four rising bars represent business performance and progression.
- A connected rising line represents analysis and direction.
- A mint-green endpoint represents the next action / opportunity.
- Rounded blue container provides a stable app icon silhouette.

This is the first UI implementation of the logo, not a final trademark-ready vector asset. Before public launch, review it at 16px, 24px, 32px, 64px and monochrome sizes; prepare light/dark and print variants; and test visual similarity to competitors.

## 4. Current color tokens

- Primary blue: #2563EB (dashboard) / #1769FF (landing-page accents)
- Deep navy: #071329 (landing-page background)
- White: #FFFFFF
- Mint accent: #34D399
- Secondary text: #94A3B8 (dashboard) / #61708A (landing page)

The two blue values are currently close but not fully unified. Consolidate to one primary blue only after reviewing contrast and UI screenshots; avoid a large redesign in the same change as the name migration.

## 5. Usage rules

- Use «مدیرنگر» as the wordmark, with the descriptor below when space permits.
- Keep the logo mark proportions and clear space; do not stretch it.
- Use the mark with sufficient contrast against dark or white backgrounds.
- Avoid adding the old AnBox icon/wordmark to login, sidebar, dashboard title or public landing header.
- Preserve legacy database fields, backup-format identifiers and authentication addresses until a separate migration is justified. Internal identifiers are not public brand assets and changing them can break compatibility.

## 6. Name clearance checklist

Before treating the brand as final:
- [ ] Search exact and phonetic variants in Iranian trademark databases and relevant classes.
- [ ] Check company-name collisions and social handles.
- [ ] Check .ir and relevant international domains directly with registrars.
- [ ] Review similar names in SaaS, AI, analytics, consulting and business-management categories.
- [ ] Obtain legal review before registration or large-scale public marketing.
- [ ] Decide the canonical Latin spelling (ModirNegar vs ManagerNegar) and secure matching handles.
- [ ] Test name comprehension and pronunciation with target SMB owners.

## 7. Technical migration boundary

Implemented in visible UI:
- Document title.
- Login title and logo.
- Sidebar wordmark and mark.
- Dashboard header.
- Public landing header/footer and title.
- Backup download filename.
- Generic visible label «تناسب با محصول».

Intentionally preserved:
- Supabase project ID and URL.
- Auth Edge Function names and auth email suffix used by existing accounts.
- Database field key anbox_fit.
- Legacy Excel header import alias «تناسب با آن باکس».
- Backup data format identifier anbox-crm-backup so existing backups remain importable.
- Existing user records and localStorage keys.

## 8. Known public-site placeholders

The contact form currently prepares a mailto message and does not save to a server. Official email/phone/address, blog articles and product demo video are placeholders. Replace these only after the owner supplies verified contact details and final content; do not invent them.
