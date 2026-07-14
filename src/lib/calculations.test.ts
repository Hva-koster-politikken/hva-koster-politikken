import { describe, expect, it } from 'vitest'
import { currentBudget, getBudgetScenario } from '../data/budget'
import { parties } from '../data/parties'
import {
  calculatePartyResult,
  calculateTax,
  defaultProfile,
  kr,
  numberWithSpaces,
  sortPartyResults,
} from './calculations'

describe('2026-beregninger', () => {
  it('formaterer beløp med mellomrom', () => {
    expect(numberWithSpaces(100000)).toBe('100 000')
    expect(kr(12345)).toBe('12 345 kr')
  })

  it('dagens foreløpige budsjettgrupper summerer til 100 prosent', () => {
    expect(currentBudget.reduce((sum, item) => sum + item.percent, 0)).toBe(100)
  })

  it('viser ikke oppdiktede partibudsjetter', () => {
    expect(getBudgetScenario('frp')).toBeNull()
    expect(getBudgetScenario('current')).toEqual(currentBudget)
  })

  it('håndterer null inntekt', () => {
    const tax = calculateTax({
      ...defaultProfile,
      salary: 0,
      interestExpenses: 0,
      debt: 0,
      homeValue: 0,
      bankSavings: 0,
    })
    expect(tax.total).toBe(0)
  })

  it('beregner 130 000 kr i lønn etter vedtatte 2026-regler', () => {
    const tax = calculateTax({
      ...defaultProfile,
      salary: 130000,
    })
    expect(tax.ordinaryIncomeTax).toBe(0)
    expect(tax.bracketTax).toBe(0)
    expect(tax.socialSecurity).toBeCloseTo(7587.5)
    expect(tax.total).toBe(7588)
  })

  it('bruker marginale skattetrinn og ikke én prosent på hele inntekten', () => {
    const tax = calculateTax({ ...defaultProfile, salary: 750000, interestExpenses: 0 })
    expect(tax.bracketTax).toBeGreaterThan(0)
    expect(tax.bracketTax).toBeLessThan(750000 * 0.137)
  })

  it('bruker pensjonsinntekt og pensjonistfradrag', () => {
    const tax = calculateTax({
      ...defaultProfile,
      incomeType: 'pensioner',
      salary: 900000,
      pensionIncome: 300000,
      interestExpenses: 0,
      debt: 0,
      homeValue: 0,
      bankSavings: 0,
    })
    expect(tax.taxCredits).toBeGreaterThan(0)
    expect(tax.total).toBeGreaterThanOrEqual(0)
  })

  it('beregner Rødts og FrPs frikortgrense ved 130 000 kr', () => {
    const profile = { ...defaultProfile, salary: 130000, interestExpenses: 0, debt: 0, homeValue: 0, bankSavings: 0 }
    for (const id of ['rodt', 'frp']) {
      const party = parties.find(candidate => candidate.id === id)!
      expect(calculatePartyResult(party, profile).tax.total).toBe(0)
    }
  })

  it('rangerer dokumenterte partier før uavklarte estimater', () => {
    const sorted = sortPartyResults(parties, defaultProfile)
    const firstUnclear = sorted.findIndex(result => result.status === 'unclear')
    expect(firstUnclear).toBeGreaterThan(0)
    expect(sorted.slice(0, firstUnclear).every(result => result.status === 'documented')).toBe(true)
    expect(sorted.slice(firstUnclear).every(result => result.status === 'unclear')).toBe(true)
  })

  it('tar med alle ni stortingspartier og Norgesdemokratene', () => {
    expect(parties).toHaveLength(10)
    expect(parties.some(party => party.id === 'nd')).toBe(true)
  })

  it('lar ikke Norgesdemokratene vinne den dokumenterte rangeringen', () => {
    const sorted = sortPartyResults(parties, defaultProfile)
    const nd = sorted.find(result => result.party.id === 'nd')!
    expect(nd.status).toBe('unclear')
    expect(sorted.indexOf(nd)).toBeGreaterThan(sorted.filter(result => result.status === 'documented').length - 1)
    expect(nd.estimateRange).toEqual({ minimumTax: 62500, maximumTax: 75000 })
  })
})
