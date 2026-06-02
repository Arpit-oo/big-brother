export const LEET_MAP: Record<string, string[]> = {
  a: ['4', '@', 'á', 'à', 'â', 'ä', 'ã', 'å', 'α', 'а'],
  b: ['8', '6', 'ß', 'β', 'б'],
  c: ['(', '{', '[', '<', '¢', 'ç', 'с'],
  d: ['|)', 'đ'],
  e: ['3', '€', 'è', 'é', 'ê', 'ë', 'е'],
  f: ['ph'],
  g: ['9', '6'],
  h: ['#'],
  i: ['1', '!', '|', 'í', 'ì', 'î', 'ï', 'і'],
  k: ['|<'],
  l: ['1', '|', 'ł'],
  m: ['nn'],
  n: ['ñ', 'η'],
  o: ['0', 'ø', 'ö', 'ó', 'ò', 'ô', 'õ', 'о', 'θ'],
  p: ['|*', 'р'],
  r: ['®', 'я'],
  s: ['5', '$', '§', 'ś', 'š'],
  t: ['7', '+', '†'],
  u: ['µ', 'ü', 'ú', 'ù', 'û', 'υ'],
  v: ['\\/', 'ν'],
  w: ['\\/\\/', 'ω', 'ш'],
  x: ['×', '%', 'х'],
  y: ['¥', 'у'],
  z: ['2', 'ž', 'ź'],
}

export function normalizeText(text: string): string {
  let normalized = text.toLowerCase()

  // Sort variants by length descending so multi-char variants match first
  const sortedEntries = Object.entries(LEET_MAP).map(
    ([letter, variants]) =>
      [letter, [...variants].sort((a, b) => b.length - a.length)] as const
  )

  for (const [letter, variants] of sortedEntries) {
    for (const variant of variants) {
      normalized = normalized.replaceAll(variant.toLowerCase(), letter)
    }
  }

  // Strip separators (hyphens, dots, underscores, spaces)
  normalized = normalized.replace(/[_\-.\s]+/g, '')
  // Collapse repeated chars (3+ → 2)
  normalized = normalized.replace(/(.)\1{2,}/g, '$1$1')

  return normalized
}
