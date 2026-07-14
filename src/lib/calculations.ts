import type { Party, PartyResult, TaxBreakdown, TaxRules, UserProfile } from '../types'

export const defaultProfile: UserProfile = {
  age: 32,
  municipality: 'Lillestrøm',
  incomeType: 'worker',
  salary: 750000,
  pensionIncome: 0,
  benefitIncome: 0,
  otherIncome: 0,
  rentalIncome: 0,
  debt: 2400000,
  interestExpenses: 120000,
  homeValue: 4500000,
  ownershipShare: 100,
  bankSavings: 100000,
  shares: 0,
  childrenUnder6: 0,
  children6to12: 0,
  children13to17: 0,
  kindergartenChildren: 0,
  sfoChildren: 0,
  singleParent: false,
  supportNeeds: [],
  deductionSelections: [],
  rentalMaintenance: 0,
  rentalOperatingCosts: 0,
  unionFee: 0,
  childcareExpenses: 0,
  commuteExpenses: 0,
  donations: 0,
  investmentLosses: 0,
  carType: 'fossil',
  annualKm: 12000,
  tolls: 6000,
}

export const currentTaxRules: TaxRules = {
  label: 'Vedtatte regler for 2026',
  personDeduction: 114540,
  ordinaryIncomeRate: 0.22,
  wageMinDeductionRate: 0.46,
  wageMinDeductionMax: 95700,
  pensionMinDeductionRate: 0.40,
  pensionMinDeductionMax: 75400,
  socialSecurityLowerLimit: 99650,
  socialSecurityPhaseInRate: 0.25,
  wageSocialSecurityRate: 0.076,
  pensionSocialSecurityRate: 0.051,
  selfEmployedSocialSecurityRate: 0.108,
  brackets: [
    { threshold: 226100, rate: 0.017 },
    { threshold: 318300, rate: 0.04 },
    { threshold: 725050, rate: 0.137 },
    { threshold: 980100, rate: 0.168 },
    { threshold: 1467200, rate: 0.178 },
  ],
  childcareFirstChildMax: 15000,
  childcareAdditionalChildMax: 10000,
  wealthAllowance: 1900000,
  wealthSecondThreshold: 21500000,
  wealthRate: 0.01,
  wealthSecondRate: 0.011,
  shareValuationRate: 0.8,
}

const positive = (value: number) => Math.max(0, Number.isFinite(value) ? value : 0)
const has = (profile: UserProfile, id: string) => profile.deductionSelections.includes(id)

export const numberWithSpaces = (value: number) =>
  new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 }).format(Math.round(value)).replace(/\u00a0/g, ' ')

export const kr = (value: number) => `${numberWithSpaces(value)} kr`

export const profileIncomes = (profile: UserProfile) => {
  const receivesSalary = ['worker', 'both', 'student'].includes(profile.incomeType)
  const selfEmployed = profile.incomeType === 'selfEmployed'
  const receivesPension = ['pensioner', 'both'].includes(profile.incomeType)
  const receivesBenefit = ['disabled', 'youngDisabled', 'aap', 'unemployed'].includes(profile.incomeType)

  return {
    wage: receivesSalary ? positive(profile.salary) : 0,
    selfEmployedIncome: selfEmployed ? positive(profile.salary) : 0,
    pension: receivesPension ? positive(profile.pensionIncome) : 0,
    benefit: receivesBenefit ? positive(profile.benefitIncome) : 0,
    other: positive(profile.otherIncome),
    rental: positive(profile.rentalIncome),
  }
}

const bracketTax = (personalIncome: number, brackets: TaxRules['brackets']) =>
  brackets.reduce((sum, bracket, index) => {
    const nextThreshold = brackets[index + 1]?.threshold ?? Number.POSITIVE_INFINITY
    const taxableInBracket = Math.max(0, Math.min(personalIncome, nextThreshold) - bracket.threshold)
    return sum + taxableInBracket * bracket.rate
  }, 0)

const socialSecurityTax = (
  personalIncome: number,
  pension: number,
  selfEmployedIncome: number,
  rules: TaxRules,
) => {
  if (personalIncome <= rules.socialSecurityLowerLimit) return 0
  const wageAndBenefit = Math.max(0, personalIncome - pension - selfEmployedIncome)
  const calculated =
    wageAndBenefit * rules.wageSocialSecurityRate +
    pension * rules.pensionSocialSecurityRate +
    selfEmployedIncome * rules.selfEmployedSocialSecurityRate
  const phaseInCap = (personalIncome - rules.socialSecurityLowerLimit) * rules.socialSecurityPhaseInRate
  return Math.min(calculated, phaseInCap)
}

const pensionTaxCredit = (pension: number, extraCredit: number) => {
  if (pension <= 0) return 0
  const maximum = 37100 + extraCredit
  const firstThreshold = 284950
  const secondThreshold = 436050
  const firstReduction = Math.max(0, Math.min(pension, secondThreshold) - firstThreshold) * 0.167
  const secondReduction = Math.max(0, pension - secondThreshold) * 0.06
  return Math.max(0, maximum - firstReduction - secondReduction)
}

const primaryHomeTaxValue = (profile: UserProfile) => {
  const share = Math.min(1, positive(profile.ownershipShare) / 100)
  const fullValue = positive(profile.homeValue)
  const lowPart = Math.min(fullValue, 10000000) * 0.25
  const highPart = Math.max(0, fullValue - 10000000) * 0.70
  return (lowPart + highPart) * share
}

const wealthTax = (profile: UserProfile, rules: TaxRules) => {
  const taxableWealth = Math.max(
    0,
    primaryHomeTaxValue(profile) +
      positive(profile.bankSavings) +
      positive(profile.shares) * rules.shareValuationRate -
      positive(profile.debt),
  )
  if (taxableWealth <= rules.wealthAllowance) return 0
  const firstBand = Math.max(0, Math.min(taxableWealth, rules.wealthSecondThreshold) - rules.wealthAllowance)
  const secondBand = Math.max(0, taxableWealth - rules.wealthSecondThreshold)
  return firstBand * rules.wealthRate + secondBand * rules.wealthSecondRate
}

const employmentDeduction = (profile: UserProfile, earnedIncome: number, rules: TaxRules) => {
  const deduction = rules.employmentDeduction
  if (!deduction || earnedIncome <= 0) return 0
  if (deduction.minAge !== undefined && profile.age < deduction.minAge) return 0
  if (deduction.maxAge !== undefined && profile.age > deduction.maxAge) return 0
  const phaseOut = deduction.phaseOutStart !== undefined && deduction.phaseOutRate !== undefined
    ? Math.max(0, earnedIncome - deduction.phaseOutStart) * deduction.phaseOutRate
    : 0
  return Math.max(0, deduction.amount - phaseOut)
}

export const calculateTax = (profile: UserProfile, rules: TaxRules = currentTaxRules): TaxBreakdown => {
  const income = profileIncomes(profile)
  const wageLikeIncome = income.wage + income.benefit
  const earnedIncome = wageLikeIncome + income.selfEmployedIncome
  const personalIncome = earnedIncome + income.pension

  const rentalCosts =
    (has(profile, 'rentalMaintenance') ? positive(profile.rentalMaintenance) : 0) +
    (has(profile, 'rentalOperating') ? positive(profile.rentalOperatingCosts) : 0)
  const netRentalIncome = Math.max(0, income.rental - rentalCosts)
  const grossIncome = personalIncome + income.other + netRentalIncome

  const wageMinDeduction = Math.min(wageLikeIncome * rules.wageMinDeductionRate, rules.wageMinDeductionMax)
  const pensionMinDeduction = Math.min(income.pension * rules.pensionMinDeductionRate, rules.pensionMinDeductionMax)
  // Lønn og pensjon samordnes. Høyeste beregnede minstefradrag brukes i denne forenklede modellen.
  const minimumDeduction = wageLikeIncome > 0 && income.pension > 0
    ? Math.max(wageMinDeduction, pensionMinDeduction)
    : wageMinDeduction + pensionMinDeduction

  const numberOfChildren = profile.childrenUnder6 + profile.children6to12 + profile.children13to17
  const childcareCap = numberOfChildren > 0
    ? rules.childcareFirstChildMax + Math.max(0, numberOfChildren - 1) * rules.childcareAdditionalChildMax
    : 0
  const childcareDeduction = has(profile, 'childcare')
    ? Math.min(positive(profile.childcareExpenses), childcareCap)
    : 0
  const ordinaryDeductions =
    positive(profile.interestExpenses) +
    (has(profile, 'union') ? Math.min(positive(profile.unionFee), 8700) : 0) +
    childcareDeduction +
    (has(profile, 'commute') ? Math.max(0, Math.min(positive(profile.commuteExpenses), 120000) - 12000) : 0) +
    (has(profile, 'donations') ? Math.min(positive(profile.donations), 25000) : 0) +
    (has(profile, 'investmentLoss') ? positive(profile.investmentLosses) : 0)

  const taxableOrdinaryIncome = Math.max(
    0,
    grossIncome - minimumDeduction - ordinaryDeductions - rules.personDeduction - employmentDeduction(profile, earnedIncome, rules),
  )
  const ordinaryIncomeTax = taxableOrdinaryIncome * rules.ordinaryIncomeRate
  const calculatedBracketTax = bracketTax(personalIncome, rules.brackets)
  const calculatedSocialSecurity = socialSecurityTax(
    personalIncome,
    income.pension,
    income.selfEmployedIncome,
    rules,
  )
  const calculatedWealthTax = wealthTax(profile, rules)
  const taxBeforeCredits = ordinaryIncomeTax + calculatedBracketTax + calculatedSocialSecurity + calculatedWealthTax
  const employmentCredit = earnedIncome > 0 ? rules.employmentTaxCredit ?? 0 : 0
  const pensionCredit = pensionTaxCredit(income.pension, rules.extraPensionTaxCredit ?? 0)
  const taxCredits = Math.min(taxBeforeCredits, employmentCredit + pensionCredit)

  return {
    grossIncome,
    taxableOrdinaryIncome,
    ordinaryIncomeTax,
    bracketTax: calculatedBracketTax,
    socialSecurity: calculatedSocialSecurity,
    wealthTax: calculatedWealthTax,
    taxCredits,
    total: Math.max(0, Math.round(taxBeforeCredits - taxCredits)),
  }
}

const estimatedFlatTax = (profile: UserProfile, party: Party): PartyResult => {
  const baseline = calculateTax(profile)
  const estimate = party.estimate!
  const income = profileIncomes(profile)
  const grossPersonalIncome = income.wage + income.selfEmployedIncome + income.pension + income.benefit
  const excess = Math.max(0, grossPersonalIncome - estimate.threshold)
  const midpointTax = Math.round(excess * estimate.midpointRate)
  const tax: TaxBreakdown = {
    grossIncome: grossPersonalIncome + income.other + income.rental,
    taxableOrdinaryIncome: excess,
    ordinaryIncomeTax: midpointTax,
    bracketTax: 0,
    socialSecurity: 0,
    wealthTax: 0,
    taxCredits: 0,
    total: midpointTax,
  }
  const annualDifference = baseline.total - tax.total
  return {
    party,
    tax,
    annualDifference,
    monthlyDifference: annualDifference / 12,
    status: 'unclear',
    estimateRange: {
      minimumTax: Math.round(excess * estimate.minimumRate),
      maximumTax: Math.round(excess * estimate.maximumRate),
    },
  }
}

export const calculatePartyResult = (party: Party, profile: UserProfile): PartyResult => {
  if (party.estimate) return estimatedFlatTax(profile, party)
  const baseline = calculateTax(profile)
  const tax = calculateTax(profile, party.rules ?? currentTaxRules)
  const annualDifference = baseline.total - tax.total
  return {
    party,
    tax,
    annualDifference,
    monthlyDifference: annualDifference / 12,
    status: party.status,
  }
}

export const sortPartyResults = (parties: Party[], profile: UserProfile) =>
  parties
    .map(party => calculatePartyResult(party, profile))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === 'documented' ? -1 : 1
      if (a.tax.total !== b.tax.total) return a.tax.total - b.tax.total
      return a.party.name.localeCompare(b.party.name, 'nb')
    })

export const estimateTax = (profile: UserProfile) => calculateTax(profile).total
