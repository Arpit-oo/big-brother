import { normalizeText } from './leetspeak-map'
import type { Keyword } from './keyword-service'

export interface MatchResult {
  keyword: Keyword
  matchedText: string
  confidence: number
}

export function matchText(
  text: string,
  keywords: Keyword[]
): MatchResult | null {
  const enabledKeywords = keywords.filter((k) => k.enabled)
  for (const keyword of enabledKeywords) {
    const result = matchSingle(text, keyword)
    if (result) return result
  }
  return null
}

function matchSingle(text: string, keyword: Keyword): MatchResult | null {
  const term = keyword.term.toLowerCase()

  switch (keyword.match_mode) {
    case 'exact':
      if (text.toLowerCase() === term) {
        return { keyword, matchedText: text, confidence: 1.0 }
      }
      break
    case 'contains':
      if (text.toLowerCase().includes(term)) {
        return { keyword, matchedText: text, confidence: 0.9 }
      }
      break
    case 'smart':
      return smartMatch(text, keyword)
    case 'regex':
      try {
        const regex = new RegExp(keyword.term, 'i')
        if (regex.test(text)) {
          return { keyword, matchedText: text, confidence: 0.95 }
        }
      } catch {
        // Invalid regex pattern — skip
      }
      break
  }
  return null
}

function smartMatch(text: string, keyword: Keyword): MatchResult | null {
  const term = keyword.term.toLowerCase()
  const lowerText = text.toLowerCase()

  // Direct substring match
  if (lowerText.includes(term)) {
    return { keyword, matchedText: text, confidence: 1.0 }
  }

  // Leetspeak/unicode normalized match
  const normalizedText = normalizeText(text)
  const normalizedTerm = normalizeText(term)
  if (normalizedText.includes(normalizedTerm)) {
    return { keyword, matchedText: text, confidence: 0.85 }
  }

  // Separator-stripped match
  const textNoSpaces = lowerText.replace(/[\s\-_.]+/g, '')
  if (textNoSpaces.includes(term.replace(/[\s\-_.]+/g, ''))) {
    return { keyword, matchedText: text, confidence: 0.8 }
  }

  return null
}
