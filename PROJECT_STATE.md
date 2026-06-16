# FluentForge — PROJECT_STATE.md
_Single source of truth. Read this first every session. Never archive Active Constraints to cold._

---

## Identity
- **App:** FluentForge
- **Mission:** A gamified English learning app that helps non-native speakers improve through spaced-repetition vocabulary, grammar, listening, and American-style pronunciation.
- **GitHub:** https://github.com/Romlun/FluentForge
- **Local path (operator Mac):** /Users/romanlunickin/FluentForge
- **Director persona:** Forge
- **Chat title format:** `FluentForge · Forge · vX.Y · Phase`
- **Current chat title:** `FluentForge · Forge · v0.3 · UI Fixes & Relay Repair`

---

## Stack
- Next.js 16 App Router · React 19 · TypeScript strict · Tailwind · shadcn/ui · PWA-ready
- Supabase (Auth, Postgres, Storage, Realtime)
- Vercel (hosting + edge functions)
- GitHub (source control) · GitHub Actions (CI)
- pnpm
- Anthropic API (server-only, never exposed to client)
- **Code Agent:** Claude Code, run by the operator directly in their own terminal at the local repo path above. Director does not write or edit application source — read-only verification via Desktop Commander only (see Operator Preferences).

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
| GitHub Actions CI     | ⚠️ Configured but BROKEN — see Active Blocker / Hazards below  |
| word_list table        | ✅ 2,174 Britlex headwords imported (positions 1–2174)          |
| words content pipeline | 🔄 933 of 2,174 generated via seed-words Edge Fn; run reports done=true but didn't cover full list — needs investigation |
| Domain                | ❌ Not set                                                     |

---

## Migration Ledger
_Verified against live Supabase `list_migrations` (2026-06-16) — supersedes the prior hand-maintained version, which had a numbering gap and two entries (009, 010 below) that don't correspond to any tracked migration._

| # | Name | Applied | Notes |
|---|------|---------|-------|
| 001 | initial_schema | 2026-06-12 | profiles, words, user_word_progress + RLS + triggers |
| 002 | fix_function_security | 2026-06-12 | Hardened set_updated_at search_path |
| 003 | fix_handle_new_user_permissions | 2026-06-12 | Revoked handle_new_user from anon+authenticated |
| 004 | autowire_extensions_and_relay | 2026-06-12 | pg_net + pg_cron extensions; relay table with RLS (service-role only) |
| 005 | autowire_finalize_function | 2026-06-12 | relay_autowire_finalize() — PR verification logic |
| 006 | autowire_orchestrator | 2026-06-12 | relay_autowire_tick() — cron orchestrator; v_repo = Romlun/FluentForge |
| 007 | autowire_cron_and_lockdown | 2026-06-12 | Cron scheduled (every minute); revoked public execute on both functions |
| 008 | autowire_revoke_public_execute | 2026-06-12 | Explicit revoke from anon+authenticated+public — clears security advisors |
| 009 | add_words_unique_and_rank_index | 2026-06-13 | |
| 010 | relay_auto_merge_via_graphql | 2026-06-13 | Introduced relay_merge_when_ready() — auto-merges a relay's PR via GitHub GraphQL once verified, on a cron poll. Used for PRs #9, #10, #11. Merges with NO per-PR Director/operator clearance — see Hazards re: conflict with Auto-Merge Scope. |
| 011 | fix_relay_merge_status_and_queue_edge_fn_pr | 2026-06-13 | |
| 012 | seed_words_orchestrator | 2026-06-13 | seed_words_tick() + seed-words-orchestrator cron (*/3 min) driving the seed-words Edge Function |
| 013 | add_word_category_and_clear_words | 2026-06-13 | Added words.category / word_list.category; cleared prior words rows for re-seed |
| 014 | create_word_list_table | 2026-06-13 | word_list (position, word, source, category) — Britlex 2,174-entry import target |
| 015 | drop_word_list_word_unique | 2026-06-13 | Dropped UNIQUE on word_list.word — Britlex has legitimate duplicate headwords at different positions/senses |

**Untracked schema drift:** `words.translation` and `user_word_progress.step` / `next_review_at` exist live but match no migration above — applied via raw `execute_sql` DDL outside migration tracking at some point on 2026-06-13. Schema can't currently be fully rebuilt from this ledger alone. Low-urgency fix: a no-op `ADD COLUMN IF NOT EXISTS` migration to bring tracking back in sync.

---

## Phase Plan
- ✅ **Phase 1 — Vocabulary MVP:** SRS review session, word selection (add/known) with daily quota, flashcard UI, Russian translations, forgot password flow
- 🔄 **Phase 2 — Content pipeline & TTS:** word_list import done (2,174 Britlex headwords). Content generation at 933/2,174 — seed run completed (done=true) without covering the full list; needs investigation + re-trigger. TTS audio + images: not started. List expansion to ~5000 (positions 2175+): not started, low priority.
- ⚪ **Phase 3 — Game layer:** XP, streaks, levels, badges
- ⚪ **Phase 4 — Grammar + Listening:** Grammar rules + exercises, audio comprehension exercises

## In-Flight Work
- [x] Relay smoke test (verified end-to-end via PRs 3/4/5)
- [x] Flashcard browse + review UI
- [x] Word selection (add/known) + daily quota
- [x] SRS review session
- [x] Forgot password flow
- [x] Britlex word_list import (2,174 headwords)
- [ ] Investigate why seed-words run stopped at 933/2,174 despite done=true, then re-trigger to finish the list
- [ ] /api/next-due-word empty-state fix (return nextDueAt when no cards due) — dispatched twice via relay (d45d42f0, 36be27c3), never built — see Active Blocker
- [ ] UI redesign — sign-in/signup, dashboard, vocabulary card, review screen, global nav — full spec exists, nothing implemented; recommend splitting into 5 smaller patches once a build path exists
- [ ] TTS American audio + images per word
- [ ] List expansion to ~5000 words (positions 2175+) — low priority

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
- **SD-003:** Autowire relay system — CURRENTLY BROKEN, see Hazards. Architecture: Director
  dispatches via SQL insert into relay + net.http_post to GitHub repository_dispatch (event:
  cody-build). pg_cron ticks every minute, finds PR by relay UUID in body. Merging is automated
  via relay_merge_when_ready() (migration 010) — a cron-driven function that merges via GitHub
  GraphQL once its own verification passes, WITHOUT per-PR Director/operator clearance. This is
  how PRs #9, #10, #11 merged. NOTE: this conflicts with the conservative Auto-Merge Scope below
  (which excludes customer-facing UI + agent-relay code) — flagged as an unresolved governance
  question, not yet decided by operator. Workflow: .github/workflows/cody-build.yml. CLAUDE.md
  in repo root sets Cody's standing rules.
  **As of 2026-06-16:** operator is bypassing this system for now, working directly in the local
  repo clone via their own terminal/Claude Code session. Director reads/verifies via Desktop
  Commander only; does not write or edit application source. Relay dispatch is dormant, not
  removed — this architecture stands for whenever it's revived.
- **SD-004:** Cards are English→Russian. Front: English word + phonetic + part of speech. Back: Russian translation (primary, large) → English definition (secondary) → English example sentence (italics). Example sentences English-only, no Russian gloss.
- **SD-005:** SRS ladder — fixed steps 0-10 mapping to: 0=now, 1=1h, 2=2h, 3=4h, 4=8h, 5=1d, 6=2d, 7=4d, 8=8d, 9=16d, 10=30d. Got it = step+1 (max 10). Again = step-1 (min 1). next_review_at = now() + ladder minutes. Stored as timestamptz.
- **SD-006:** Word list source = Britlex 5000 list (britlex.ru). Only English headwords used (factual, not copyrightable) — confirmed live as `word_list.source='britlex_5000'`. All per-word content (translations, definitions, phonetics, examples, audio, images) generated by us via Anthropic API, never copied from Britlex or any competitor.

### Pre-Approved Bundles
_None yet._

### Auto-Merge Scope
Conservative default. Code Agent may auto-merge ONLY:
- README / docs-only changes
- Non-migration dependency bumps (patch/minor, green CI)

ALWAYS exclude from auto-merge: migrations, RLS policies, auth config, billing,
customer-facing UI, agent-relay code, env var changes.

### Hazards
- ~~gh_dispatch_token lacks pull_requests scope~~ — SUPERSEDED. PRs #9, #10, #11 merged successfully via relay_auto_merge_via_graphql (migration 010); scope is evidently fine now. Struck through rather than deleted in case it recurs.
- Supabase Site URL was localhost:3000, fixed to production URL in dashboard. Redirect URLs include both prod and localhost.
- **ACTIVE — cody-build workflow broken:** `claude-code-base-action@beta` fails ~10-20s into every run, exit 1, before any code is written. Root cause: the workflow's `claude_env` block sets `ANTHROPIC_MODEL`, but it arrives EMPTY in the actual run environment (confirmed in job logs) — suspected parsing bug in the action, possibly tied to the `claude_env` YAML block or the `@beta` version pin. NOT YET FIXED — `.github/workflows/cody-build.yml` itself has never actually been read; that's the concrete next step whenever this path is revived. Four relays stuck in `dispatched` with no PR: 3c70ad08, 50469ace (2026-06-13), d45d42f0, 36be27c3 (2026-06-14).
- **Auto-merge governance gap:** relay_merge_when_ready() (SD-003) auto-merges customer-facing PRs with no per-PR human gate, contradicting the stated Auto-Merge Scope. Unresolved — operator hasn't ruled on whether to tighten the function or revise the policy.
- **Untracked schema drift:** see Migration Ledger note — words.translation and user_word_progress.step/next_review_at exist live with no corresponding migration.
- Two dangling auto-merge cron jobs (auto-merge-d45d42f0, auto-merge-36be27c3) are harmless no-ops polling for PRs that won't appear until the workflow is fixed. Leave as-is or unschedule — operator's call, not urgent.

---

## Role / Auth Model
Supabase Auth, single role (no admin/staff tier yet). Signup, login, email confirmation, and a protected dashboard route are shipped. RLS on profiles/words/user_word_progress restricts each user to their own rows (service-role bypasses for seeding/relay). No further role differentiation planned until a feature needs it.

---

## Operator Preferences
- Often on phone — keep all directives atomic, one item per copyable block
- **As of 2026-06-16:** operator writes application code directly, in their own terminal, via Claude Code, against the local clone at the path above. Director's role narrowed to read-only verification via Desktop Commander — no write_file/edit_block on application source. Director may still update PROJECT_STATE.md directly when explicitly authorized (as in this update).
- Git operations (commit/push/merge): operator's local terminal now; historically Safari on mobile for PR merges. SSH auth (not HTTPS PAT — had scope issues).

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

**Session 3 — 2026-06-16:**
Imported Britlex word_list (2,174 headwords, migration 014; dropped over-constraining UNIQUE in 015 — legitimate duplicate headwords at different positions/senses). Stood up seed-words Edge Function + seed-words-orchestrator cron (migration 012) to generate translation/definition/phonetics/example per word via Anthropic API; run completed (done=true) but only reached 933/2,174 words — needs investigation. Attempted two Cody dispatches via relay (next-due-word empty-state fix, full UI redesign) — both failed: cody-build workflow dies in ~10-20s because ANTHROPIC_MODEL arrives empty in the run environment despite being set in claude_env (suspected claude-code-base-action@beta parsing bug). Root cause identified, not yet fixed — workflow file itself never read. Operator decided to bypass the relay entirely for now: cloned repo to laptop (~/FluentForge), fixed a stale Claude Code login (401 → /login), and will write code directly via local terminal. Director's role narrowed to read-only file verification via Desktop Commander. Read live PROJECT_STATE.md from the repo and found it stale (last updated end of Session 2): migration ledger didn't match live Supabase history at all, SD-006 mischaracterized the word list as non-Britlex corpus data, local path was wrong, Role/Auth Model was still TBD despite auth being shipped, and a real governance gap surfaced — relay_auto_merge_via_graphql auto-merges customer-facing PRs (#9-11) with no per-PR gate, contradicting the documented Auto-Merge Scope. Corrected all of the above; governance gap and cody-build fix both flagged as unresolved, deferred until relay work resumes. Next: operator works locally; Director verifies on request.
