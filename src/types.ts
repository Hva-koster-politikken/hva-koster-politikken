export type IncomeType =
  | 'worker'
  | 'pensioner'
  | 'both'
  | 'disabled'
  | 'youngDisabled'
  | 'aap'
  | 'student'
  | 'unemployed'
  | 'selfEmployed'

export type UserProfile = {
  age: number
  municipality: string
  incomeType: IncomeType
  salary: number
  pensionIncome: number
  benefitIncome: number
  otherIncome: number
  rentalIncome: number
  debt: number
  interestExpenses: number
  homeValue: number
  ownershipShare: number
  bankSavings: number
  shares: number
  childrenUnder6: number
  children6to12: number
  children13to17: number
  kindergartenChildren: number
  sfoChildren: number
  singleParent: boolean
  supportNeeds: string[]
  deductionSelections: string[]
  rentalMaintenance: number
  rentalOperatingCosts: number
  unionFee: number
  childcareExpenses: number
  commuteExpenses: number
  donations: number
  investmentLosses: number
  carType: 'none' | 'fossil' | 'electric'
  annualKm: number
  tolls: number
}

export type TaxBracket = { threshold: number; rate: number }

export type TaxRules = {
  label: string
  personDeduction: number
  ordinaryIncomeRate: number
  wageMinDeductionRate: number
  wageMinDeductionMax: number
  pensionMinDeductionRate: number
  pensionMinDeductionMax: number
  socialSecurityLowerLimit: number
  socialSecurityPhaseInRate: number
  wageSocialSecurityRate: number
  pensionSocialSecurityRate: number
  selfEmployedSocialSecurityRate: number
  brackets: TaxBracket[]
  employmentTaxCredit?: number
  employmentDeduction?: {
    amount: number
    minAge?: number
    maxAge?: number
    phaseOutStart?: number
    phaseOutRate?: number
  }
  extraPensionTaxCredit?: number
  childcareFirstChildMax: number
  childcareAdditionalChildMax: number
  wealthAllowance: number
  wealthSecondThreshold: number
  wealthRate: number
  wealthSecondRate: number
  shareValuationRate: number
}

export type PartyStatus = 'documented' | 'unclear'

export type Party = {
  id: string
  name: string
  shortName: string
  color: string
  status: PartyStatus
  statusReason?: string
  sourceTitle: string
  sourceUrl: string
  sourceDate: string
  rules?: TaxRules
  estimate?: {
    kind: 'flat-above-threshold'
    threshold: number
    midpointRate: number
    minimumRate: number
    maximumRate: number
  }
  highlights: string[]
}

export type TaxBreakdown = {
  grossIncome: number
  taxableOrdinaryIncome: number
  ordinaryIncomeTax: number
  bracketTax: number
  socialSecurity: number
  wealthTax: number
  taxCredits: number
  total: number
}

export type PartyResult = {
  party: Party
  tax: TaxBreakdown
  annualDifference: number
  monthlyDifference: number
  status: PartyStatus
  estimateRange?: { minimumTax: number; maximumTax: number }
}
