// FluentForge — Anthropic model constants (SD-002)
// Sonnet 4.6: default for all real-time/interactive features
// Opus 4.8: offline/batch work only (word bank generation, content seeding)

/**
 * Anthropic model constants for FluentForge.
 * 
 * @property {string} DEFAULT - Claude Sonnet 4.6 for real-time and interactive features requiring low latency
 * @property {string} BATCH - Claude Opus 4.8 for offline and batch processing tasks (word bank generation, content seeding)
 */
export const MODELS = {
  DEFAULT: "claude-sonnet-4-6",
  BATCH: "claude-opus-4-8",
} as const

export type ModelKey = keyof typeof MODELS
