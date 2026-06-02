import { describe, it, expect } from 'vitest'
import { normalizeText } from '../electron/services/leetspeak-map'
import { matchText, MatchResult } from '../electron/services/matcher'
import type { Keyword } from '../electron/services/keyword-service'

function makeKeyword(
  term: string,
  mode: Keyword['match_mode'] = 'smart'
): Keyword {
  return {
    id: 'test-1',
    term,
    category: 'test',
    match_mode: mode,
    action_type: 'close_tab',
    action_config: {},
    bypass_mode: 'soft',
    bypass_cooldown_seconds: 30,
    enabled: true,
  }
}

describe('normalizeText', () => {
  it('normalizes basic leetspeak', () => {
    expect(normalizeText('p0rn')).toBe('porn')
    expect(normalizeText('p0rnhub')).toBe('pornhub')
    expect(normalizeText('pr0n')).toBe('pron')
  })

  it('normalizes unicode substitutions', () => {
    expect(normalizeText('pörn')).toBe('porn')
    expect(normalizeText('gàmbling')).toBe('gambling')
    expect(normalizeText('çasino')).toBe('casino')
  })

  it('strips separators', () => {
    expect(normalizeText('p-o-r-n')).toBe('porn')
    expect(normalizeText('p.o.r.n')).toBe('porn')
    expect(normalizeText('p_o_r_n')).toBe('porn')
    expect(normalizeText('p o r n')).toBe('porn')
  })

  it('collapses repeated characters', () => {
    expect(normalizeText('poooorn')).toBe('poorn')
    expect(normalizeText('seeex')).toBe('seex')
  })

  it('handles mixed evasion techniques', () => {
    expect(normalizeText('p.0.r.n')).toBe('porn')
    expect(normalizeText('g@mbl1ng')).toBe('gambling')
  })
})

describe('matchText', () => {
  it('exact mode matches only exact text', () => {
    const kw = makeKeyword('pornhub', 'exact')
    expect(matchText('pornhub', [kw])).toBeTruthy()
    expect(matchText('PORNHUB', [kw])).toBeTruthy()
    expect(matchText('pornhub.com', [kw])).toBeNull()
  })

  it('contains mode matches substrings', () => {
    const kw = makeKeyword('casino', 'contains')
    expect(matchText('online-casino.com', [kw])).toBeTruthy()
    expect(matchText('CASINO ROYALE', [kw])).toBeTruthy()
    expect(matchText('cas1no', [kw])).toBeNull() // no leet in contains mode
  })

  it('smart mode catches leetspeak', () => {
    const kw = makeKeyword('porn', 'smart')
    expect(matchText('p0rn', [kw])).toBeTruthy()
    expect(matchText('p-o-r-n', [kw])).toBeTruthy()
    expect(matchText('pörn', [kw])).toBeTruthy()
  })

  it('smart mode catches URL evasion', () => {
    const kw = makeKeyword('pornhub', 'smart')
    expect(matchText('p0rnhub.com', [kw])).toBeTruthy()
    expect(matchText('porn-hub.com', [kw])).toBeTruthy()
    expect(matchText('p.o.r.n.h.u.b', [kw])).toBeTruthy()
  })

  it('regex mode works', () => {
    const kw = makeKeyword('p[o0]rn|xxx', 'regex')
    expect(matchText('p0rn site', [kw])).toBeTruthy()
    expect(matchText('xxx video', [kw])).toBeTruthy()
    expect(matchText('clean page', [kw])).toBeNull()
  })

  it('skips disabled keywords', () => {
    const kw = makeKeyword('porn', 'smart')
    kw.enabled = false
    expect(matchText('porn', [kw])).toBeNull()
  })

  it('returns first match from multiple keywords', () => {
    const kw1 = makeKeyword('gambling', 'smart')
    kw1.id = 'kw1'
    const kw2 = makeKeyword('casino', 'smart')
    kw2.id = 'kw2'
    const result = matchText('online casino gambling', [kw1, kw2])
    expect(result).toBeTruthy()
    expect(result!.keyword.id).toBe('kw1')
  })
})
