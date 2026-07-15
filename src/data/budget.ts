export type BudgetItem = {
  id: string
  name: string
  amount: number
  color: string
}

export type BudgetScenario = {
  partyId: string
  label: string
  items: BudgetItem[]
  confidence: 'grouped-baseline' | 'directional-estimate' | 'very-uncertain'
  note: string
  budgetTitle: string
  budgetUrl: string
  programTitle: string
  programUrl: string
  longTermGoal: string
}

const categories = [
  ['health', 'Helse og omsorg', '#176b87'],
  ['welfare', 'Pensjon og trygd', '#274c77'],
  ['municipal', 'Kommunale tjenester', '#5b8e7d'],
  ['education', 'Skole og utdanning', '#e5a84b'],
  ['transport', 'Samferdsel', '#cf6f54'],
  ['defence', 'Forsvar og beredskap', '#6b705c'],
  ['justice', 'Politi og justis', '#545f66'],
  ['climate', 'Klima og miljø', '#4f9d69'],
  ['immigration', 'Innvandring og integrering', '#8d6a9f'],
  ['aid', 'Bistand', '#d08770'],
  ['other', 'Andre formål', '#a0a7ad'],
] as const

const items = (amounts: number[]): BudgetItem[] => categories.map(([id, name, color], index) => ({
  id,
  name,
  color,
  amount: amounts[index],
}))

export const currentBudget: BudgetItem[] = items([22, 21, 13, 11, 7, 5, 3, 3, 2, 2, 11])

const currentSource = 'https://www.regjeringen.no/no/statsbudsjett/2026/id3116084/'

export const budgetScenarios: BudgetScenario[] = [
  {
    partyId: 'current',
    label: 'Dagens vedtatte budsjett',
    items: currentBudget,
    confidence: 'grouped-baseline',
    note: 'Offentlige utgifter er samlet i elleve lettleste kategorier. Fordelingen er en forenklet gruppering, ikke en offisiell statskonto.',
    budgetTitle: 'Statsbudsjettet 2026',
    budgetUrl: currentSource,
    programTitle: 'Regjeringens politikk',
    programUrl: 'https://www.regjeringen.no/no/dokumenter/hurdalsplattformen/id2877252/',
    longTermGoal: 'Videreføre en bred offentlig velferdsstat og prioritere arbeid, trygghet og omfordeling.',
  },
  {
    partyId: 'ap',
    label: 'Arbeiderpartiet',
    items: items([22, 21, 13, 11, 7, 5, 3, 3, 2, 2, 11]),
    confidence: 'grouped-baseline',
    note: 'Ap leder regjeringen. Her brukes vedtatt budsjett som konkret 2026-grunnlag.',
    budgetTitle: 'Vedtatt statsbudsjett 2026',
    budgetUrl: currentSource,
    programTitle: 'Arbeiderpartiets partiprogram 2025–2029',
    programUrl: 'https://www.arbeiderpartiet.no/politikken/partiprogram/',
    longTermGoal: 'Styrke arbeid, velferd og trygg økonomisk styring innenfor en stor offentlig sektor.',
  },
  {
    partyId: 'frp',
    label: 'Fremskrittspartiet',
    items: items([23, 20, 11, 10, 8, 6, 4, 1, 1, 0.5, 11.5]),
    confidence: 'directional-estimate',
    note: 'Retningsestimat: lavere samlet offentlig pengebruk, med prioritering av helse, vei, politi og forsvar og kutt på blant annet bistand, klima og integrering.',
    budgetTitle: 'FrPs alternative statsbudsjett 2026',
    budgetUrl: 'https://www.frp.no/nyheter/fremskrittspartiets-alternative-statsbudsjett',
    programTitle: 'FrPs partiprogram 2025–2029',
    programUrl: 'https://www.frp.no/files/Program/2025/Program-2025-2029.pdf',
    longTermGoal: 'Mindre stat, lavere skatter og avgifter og avvikling av formuesskatten på lengre sikt.',
  },
  {
    partyId: 'h',
    label: 'Høyre',
    items: items([22, 20, 12.5, 11, 7.5, 6, 3.5, 2.5, 1.5, 1.5, 10]),
    confidence: 'directional-estimate',
    note: 'Retningsestimat: noe lavere samlet pengebruk, lavere skatt og tydeligere prioritering av forsvar, politi og samferdsel.',
    budgetTitle: 'Høyres alternative budsjett 2026',
    budgetUrl: 'https://hoyre.no/hoyres-alternative-budsjett-2026/',
    programTitle: 'Høyres stortingsvalgprogram 2025–2029',
    programUrl: 'https://hoyre.no/politikk/partiprogram/',
    longTermGoal: 'Lavere skatter, mer privat verdiskaping og en mer effektiv offentlig sektor.',
  },
  {
    partyId: 'mdg',
    label: 'Miljøpartiet De Grønne',
    items: items([22, 21, 13, 12, 9, 5, 3, 7, 2, 3, 6]),
    confidence: 'directional-estimate',
    note: 'Retningsestimat: høyere samlet pengebruk og kraftig flytting mot klima, natur, kollektivtransport og grønn omstilling.',
    budgetTitle: 'MDGs alternative statsbudsjett 2026',
    budgetUrl: 'https://mdg.no/_service/505809/download/id/1583667/name/Alternativt-statsbudsjett-MDG-2026.pdf',
    programTitle: 'MDGs arbeidsprogram 2025–2029',
    programUrl: 'https://mdg.no/politikk/arbeidsprogram',
    longTermGoal: 'En rask grønn omstilling med høyere miljøavgifter og mer bruk av penger på klima, natur og kollektivtransport.',
  },
  {
    partyId: 'rodt',
    label: 'Rødt',
    items: items([25, 24, 15, 13, 7, 4.5, 3, 4, 2, 2, 5.5]),
    confidence: 'directional-estimate',
    note: 'Retningsestimat: større statsbudsjett og høyere prioritering av offentlig helse, trygd, kommuner og utdanning.',
    budgetTitle: 'Rødts alternative statsbudsjett 2026',
    budgetUrl: 'https://roedt.no/fil/24e707442d6f7e386f1a1049e712c450b9f674b7.pdf?dl=',
    programTitle: 'Rødts arbeidsprogram 2025–2029',
    programUrl: 'https://roedt.no/fil/25ba75b90597df613816bd5c6c77dc7d49192e20.pdf?dl=',
    longTermGoal: 'Større offentlig velferd, mer progressiv skatt og mindre privat profitt i velferdstjenestene.',
  },
  {
    partyId: 'sp',
    label: 'Senterpartiet',
    items: items([22, 22, 15, 11, 9, 5.5, 3, 3, 2, 1.5, 8]),
    confidence: 'directional-estimate',
    note: 'Retningsestimat: noe høyere pengebruk, særlig til kommuner, distrikt, velferd og samferdsel.',
    budgetTitle: 'Senterpartiets alternative statsbudsjett 2026',
    budgetUrl: 'https://www.senterpartiet.no/aktuelt/sp-med-budsjett-for-hele-norge--velferden-ma-styrkes-og-avgiftene-reduseres/',
    programTitle: 'Senterpartiets stortingsprogram 2025–2029',
    programUrl: 'https://www.senterpartiet.no/politikk/program-uttaler-og-rapporter/',
    longTermGoal: 'Desentralisere makt og prioritere kommuner, landbruk, beredskap og tjenester i hele landet.',
  },
  {
    partyId: 'sv',
    label: 'Sosialistisk Venstreparti',
    items: items([25, 24, 15, 13, 8, 4.5, 3, 5, 2, 3, 2.5]),
    confidence: 'directional-estimate',
    note: 'Retningsestimat: større budsjett med mer til velferd, kommuner, utdanning, klima og bistand.',
    budgetTitle: 'SVs alternative statsbudsjett 2026',
    budgetUrl: 'https://www.sv.no/wp-content/uploads/2025/11/svs-alternative-statsbudsjett-2026.pdf',
    programTitle: 'SVs arbeidsprogram 2025–2029',
    programUrl: 'https://www.sv.no/politikken/arbeidsprogram/',
    longTermGoal: 'Styrke offentlig velferd og grønn omstilling finansiert med mer progressiv skatt.',
  },
  {
    partyId: 'v',
    label: 'Venstre',
    items: items([22, 20, 12, 12.5, 8.5, 6, 3, 6, 2, 2, 6]),
    confidence: 'directional-estimate',
    note: 'Retningsestimat: omtrent samme samlede nivå, men mer til klima, utdanning, kollektivtransport og grønn næringsutvikling.',
    budgetTitle: 'Venstres alternative statsbudsjett 2026',
    budgetUrl: 'https://www.venstre.no/content/uploads/Venstres_alternative_statsbudsjett_2026-web.pdf',
    programTitle: 'Venstres stortingsprogram 2025–2029',
    programUrl: 'https://www.venstre.no/politikk/partiprogram/',
    longTermGoal: 'Grønt skatteskifte, bedre vilkår for næringsliv og sterkere prioritering av utdanning og klima.',
  },
  {
    partyId: 'krf',
    label: 'Kristelig Folkeparti',
    items: items([23, 23, 13, 12, 7, 5.5, 3, 3, 2, 3, 7.5]),
    confidence: 'directional-estimate',
    note: 'Retningsestimat: noe større budsjett med sterkere prioritering av familier, helse, ideelle tjenester og bistand.',
    budgetTitle: 'KrFs alternative statsbudsjett 2026',
    budgetUrl: 'https://krf.no/content/uploads/2025/11/Alternativt-Budsjett_MASTER_web3.pdf',
    programTitle: 'KrFs stortingsprogram 2025–2029',
    programUrl: 'https://krf.no/politikk/politisk-program/',
    longTermGoal: 'Styrke familiene, ideelle velferdsaktører, bistand og verdighet i helse og omsorg.',
  },
  {
    partyId: 'nd',
    label: 'Norgesdemokratene',
    items: items([22, 20, 10, 10, 8, 7, 5, 0.5, 0.5, 0.5, 11.5]),
    confidence: 'very-uncertain',
    note: 'Svært usikkert retningsestimat basert på partiprogrammet. Partiet har ikke et tilstrekkelig detaljert alternativt statsbudsjett for en presis normalisering.',
    budgetTitle: 'Ingen fullstendig normalisert alternativbudsjett',
    budgetUrl: 'https://www.norgesdemokratene.no/program/partiprogram',
    programTitle: 'Norgesdemokratenes partiprogram 2025–2029',
    programUrl: 'https://www.norgesdemokratene.no/program/partiprogram',
    longTermGoal: 'Store kutt i bistand, innvandring og klimapolitikk, kombinert med sterkere prioritering av politi, forsvar og nasjonal beredskap.',
  },
]

export const getBudgetScenario = (partyId: string) =>
  budgetScenarios.find(scenario => scenario.partyId === partyId) ?? budgetScenarios[0]

export const budgetTotal = (scenario: BudgetScenario) =>
  scenario.items.reduce((sum, item) => sum + item.amount, 0)

export const budgetShare = (scenario: BudgetScenario, item: BudgetItem) =>
  budgetTotal(scenario) === 0 ? 0 : item.amount / budgetTotal(scenario) * 100
