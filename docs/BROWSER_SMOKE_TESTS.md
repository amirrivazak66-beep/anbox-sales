# Browser Smoke Checks — Mock-only

The Playwright smoke test starts a local static server and mocks the Supabase client in the browser. It never uses production credentials or sends requests to the production Supabase API.

It covers:
- Landing page brand, interactive carousel and mobile navigation.
- Login validation and a synthetic manager session.
- Rendering/navigation for dashboard, leads, team, pipeline, reports and settings.
- Checklist save/reload persistence using isolated browser localStorage.

It does not validate:
- Real authentication, real RLS policy enforcement or production database data.
- Actual Excel parsing/round-trip.
- Production GitHub Pages deployment.
- A verified database restore point.

The external Supabase JS CDN is fulfilled by a local mock; other external network requests are blocked. The test's fake credentials and profile are disposable fixtures only.
