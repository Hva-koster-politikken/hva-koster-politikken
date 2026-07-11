import type { Party, UserProfile } from '../types'

export const defaultProfile: UserProfile = {
  age: 32, municipality: 'Lillestrøm', salary: 750000, otherIncome: 0,
  rentalIncome: 0, debt: 2400000, interestExpenses: 120000, homeValue: 4500000,
  ownershipShare: 100, bankSavings: 100000, shares: 0, children: 0,
  kindergartenChildren: 0, sfoChildren: 0, carType: 'fossil', annualKm: 12000, tolls: 6000,
}

export const kr = (value: number) => new Intl.NumberFormat('nb-NO', {
  style: 'currency', currency: 'NOK', maximumFractionDigits: 0,
}).format(Math.round(value))

export const estimateTax = (p: UserProfile) => {
  const gross = Math.max(0, p.salary + p.otherIncome + p.rentalIncome)
  const roughTax = gross * (gross < 300000 ? 0.18 : gross < 700000 ? 0.25 : 0.29)
  const interestRelief = Math.max(0, p.interestExpenses) * 0.22
  return Math.max(0, roughTax - interestRelief)
}

export const partyEffect = (party: Party, profile: UserProfile) =>
  party.measures.reduce((sum, measure) => sum + measure.effect(profile), 0)

export const sortParties = (parties: Party[], profile: UserProfile) =>
  [...parties].sort((a, b) => partyEffect(b, profile) - partyEffect(a, profile))
