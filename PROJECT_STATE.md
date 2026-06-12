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

| Resource              | Status                                                          |
|-----------------------|-----------------------------------------------------------------|
| GitHub repo           | ✅ https://github.com/Romlun/FluentForge                       |
| Next.js scaffold      | ✅ v16.2.9 + React 19 + TS strict + shadcn/ui (commit 9cf2177) |
| Supabase project      | ✅ fluentforge · ref: qbmwruehpcwebtawgejt · us-west-1         |
| Vercel project        | ✅ fluent-forge · prj_OFdZ54pA8jRLCt8uiScwK7PbYE9L            |
| Vercel production URL | ✅ https://fluent-forge-black.vercel.app                       |
| Vercel linked in repo | ✅ .vercel/project.json committed (commit b08dc94)             |
| Env vars — Vercel     | ✅ NEXT_PUBLIC_SUPABASE_URL + ANON_KEY (all envs)              |
|                       | ✅ SUPABASE_SERVICE_ROLE_KEY + ANTHROPIC_API_KEY (prod+preview)|
| Env vars — local      | ✅ .env.local on operator Mac (all 4 vars filled)              |
| GitHub Actions CI     | ❌ Not configured                                              |
| Domain                | ❌ Not set                                                     |

---

## Migration Ledger
| # | Name | Applied | Notes |
|---|------|---------|-------|
| 001 | initial_schema | 2026-06-12 | profiles, words, user_word_progress + RLS + triggers |
| 002 | fix_function_security | 2026-06-12 | Hardened set_updated_at search_path; revoked handle_new_user from anon+authenticated |
| 004 | autowire_extensions_and_relay | 2026-06-12 | pg_net + pg_cron extensions; relay table with RLS (service-role only) |
| 005 | autowire_finalize_function | 2026-06-12 | relay_autowire_finalize() — PR verification logic |
| 006 | autowire_orchestrator | 2026-06-12 | relay_autowire_tick() — cron orchestrator; v_repo = Romlun/FluentForge |
| 007 | autowire_cron_and_lockdown | 2026-06-12 | Cron scheduled (every minute); revoked public execute on both functions |
| 008 | autowire_revoke_public_execute | 2026-06-12 | Explicit revoke from anon+authenticated+public — clears security advisors |

---

## In-Flight Work
- [x] Scaffold Next.js project (commit 9cf2177)
- [x] Create Supabase project (ref: qbmwruehpcwebtawgejt)
- [x] Create Vercel project + link to GitHub (commit b08dc94)
- [x] Wire env vars (Vercel + local .env.local)
- [x] Install + configure Supabase client in src/lib/supabase/ (commit 568edf9)
- [x] Define initial data model + first migration (migrations 001–003, 2026-06-12)
- [x] Auth — signup, login, email confirmation, protected dashboard (commit b8bb27e)
- [ ] GitHub Actions CI (lint + type-check) — deferred, not blocking
- [ ] Autowire relay: CLAUDE.md + cody-build.yml workflow + branch ruleset + PATs in Vault (Part A in progress)

## Parked / Paused
_None._

---

## Active Constraints

### Precedents
_None banked yet._

### Standing Decisions
- **SD-001:** UI language is English-only. i18n deferred until core is solid.
- **SD-002:** Anthropic model selection — Sonnet 4.6 by default for all real-time/interactive
  AI features (grammar explanations, exercise generation, pronunciation feedback, evaluating
  user responses). Opus 4.8 only for offline/batch work where quality is critical and latency
  doesn't matter: generating the word bank, writing example sentences, seeding content.
  Model constants live in src/lib/ai/models.ts — never hardcode model strings inline.
- **SD-003:** Autowire relay system active. Director dispatches Claude Code via SQL insert
  into relay + net.http_post to GitHub repository_dispatch (event: cody-build). pg_cron ticks
  every minute, finds PR by relay UUID in body, writes verified/rejected verdict. Director NEVER
  merges — operator merges via Safari only. Vault secrets: gh_read_token (Contents+PR+Actions:Read),
  gh_dispatch_token (Contents:Write). Workflow: .github/workflows/cody-build.yml.
  CLAUDE.md in repo root sets Cody's standing rules.

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
Desktop Commander. Next.js 16 + React 19 + shadcn/ui scaffolded (commit 9cf2177).
Product vision defined: Britlex-inspired spaced-rep vocab with American pronunciation,
+ grammar/listening/pronunciation modules + game layer. Supabase project created
(qbmwruehpcwebtawgejt, us-west-1). Vercel project created + linked (commit b08dc94),
production URL: https://fluent-forge-black.vercel.app. All env vars wired.
Next: Supabase client setup, GitHub Actions CI, data model + first migration.
