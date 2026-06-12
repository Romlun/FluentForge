# FluentForge — PROJECT_STATE.md
_Single source of truth. Read this first every session. Never archive Active Constraints to cold._

---

## Identity
- **App:** FluentForge
- **Mission:** A gamified English learning app that helps non-native speakers improve through spaced-repetition vocabulary, grammar, listening, and American-style pronunciation.
- **GitHub:** https://github.com/Romlun/FluentForge
- **Local path (operator Mac):** /Users/romanlunickin/Developer/FluentForge
- **Director persona:** Forge
- **Chat title format:** `FluentForge · Forge · vX.Y · Phase`
- **Current chat title:** `FluentForge · Forge · v0.1 · Scaffold`

---

## Stack
- Next.js App Router · TypeScript strict · Tailwind · shadcn/ui · PWA-ready
- Supabase (Auth, Postgres, Storage, Realtime)
- Vercel (hosting + edge functions)
- GitHub (source control) · GitHub Actions (CI)
- pnpm
- Anthropic API (server-only, never exposed to client)
- **Code Agent:** Claude Code on operator's local machine

---

## Infra State

| Resource         | Status                                      |
|------------------|---------------------------------------------|
| GitHub repo      | ✅ https://github.com/Romlun/FluentForge    |
| Supabase project | ❌ Not created                              |
| Vercel project   | ❌ Not created                              |
| Domain           | ❌ Not set                                  |
| GitHub Actions   | ❌ Not configured                           |

---

## Migration Ledger
_No migrations applied yet._

---

## In-Flight Work
- [ ] Scaffold Next.js project into repo (pnpm, TS strict, Tailwind, shadcn/ui)
- [ ] Create Supabase project + configure Auth
- [ ] Create Vercel project + link to GitHub repo
- [ ] Set up GitHub Actions CI (lint + type-check)
- [ ] Define initial data model (users, words, decks, progress, sessions)

## Parked / Paused
_None._

---

## Active Constraints

### Precedents
_None banked yet._

### Standing Decisions
_None yet._

### Pre-Approved Bundles
_None yet._

### Auto-Merge Scope
Conservative default. Code Agent may auto-merge ONLY:
- README / docs-only changes
- Non-migration dependency bumps (patch/minor, green CI)

ALWAYS exclude from auto-merge: migrations, RLS policies, auth config, billing,
customer-facing UI, agent-relay code, env var changes.

### Hazards
_None identified yet._

---

## Role / Auth Model
_TBD — defined when Supabase Auth is first configured._

---

## Operator Preferences
- Often on phone — keep all directives atomic, one item per copyable block
- (Additional preferences added as they emerge)

---

## Session Notes
**Session 1 — 2026-06-12:**
Brand-new app. Named FluentForge (gamified English learning). Repo created
at https://github.com/Romlun/FluentForge, cloned to
/Users/romanlunickin/Developer/FluentForge. PROJECT_STATE.md bootstrapped
directly via Desktop Commander (Claude Code not yet authenticated at time of
first commit). Stack confirmed as default. Claude Code /login needed before
Code Agent work begins. Next session: scaffold Next.js app, create Supabase
project, create Vercel project.
