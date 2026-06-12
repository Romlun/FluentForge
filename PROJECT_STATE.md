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
- Next.js 16 App Router · React 19 · TypeScript strict · Tailwind · shadcn/ui · PWA-ready
- Supabase (Auth, Postgres, Storage, Realtime)
- Vercel (hosting + edge functions)
- GitHub (source control) · GitHub Actions (CI)
- pnpm
- Anthropic API (server-only, never exposed to client)
- **Code Agent:** Claude Code on operator's local machine

---

## Product Vision

### Core Modules
1. **Vocabulary** — spaced-repetition flashcards (primary module)
2. **Grammar** — rule explanations + exercises
3. **Listening** — audio comprehension exercises
4. **Pronunciation** — American English, active speaking practice

### Vocabulary Card Design (inspired by Britlex)
Each card contains: word · image · example sentence in context · American audio
- Browse mode (flip through) separate from Review mode (spaced repetition)
- Self-rated recall: user picks interval after seeing answer (Again / 1d / 3d / 7d / 14d)
- Words with multiple meanings split into separate cards
- Phrasal verbs included in word list
- Frequency-based word list (top ~5000 most common American English words)

### Differentiators vs Britlex (main competitor reference)
- American pronunciation (Britlex = British — our clearest differentiator)
- Game layer: XP, streaks, levels, badges
- Grammar + listening modules (Britlex is vocabulary only)
- Active pronunciation practice (Britlex is passive listening only)
- Mobile-first modern UI

### UI Language
- English only (i18n deferred)

### Reference Apps
- https://britlex.ru — vocabulary + spaced rep logic (good), British accent (not for us)
- https://encards.ru — Britlex's newer version, check for UX ideas

---

## Infra State

| Resource         | Status                                        |
|------------------|-----------------------------------------------|
| GitHub repo      | ✅ https://github.com/Romlun/FluentForge      |
| Next.js scaffold | ✅ v16.2.9 + React 19 + TS strict + shadcn/ui |
| Supabase project | ❌ Not created                                |
| Vercel project   | ❌ Not created                                |
| Domain           | ❌ Not set                                    |
| GitHub Actions   | ❌ Not configured                             |

---

## Migration Ledger
_No migrations applied yet._

---

## In-Flight Work
- [x] Scaffold Next.js project (commit 9cf2177)
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
- **SD-001:** UI language is English-only. i18n deferred until core is solid.

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

---

## Session Notes

**Session 1 — 2026-06-12:**
New app. Named FluentForge (gamified American English learning). Repo created
at https://github.com/Romlun/FluentForge. PROJECT_STATE.md bootstrapped via
Desktop Commander. Next.js 16 + React 19 + shadcn/ui scaffolded by Code Agent
(commit 9cf2177). Product vision defined: spaced-rep vocab (Britlex-inspired
logic, American pronunciation), + grammar/listening/pronunciation modules +
game layer. Next: Supabase project, Vercel project, GitHub Actions CI, data model.
