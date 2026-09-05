# Forge Marketing — Decision Log

> **PLACEHOLDER DOCUMENT.** Architecture Decision Records (ADRs) for the
> rebuild go here, one per decision, in the format below. No decisions
> have been recorded yet beyond repository setup.

## Format

```
## ADR-NNN: <title>
Date: YYYY-MM-DD
Status: proposed | accepted | superseded

Context:
Decision:
Consequences:
```

## Log

### ADR-000: Establish baseline repository

Date: `[PLACEHOLDER — fill in actual date]`
Status: accepted

Context: The existing Forge marketing site lived only in the original
`Rishiidev/forge` repository, mixed with unrelated history. A clean,
reversible baseline was needed before any rebuild work started.

Decision: Created a new repository (`forge-marketing`) with a single
baseline commit containing the untouched existing site, followed by a
docs-scaffold commit. All rebuild work happens on the `rebuild` branch.

Consequences: The baseline commit is the reference point for "what the
site looked like before the rebuild." Nothing in it should be treated as
a design or business decision — see `docs/forge-business-rules.md` for
open questions the baseline surfaced (conflicting pricing, placeholder
contact info, etc.).
