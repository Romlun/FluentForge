let cachedVoices: SpeechSynthesisVoice[] = []
let voicesInitialized = false

function getSpeechSynthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined' || !window.speechSynthesis) return null
  return window.speechSynthesis
}

function refreshVoices(): SpeechSynthesisVoice[] {
  const speechSynthesis = getSpeechSynthesis()
  if (!speechSynthesis) return []

  const voices = speechSynthesis.getVoices()
  if (voices.length > 0) {
    cachedVoices = voices
  }

  return cachedVoices
}

function initializeVoices() {
  if (voicesInitialized) return
  voicesInitialized = true

  const speechSynthesis = getSpeechSynthesis()
  if (!speechSynthesis) return

  refreshVoices()
  speechSynthesis.addEventListener('voiceschanged', refreshVoices)
}

export function isBrowserTtsAvailable(): boolean {
  const speechSynthesis = getSpeechSynthesis()
  if (!speechSynthesis) return false

  initializeVoices()
  return true
}

export function speakAmerican(text: string) {
  const speechSynthesis = getSpeechSynthesis()
  const trimmedText = text.trim()

  if (!speechSynthesis || !trimmedText) return

  initializeVoices()

  const utterance = new SpeechSynthesisUtterance(trimmedText)
  const voices = refreshVoices()
  const preferredVoice =
    voices.find((voice) => voice.lang.toLowerCase() === 'en-us') ??
    voices.find((voice) => voice.lang.toLowerCase().startsWith('en'))

  utterance.lang = 'en-US'
  utterance.rate = 0.9
  utterance.pitch = 1
  if (preferredVoice) {
    utterance.voice = preferredVoice
  }

  speechSynthesis.cancel()
  speechSynthesis.speak(utterance)
}

initializeVoices()
