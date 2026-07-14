export type BudgetItem = { name: string; percent: number; color: string }

// Foreløpig visuell gruppering. Den brukes ikke i lommebokrangeringen.
export const currentBudget: BudgetItem[] = [
  { name: 'Helse og omsorg', percent: 22, color: '#176b87' },
  { name: 'Pensjon og trygd', percent: 21, color: '#274c77' },
  { name: 'Kommunale tjenester', percent: 13, color: '#5b8e7d' },
  { name: 'Skole og utdanning', percent: 11, color: '#e5a84b' },
  { name: 'Samferdsel', percent: 7, color: '#cf6f54' },
  { name: 'Forsvar og beredskap', percent: 5, color: '#6b705c' },
  { name: 'Politi og justis', percent: 3, color: '#545f66' },
  { name: 'Klima og miljø', percent: 3, color: '#4f9d69' },
  { name: 'Innvandring og integrering', percent: 2, color: '#8d6a9f' },
  { name: 'Bistand', percent: 2, color: '#d08770' },
  { name: 'Andre formål', percent: 11, color: '#a0a7ad' },
]

// Vi viser ikke lenger oppdiktede partiforskjeller. Partiscenarioer legges til når
// utgiftene er normalisert fra hvert alternative statsbudsjett.
export const getBudgetScenario = (partyId: string): BudgetItem[] | null =>
  partyId === 'current' ? currentBudget : null
