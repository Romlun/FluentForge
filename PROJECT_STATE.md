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
- **Code Agent:** operator's coding agent of choice (Claude Code, Codex CLI, or otherwise), run by the operator directly in their own terminal at the local repo path above. Director directives are tool-agnostic from 2026-06-16 onward — same standards (CLAUDE.md branch-and-PR workflow, `pnpm build` before push) regardless of which agent implements them. Director does not write or edit application source — read-only verification via Desktop Commander only (see Operator Preferences).

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
- Frequency-based word list (currently 4,663 deduped words from the Britlex 5000 source)

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
| word_list table        | ✅ 4,663 Britlex headwords after operator-file dedupe (migration 029) |
| words content pipeline | ✅ COMPLETE — words fully populated: 4,663 rows, all six content fields (word, part_of_speech, translation, phonetic, definition, example_sentence), all operator-authored (original work, American English), zero Opus/API involvement. word_list and words both 4,663, fully aligned, every row has frequency_rank. audio_url still null everywhere (browser-TTS fallback live; Stage 2 real audio pending). |
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
| 016 | add_word_list_seed_attempts | 2026-06-16 | word_list.seed_attempts (default 0) — caps retries on permanently-failing words at 3 |
| 017 | add_seed_progress_remaining | 2026-06-16 | seed_progress.remaining — authoritative missing-word count, computed in SQL not trusted from the edge function |
| 018 | seed_words_tick_self_healing_rewrite + fix_seed_words_tick_http_timeout | 2026-06-16 | Rewrote orchestrator: queries actual missing words instead of walking a fixed offset; properly accumulates total_failed (previously dead); bumped net.http_post timeout_milliseconds from the 5000ms default to 60000ms — this was the actual root cause of the stall, not an edge function timeout as first suspected (see Session Notes) |
| 019 | add_random_distractor_translations_rpc + widen_distractor_translations_rpc_candidate_pool | 2026-06-17 | get_random_distractor_translations() — replaces the invalid order(random()) in getReviewOptions (patch 5 fixup). Returns 10 candidates so the app can dedupe client-side, not just 3. |
| 020 | add_get_missing_words_batch_rpc | 2026-06-17 | get_missing_words_batch() — moves the seed-words missing-word lookup into SQL. Direct REST .select().limit() on word_list/words silently caps at 1000 rows regardless of the limit requested (confirmed empirically) — see Hazards. The RPC has no such cap since it's not a REST table select. |
| 021 | add_temp_bulk_insert_word_list_rpc (created + dropped same session) | 2026-06-17 | One-off RPC used to bulk-load the 2826 new word_list rows (positions 2175-5000) directly from a local script's memory, avoiding piping that much data through Director's own context twice. Granted EXECUTE to anon temporarily, used once, then function dropped (grant revoked automatically with it). Net effect: no permanent schema change, just a faster one-time load mechanism — recorded here as a precedent for future bulk loads, see Operator Preferences. |
| 022 | enable_rls_word_list_and_seed_progress | 2026-06-17 | Enabled RLS on word_list and seed_progress, no policies — both are internal pipeline-only tables with no legitimate anon/authenticated access pattern. Fixed two ERROR-level Supabase advisor findings (RLS disabled in public) surfaced during a routine session-start audit. service_role + SECURITY DEFINER cron functions unaffected. |
| 029 | dedupe_word_list_to_one_row_per_word | 2026-06-18 | Operator confirmed their CSV intentionally merges multiple senses per word into one row. Collapsed word_list's 286 words that had multiple positions (~300 extra rows, originally meant for separate per-sense cards per the Product Vision) down to one row each, keeping the lowest position. word_list is now 4,663 rows (was 5,000), matching the operator's file exactly. No FK referenced word_list, so this was a clean delete. |
| 030 | add_temp_bulk_upsert_words_rpc + drop_temp_bulk_upsert_words_rpc | 2026-06-18 | One-off RPC (anon, dropped after use) — loaded operator's completed 4,663-row CSV straight into `words` via local script. Upsert on word, overwriting earlier Opus rows. |
| 031 | align_phrasal_verb_spellings_word_list_to_csv | 2026-06-18 | Renamed 19 British-shorthand phrasal-verb headwords in word_list to the operator's spelled-out CSV spellings (e.g. "set smb up with" → "set somebody up with"; "upwards" → "upward" per operator's explicit choice). Backfilled frequency_rank on the matching words rows. |
| 032 | delete_orphan_opus_phrasal_verb_rows | 2026-06-18 | Deleted 4 leftover Opus-seeded words rows (face with, put smb down, put smth down to, set smb up with) orphaned by migration 031's rename — each had a spelled-out twin already present, zero user_word_progress refs. Tables reconciled at 4,663 each. |

**Untracked schema drift:** `words.translation` and `user_word_progress.step` / `next_review_at` exist live but match no migration above — applied via raw `execute_sql` DDL outside migration tracking at some point on 2026-06-13. Schema can't currently be fully rebuilt from this ledger alone. Low-urgency fix: a no-op `ADD COLUMN IF NOT EXISTS` migration to bring tracking back in sync.

---

## Phase Plan
- ✅ **Phase 1 — Vocabulary MVP:** SRS review session, word selection (add/known) with daily quota, flashcard UI, Russian translations, forgot password flow
- 🔄 **Phase 2 — Content pipeline & TTS:** word_list import DONE — 4,663 Britlex headwords after operator-file dedupe (migration 029). Content COMPLETE 2026-06-18 — operator authored a full 4,663-word CSV (translation, American phonetic, definition, part of speech, example) loaded straight into `words`, overwriting the earlier 1,050 Opus-seeded rows for one consistent source. ANTHROPIC_API_KEY is no longer on the critical path for content. Remaining Phase 2: TTS audio (Stage 1 browser TTS shipped PR #22; Stage 2 pre-generated audio files into Storage/audio_url still pending) + images (not started).
- ⚪ **Phase 3 — Game layer:** XP, streaks, levels, badges
- ⚪ **Phase 4 — Grammar + Listening:** Grammar rules + exercises, audio comprehension exercises

## In-Flight Work
- [x] Relay smoke test (verified end-to-end via PRs 3/4/5)
- [x] Flashcard browse + review UI
- [x] Word selection (add/known) + daily quota
- [x] SRS review session
- [x] Forgot password flow
- [x] Britlex word_list import (2,174 headwords)
- [x] Diagnose + fix the seed-words stall — root cause was net.http_post's 5000ms default timeout, far too short for an Opus 4.8 call; fixed (60000ms) + rewrote orchestrator/edge fn to be self-healing instead of offset-based; running unattended again
- [x] /api/next-due-word empty-state fix — PR #12 merged to main 2026-06-16. Also fixed the tsconfig scripts/+supabase/ exclude bug (see Hazards), unblocking every deploy since PR #9.
- [x] UI redesign, against the GPT mockup (uploaded 2026-06-16, FluentForge branding per Precedents) — all 5 patches merged and live in production 2026-06-17:
  1. [x] Design system / shared primitives — PR #13 merged 2026-06-16
  2. [x] Sign-in / signup screens — PR #14 merged 2026-06-16. SSO buttons present but disabled (no OAuth configured); new PasswordInput component (show/hide toggle).
  3. [x] Dashboard — PR #15 merged 2026-06-16. Real data (profile, today's count, due count, recent words), 3-tab bottom nav (Home/Vocabulary/Review — Profile/My Words deferred, no routes yet). FLAGGED: profiles.streak_count exists but nothing increments it — card shows real zero, not faked; needs increment logic, likely Phase 3.
  4. [x] Vocabulary card (browse/add) + My Words + word detail screen — PR #16 merged 2026-06-16, built via Codex CLI (first non-Claude-Code patch — see Operator Preferences). Real audio button (plays words.audio_url when present, honestly disabled otherwise — TTS not built yet). "Difficult" = lapses >= 2 (DIFFICULT_LAPSE_THRESHOLD in actions.ts, adjustable). Bookmark icon visual-only, no bookmark concept exists. Word detail adds an unrequested-but-real SRS stats card (reviews/lapses/step) — good addition, no fabricated data.
  5. [x] Review screen — multiple-choice quiz interaction — PR #18 merged 2026-06-17, completing the full UI redesign. Built via Codex (interaction logic, progress tracking) with a real bug found and fixed before merge: getReviewOptions used the same order(random()) PostgREST mistake as the seed-words incident — see the recurring-gotcha Precedent. Fixed via new RPC (get_random_distractor_translations) + a one-line code swap, the latter applied directly by the Director at the operator's explicit one-off request (standing rule is otherwise unchanged — Director doesn't write app code). NOTE: the production deploy for this merge had an unexplained ~3min delay (GitHub showed zero status checks registered for the commit; no active Vercel incident on Build/Deploy/Git Integrations at the time) — resolved by the operator manually clicking Redeploy from the Vercel dashboard. Isolated incident, not investigated further.
- [x] Daily quota timezone fix + soft-cap (not hard-block) — PR #19 merged 2026-06-17. Local `pnpm build` passed. Fixes two bugs: getTodayAddedCount/dashboard both used UTC midnight instead of Pacific midnight (operator's real reset time); FlashCard.tsx hard-disabled "Add to learn" once daily_new_limit was hit instead of treating it as a goal.
- [x] Auth error logging — PR #17 merged 2026-06-17. Triggered by a real production incident: a person the operator shared the link with couldn't sign in ("information is wrong"). Investigation confirmed only the operator's own account exists in auth.users; signUp/redirect-URL mechanics were directly verified working via a manual test call. Root cause of THAT specific incident (their exact email) was never pinned down — yesterday's logs had already rotated out by the time of investigation. login/signup now log email + structured error (message/status/code) server-side, so next time this is debuggable from Vercel runtime logs instead of guesswork.
- [x] Browser TTS pronunciation (Stage 1 audio) — PR #22 merged 2026-06-18. src/lib/tts.ts (SSR-guarded, async voice caching via voiceschanged, en-US preference, overlap cancel), wired into word detail / flashcard / review audio buttons. audio_url plays first when present; speakAmerican() is the fallback, so Stage 2 pre-generated audio takes over automatically with no code change.
- [x] Vocabulary browse pagination — PR #24 merged 2026-06-18. Browse screen was capped at 1,000 words (the documented PostgREST 1,000-row cap on an unpaginated words.select(*)). Replaced with getVocabularyWordsPage(offset, limit) using .range() + count:'exact', page size 100, ordered by frequency_rank. Also added page-scoped getWordStatusesForWords(.in word_id) to pre-empt the same cap on the user-progress side once a user has 1,000+ saved words. All 4,663 words now browsable. Not yet real-device verified.
- [x] List expansion and operator override dedupe — DONE 2026-06-18. Initially expanded to 5000 positions
  from the real Britlex PDF (https://britlex.ru/5000_7000_English_words.pdf), not just the
  original 2174 the import script had gotten before. Needed a more robust extraction than the
  original script's line-anchored regex: flatten all whitespace first (pdf-parse's line-breaking
  for this doc is inconsistent between runs), allow `:`/`.` in the word match (plural notes like
  "leaf (pl: leaves)" otherwise break it), and reject any match whose position isn't strictly
  greater than the last accepted one (filters false positives from numbers embedded in the
  Russian glosses, e.g. "13-19" in an age range). Then operator confirmed their CSV intentionally
  merges multiple senses per word, so migration 029 collapsed duplicate word_list positions to one
  row per word. word_list now has 4,663 rows total, matching the operator's CSV exactly; all 4,663
  now have complete operator-authored content loaded directly into `words`. scripts/import-word-list.ts itself was NOT
  updated with the more robust PDF logic — it still has the original fragile regex if anyone re-runs
  it from scratch.

## Parked / Paused
- **Headroom token compression** (https://github.com/chopratejas/headroom) — compress
  tool outputs/file reads before they hit the LLM. 60-95% fewer tokens. Plug in at two
  points: (1) Cody's cody-build.yml Action to compress repo file reads; (2) Director side
  via Desktop Commander to compress large file reads. Low urgency while codebase is small;
  revisit when Cody starts hitting context pressure on multi-file tasks.

---

## Active Constraints

### Precedents
- **2026-06-16 — App branding stays FluentForge.** Operator commissioned a GPT-generated UI
  mockup that's branded "LexiLearn" throughout. Confirmed: that's placeholder naming from the
  design tool, not a rename signal. Treat the mockup as a visual/component reference only —
  ignore its app name, copy, and any other product-naming choices unless explicitly told otherwise.
- **RECURRING GOTCHA — never use `.order('random()')` on the Supabase JS query builder.**
  This has broken two separate features now: the original seed-words content pipeline stall,
  and patch 5 of the UI redesign (review quiz distractors). PostgREST's `order` parameter only
  accepts column names, not SQL expressions — `.order('random()')` throws a parse error on
  every call at runtime, and `pnpm build`'s typecheck has no way to catch it. For any "random
  row(s)" need: write a Postgres function (`ORDER BY random() LIMIT n` works fine in real SQL)
  and call it via `supabase.rpc(...)` instead. See `get_random_distractor_translations` (added
  2026-06-16) for the pattern.
- **RECURRING GOTCHA — PostgREST embedded left-join `.is('relation.column', null)` does not work as a "not exists" filter.** PostgREST returns an empty array `[]` for non-matching left joins, not `null`, so `.is('user_word_progress.word_id', null)` never fires. This caused the learn-queue filter (PR #26) to silently include all words regardless of user progress — fixed in PR #27 by fetching the user's existing word_id list first and applying `.not('id', 'in', (...))` instead. Pattern to follow for any "exclude rows where a related row exists" query: fetch the related IDs separately, then exclude with `.not()`. Do not rely on embedded join null-checks.
- **2026-06-16 — Review session uses active-recall multiple-choice, not flip-card.** The
  GPT mockup showed a multiple-choice translation quiz (4 options, 3-way outcome: I forgot /
  Need practice / I remember) instead of the originally-shipped flip-card + binary Again/Got it.
  Operator chose to adopt the new interaction. This is a real behavior change, not just a
  restyle — needs distractor generation for wrong answers and a 3-way-outcome mapping onto the
  SD-005 step ladder. See In-Flight Work for the build plan.
- **2026-06-18 — Word-list content overrides collapse selected multiple senses.** word_list no
  longer preserves multiple senses as separate positions for words the operator's file treats as
  one entry. The Product Vision line ("words with multiple meanings split into separate cards") no
  longer applies to those 286 words specifically; it still applies to anything seeded purely via
  Opus.

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
- **SD-006:** Word list source = Britlex 5000 list (britlex.ru). Only English headwords used (factual, not copyrightable) — confirmed live as `word_list.source='britlex_5000'`. Current per-word text content (translations, definitions, phonetics, examples, part of speech) is operator-authored original American-English work loaded from the completed 4,663-row CSV, never copied from Britlex or any competitor. Audio/images remain separate future assets.

### Pre-Approved Bundles
_None yet._

### Auto-Merge Scope
Conservative default. Code Agent may auto-merge ONLY:
- README / docs-only changes
- Non-migration dependency bumps (patch/minor, green CI)

ALWAYS exclude from auto-merge: migrations, RLS policies, auth config, billing,
customer-facing UI, agent-relay code, env var changes.

### Hazards
- **NEW — stale AGENTS.md conflicts with current PR workflow:** Codex CLI generated `/AGENTS.md` (untracked, not committed) on 2026-06-16 — but its content is just the old relay-era CLAUDE.md verbatim: it instructs the agent to run `gh pr create` itself and include a `relay-directive: <uuid>` line. That's wrong now — Director opens and merges every PR (Operator Preferences). Codex correctly ignored it and stopped after pushing this time, but the file is sitting there and could mislead a future agent (Codex or Claude Code) into trying to open its own PR. Needs fixing or deleting — not done yet, flagged for next session/patch.
- ~~gh_dispatch_token lacks pull_requests scope~~ — SUPERSEDED. PRs #9, #10, #11 merged successfully via relay_auto_merge_via_graphql (migration 010); scope is evidently fine now. Struck through rather than deleted in case it recurs.
- Supabase Site URL was localhost:3000, fixed to production URL in dashboard. Redirect URLs include both prod and localhost.
- **ACTIVE — cody-build workflow broken:** `claude-code-base-action@beta` fails ~10-20s into every run, exit 1, before any code is written. Root cause: the workflow's `claude_env` block sets `ANTHROPIC_MODEL`, but it arrives EMPTY in the actual run environment (confirmed in job logs) — suspected parsing bug in the action, possibly tied to the `claude_env` YAML block or the `@beta` version pin. NOT YET FIXED — `.github/workflows/cody-build.yml` itself has never actually been read; that's the concrete next step whenever this path is revived. **Manually disabled by operator 2026-06-16** (verified via GitHub API: `state: disabled_manually`) — re-enable from the Actions tab once the bug is fixed and the relay path is wanted again.
- **CLOSED 2026-06-16 — old relay dispatches:** the four orphaned relays (3c70ad08, 50469ace, d45d42f0, 36be27c3) updated to `status='rejected'` — none ever produced a PR. All four `auto-merge-<id>` cron jobs unscheduled, and the master `relay-autowire-tick` orchestrator (every-minute poll) unscheduled too, since the whole relay system is dormant with the workflow disabled. To revive later: re-enable the workflow, re-schedule `relay-autowire-tick` (`SELECT cron.schedule('relay-autowire-tick', '* * * * *', $$SELECT relay_autowire_tick()$$)`), and insert fresh relay rows for any new dispatch.
- **Auto-merge governance gap:** relay_merge_when_ready() (SD-003) auto-merges customer-facing PRs with no per-PR human gate, contradicting the stated Auto-Merge Scope. Unresolved — operator hasn't ruled on whether to tighten the function or revise the policy. (Moot while the relay system is dormant; revisit if/when revived.)
- **Untracked schema drift:** see Migration Ledger note — words.translation and user_word_progress.step/next_review_at exist live with no corresponding migration.
- ~~**ACTIVE — seed-words edge function ANTHROPIC_API_KEY is invalid.** Confirmed via direct error capture: `401 invalid x-api-key`. Previously blocked the remaining 19 normal Opus generations (phrasing mismatches from the operator CSV, not true word-list gaps). RESOLVED/MOOT 2026-06-18: all 4,663 rows now have operator-authored content loaded directly into `words`; no generation is needed and ANTHROPIC_API_KEY is no longer on the critical path for content. Keep struck through in case the generation path is revived later.~~
- ~~**ACTIVE — 903 word_list rows stuck at the 3-attempt seed_attempts retry cap.** RESOLVED/MOOT 2026-06-18: the Opus seed pipeline was bypassed entirely by the completed operator-authored CSV load into `words`; no retry-cap reset is needed unless generation is deliberately revived later.~~
- **RECURRING GOTCHA — direct REST `.select().limit(N)` on word_list/words silently caps at 1000 rows**, regardless of how large N is, confirmed empirically (requested 6000, got exactly 1000). This is a Supabase/PostgREST behavior, not anything in this project's code — `current_setting('pgrst.db_max_rows', true)` reports null (no override configured), yet the cap applies anyway. This broke the seed-words missing-word lookup once the table grew past 1000 rows (it would silently see only the first 1000 positions and think nothing was missing). Fixed by moving that lookup into a SQL function (migration 020) instead of a REST table select — RPC results aren't subject to this cap. Surfaced AGAIN 2026-06-18 in the vocabulary browse screen (showed only 1,000 of 4,663 words). Same root cause, fixed via .range() pagination (PR #24). Lesson holds: any .select() expecting >1,000 rows silently truncates — paginate with .range() or use an RPC.
- ~~Production build broken since PR #9~~ — RESOLVED 2026-06-16 via PR #12. tsconfig's broad `**/*.ts` include was pulling scripts/ (pdf-parse, no types) and supabase/ (Deno esm.sh imports tsc can't resolve) into the app's strict typecheck. Excluded both. Production confirmed READY on commit 750c11f. Three days of silent failures — PRs #9, #10, #11, and a docs-only commit all failed to deploy with nothing alerting on it; Vercel just kept serving stale Phase-1 code. Worth actively checking deploy state after merges rather than assuming a merge shipped.

---

## Role / Auth Model
Supabase Auth, single role (no admin/staff tier yet). Signup, login, email confirmation, and a protected dashboard route are shipped. RLS on profiles/words/user_word_progress restricts each user to their own rows (service-role bypasses for seeding/relay). No further role differentiation planned until a feature needs it.

---

## Operator Preferences
- Often on phone — keep all directives atomic, one item per copyable block
- **As of 2026-06-16:** operator writes application code directly, in their own terminal, via Claude Code, against the local clone at the path above. Director's role narrowed to read-only verification via Desktop Commander — no write_file/edit_block on application source. Director may still update PROJECT_STATE.md directly when explicitly authorized (as in this update).
- Git operations (commit/push): operator's local terminal. **PR open/merge (as of 2026-06-16): operator does not want to interact with GitHub.com at all** — Director handles all PR creation and merging via the GitHub API (same gh_dispatch_token/GraphQL mechanism proven on PRs #9-12), verifying build status (Vercel) and reviewing the diff before each merge. Operator's only loop now: paste Director's directive into local Claude Code, run it, report back. No more compare links or manual merge clicks for the operator.
- **As of 2026-06-17: minimize Director token usage on bulk/data work.** Director's role is SQL
  migrations/RPC functions, edge function deployment, PR review/merge, build verification, and
  diagnosis — things that genuinely need Supabase/GitHub MCP access. Anything involving parsing,
  scripting, bulk data transformation, or moving large amounts of text/data should go to the
  operator's coding agent running a local script, NOT Director typing it through chat. Triggered
  by the word_list expansion/dedupe task, where Director manually transcribed ~2800 SQL rows through
  its own context (twice — once reading, once writing) before realizing a one-off RPC + a local
  script calling it directly was far cheaper. Default to that pattern for any future bulk load.
- **PR reporting format (2026-06-17):** after `pnpm build` passes locally and the branch is pushed,
  Code Agent reports branch+commit, explicit local build result, the diff (or
  `git diff main...HEAD --stat` if large), and relevant caveats (warnings, unrelated unstaged
  files) directly in its report back to the operator. Director reviews from that report instead
  of re-fetching the diff via GitHub API for routine cases. PR creation/merge remain with Director
  via the GitHub API for now — gh CLI isn't installed locally; full delegation to the Code Agent is
  deferred pending a deliberate decision on the one-time github.com auth setup that would require.

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
Imported Britlex word_list (2,174 headwords, migration 014; dropped over-constraining UNIQUE in 015 — legitimate duplicate headwords at different positions/senses). Stood up seed-words Edge Function + seed-words-orchestrator cron (migration 012) to generate translation/definition/phonetics/example per word via Anthropic API; run completed (done=true) but only reached 933/2,174 words — needs investigation. Attempted two Cody dispatches via relay (next-due-word empty-state fix, full UI redesign) — both failed: cody-build workflow dies in ~10-20s because ANTHROPIC_MODEL arrives empty in the run environment despite being set in claude_env (suspected claude-code-base-action@beta parsing bug). Root cause identified, not yet fixed — workflow file itself never read. Operator decided to bypass the relay entirely for now: cloned repo to laptop (~/FluentForge), fixed a stale Claude Code login (401 → /login), and will write code directly via local terminal. Director's role narrowed to read-only file verification via Desktop Commander. Read live PROJECT_STATE.md from the repo and found it stale (last updated end of Session 2): migration ledger didn't match live Supabase history at all, SD-006 mischaracterized the word list as non-Britlex corpus data, local path was wrong, Role/Auth Model was still TBD despite auth being shipped, and a real governance gap surfaced — relay_auto_merge_via_graphql auto-merges customer-facing PRs (#9-11) with no per-PR gate, contradicting the documented Auto-Merge Scope. Corrected all of the above; governance gap and cody-build fix both flagged as unresolved, deferred until relay work resumes. Closed out the old relay system entirely: 4 orphaned relay rows → `rejected`, all 4 auto-merge cron jobs + the master `relay-autowire-tick` orchestrator unscheduled (`cron.job` now empty). Then diagnosed and fixed the seed-words stall (migrations 016-018): true root cause was `net.http_post`'s 5000ms default timeout — far shorter than an Opus 4.8 generation call — silently dropping every chunk while the edge function kept completing in the background and persisting whatever it finished before the caller gave up (explains the 933 real rows despite zero recorded successes). First attempted fix (rewriting to a self-healing "missing words" query) had its own bug — an overfetch-by-position window that happened to land entirely on already-seeded rows; fixed by fetching the full small candidate set instead of windowing. Bumped the http timeout to 60000ms, redeployed edge function v4, smoke-tested manually (confirmed 200/processed:20), reset and restarted the cron pipeline — running unattended again, 973/2,174 at restart, ~1,082 remaining. Next: operator continues building features locally; Director verifies on request and monitors the pipeline.

**Session 4 — 2026-06-17:**
Routine session-start audit by a fresh Director instance. Verified migration ledger against live Supabase — exact match, no drift. Opened and merged PR #19 (daily-quota Pacific-midnight fix + soft cap) after reviewing the diff and confirming green Vercel build. Found and fixed two ERROR-level RLS gaps (word_list, seed_progress) via migration 022. Corrected stale content-pipeline numbers in Phase Plan/Infra State; later operator-file override/dedupe work brought word_list to 4,663 rows total, then the completed operator-authored CSV load brought `words` to the same 4,663-row complete-content state.

**Session 4 — 2026-06-17 (cont'd):**
Routine session-start audit by a fresh Director instance, no drift in migration ledger. Opened/merged PR #19 (daily-quota Pacific-midnight fix) after diff review + green Vercel build. Fixed two ERROR-level RLS gaps (word_list, seed_progress) via migration 022. Corrected stale Phase 2 content-pipeline numbers. Reworked the PR reporting workflow to cut Director's redundant GitHub/Vercel API calls — Code Agent now reports diff + build status directly; gh CLI install (for full PR delegation) deferred, not yet decided.

**Session 4 cont'd — 2026-06-18:**
Content pipeline completed WITHOUT the API. Operator authored a full 4,663-word CSV (all six fields, original American-English work) after establishing Britlex's content couldn't be reused. Loaded straight into `words` via one-off RPC (migration 030), overwriting the 1,050 earlier Opus rows for one consistent source. Reconciled a 19-word phrasal-verb spelling mismatch between word_list (British shorthand) and the CSV (spelled out) — renamed word_list to match (031), backfilled frequency_rank, deleted 4 orphaned Opus duplicates (032). Both tables now 4,663, aligned, zero null fields, advisors clean. ANTHROPIC_API_KEY no longer on the critical path. Browser TTS shipped (PR #22). Remaining: Stage 2 audio generation + images.

Late session: user reported the live site showed only 1,000 words — diagnosed as the known PostgREST 1,000-row cap hitting the unpaginated vocabulary browse query (data was fully intact, 4,663 in DB). Fixed via page-backed browse (PR #24, .range() pagination, page size 100) plus page-scoped status loading to pre-empt the same cap user-side. Browser TTS (PR #22) also shipped earlier this session. Open loose ends carried forward: stale AGENTS.md still not deleted; Stage 2 pre-generated audio + word images not started; PR #24 not yet real-device verified.
