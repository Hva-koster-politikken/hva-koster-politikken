import type { Party, UserProfile } from '../types'

export const defaultProfile: UserProfile = {
  age: 32, municipality: 'Lillestrøm', incomeType: 'worker', salary: 750000,
  pensionIncome: 0, benefitIncome: 0, otherIncome: 0,
  rentalIncome: 0, debt: 2400000, interestExpenses: 120000, homeValue: 4500000,
  ownershipShare: 100, bankSavings: 100000, shares: 0, childrenUnder6: 0,
  children6to12: 0, children13to17: 0, kindergartenChildren: 0, sfoChildren: 0,
  singleParent: false, supportNeeds: [], deductionSelections: [], rentalMaintenance: 0,
  rentalOperatingCosts: 0, unionFee: 0, childcareExpenses: 0, commuteExpenses: 0,
  donations: 0, investmentLosses: 0, carType: 'fossil', annualKm: 12000, tolls: 6000,
}

export const kr = (value: number) => new Intl.NumberFormat('nb-NO', {
  style: 'currency', currency: 'NOK', maximumFractionDigits: 0,
}).format(Math.round(value))

export const estimateTax = (p: UserProfile) => {
  const salaryStatuses: UserProfile['incomeType'][] = ['worker', 'both', 'student', 'selfEmployed']
  const benefitStatuses: UserProfile['incomeType'][] = ['disabled', 'youngDisabled', 'aap', 'unemployed']
  const salary = salaryStatuses.includes(p.incomeType) ? p.salary : 0
  const pension = p.incomeType === 'pensioner' || p.incomeType === 'both' ? p.pensionIncome : 0
  const benefit = benefitStatuses.includes(p.incomeType) ? p.benefitIncome : 0
  const gross = Math.max(0, salary + pension + benefit + p.otherIncome + p.rentalIncome)
  const roughTax = gross * (gross < 300000 ? 0.18 : gross < 700000 ? 0.25 : 0.29)
  const interestRelief = Math.max(0, p.interestExpenses) * 0.22
  return Math.max(0, roughTax - interestRelief)
}

export const partyEffect = (party: Party, profile: UserProfile) =>
  party.measures.reduce((sum, measure) => sum + measure.effect(profile), 0)

export const sortParties = (parties: Party[], profile: UserProfile) =>
  [...parties].sort((a, b) => partyEffect(b, profile) - partyEffect(a, profile))
