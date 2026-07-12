import { describe, expect, it } from 'vitest'
import { currentBudget, getBudgetScenario } from '../data/budget'
import { parties } from '../data/parties'
import { defaultProfile, estimateTax, kr, partyEffect, sortParties } from './calculations'

describe('beregninger', () => {
  it('formaterer norske kroner', () => expect(kr(12345)).toContain('12 345'))
  it('dagens budsjett summerer til 100 prosent', () => expect(currentBudget.reduce((s, x) => s + x.percent, 0)).toBe(100))
  it('alle partienes demobudsjett summerer til 100 prosent', () => {
    for (const party of parties) expect(getBudgetScenario(party.id).reduce((s, x) => s + x.percent, 0)).toBe(100)
  })
  it('håndterer null inntekt', () => expect(estimateTax({ ...defaultProfile, salary: 0, interestExpenses: 0 })).toBe(0))
  it('bruker pensjonsinntekt for pensjonistprofil', () => {
    const tax = estimateTax({ ...defaultProfile, incomeType: 'pensioner', salary: 900000, pensionIncome: 400000, interestExpenses: 0 })
    expect(tax).toBe(100000)
  })
  it('gir årlig og månedlig utslag', () => {
    const annual = partyEffect(parties[0], defaultProfile)
    expect(annual / 12).toBeCloseTo(annual / 12)
  })
  it('sorterer størst utslag først', () => {
    const sorted = sortParties(parties, defaultProfile)
    expect(partyEffect(sorted[0], defaultProfile)).toBeGreaterThanOrEqual(partyEffect(sorted.at(-1)!, defaultProfile))
  })
  it('summerer barn i alle aldersgrupper i familietiltak', () => {
    const ap = parties.find(p => p.id === 'ap')!
    const noChildren = partyEffect(ap, defaultProfile)
    const threeChildren = partyEffect(ap, { ...defaultProfile, childrenUnder6: 1, children6to12: 1, children13to17: 1 })
    expect(threeChildren - noChildren).toBe(2550)
  })
  it('håndterer tomme økonomiske verdier', () => {
    const empty = { ...defaultProfile, salary: 0, pensionIncome: 0, otherIncome: 0, rentalIncome: 0, childrenUnder6: 0, children6to12: 0, children13to17: 0, annualKm: 0 }
    expect(Number.isFinite(partyEffect(parties[0], empty))).toBe(true)
  })
})
