import { describe, expect, it } from 'vitest'
import { budgetScenarios, budgetTotal, currentBudget, getBudgetScenario } from '../data/budget'
import { parties } from '../data/parties'
import type { IncomeType } from '../types'
import {
  calculatePartyResult,
  calculateTax,
  defaultProfile,
  kr,
  numberWithSpaces,
  sortPartyResults,
} from './calculations'

const emptyEconomy = {
  ...defaultProfile,
  incomeTypes: [],
  salary: 0,
  selfEmployedIncome: 0,
  pensionIncome: 0,
  benefitIncome: 0,
  otherIncome: 0,
  rentalTaxMode: 'none' as const,
  rentalIncome: 0,
  rentalMaintenance: 0,
  rentalOperatingCosts: 0,
  interestExpenses: 0,
  debt: 0,
  homeValue: 0,
  secondaryHomeValue: 0,
  holidayHomeValue: 0,
  bankSavings: 0,
  shares: 0,
  businessAssets: 0,
  otherWealth: 0,
}

describe('2026-beregninger', () => {
  it('formaterer beløp med mellomrom', () => {
    expect(numberWithSpaces(100000)).toBe('100 000')
    expect(kr(12345)).toBe('12 345 kr')
  })

  it('bruker dagens budsjett som indeks 100', () => {
    expect(currentBudget.reduce((sum, item) => sum + item.amount, 0)).toBe(100)
    expect(budgetTotal(getBudgetScenario('current'))).toBe(100)
  })

  it('viser budsjettretning for alle partier uten å tvinge totalene til 100', () => {
    expect(budgetScenarios).toHaveLength(parties.length + 1)
    expect(parties.every(party => getBudgetScenario(party.id).partyId === party.id)).toBe(true)
    expect(new Set(budgetScenarios.map(budgetTotal)).size).toBeGreaterThan(1)
    expect(budgetTotal(getBudgetScenario('frp'))).toBeLessThan(100)
    expect(budgetTotal(getBudgetScenario('rodt'))).toBeGreaterThan(100)
  })

  it('håndterer null inntekt', () => {
    expect(calculateTax(emptyEconomy).total).toBe(0)
  })

  it('beregner 130 000 kr i lønn etter vedtatte 2026-regler', () => {
    const tax = calculateTax({
      ...emptyEconomy,
      incomeTypes: ['worker'],
      salary: 130000,
    })
    expect(tax.ordinaryIncomeTax).toBe(0)
    expect(tax.bracketTax).toBe(0)
    expect(tax.socialSecurity).toBeCloseTo(7587.5)
    expect(tax.total).toBe(7588)
  })

  it('bruker marginale skattetrinn og ikke én prosent på hele inntekten', () => {
    const tax = calculateTax({ ...emptyEconomy, incomeTypes: ['worker'], salary: 750000 })
    expect(tax.bracketTax).toBeGreaterThan(0)
    expect(tax.bracketTax).toBeLessThan(750000 * 0.137)
  })

  it('kan kombinere lønn, ENK og skattepliktig utleie', () => {
    const tax = calculateTax({
      ...emptyEconomy,
      incomeTypes: ['worker', 'selfEmployed'],
      salary: 500000,
      selfEmployedIncome: 125000,
      rentalTaxMode: 'privateTaxable',
      rentalIncome: 250000,
    })
    expect(tax.grossIncome).toBe(875000)
    expect(tax.netRentalIncome).toBe(250000)
  })

  it('bruker pensjonsinntekt og pensjonistfradrag', () => {
    const tax = calculateTax({
      ...emptyEconomy,
      incomeTypes: ['pensioner'],
      pensionIncome: 300000,
    })
    expect(tax.taxCredits).toBeGreaterThan(0)
    expect(tax.total).toBeGreaterThanOrEqual(0)
  })

  it('beregner Rødts og FrPs frikortgrense ved 130 000 kr', () => {
    const profile = { ...emptyEconomy, incomeTypes: ['worker'] as IncomeType[], salary: 130000 }
    for (const id of ['rodt', 'frp']) {
      const party = parties.find(candidate => candidate.id === id)!
      expect(calculatePartyResult(party, profile).tax.total).toBe(0)
    }
  })

  it('lar skattefri utleie stå uten skatteeffekt', () => {
    const base = { ...emptyEconomy, incomeTypes: ['worker'] as IncomeType[], salary: 500000 }
    const withoutRental = calculateTax(base)
    const taxFree = calculateTax({ ...base, rentalTaxMode: 'taxFree', rentalIncome: 250000 })
    expect(taxFree.total).toBe(withoutRental.total)
    expect(taxFree.rentalTaxEffect).toBe(0)
  })

  it('gir om lag 11 000 kr lavere skatt for 50 000 kr i fradragsberettiget vedlikehold', () => {
    const withoutMaintenance = calculateTax({
      ...emptyEconomy,
      rentalTaxMode: 'privateTaxable',
      rentalIncome: 250000,
    })
    const withMaintenance = calculateTax({
      ...emptyEconomy,
      rentalTaxMode: 'privateTaxable',
      rentalIncome: 250000,
      rentalMaintenance: 50000,
    })
    expect(withoutMaintenance.total - withMaintenance.total).toBe(11000)
  })

  it('lar utleieunderskudd redusere annen alminnelig inntekt', () => {
    const base = { ...emptyEconomy, incomeTypes: ['worker'] as IncomeType[], salary: 500000 }
    const withoutRental = calculateTax(base)
    const withLoss = calculateTax({
      ...base,
      rentalTaxMode: 'privateTaxable',
      rentalIncome: 50000,
      rentalOperatingCosts: 80000,
    })
    expect(withLoss.netRentalIncome).toBe(-30000)
    expect(withoutRental.total - withLoss.total).toBe(6600)
    expect(withLoss.rentalTaxEffect).toBe(-6600)
  })

  it('viser høyere skatt når lønnsom utleie behandles som næring', () => {
    const rental = { ...emptyEconomy, rentalIncome: 250000 }
    const privateTax = calculateTax({ ...rental, rentalTaxMode: 'privateTaxable' })
    const businessTax = calculateTax({ ...rental, rentalTaxMode: 'business' })
    expect(businessTax.total).toBeGreaterThan(privateTax.total)
  })

  it('skiller mellom primærbolig og sekundærbolig i formuesskatten', () => {
    const primary = calculateTax({ ...emptyEconomy, homeValue: 8000000 })
    const secondary = calculateTax({ ...emptyEconomy, secondaryHomeValue: 8000000 })
    expect(primary.taxableWealth).toBe(2000000)
    expect(secondary.taxableWealth).toBe(8000000)
    expect(secondary.wealthTax).toBeGreaterThan(primary.wealthTax)
  })

  it('dobler formuesgrensene for ektefeller som skattlegges samlet', () => {
    const single = calculateTax({ ...emptyEconomy, bankSavings: 3000000, civilStatus: 'single' })
    const joint = calculateTax({ ...emptyEconomy, bankSavings: 3000000, civilStatus: 'joint' })
    expect(single.wealthTax).toBe(11000)
    expect(joint.wealthTax).toBe(0)
  })

  it('bruker Rødts tre progressive formuesskattetrinn', () => {
    const rodt = parties.find(party => party.id === 'rodt')!
    const result = calculatePartyResult(rodt, { ...emptyEconomy, bankSavings: 150000000 })
    expect(result.tax.wealthTax).toBeGreaterThan(150000000 * 0.014)
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
