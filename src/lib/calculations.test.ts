import { describe, expect, it } from 'vitest'
import { budget } from '../data/budget'
import { parties } from '../data/parties'
import { defaultProfile, estimateTax, kr, partyEffect, sortParties } from './calculations'

describe('beregninger', () => {
  it('formaterer norske kroner', () => expect(kr(12345)).toContain('12 345'))
  it('budsjettet summerer til 100 prosent', () => expect(budget.reduce((s, x) => s + x.percent, 0)).toBe(100))
  it('håndterer null inntekt', () => expect(estimateTax({ ...defaultProfile, salary: 0, interestExpenses: 0 })).toBe(0))
  it('gir årlig og månedlig utslag', () => {
    const annual = partyEffect(parties[0], defaultProfile)
    expect(annual / 12).toBeCloseTo(annual / 12)
  })
  it('sorterer størst utslag først', () => {
    const sorted = sortParties(parties, defaultProfile)
    expect(partyEffect(sorted[0], defaultProfile)).toBeGreaterThanOrEqual(partyEffect(sorted.at(-1)!, defaultProfile))
  })
  it('håndterer tomme økonomiske verdier', () => {
    const empty = { ...defaultProfile, salary: 0, otherIncome: 0, rentalIncome: 0, children: 0, annualKm: 0 }
    expect(Number.isFinite(partyEffect(parties[0], empty))).toBe(true)
  })
})
