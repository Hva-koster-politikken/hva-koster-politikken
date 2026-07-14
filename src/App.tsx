import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Calculator,
  Check,
  ChevronDown,
  ExternalLink,
  Landmark,
  LockKeyhole,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react'
import { parties } from './data/parties'
import { currentBudget, getBudgetScenario } from './data/budget'
import {
  calculateTax,
  defaultProfile,
  kr,
  numberWithSpaces,
  profileIncomes,
  sortPartyResults,
} from './lib/calculations'
import type { PartyResult, UserProfile } from './types'

type View = 'home' | 'form' | 'results' | 'receipt' | 'method'

type NumberFieldProps = {
  label: string
  value: number
  onChange: (value: number) => void
  suffix?: string
  grouped?: boolean
}

const NumberField = ({ label, value, onChange, suffix = 'kr', grouped = true }: NumberFieldProps) => {
  const displayValue = value === 0 ? '' : grouped ? numberWithSpaces(value) : String(value)
  return <label className="field">
    <span>{label}</span>
    <div className="input-wrap">
      <input
        inputMode="numeric"
        value={displayValue}
        placeholder="0"
        onChange={event => {
          const digits = event.target.value.replace(/\D/g, '')
          onChange(digits ? Number(digits) : 0)
        }}
      />
      <em>{suffix}</em>
    </div>
  </label>
}

const supportOptions = [
  ['glasses', 'Briller og synshjelpemidler'],
  ['dental', 'Tannhelse'],
  ['assistive', 'Tekniske hjelpemidler'],
  ['interpreter', 'Tolk'],
  ['medicine', 'Medisiner og egenandeler'],
  ['mentalHealth', 'Psykisk helse'],
  ['homeCare', 'Hjemmetjenester'],
  ['care', 'Pleie og omsorg'],
  ['disability', 'Uføre- og NAV-ytelser'],
  ['caregiver', 'Pårørendestøtte'],
  ['kindergarten', 'Barnehage og SFO'],
  ['student', 'Studiestøtte'],
] as const

const deductionOptions = [
  ['rentalMaintenance', 'Vedlikehold av skattepliktig utleie'],
  ['rentalOperating', 'Driftskostnader ved utleie'],
  ['union', 'Fagforeningskontingent'],
  ['childcare', 'Pass og stell av barn'],
  ['commute', 'Reise eller pendling til arbeid'],
  ['donations', 'Gaver til godkjente organisasjoner'],
  ['investmentLoss', 'Realisert tap på aksjer eller fond'],
  ['ips', 'Individuell pensjonssparing (IPS)'],
] as const

const incomeStatusOptions: readonly (readonly [UserProfile['incomeType'], string])[] = [
  ['worker', 'Arbeidstaker'],
  ['pensioner', 'Pensjonist'],
  ['both', 'Jobb + pensjon'],
  ['disabled', 'Uføretrygdet'],
  ['youngDisabled', 'Ung ufør'],
  ['aap', 'AAP'],
  ['student', 'Student'],
  ['unemployed', 'Arbeidsledig'],
  ['selfEmployed', 'Selvstendig næringsdrivende'],
]

const incomeStatusLabel = Object.fromEntries(incomeStatusOptions) as Record<UserProfile['incomeType'], string>
const formatPercent = (value: number) => `${new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 1 }).format(value)} %`

const ChoiceGrid = ({
  options,
  selected,
  onToggle,
}: {
  options: readonly (readonly [string, string])[]
  selected: string[]
  onToggle: (id: string) => void
}) => <div className="choice-grid">
  {options.map(([id, label]) => <button
    type="button"
    key={id}
    className={selected.includes(id) ? 'choice selected' : 'choice'}
    aria-pressed={selected.includes(id)}
    onClick={() => onToggle(id)}
  >
    <span>{selected.includes(id) && <Check size={15} />}</span>{label}
  </button>)}
</div>

const Difference = ({ result, annual = false }: { result: PartyResult; annual?: boolean }) => {
  const value = annual ? result.annualDifference : result.monthlyDifference
  return <strong className={value < 0 ? 'negative' : value > 0 ? 'positive' : ''}>
    {value > 0 ? '+' : ''}{kr(value)}
  </strong>
}

function App() {
  const [view, setView] = useState<View>('home')
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [budgetPartyId, setBudgetPartyId] = useState('current')

  const results = useMemo(() => sortPartyResults(parties, profile), [profile])
  const documentedResults = results.filter(result => result.status === 'documented')
  const unclearResults = results.filter(result => result.status === 'unclear')
  const baselineTax = calculateTax(profile)
  const bestResult = documentedResults[0]
  const income = profileIncomes(profile)
  const profileIncome = income.wage + income.selfEmployedIncome + income.pension + income.benefit + income.other + income.rental
  const childrenCount = profile.childrenUnder6 + profile.children6to12 + profile.children13to17
  const selectedBudget = getBudgetScenario(budgetPartyId)
  const selectedParty = parties.find(party => party.id === budgetPartyId)

  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) =>
    setProfile(previous => ({ ...previous, [key]: value }))
  const toggleList = (key: 'supportNeeds' | 'deductionSelections', id: string) =>
    setProfile(previous => ({
      ...previous,
      [key]: previous[key].includes(id)
        ? previous[key].filter(item => item !== id)
        : [...previous[key], id],
    }))
  const navigate = (next: View) => {
    setView(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const steps = [
    {
      title: 'Deg og inntekten din',
      hint: 'Beløp vises med mellomrom, for eksempel 750 000.',
      content: <>
        <div className="grid-2">
          <NumberField label="Alder" value={profile.age} suffix="år" grouped={false} onChange={value => update('age', value)} />
          <label className="field"><span>Bostedskommune</span><input value={profile.municipality} onChange={event => update('municipality', event.target.value)} /></label>
        </div>
        <div className="section-label">Hva beskriver deg best?</div>
        <div className="income-options" role="radiogroup" aria-label="Hovedsituasjon">
          {incomeStatusOptions.map(([id, label]) => <button
            type="button"
            role="radio"
            aria-checked={profile.incomeType === id}
            key={id}
            className={profile.incomeType === id ? 'active' : ''}
            onClick={() => update('incomeType', id)}
          >{profile.incomeType === id && <Check size={14} />}{label}</button>)}
        </div>
        <div className="grid-2">
          {['worker', 'both', 'student', 'selfEmployed'].includes(profile.incomeType) && <NumberField
            label={profile.incomeType === 'selfEmployed' ? 'Årlig næringsinntekt' : 'Brutto årslønn'}
            value={profile.salary}
            onChange={value => update('salary', value)}
          />}
          {['pensioner', 'both'].includes(profile.incomeType) && <NumberField label="Årlig pensjonsinntekt" value={profile.pensionIncome} onChange={value => update('pensionIncome', value)} />}
          {['disabled', 'youngDisabled', 'aap', 'unemployed'].includes(profile.incomeType) && <NumberField label="Årlige skattepliktige ytelser" value={profile.benefitIncome} onChange={value => update('benefitIncome', value)} />}
          <NumberField label="Annen skattepliktig inntekt" value={profile.otherIncome} onChange={value => update('otherIncome', value)} />
        </div>
        <NumberField label="Årlig skattepliktig utleieinntekt før kostnader" value={profile.rentalIncome} onChange={value => update('rentalIncome', value)} />
        <p className="field-help">Ta bare med utleie som er skattepliktig. Vedlikehold og driftskostnader kan føres senere i skjemaet.</p>
      </>,
    },
    {
      title: 'Bolig og gjeld',
      hint: 'Gjeld påvirker formuesskatt, mens betalte renter gir inntektsfradrag.',
      content: <>
        <div className="grid-2">
          <NumberField label="Markedsverdi på bolig" value={profile.homeValue} onChange={value => update('homeValue', value)} />
          <NumberField label="Din eierandel" value={profile.ownershipShare} suffix="%" grouped={false} onChange={value => update('ownershipShare', Math.min(100, value))} />
        </div>
        <div className="grid-2">
          <NumberField label="Samlet gjeld" value={profile.debt} onChange={value => update('debt', value)} />
          <NumberField label="Årlige renteutgifter" value={profile.interestExpenses} onChange={value => update('interestExpenses', value)} />
        </div>
      </>,
    },
    {
      title: 'Formue og barn',
      hint: 'Barnets alder og antall barn kan påvirke fradrag og støtteordninger.',
      content: <>
        <div className="grid-2">
          <NumberField label="Bankinnskudd" value={profile.bankSavings} onChange={value => update('bankSavings', value)} />
          <NumberField label="Aksjer og fond" value={profile.shares} onChange={value => update('shares', value)} />
        </div>
        <div className="section-label">Barn under 18 år</div>
        <div className="grid-3">
          <NumberField label="0–5 år" value={profile.childrenUnder6} suffix="barn" grouped={false} onChange={value => update('childrenUnder6', value)} />
          <NumberField label="6–12 år" value={profile.children6to12} suffix="barn" grouped={false} onChange={value => update('children6to12', value)} />
          <NumberField label="13–17 år" value={profile.children13to17} suffix="barn" grouped={false} onChange={value => update('children13to17', value)} />
        </div>
        <div className="grid-2">
          <NumberField label="Barn i barnehage" value={profile.kindergartenChildren} suffix="barn" grouped={false} onChange={value => update('kindergartenChildren', value)} />
          <NumberField label="Barn i SFO" value={profile.sfoChildren} suffix="barn" grouped={false} onChange={value => update('sfoChildren', value)} />
        </div>
        <button type="button" className={profile.singleParent ? 'single-choice selected' : 'single-choice'} aria-pressed={profile.singleParent} onClick={() => update('singleParent', !profile.singleParent)}>
          <span>{profile.singleParent && <Check size={15} />}</span>Jeg er enslig forsørger
        </button>
      </>,
    },
    {
      title: 'Tjenester og støtte',
      hint: 'Velg områdene som er relevante for deg eller husstanden.',
      content: <>
        <ChoiceGrid options={supportOptions} selected={profile.supportNeeds} onToggle={id => toggleList('supportNeeds', id)} />
        <div className="info-box"><strong>Vises som relevante områder</strong><p>Vi regner bare inn ytelser når partiets beløp, vilkår og virkning for profilen er dokumentert. Resten påvirker ikke rangeringen ennå.</p></div>
      </>,
    },
    {
      title: 'Fradrag og kostnader',
      hint: 'Velg bare fradrag du faktisk mener gjelder for deg.',
      content: <>
        <ChoiceGrid options={deductionOptions} selected={profile.deductionSelections} onToggle={id => toggleList('deductionSelections', id)} />
        {profile.deductionSelections.includes('rentalMaintenance') && <NumberField label="Vedlikeholdskostnader på skattepliktig utleie" value={profile.rentalMaintenance} onChange={value => update('rentalMaintenance', value)} />}
        {profile.deductionSelections.includes('rentalOperating') && <NumberField label="Andre driftskostnader ved skattepliktig utleie" value={profile.rentalOperatingCosts} onChange={value => update('rentalOperatingCosts', value)} />}
        {profile.deductionSelections.includes('union') && <NumberField label="Betalt fagforeningskontingent" value={profile.unionFee} onChange={value => update('unionFee', value)} />}
        {profile.deductionSelections.includes('childcare') && <NumberField label="Utgifter til pass og stell av barn" value={profile.childcareExpenses} onChange={value => update('childcareExpenses', value)} />}
        {profile.deductionSelections.includes('commute') && <NumberField label="Beregnet reisebeløp før egenandel" value={profile.commuteExpenses} onChange={value => update('commuteExpenses', value)} />}
        {profile.deductionSelections.includes('donations') && <NumberField label="Gaver til godkjente organisasjoner" value={profile.donations} onChange={value => update('donations', value)} />}
        {profile.deductionSelections.includes('investmentLoss') && <NumberField label="Realisert tap på aksjer eller fond" value={profile.investmentLosses} onChange={value => update('investmentLosses', value)} />}
        <div className="warning-box"><strong>Forenklet beregning – ikke skatteråd</strong><p>Appen bruker vedtatte grenser der de finnes. Særlige regler, ektefellefordeling og dokumentasjonskrav kan gi et annet resultat i skattemeldingen.</p></div>
      </>,
    },
    {
      title: 'Bil og transport',
      hint: 'Disse opplysningene lagres til avgiftsdelen, men påvirker ikke skatterangeringen ennå.',
      content: <>
        <label className="field"><span>Biltype</span><select value={profile.carType} onChange={event => update('carType', event.target.value as UserProfile['carType'])}><option value="none">Ingen bil</option><option value="fossil">Bensin eller diesel</option><option value="electric">Elbil</option></select></label>
        <div className="grid-2">
          <NumberField label="Kjørelengde per år" value={profile.annualKm} suffix="km" onChange={value => update('annualKm', value)} />
          <NumberField label="Bomutgifter per år" value={profile.tolls} onChange={value => update('tolls', value)} />
        </div>
      </>,
    },
  ]

  const renderResultCard = (result: PartyResult, index?: number) => <article key={result.party.id} className={`party-card ${result.status === 'unclear' ? 'unclear-card' : ''}`}>
    <div className="rank">{index !== undefined ? index + 1 : <AlertTriangle size={17} />}</div>
    <div className="party-logo" style={{ background: result.party.color }}>{result.party.shortName}</div>
    <div className="party-name">
      <h3>{result.party.name}</h3>
      <span>{result.status === 'documented' ? 'Dokumentert beregning' : 'Uavklart – estimat, ikke rangert'}</span>
    </div>
    <div className="effect"><Difference result={result} /><span>per måned mot dagens regler</span></div>
    <details>
      <summary><ChevronDown /> Se beregning og kilde</summary>
      <div className="tax-breakdown">
        <div><span>Skatt med forslaget</span><b>{kr(result.tax.total)}</b></div>
        <div><span>Dagens skatt</span><b>{kr(baselineTax.total)}</b></div>
        <div><span>Forskjell per år</span><Difference result={result} annual /></div>
        {result.estimateRange && <div><span>Mulig skatteintervall</span><b>{kr(result.estimateRange.minimumTax)}–{kr(result.estimateRange.maximumTax)}</b></div>}
      </div>
      {result.party.statusReason && <div className="unclear-reason"><AlertTriangle size={16} /><span>{result.party.statusReason}</span></div>}
      <ul className="highlights">{result.party.highlights.map(highlight => <li key={highlight}>{highlight}</li>)}</ul>
      <a className="source-link" href={result.party.sourceUrl} target="_blank" rel="noreferrer">{result.party.sourceTitle} · {result.party.sourceDate} <ExternalLink size={13} /></a>
    </details>
  </article>

  return <div className="app">
    <header className="site-header">
      <button className="brand" onClick={() => navigate('home')}><span><Landmark size={21} /></span>Hva koster politikken?</button>
      <nav><button onClick={() => navigate('results')}>Partier</button><button onClick={() => navigate('receipt')}>Skattekvittering</button><button onClick={() => navigate('method')}>Metode</button></nav>
    </header>
    <div className="data-banner"><strong>Skatt oppdatert for 2026</strong><span> · Partitall har kilder, og uavklarte estimater rangeres ikke.</span></div>

    <main>
      {view === 'home' && <>
        <section className="hero">
          <div><span className="eyebrow">Politikk oversatt til kroner</span><h1>Hva betyr politikken<br /><i>for din lommebok?</i></h1><p>Fyll inn noen enkle opplysninger. Se beregnet skatt etter vedtatte 2026-regler og sammenlign dokumenterte partiforslag.</p><button className="primary" onClick={() => navigate('form')}>Start beregningen <ArrowRight size={18} /></button><div className="trust"><span><LockKeyhole size={16} />Ingen innlogging</span><span><ShieldCheck size={16} />Data blir i nettleseren</span></div></div>
          <div className="hero-card"><div className="mini-label">Eksempelprofilen på forsiden</div><h3>Best for lommeboken</h3><div className="big-number">{bestResult ? kr(bestResult.monthlyDifference) : '–'} <small>/ mnd.</small></div><div className="mini-bars">{documentedResults.slice(0, 4).map((result, index) => <div key={result.party.id}><span>{result.party.shortName}</span><b style={{ width: `${92 - index * 14}%`, background: result.party.color }} /></div>)}</div><small className="verified-pill">DOKUMENTERTE 2026-TALL</small></div>
        </section>
        <section className="feature-grid">
          <button onClick={() => navigate('form')}><span><Calculator /></span><h3>Beregn din økonomi</h3><p>Progressiv skatt, bunnfradrag, minstefradrag og trygdeavgift.</p><ArrowRight /></button>
          <button onClick={() => navigate('results')}><span><BarChart3 /></span><h3>Best for lommeboken</h3><p>Partiene rangeres etter beregnet skatt for akkurat din profil.</p><ArrowRight /></button>
          <button onClick={() => navigate('receipt')}><span><ReceiptText /></span><h3>Se hvor pengene går</h3><p>Budsjettfordelingen holdes adskilt fra skatterangeringen.</p><ArrowRight /></button>
        </section>
        <section className="principles"><span className="eyebrow">Bygget for tillit</span><h2>Ingen skjulte demotall</h2><p>Alle partiberegninger kan spores til et program eller alternativt statsbudsjett. Mangler en nødvendig sats, blir resultatet merket og flyttet ut av rangeringen.</p><div><span><Check /> Kilde på hvert parti</span><span><Check /> Samme beregningsmetode</span><span><Check /> Uavklart betyr uavklart</span></div></section>
      </>}

      {view === 'form' && <section className="form-page">
        <div className="form-intro"><span className="eyebrow">Steg {step + 1} av {steps.length}</span><h1>{steps[step].title}</h1><p>{steps[step].hint}</p><div className="progress"><i style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div></div>
        <div className="form-card">{steps[step].content}<div className="form-actions">{step > 0 ? <button className="secondary" onClick={() => setStep(value => value - 1)}>Tilbake</button> : <button className="text-button" onClick={() => navigate('home')}>Avbryt</button>}<button className="primary" onClick={() => step < steps.length - 1 ? setStep(value => value + 1) : navigate('results')}>{step < steps.length - 1 ? 'Neste' : 'Se resultatet'} <ArrowRight size={17} /></button></div></div>
        <p className="privacy"><LockKeyhole size={15} /> Opplysningene behandles lokalt og sendes ikke til oss.</p>
      </section>}

      {view === 'results' && <section className="results-page">
        <div className="page-heading"><span className="eyebrow">Din partisammenligning</span><h1>Best for lommeboken</h1><p>Dette betyr lavest beregnet skatt og høyest dokumentert lommebokeffekt – ikke «beste parti».</p></div>
        <div className="result-summary"><div><span>Mest igjen blant dokumenterte forslag</span><h2>{bestResult?.party.name ?? '–'}</h2><p>{bestResult && <><Difference result={bestResult} /> per måned mot dagens regler</>}</p></div><div className="profile-chip">Profil: {profile.age} år · {incomeStatusLabel[profile.incomeType].toLowerCase()} · {kr(profileIncome)} i inntekt · {childrenCount} barn<button onClick={() => navigate('form')}>Endre</button></div></div>
        <div className="baseline-card"><div><span>Dagens beregnede skatt</span><strong>{kr(baselineTax.total)}</strong></div><div><span>Alminnelig inntektsskatt</span><b>{kr(baselineTax.ordinaryIncomeTax)}</b></div><div><span>Trinnskatt</span><b>{kr(baselineTax.bracketTax)}</b></div><div><span>Trygdeavgift</span><b>{kr(baselineTax.socialSecurity)}</b></div><div><span>Formuesskatt</span><b>{kr(baselineTax.wealthTax)}</b></div></div>
        <div className="scope-note"><ShieldCheck size={18} /><p><strong>Rangeringen gjelder det vi kan beregne.</strong> Skatt, valgte fradrag og konkrete skattefradrag er med. Generelle løfter, offentlige tjenester og avgiftsendringer uten nok profilinformasjon er ikke gitt oppdiktede kroneverdier.</p></div>
        <div className="party-list">{documentedResults.map((result, index) => renderResultCard(result, index))}</div>
        {unclearResults.length > 0 && <div className="unclear-section"><div className="section-heading"><AlertTriangle /><div><h2>Uavklarte estimater</h2><p>Disse vises for å gi informasjon, men kan ikke vinne rangeringen.</p></div></div><div className="party-list">{unclearResults.map(result => renderResultCard(result))}</div></div>}
        <div className="bottom-actions"><button className="secondary" onClick={() => navigate('form')}>Endre opplysninger</button><button className="primary" onClick={() => navigate('receipt')}>Se budsjettfordeling <ArrowRight size={17} /></button></div>
      </section>}

      {view === 'receipt' && <section className="receipt-page">
        <div className="page-heading"><span className="eyebrow">Budsjettfordeling</span><h1>Hva brukes fellesskapets penger på?</h1><p>Velg et parti. Vi viser aldri konstruerte partiforskjeller som om de var fakta.</p></div>
        <div className="budget-selector"><button className={budgetPartyId === 'current' ? 'active' : ''} onClick={() => setBudgetPartyId('current')}>Dagens fordeling</button>{parties.map(party => <button key={party.id} className={budgetPartyId === party.id ? 'active' : ''} onClick={() => setBudgetPartyId(party.id)}>{party.shortName}</button>)}</div>
        <div className="tax-total"><span>Din beregnede skatt etter vedtatte 2026-regler</span><strong>{kr(baselineTax.total)}</strong><small>Skatteberegningen er separat fra den foreløpige budsjettgrafikken.</small></div>
        {selectedBudget ? <div className="budget-comparison"><div className="budget-visual"><div className="donut" style={{ background: `conic-gradient(${selectedBudget.map((item, index) => { const start = selectedBudget.slice(0, index).reduce((sum, entry) => sum + entry.percent, 0); return `${item.color} ${start}% ${start + item.percent}%` }).join(',')})` }}><div><strong>100 %</strong><span>Foreløpig gruppering</span></div></div><span className="estimate-pill">IKKE OFFISIELL STATSKONTO</span></div><div className="budget-table">{currentBudget.map(item => <div className="budget-row" key={item.name}><span><i style={{ background: item.color }} />{item.name}</span><strong>{formatPercent(item.percent)}</strong></div>)}</div></div> : <div className="budget-empty"><AlertTriangle /><h2>{selectedParty?.name}: ikke ferdig normalisert</h2><p>Partiets alternative statsbudsjett finnes, men utgiftene er ennå ikke omregnet til samme kategorier og prosenter. Derfor viser vi ingen oppdiktet fordeling.</p><a href={selectedParty?.sourceUrl} target="_blank" rel="noreferrer">Åpne partiets kilde <ExternalLink size={14} /></a></div>}
        <div className="notice"><ShieldCheck /><div><strong>Hvorfor er partivisningen tom?</strong><p>Alternative budsjetter bruker ulike tabeller og kategorier. Før de kan sammenlignes må alle beløp normaliseres mot samme statsbudsjettgrunnlag. Dette påvirker ikke skatteberegningen.</p></div></div>
      </section>}

      {view === 'method' && <section className="method-page">
        <div className="page-heading"><span className="eyebrow">Åpen metode</span><h1>Slik regner appen</h1><p>Samme profil og beregningsmotor brukes for alle partier.</p></div>
        <div className="method-grid"><article><b>1</b><h3>Vedtatte regler</h3><p>2026-reglene er grunnlinjen: 22 % skatt på alminnelig inntekt, progressive skattetrinn, trygdeavgift og faktiske fradragsgrenser.</p></article><article><b>2</b><h3>Partiets tall</h3><p>Personfradrag, trinn, satser og konkrete skattefradrag erstattes med partiets dokumenterte forslag.</p></article><article><b>3</b><h3>Nøytral sortering</h3><p>Lavest beregnet skatt kommer øverst. Uavklarte estimater vises i en egen, ikke-rangert del.</p></article></div>
        <div className="method-copy"><h2>Hva beregnes?</h2><p>Modellen tar med lønn eller trygd, pensjon, skattepliktig utleie, personfradrag, minstefradrag, renteutgifter, valgte standardfradrag, trinnskatt, trygdeavgift og en forenklet formuesskatt. For pensjon brukes også skattefradraget for pensjonsinntekt.</p><h2>Hva er foreløpig utenfor?</h2><p>Kommunale forskjeller, ektefellefordeling, den tilfeldige forsøksordningen med arbeidsfradrag for unge, detaljert skatt på aksjeutbytte og alle forbruksavgifter er ikke med. Tjenester og ytelser tas bare med når de kan knyttes til konkrete vilkår og beløp.</p><h2>Kontrollpunkt: 130 000 kr i lønn</h2><p>Med ingen annen inntekt gir vedtatte 2026-regler omtrent 7 588 kr i trygdeavgift og ingen alminnelig inntektsskatt eller trinnskatt. Dette er lagt inn som automatisk test.</p><a className="source-link" href="https://www.regjeringen.no/no/tema/okonomi-og-budsjett/skatter-og-avgifter/skatte-og-avgiftssatser/skattesatser-2026/id3121978/" target="_blank" rel="noreferrer">Finansdepartementets vedtatte skattesatser 2026 <ExternalLink size={13} /></a><br /><button className="secondary" onClick={() => { setProfile(defaultProfile); setStep(0); navigate('form') }}><RotateCcw size={16} /> Nullstill opplysninger</button></div>
      </section>}
    </main>

    <footer><div><strong>Hva koster politikken?</strong><span>En åpen og nøytral beregningsprototype.</span></div><nav><button onClick={() => navigate('method')}>Metode og personvern</button><a href="https://github.com/Hva-koster-politikken/hva-koster-politikken">Åpen kildekode</a></nav></footer>
  </div>
}

export default App
