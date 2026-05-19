import { describe, it, expect } from 'vitest'
import { parseChainage } from '@/lib/parseChainage'

describe('parseChainage', () => {
  it('returns 0 for empty string', () => expect(parseChainage('')).toBe(0))
  it('parses 1+250', () => expect(parseChainage('1+250')).toBe(1250))
  it('parses 10+500', () => expect(parseChainage('10+500')).toBe(10500))
  it('parses 0+000', () => expect(parseChainage('0+000')).toBe(0))
  it('parses 2+050', () => expect(parseChainage('2+050')).toBe(2050))
  it('strips spaces in "1 + 250"', () => expect(parseChainage('1 + 250')).toBe(1250))
  it('parses plain number', () => expect(parseChainage('1250')).toBe(1250))
  it('returns 0 for non-numeric', () => expect(parseChainage('abc')).toBe(0))

  it('normalization: start > end swaps correctly', () => {
    const s = parseChainage('5+000')
    const e = parseChainage('3+000')
    expect(Math.min(s, e)).toBe(3000)
    expect(Math.max(s, e)).toBe(5000)
  })

  describe('overlap detection logic (mirrors submit route)', () => {
    function overlaps(s1: string, e1: string, s2: string, e2: string): boolean {
      const ns1 = Math.min(parseChainage(s1), parseChainage(e1))
      const ne1 = Math.max(parseChainage(s1), parseChainage(e1))
      const ns2 = Math.min(parseChainage(s2), parseChainage(e2))
      const ne2 = Math.max(parseChainage(s2), parseChainage(e2))
      // matches Supabase query: .lt('start_chainage_val', normEnd) .gt('end_chainage_val', normStart)
      return ns2 < ne1 && ne2 > ns1
    }

    it('detects clear overlap', () => expect(overlaps('1+000','3+000','2+000','4+000')).toBe(true))
    it('no overlap for separate ranges', () => expect(overlaps('1+000','2+000','3+000','4+000')).toBe(false))
    it('adjacent ranges do NOT overlap', () => expect(overlaps('1+000','2+000','2+000','3+000')).toBe(false))
    it('contained range overlaps', () => expect(overlaps('1+000','5+000','2+000','3+000')).toBe(true))
    it('reversed input normalizes', () => expect(overlaps('3+000','1+000','2+000','4+000')).toBe(true))
  })
})
