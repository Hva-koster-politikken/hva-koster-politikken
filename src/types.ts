export type UserProfile = {
  age: number
  municipality: string
  salary: number
  otherIncome: number
  rentalIncome: number
  debt: number
  interestExpenses: number
  homeValue: number
  ownershipShare: number
  bankSavings: number
  shares: number
  children: number
  kindergartenChildren: number
  sfoChildren: number
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
