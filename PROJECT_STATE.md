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
- **Current chat title:** `FluentForge · Forge · v0.2 · Vocabulary`

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
| 009 | add_word_translation | 2026-06-13 | Added words.translation (Russian) column |
| 010 | srs_schema_redesign | 2026-06-13 | user_word_progress: replaced due_date/interval_days/ease_factor with step + next_review_at; status CHECK (learning/known); review-queue index; profiles.daily_new_limit default 10 |

---

## Phase Plan
- ✅ **Phase 1 — Vocabulary MVP:** SRS review session, word selection (add/known) with daily quota, flashcard UI, Russian translations, forgot password flow
- 🔄 **Phase 2 — Content pipeline & TTS:** Full ~5000 word dataset (Russian translations, English definitions, example sentences via Anthropic API), American audio + images per word
- ⚪ **Phase 3 — Game layer:** XP, streaks, levels, badges
- ⚪ **Phase 4 — Grammar + Listening:** Grammar rules + exercises, audio comprehension exercises

## In-Flight Work
- [x] Relay smoke test (verified end-to-end via PRs 3/4/5)
- [x] Flashcard browse + review UI
- [x] Word selection (add/known) + daily quota
- [x] SRS review session
- [x] Forgot password flow
- [ ] Phase 2 — Content pipeline: generate full ~5000 word dataset (Russian translation + English definition + example sentence per word) via Anthropic API
- [ ] Phase 2 — TTS American audio + images per word

## Parked / Paused
- **Headroom token compression** (https://github.com/chopratejas/headroom) — compress
  tool outputs/file reads before they hit the LLM. 60-95% fewer tokens. Plug in at two
  points: (1) Cody's cody-build.yml Action to compress repo file reads; (2) Director side
  via Desktop Commander to compress large file reads. Low urgency while codebase is small;
  revisit when Cody starts hitting context pressure on multi-file tasks.

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
- **SD-004:** Cards are English→Russian. Front: English word + phonetic + part of speech. Back: Russian translation (primary, large) → English definition (secondary) → English example sentence (italics). Example sentences English-only, no Russian gloss.
- **SD-005:** SRS ladder — fixed steps 0-10 mapping to: 0=now, 1=1h, 2=2h, 3=4h, 4=8h, 5=1d, 6=2d, 7=4d, 8=8d, 9=16d, 10=30d. Got it = step+1 (max 10). Again = step-1 (min 1). next_review_at = now() + ladder minutes. Stored as timestamptz.
- **SD-006:** Word list = top ~5000 frequency words (public corpus data, NOT copied from Britlex). All per-word content (definitions, sentences, translations, audio, images) generated by us, never copied from any competitor.

### Pre-Approved Bundles
_None yet._

### Auto-Merge Scope
Conservative default. Code Agent may auto-merge ONLY:
- README / docs-only changes
- Non-migration dependency bumps (patch/minor, green CI)

ALWAYS exclude from auto-merge: migrations, RLS policies, auth config, billing,
customer-facing UI, agent-relay code, env var changes.

### Hazards
- gh_dispatch_token lacks pull_requests scope: gh pr create fails silently in workflow, and Director cannot open/merge PRs via API. Operator must open + merge each PR manually until token scope is fixed.
- Supabase Site URL was localhost:3000, fixed to production URL in dashboard. Redirect URLs include both prod and localhost.

---

## Role / Auth Model
_TBD — defined when Supabase Auth is first configured._

---

## Operator Preferences
- Often on phone — keep all directives atomic, one item per copyable block
- Director coordinates all Cody work directly; operator speaks only to Director (no separate relay blocks)
- Operator opens PRs via GitHub compare link + Create pull request, then merges in Safari
- PENDING: gh_dispatch_token needs pull_requests:write scope so Director can open PRs and merge via API (deferred to next session)

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

**Session 2 — 2026-06-13:**
Phase 1 shipped. Diagnosed relay never created PRs (Cody committed to main; workflow lacked branch+PR enforcement and prompt field mismatch). Fixed workflow via direct Contents API write + corrected task field. Shipped: Russian translations (SD-004), forgot password, word selection with daily quota, full SRS review session (SD-005), mobile layout fix, navigation. Migrations 009 (translation) + 010 (SRS redesign) applied directly via MCP. 10 seed words live with Russian. Britlex confirmed as word-list reference only — content generated by us (SD-006). Phase 1 complete. Next: PAT scope fix, then Phase 2 content pipeline (~5000 words).
