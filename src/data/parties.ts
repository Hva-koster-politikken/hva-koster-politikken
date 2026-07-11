import type { Party } from '../types'

const amount = (value: number) => () => value
const salaryRate = (rate: number) => (p: Parameters<Party['measures'][number]['effect']>[0]) => p.salary * rate
const perChild = (value: number) => (p: Parameters<Party['measures'][number]['effect']>[0]) => p.children * value
const fossilKm = (rate: number) => (p: Parameters<Party['measures'][number]['effect']>[0]) => p.carType === 'fossil' ? p.annualKm * rate : 0

export const parties: Party[] = [
  { id: 'ap', name: 'Arbeiderpartiet', shortName: 'Ap', color: '#d71920', measures: [
    { id: 'ap-1', name: 'Familietiltak', description: 'Illustrerende støtte per barn.', category: 'Familie', effect: perChild(850), confidence: 'Demo' },
    { id: 'ap-2', name: 'Skattejustering', description: 'Illustrerende fast skatteendring.', category: 'Skatt', effect: amount(200), confidence: 'Demo' },
  ]},
  { id: 'frp', name: 'Fremskrittspartiet', shortName: 'FrP', color: '#005b9a', measures: [
    { id: 'frp-1', name: 'Redusert inntektsskatt', description: 'Illustrerende prosentvis skattelette.', category: 'Skatt', effect: salaryRate(0.007), confidence: 'Demo' },
    { id: 'frp-2', name: 'Bil og avgifter', description: 'Illustrerende utslag for fossilbil.', category: 'Bil og avgifter', effect: fossilKm(0.12), confidence: 'Demo' },
  ]},
  { id: 'h', name: 'Høyre', shortName: 'H', color: '#0065f1', measures: [
    { id: 'h-1', name: 'Redusert inntektsskatt', description: 'Illustrerende prosentvis skattelette.', category: 'Skatt', effect: salaryRate(0.005), confidence: 'Demo' },
  ]},
  { id: 'sv', name: 'Sosialistisk Venstreparti', shortName: 'SV', color: '#e60000', measures: [
    { id: 'sv-1', name: 'Familietiltak', description: 'Illustrerende støtte per barn.', category: 'Familie', effect: perChild(1800), confidence: 'Demo' },
    { id: 'sv-2', name: 'Skatteendring', description: 'Illustrerende inntektsavhengig endring.', category: 'Skatt', effect: salaryRate(-0.002), confidence: 'Demo' },
  ]},
  { id: 'rodt', name: 'Rødt', shortName: 'Rødt', color: '#b40025', measures: [
    { id: 'r-1', name: 'Familietiltak', description: 'Illustrerende støtte per barn.', category: 'Familie', effect: perChild(2100), confidence: 'Demo' },
    { id: 'r-2', name: 'Skatteendring', description: 'Illustrerende inntektsavhengig endring.', category: 'Skatt', effect: salaryRate(-0.003), confidence: 'Demo' },
  ]},
  { id: 'sp', name: 'Senterpartiet', shortName: 'Sp', color: '#00843d', measures: [
    { id: 'sp-1', name: 'Generelt tiltak', description: 'Illustrerende fast utslag.', category: 'Skatt', effect: amount(1450), confidence: 'Demo' },
  ]},
  { id: 'v', name: 'Venstre', shortName: 'V', color: '#009b77', measures: [
    { id: 'v-1', name: 'Skatteveksling', description: 'Illustrerende inntektsavhengig utslag.', category: 'Skatt', effect: salaryRate(0.0025), confidence: 'Demo' },
  ]},
  { id: 'krf', name: 'Kristelig Folkeparti', shortName: 'KrF', color: '#d4a017', measures: [
    { id: 'krf-1', name: 'Familietiltak', description: 'Illustrerende støtte per barn.', category: 'Familie', effect: perChild(1500), confidence: 'Demo' },
  ]},
  { id: 'mdg', name: 'Miljøpartiet De Grønne', shortName: 'MDG', color: '#39a935', measures: [
    { id: 'mdg-1', name: 'Grønn skatteveksling', description: 'Illustrerende fast utslag.', category: 'Skatt', effect: amount(900), confidence: 'Demo' },
    { id: 'mdg-2', name: 'Drivstoffavgift', description: 'Illustrerende utslag for fossilbil.', category: 'Bil og avgifter', effect: fossilKm(-0.09), confidence: 'Demo' },
  ]},
]
