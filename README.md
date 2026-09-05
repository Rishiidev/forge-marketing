# Forge Marketing — Rebuild

This repository is the componentized rebuild of the Forge marketing website.
The `main` branch holds the untouched baseline of the existing static site
(see the baseline commit). All new work happens on `rebuild` and other
feature branches.

> The original product README (run instructions, the capacity-cap mechanism,
> the "honest line" content principle) is preserved as-is at
> [docs/legacy-readme.md](docs/legacy-readme.md). Nothing from it has been
> changed or removed.

## Status

Rebuild in progress. The public marketing site's architecture (Next.js
App Router, TypeScript, Tailwind, MDX content, CRM/analytics
abstractions), design system (`/design-system`, internal), the
homepage, and the showcase system (`/showcases`, `/showcases/[slug]`)
are built and sourced from real data — see `docs/decisions.md`
ADR-001/ADR-005/ADR-007/ADR-008. `/audit`, `/websites`, and
`/maintenance` are also real and complete (sourced from the legacy
codebase), though maintenance pricing itself is one of two conflicting
numbers pending a business decision (Human Decision #3). `/tools` and
`/blog` remain genuinely empty — no real tool or blog post has been
written yet, not a copy-pass gap. The customer application
(`app.forge.bruuhh.com`) has not been started.

No CRM/analytics provider is configured in this environment — lead
submissions currently only log to the console. See
[`docs/session-handoff.md`](docs/session-handoff.md) for the full
current-state handoff, including the most launch-blocking open item
(Human Decision #13, the contact channel).

## Docs

- [docs/forge-business-rules.md](docs/forge-business-rules.md) — pricing, offers, funnel rules
- [docs/architecture.md](docs/architecture.md) — target architecture for the rebuild
- [docs/conversion-architecture.md](docs/conversion-architecture.md) — funnel design, objection handling, CRM lifecycle, analytics taxonomy
- [docs/decisions.md](docs/decisions.md) — architecture decision log
- [docs/session-handoff.md](docs/session-handoff.md) — start here after a break: what changed, what's unresolved, next action
- [docs/session-state.md](docs/session-state.md) — detailed current-state reference (architecture, business rules, file inventory)

## Local development

```bash
npm install
npm run dev       # http://localhost:3000
npm run typecheck
npm run lint
npm run build
```

Requires Node 18.18+. No environment variables are required to run
locally — `lib/crm.ts` and `lib/analytics.ts` both default to
console-only providers when unconfigured. To point lead capture at a
real webhook, set `CRM_PROVIDER=webhook` and `CRM_WEBHOOK_URL=...`.

The legacy static site (`python3 -m http.server` from its own directory)
still works unmodified from [legacy/](legacy/), for reference.

## Branches

- `main` — baseline + reviewed rebuild work
- `rebuild` — active rebuild work, branched from the baseline commit
