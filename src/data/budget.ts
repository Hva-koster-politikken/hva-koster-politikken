export type BudgetItem = { name: string; percent: number; color: string }

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

// Kun for å demonstrere sammenligningsfunksjonen. Dette er ikke partienes faktiske budsjettall.
const demoAdjustments: Record<string, Record<string, number>> = {
  ap: { 'Helse og omsorg': 1, 'Skole og utdanning': 0.5, 'Klima og miljø': 0.5, 'Andre formål': -2 },
  frp: { 'Politi og justis': 1, 'Forsvar og beredskap': 1.5, Samferdsel: 1, 'Innvandring og integrering': -1, Bistand: -1, 'Andre formål': -1.5 },
  h: { 'Helse og omsorg': 0.5, 'Forsvar og beredskap': 1, Samferdsel: 0.5, 'Kommunale tjenester': -0.5, Bistand: -0.5, 'Andre formål': -1 },
  sv: { 'Helse og omsorg': 1, 'Skole og utdanning': 1, 'Klima og miljø': 1, 'Forsvar og beredskap': -1, Bistand: 0.5, 'Andre formål': -2.5 },
  rodt: { 'Helse og omsorg': 1.5, 'Skole og utdanning': 1, 'Kommunale tjenester': 0.5, 'Forsvar og beredskap': -1.5, Bistand: 0.5, 'Andre formål': -2 },
  sp: { 'Kommunale tjenester': 1, Samferdsel: 1, 'Helse og omsorg': 0.5, 'Klima og miljø': -0.5, 'Andre formål': -2 },
  v: { 'Skole og utdanning': 0.5, 'Klima og miljø': 1, Bistand: 0.5, 'Forsvar og beredskap': 0.5, 'Andre formål': -2.5 },
  krf: { 'Helse og omsorg': 0.7, 'Kommunale tjenester': 0.8, Bistand: 0.5, 'Andre formål': -2 },
  mdg: { 'Klima og miljø': 2, Samferdsel: 1, 'Forsvar og beredskap': -0.5, 'Andre formål': -2.5 },
}

export const getBudgetScenario = (partyId: string): BudgetItem[] => {
  if (partyId === 'current') return currentBudget
  const changes = demoAdjustments[partyId] ?? {}
  return currentBudget.map(item => ({ ...item, percent: item.percent + (changes[item.name] ?? 0) }))
}
