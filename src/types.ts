export type UserProfile = {
  age: number
  municipality: string
  incomeType: 'worker' | 'pensioner' | 'both' | 'disabled' | 'youngDisabled' | 'aap' | 'student' | 'unemployed' | 'selfEmployed'
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

export type Measure = {
  id: string
  name: string
  description: string
  category: 'Skatt' | 'Familie' | 'Bil og avgifter' | 'Formue'
  effect: (profile: UserProfile) => number
  confidence: 'Demo'
}

export type Party = {
  id: string
  name: string
  shortName: string
  color: string
  measures: Measure[]
}
