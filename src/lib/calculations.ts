import type { Party, PartyResult, TaxBreakdown, TaxRules, UserProfile } from '../types'

export const defaultProfile: UserProfile = {
  age: 32,
  municipality: 'Lillestrøm',
  civilStatus: 'single',
  incomeTypes: ['worker'],
  salary: 750000,
  selfEmployedIncome: 0,
  pensionIncome: 0,
  benefitIncome: 0,
  otherIncome: 0,
  rentalTaxMode: 'none',
  rentalIncome: 0,
  rentalMaintenance: 0,
  rentalOperatingCosts: 0,
  rentalImprovements: 0,
  debt: 2400000,
  interestExpenses: 120000,
  homeValue: 4500000,
  ownershipShare: 100,
  secondaryHomeValue: 0,
  holidayHomeValue: 0,
  bankSavings: 100000,
  shares: 0,
  businessAssets: 0,
  otherWealth: 0,
  childrenUnder6: 0,
  children6to12: 0,
  children13to17: 0,
  kindergartenChildren: 0,
  sfoChildren: 0,
  singleParent: false,
  supportNeeds: [],
  deductionSelections: [],
  unionFee: 0,
  childcareExpenses: 0,
  commuteExpenses: 0,
  donations: 0,
  investmentLosses: 0,
  ipsContribution: 0,
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
  ipsDeductionMax: 25000,
  wealthAllowance: 1900000,
  wealthSecondThreshold: 21500000,
  wealthRate: 0.01,
  wealthSecondRate: 0.011,
  primaryHomeLowValuationRate: 0.25,
  primaryHomeHighThreshold: 14000000,
  primaryHomeHighValuationRate: 0.70,
  secondaryHomeValuationRate: 1,
  holidayHomeValuationRate: 0.30,
  shareValuationRate: 0.8,
  businessAssetValuationRate: 0.7,
  otherWealthValuationRate: 1,
}

const positive = (value: number) => Math.max(0, Number.isFinite(value) ? value : 0)
const has = (profile: UserProfile, id: string) => profile.deductionSelections.includes(id)
const receives = (profile: UserProfile, id: UserProfile['incomeTypes'][number]) => profile.incomeTypes.includes(id)

export const numberWithSpaces = (value: number) =>
  new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 }).format(Math.round(value)).replace(/\u00a0/g, ' ')

export const kr = (value: number) => `${numberWithSpaces(value)} kr`

export const profileIncomes = (profile: UserProfile) => {
  const receivesBenefit = ['disabled', 'youngDisabled', 'aap', 'unemployed']
    .some(type => profile.incomeTypes.includes(type as UserProfile['incomeTypes'][number]))

  return {
    wage: receives(profile, 'worker') ? positive(profile.salary) : 0,
    selfEmployedIncome: receives(profile, 'selfEmployed') ? positive(profile.selfEmployedIncome) : 0,
    pension: receives(profile, 'pensioner') ? positive(profile.pensionIncome) : 0,
    benefit: receivesBenefit ? positive(profile.benefitIncome) : 0,
    other: positive(profile.otherIncome),
    rental: positive(profile.rentalIncome),
  }
}

export const rentalResult = (profile: UserProfile) => {
  const taxable = ['privateTaxable', 'business', 'uncertain'].includes(profile.rentalTaxMode)
  if (!taxable) return 0
  return positive(profile.rentalIncome) - positive(profile.rentalMaintenance) - positive(profile.rentalOperatingCosts)
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

const primaryHomeTaxValue = (profile: UserProfile, rules: TaxRules) => {
  const share = Math.min(1, positive(profile.ownershipShare) / 100)
  const fullValue = positive(profile.homeValue)
  const lowPart = Math.min(fullValue, rules.primaryHomeHighThreshold) * rules.primaryHomeLowValuationRate
  const highPart = Math.max(0, fullValue - rules.primaryHomeHighThreshold) * rules.primaryHomeHighValuationRate
  return (lowPart + highPart) * share
}

const taxableWealth = (profile: UserProfile, rules: TaxRules) => Math.max(
  0,
  primaryHomeTaxValue(profile, rules) +
    positive(profile.secondaryHomeValue) * rules.secondaryHomeValuationRate +
    positive(profile.holidayHomeValue) * rules.holidayHomeValuationRate +
    positive(profile.bankSavings) +
    positive(profile.shares) * rules.shareValuationRate +
    positive(profile.businessAssets) * rules.businessAssetValuationRate +
    positive(profile.otherWealth) * rules.otherWealthValuationRate -
    positive(profile.debt),
)

const wealthTax = (profile: UserProfile, rules: TaxRules) => {
  const wealth = taxableWealth(profile, rules)
  const householdMultiplier = profile.civilStatus === 'joint' ? 2 : 1
  const allowance = rules.wealthAllowance * householdMultiplier
  const secondThreshold = rules.wealthSecondThreshold * householdMultiplier
  const thirdThreshold = rules.wealthThirdThreshold === undefined
    ? Number.POSITIVE_INFINITY
    : rules.wealthThirdThreshold * householdMultiplier

  if (wealth <= allowance) return { wealth, tax: 0 }
  const firstBand = Math.max(0, Math.min(wealth, secondThreshold) - allowance)
  const secondBand = Math.max(0, Math.min(wealth, thirdThreshold) - secondThreshold)
  const thirdBand = Math.max(0, wealth - thirdThreshold)
  return {
    wealth,
    tax:
      firstBand * rules.wealthRate +
      secondBand * rules.wealthSecondRate +
      thirdBand * (rules.wealthThirdRate ?? rules.wealthSecondRate),
  }
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

const calculateTaxCore = (profile: UserProfile, rules: TaxRules): TaxBreakdown => {
  const income = profileIncomes(profile)
  const netRentalIncome = rentalResult(profile)
  // Ved «usikker» brukes privat utleie som hovedestimat. Begge alternativer vises i grensesnittet.
  const rentalIsBusiness = profile.rentalTaxMode === 'business'
  const rentalBusinessProfit = rentalIsBusiness ? Math.max(0, netRentalIncome) : 0
  const wageLikeIncome = income.wage + income.benefit
  const selfEmployedPersonalIncome = income.selfEmployedIncome + rentalBusinessProfit
  const earnedIncome = wageLikeIncome + selfEmployedPersonalIncome
  const personalIncome = earnedIncome + income.pension
  const grossIncome = personalIncome + income.other + (rentalIsBusiness ? Math.min(0, netRentalIncome) : netRentalIncome)

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
    (has(profile, 'investmentLoss') ? positive(profile.investmentLosses) : 0) +
    (has(profile, 'ips') ? Math.min(positive(profile.ipsContribution), rules.ipsDeductionMax) : 0)

  const taxableOrdinaryIncome = Math.max(
    0,
    grossIncome - minimumDeduction - ordinaryDeductions - rules.personDeduction - employmentDeduction(profile, earnedIncome, rules),
  )
  const ordinaryIncomeTax = taxableOrdinaryIncome * rules.ordinaryIncomeRate
  const calculatedBracketTax = bracketTax(personalIncome, rules.brackets)
  const calculatedSocialSecurity = socialSecurityTax(
    personalIncome,
    income.pension,
    selfEmployedPersonalIncome,
    rules,
  )
  const wealth = wealthTax(profile, rules)
  const taxBeforeCredits = ordinaryIncomeTax + calculatedBracketTax + calculatedSocialSecurity + wealth.tax
  const employmentCredit = earnedIncome > 0 ? rules.employmentTaxCredit ?? 0 : 0
  const pensionCredit = pensionTaxCredit(income.pension, rules.extraPensionTaxCredit ?? 0)
  const taxCredits = Math.min(taxBeforeCredits, employmentCredit + pensionCredit)

  return {
    grossIncome,
    netRentalIncome,
    rentalTaxEffect: 0,
    taxableOrdinaryIncome,
    ordinaryIncomeTax,
    bracketTax: calculatedBracketTax,
    socialSecurity: calculatedSocialSecurity,
    taxableWealth: wealth.wealth,
    wealthTax: wealth.tax,
    taxCredits,
    total: Math.max(0, Math.round(taxBeforeCredits - taxCredits)),
  }
}

export const calculateTax = (profile: UserProfile, rules: TaxRules = currentTaxRules): TaxBreakdown => {
  const result = calculateTaxCore(profile, rules)
  if (!['privateTaxable', 'business', 'uncertain'].includes(profile.rentalTaxMode)) return result
  const withoutRental = calculateTaxCore({
    ...profile,
    rentalTaxMode: 'none',
    rentalIncome: 0,
    rentalMaintenance: 0,
    rentalOperatingCosts: 0,
  }, rules)
  return { ...result, rentalTaxEffect: result.total - withoutRental.total }
}

export const calculateRentalAlternatives = (profile: UserProfile, rules: TaxRules = currentTaxRules) => ({
  privateTaxable: calculateTax({ ...profile, rentalTaxMode: 'privateTaxable' }, rules),
  business: calculateTax({ ...profile, rentalTaxMode: 'business' }, rules),
})

const estimatedFlatTax = (profile: UserProfile, party: Party): PartyResult => {
  const baseline = calculateTax(profile)
  const estimate = party.estimate!
  const income = profileIncomes(profile)
  const grossPersonalIncome = income.wage + income.selfEmployedIncome + income.pension + income.benefit
  const excess = Math.max(0, grossPersonalIncome - estimate.threshold)
  const midpointTax = Math.round(excess * estimate.midpointRate)
  const tax: TaxBreakdown = {
    grossIncome: grossPersonalIncome + income.other + rentalResult(profile),
    netRentalIncome: rentalResult(profile),
    rentalTaxEffect: 0,
    taxableOrdinaryIncome: excess,
    ordinaryIncomeTax: midpointTax,
    bracketTax: 0,
    socialSecurity: 0,
    taxableWealth: baseline.taxableWealth,
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
