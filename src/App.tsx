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
import { budgetShare, budgetTotal, currentBudget, getBudgetScenario } from './data/budget'
import {
  calculateRentalAlternatives,
  calculateTax,
  defaultProfile,
  kr,
  numberWithSpaces,
  profileIncomes,
  rentalResult,
  sortPartyResults,
} from './lib/calculations'
import type { IncomeType, PartyResult, RentalTaxMode, UserProfile } from './types'

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
  ['union', 'Fagforeningskontingent'],
  ['childcare', 'Pass og stell av barn'],
  ['commute', 'Reise eller pendling til arbeid'],
  ['donations', 'Gaver til godkjente organisasjoner'],
  ['investmentLoss', 'Realisert tap på aksjer eller fond'],
  ['ips', 'Individuell pensjonssparing (IPS)'],
] as const

const incomeStatusOptions: readonly (readonly [IncomeType, string])[] = [
  ['worker', 'Arbeidstaker'],
  ['selfEmployed', 'ENK / selvstendig'],
  ['pensioner', 'Pensjonist'],
  ['disabled', 'Uføretrygdet'],
  ['youngDisabled', 'Ung ufør'],
  ['aap', 'AAP'],
  ['student', 'Student'],
  ['unemployed', 'Arbeidsledig'],
]

const rentalOptions: readonly (readonly [RentalTaxMode, string, string])[] = [
  ['none', 'Ingen utleie', 'Ingen leieinntekt føres i beregningen.'],
  ['taxFree', 'Skattefri utleie', 'Leieinntekten vises i profilen, men skattlegges ikke.'],
  ['privateTaxable', 'Skattepliktig privat utleie', 'Overskudd skattlegges normalt med 22 %. Underskudd kan gi fradrag.'],
  ['business', 'Utleie som næring', 'Overskudd behandles som næringsinntekt og kan få trinnskatt og trygdeavgift.'],
  ['uncertain', 'Usikker', 'Privat utleie brukes i rangeringen, og begge alternativer vises i resultatet.'],
]

const incomeStatusLabel = Object.fromEntries(incomeStatusOptions) as Record<IncomeType, string>
const supportLabel = Object.fromEntries(supportOptions) as Record<string, string>
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
  const rentalAlternatives = calculateRentalAlternatives(profile)
  const bestResult = documentedResults[0]
  const income = profileIncomes(profile)
  const profileIncome = income.wage + income.selfEmployedIncome + income.pension + income.benefit + income.other +
    (profile.rentalTaxMode === 'none' ? 0 : income.rental)
  const childrenCount = profile.childrenUnder6 + profile.children6to12 + profile.children13to17
  const selectedBudget = getBudgetScenario(budgetPartyId)
  const selectedBudgetTotal = budgetTotal(selectedBudget)
  const selectedPartyResult = results.find(result => result.party.id === budgetPartyId)
  const receiptTax = budgetPartyId === 'current' ? baselineTax : selectedPartyResult?.tax ?? baselineTax
  const selectedStatuses = profile.incomeTypes.length > 0
    ? profile.incomeTypes.map(type => incomeStatusLabel[type].toLowerCase()).join(' + ')
    : 'ingen valgt inntektstype'
  const selectedSupportLabels = profile.supportNeeds.map(id => supportLabel[id]).filter(Boolean)
  const taxableRental = ['privateTaxable', 'business', 'uncertain'].includes(profile.rentalTaxMode)
  const netRental = rentalResult(profile)

  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) =>
    setProfile(previous => ({ ...previous, [key]: value }))
  const toggleList = (key: 'supportNeeds' | 'deductionSelections', id: string) =>
    setProfile(previous => ({
      ...previous,
      [key]: previous[key].includes(id)
        ? previous[key].filter(item => item !== id)
        : [...previous[key], id],
    }))
  const toggleIncome = (id: string) => setProfile(previous => ({
    ...previous,
    incomeTypes: previous.incomeTypes.includes(id as IncomeType)
      ? previous.incomeTypes.filter(item => item !== id)
      : [...previous.incomeTypes, id as IncomeType],
  }))
  const navigate = (next: View) => {
    setView(next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const steps = [
    {
      title: 'Deg og inntektene dine',
      hint: 'Velg alle situasjoner som gjelder. Beløp vises med mellomrom, for eksempel 750 000.',
      content: <>
        <div className="grid-2">
          <NumberField label="Alder" value={profile.age} suffix="år" grouped={false} onChange={value => update('age', value)} />
          <label className="field"><span>Bostedskommune</span><input value={profile.municipality} onChange={event => update('municipality', event.target.value)} /></label>
        </div>
        <label className="field"><span>Formue skattlegges som</span><select value={profile.civilStatus} onChange={event => update('civilStatus', event.target.value as UserProfile['civilStatus'])}><option value="single">Enslig</option><option value="joint">Ektefeller / skattlegges samlet</option></select></label>
        <div className="section-label">Velg alle som beskriver deg</div>
        <ChoiceGrid options={incomeStatusOptions} selected={profile.incomeTypes} onToggle={toggleIncome} />
        <div className="grid-2">
          {profile.incomeTypes.includes('worker') && <NumberField label="Brutto årslønn" value={profile.salary} onChange={value => update('salary', value)} />}
          {profile.incomeTypes.includes('selfEmployed') && <NumberField label="Årlig næringsinntekt fra ENK" value={profile.selfEmployedIncome} onChange={value => update('selfEmployedIncome', value)} />}
          {profile.incomeTypes.includes('pensioner') && <NumberField label="Årlig pensjonsinntekt" value={profile.pensionIncome} onChange={value => update('pensionIncome', value)} />}
          {profile.incomeTypes.some(type => ['disabled', 'youngDisabled', 'aap', 'unemployed'].includes(type)) && <NumberField label="Årlige skattepliktige NAV-ytelser" value={profile.benefitIncome} onChange={value => update('benefitIncome', value)} />}
          <NumberField label="Annen skattepliktig inntekt" value={profile.otherIncome} onChange={value => update('otherIncome', value)} />
        </div>
        <p className="field-help">Lønn, næringsinntekt, pensjon og ytelser beregnes som egne inntektstyper. Du kan for eksempel kombinere 500 000 kr i lønn med 125 000 kr fra ENK.</p>
      </>,
    },
    {
      title: 'Utleie',
      hint: 'Velg først om utleien er skattefri, privat skattepliktig eller næringsvirksomhet.',
      content: <>
        <div className="rental-options" role="radiogroup" aria-label="Skatt på utleie">
          {rentalOptions.map(([id, label, description]) => <button
            type="button"
            role="radio"
            aria-checked={profile.rentalTaxMode === id}
            key={id}
            className={profile.rentalTaxMode === id ? 'active' : ''}
            onClick={() => update('rentalTaxMode', id)}
          ><span>{profile.rentalTaxMode === id && <Check size={14} />}</span><div><b>{label}</b><small>{description}</small></div></button>)}
        </div>
        {profile.rentalTaxMode !== 'none' && <NumberField label="Brutto leieinntekter før kostnader" value={profile.rentalIncome} onChange={value => update('rentalIncome', value)} />}
        {taxableRental && <>
          <div className="grid-2">
            <NumberField label="Fradragsberettiget vedlikehold" value={profile.rentalMaintenance} onChange={value => update('rentalMaintenance', value)} />
            <NumberField label="Andre fradragsberettigede driftskostnader" value={profile.rentalOperatingCosts} onChange={value => update('rentalOperatingCosts', value)} />
          </div>
          <NumberField label="Påkostning / standardheving (ikke direkte fradrag)" value={profile.rentalImprovements} onChange={value => update('rentalImprovements', value)} />
          <div className="rental-preview"><span>Beregnet skattepliktig resultat</span><strong className={netRental < 0 ? 'rental-loss' : ''}>{kr(netRental)}</strong><small>{netRental < 0 ? 'Underskudd reduserer alminnelig inntekt i den forenklede modellen.' : 'Brutto leie minus vedlikehold og driftskostnader.'}</small></div>
        </>}
        {profile.rentalTaxMode === 'taxFree' && <div className="info-box"><strong>Skattefri utleie</strong><p>Beløpet vises som del av profilen, men påvirker ikke skatt eller partirangering.</p></div>}
        {profile.rentalTaxMode === 'uncertain' && <div className="warning-box"><strong>Begge alternativer vises senere</strong><p>Privat skattepliktig utleie brukes i hovedrangeringen. Resultatsiden viser også hva samme profil gir dersom utleien behandles som næring.</p></div>}
      </>,
    },
    {
      title: 'Bolig og gjeld',
      hint: 'Primærbolig og sekundærbolig verdsettes forskjellig i formuesskatten.',
      content: <>
        <div className="grid-2">
          <NumberField label="Markedsverdi på primærbolig" value={profile.homeValue} onChange={value => update('homeValue', value)} />
          <NumberField label="Din eierandel i primærboligen" value={profile.ownershipShare} suffix="%" grouped={false} onChange={value => update('ownershipShare', Math.min(100, value))} />
        </div>
        <div className="grid-2">
          <NumberField label="Din andel av sekundær-/utleieboliger" value={profile.secondaryHomeValue} onChange={value => update('secondaryHomeValue', value)} />
          <NumberField label="Anslått verdi på fritidsbolig" value={profile.holidayHomeValue} onChange={value => update('holidayHomeValue', value)} />
        </div>
        <div className="grid-2">
          <NumberField label="Samlet gjeld" value={profile.debt} onChange={value => update('debt', value)} />
          <NumberField label="Årlige renteutgifter" value={profile.interestExpenses} onChange={value => update('interestExpenses', value)} />
        </div>
        <p className="field-help">Skriv markedsverdi, ikke formuesverdi. Appen bruker deretter partiets verdsettelsesregler. Gjeld trekkes forenklet fra samlet skattemessig formue.</p>
      </>,
    },
    {
      title: 'Formue og barn',
      hint: 'Formuen vises som egen del av partisammenligningen.',
      content: <>
        <div className="grid-2">
          <NumberField label="Bankinnskudd" value={profile.bankSavings} onChange={value => update('bankSavings', value)} />
          <NumberField label="Aksjer og fond" value={profile.shares} onChange={value => update('shares', value)} />
          <NumberField label="Verdier i ENK / driftsmidler" value={profile.businessAssets} onChange={value => update('businessAssets', value)} />
          <NumberField label="Annen skattepliktig formue" value={profile.otherWealth} onChange={value => update('otherWealth', value)} />
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
        <div className="info-box"><strong>Vises som relevante områder</strong><p>Briller, hjelpemidler, tolk, tannhelse og andre tjenester påvirker bare kroneberegningen når et parti har oppgitt beløp og vilkår som kan knyttes til profilen. Ellers vises de som politisk relevant informasjon.</p></div>
      </>,
    },
    {
      title: 'Andre fradrag',
      hint: 'Utleiekostnadene er allerede ført i eget steg. Velg andre fradrag som gjelder for deg.',
      content: <>
        <ChoiceGrid options={deductionOptions} selected={profile.deductionSelections} onToggle={id => toggleList('deductionSelections', id)} />
        {profile.deductionSelections.includes('union') && <NumberField label="Betalt fagforeningskontingent" value={profile.unionFee} onChange={value => update('unionFee', value)} />}
        {profile.deductionSelections.includes('childcare') && <NumberField label="Utgifter til pass og stell av barn" value={profile.childcareExpenses} onChange={value => update('childcareExpenses', value)} />}
        {profile.deductionSelections.includes('commute') && <NumberField label="Beregnet reisebeløp før egenandel" value={profile.commuteExpenses} onChange={value => update('commuteExpenses', value)} />}
        {profile.deductionSelections.includes('donations') && <NumberField label="Gaver til godkjente organisasjoner" value={profile.donations} onChange={value => update('donations', value)} />}
        {profile.deductionSelections.includes('investmentLoss') && <NumberField label="Realisert tap på aksjer eller fond" value={profile.investmentLosses} onChange={value => update('investmentLosses', value)} />}
        {profile.deductionSelections.includes('ips') && <NumberField label="Innbetalt til IPS" value={profile.ipsContribution} onChange={value => update('ipsContribution', value)} />}
        <div className="warning-box"><strong>Forenklet beregning – ikke skatteråd</strong><p>Særlige regler, dokumentasjonskrav, kommunale variasjoner og fordeling mellom ektefeller kan gi et annet resultat i skattemeldingen.</p></div>
      </>,
    },
    {
      title: 'Bil og transport',
      hint: 'Opplysningene brukes til å vise relevante avgiftsområder, men er foreløpig ikke satt til en oppdiktet kroneverdi.',
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
      <span>{result.status === 'documented' ? 'Konkret 2026-forslag' : 'Uavklart – tydelig merket estimat'}</span>
    </div>
    <div className="effect"><Difference result={result} /><span>per måned mot dagens regler</span></div>
    <details>
      <summary><ChevronDown /> Se beregning og kilde</summary>
      <div className="tax-breakdown">
        <div><span>Samlet skatt</span><b>{kr(result.tax.total)}</b></div>
        <div><span>Dagens skatt</span><b>{kr(baselineTax.total)}</b></div>
        <div><span>Forskjell per år</span><Difference result={result} annual /></div>
        <div><span>Formuesskatt</span><b>{kr(result.tax.wealthTax)}</b></div>
        {taxableRental && <div><span>Utleieresultat</span><b>{kr(result.tax.netRentalIncome)}</b></div>}
        {taxableRental && <div><span>Skatteeffekt av utleie</span><b>{result.tax.rentalTaxEffect > 0 ? '+' : ''}{kr(result.tax.rentalTaxEffect)}</b></div>}
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
    <div className="data-banner"><strong>Skatt oppdatert for 2026</strong><span> · Konkrete forslag og anslag merkes forskjellig.</span></div>

    <main>
      {view === 'home' && <>
        <section className="hero">
          <div><span className="eyebrow">Politikk oversatt til kroner</span><h1>Hva betyr politikken<br /><i>for din lommebok?</i></h1><p>Legg inn flere inntekter, utleie, bolig, gjeld og formue. Se hva partienes konkrete 2026-forslag kan bety for deg.</p><button className="primary" onClick={() => navigate('form')}>Start beregningen <ArrowRight size={18} /></button><div className="trust"><span><LockKeyhole size={16} />Ingen innlogging</span><span><ShieldCheck size={16} />Data blir i nettleseren</span></div></div>
          <div className="hero-card"><div className="mini-label">Eksempelprofilen på forsiden</div><h3>Best for lommeboken</h3><div className="big-number">{bestResult ? kr(bestResult.monthlyDifference) : '–'} <small>/ mnd.</small></div><div className="mini-bars">{documentedResults.slice(0, 4).map((result, index) => <div key={result.party.id}><span>{result.party.shortName}</span><b style={{ width: `${92 - index * 14}%`, background: result.party.color }} /></div>)}</div><small className="verified-pill">KONKRETE 2026-FORSLAG</small></div>
        </section>
        <section className="feature-grid">
          <button onClick={() => navigate('form')}><span><Calculator /></span><h3>Beregn din økonomi</h3><p>Flere inntekter, utleie, progressive skatter, fradrag og formue.</p><ArrowRight /></button>
          <button onClick={() => navigate('results')}><span><BarChart3 /></span><h3>Best for lommeboken</h3><p>Lavest beregnet skatt kommer øverst. Det betyr ikke «beste parti».</p><ArrowRight /></button>
          <button onClick={() => navigate('receipt')}><span><ReceiptText /></span><h3>Skattekvittering</h3><p>Se anslått budsjettstørrelse, fordeling i prosent og din andel i kroner.</p><ArrowRight /></button>
        </section>
        <section className="principles"><span className="eyebrow">Bygget for tillit</span><h2>Samme metode for alle</h2><p>Partier med konkrete tall beregnes først. Uavklarte anslag merkes tydelig og plasseres under den dokumenterte rangeringen.</p><div><span><Check /> Kilde på hvert parti</span><span><Check /> Progressiv beregning</span><span><Check /> Anslag merkes</span></div></section>
      </>}

      {view === 'form' && <section className="form-page">
        <div className="form-intro"><span className="eyebrow">Steg {step + 1} av {steps.length}</span><h1>{steps[step].title}</h1><p>{steps[step].hint}</p><div className="progress"><i style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div></div>
        <div className="form-card">{steps[step].content}<div className="form-actions">{step > 0 ? <button className="secondary" onClick={() => setStep(value => value - 1)}>Tilbake</button> : <button className="text-button" onClick={() => navigate('home')}>Avbryt</button>}<button className="primary" onClick={() => step < steps.length - 1 ? setStep(value => value + 1) : navigate('results')}>{step < steps.length - 1 ? 'Neste' : 'Se resultatet'} <ArrowRight size={17} /></button></div></div>
        <p className="privacy"><LockKeyhole size={15} /> Opplysningene behandles lokalt og sendes ikke til oss.</p>
      </section>}

      {view === 'results' && <section className="results-page">
        <div className="page-heading"><span className="eyebrow">Din partisammenligning</span><h1>Best for lommeboken</h1><p>Dette betyr lavest beregnet skatt for profilen – ikke hvilket parti som er best totalt sett.</p></div>
        <div className="result-summary"><div><span>Mest igjen blant konkrete forslag</span><h2>{bestResult?.party.name ?? '–'}</h2><p>{bestResult && <><Difference result={bestResult} /> per måned mot dagens regler</>}</p></div><div className="profile-chip">Profil: {profile.age} år · {selectedStatuses} · {kr(profileIncome)} i brutto inntekter · {childrenCount} barn<button onClick={() => navigate('form')}>Endre</button></div></div>
        <div className="baseline-card"><div><span>Dagens beregnede skatt</span><strong>{kr(baselineTax.total)}</strong></div><div><span>Alminnelig inntektsskatt</span><b>{kr(baselineTax.ordinaryIncomeTax)}</b></div><div><span>Trinnskatt</span><b>{kr(baselineTax.bracketTax)}</b></div><div><span>Trygdeavgift</span><b>{kr(baselineTax.socialSecurity)}</b></div><div><span>Formuesskatt</span><b>{kr(baselineTax.wealthTax)}</b></div>{taxableRental && <div><span>Skatteeffekt av utleie</span><b>{baselineTax.rentalTaxEffect > 0 ? '+' : ''}{kr(baselineTax.rentalTaxEffect)}</b></div>}</div>
        <div className="wealth-summary"><div><span>Forenklet skattemessig nettoformue</span><strong>{kr(baselineTax.taxableWealth)}</strong></div><div><span>Dagens formuesskatt</span><strong>{kr(baselineTax.wealthTax)}</strong></div><p>Primærbolig, sekundærbolig, aksjer, driftsmidler og gjeld verdsettes forskjellig. Åpne hvert parti for å se partiets beregnede formuesskatt.</p></div>
        {taxableRental && <div className="rental-result-card"><div><span>Brutto leie</span><b>{kr(profile.rentalIncome)}</b></div><div><span>Fradragskostnader</span><b>{kr(profile.rentalMaintenance + profile.rentalOperatingCosts)}</b></div><div><span>Skattepliktig resultat</span><b>{kr(netRental)}</b></div><div><span>Skatteeffekt</span><b>{baselineTax.rentalTaxEffect > 0 ? '+' : ''}{kr(baselineTax.rentalTaxEffect)}</b></div></div>}
        {profile.rentalTaxMode === 'uncertain' && <div className="uncertain-rental"><AlertTriangle /><div><strong>Utleien er merket «usikker»</strong><p>Privat utleie gir beregnet skatt på {kr(rentalAlternatives.privateTaxable.total)}. Behandling som næring gir {kr(rentalAlternatives.business.total)}. Partirangeringen bruker privat utleie som hovedestimat.</p></div></div>}
        {selectedSupportLabels.length > 0 && <div className="selected-services"><strong>Tjenester som er relevante for profilen</strong><div>{selectedSupportLabels.map(label => <span key={label}>{label}</span>)}</div><p>Disse vises som relevante politikkområder, men påvirker bare kronebeløpet når et konkret forslag kan knyttes til profilen.</p></div>}
        <div className="scope-note"><ShieldCheck size={18} /><p><strong>Rangeringen gjelder det vi kan beregne.</strong> Skatt, formue, utleie og valgte fradrag er med. Tjenester og avgifter uten et dokumentert beløp for profilen får ikke en oppdiktet kroneverdi.</p></div>
        <div className="party-list">{documentedResults.map((result, index) => renderResultCard(result, index))}</div>
        {unclearResults.length > 0 && <div className="unclear-section"><div className="section-heading"><AlertTriangle /><div><h2>Uavklarte eller delvise estimater</h2><p>Alle partiene vises, men disse kan ikke vinne rangeringen før nødvendige satser er klare.</p></div></div><div className="party-list">{unclearResults.map(result => renderResultCard(result))}</div></div>}
        <div className="bottom-actions"><button className="secondary" onClick={() => navigate('form')}>Endre opplysninger</button><button className="primary" onClick={() => navigate('receipt')}>Se skattekvittering <ArrowRight size={17} /></button></div>
      </section>}

      {view === 'receipt' && <section className="receipt-page">
        <div className="page-heading"><span className="eyebrow">Skattekvittering og budsjettfordeling</span><h1>Hva vil partiet bruke pengene på?</h1><p>Velg parti. Konkrete årsbudsjett og langsiktige programmål vises hver for seg.</p></div>
        <div className="budget-selector"><button className={budgetPartyId === 'current' ? 'active' : ''} onClick={() => setBudgetPartyId('current')}>Dagens budsjett</button>{parties.map(party => <button key={party.id} className={budgetPartyId === party.id ? 'active' : ''} onClick={() => setBudgetPartyId(party.id)}>{party.shortName}</button>)}</div>
        <div className="tax-total"><span>{budgetPartyId === 'current' ? 'Din skatt etter vedtatte 2026-regler' : `Din beregnede skatt med ${selectedBudget.label}`}</span><strong>{kr(receiptTax.total)}</strong><small>Under fordeles beløpet etter det valgte budsjettets forenklede utgiftsandeler.</small></div>
        <div className="budget-size"><div><span>Anslått størrelse på statsbudsjettet</span><strong>{numberWithSpaces(selectedBudgetTotal)}</strong><small>Dagens nivå = 100</small></div><div><span>Forskjell fra dagens nivå</span><strong className={selectedBudgetTotal > 100 ? 'budget-up' : selectedBudgetTotal < 100 ? 'budget-down' : ''}>{selectedBudgetTotal > 100 ? '+' : ''}{formatPercent(selectedBudgetTotal - 100)}</strong><small>{selectedBudget.confidence === 'grouped-baseline' ? 'Forenklet gruppert grunnlinje' : selectedBudget.confidence === 'very-uncertain' ? 'Svært usikkert programestimat' : 'Forenklet retningsestimat'}</small></div><p>{selectedBudget.note}</p></div>
        <div className="budget-comparison"><div className="budget-visual"><div className="donut" style={{ background: `conic-gradient(${selectedBudget.items.map((item, index) => { const start = selectedBudget.items.slice(0, index).reduce((sum, entry) => sum + budgetShare(selectedBudget, entry), 0); const share = budgetShare(selectedBudget, item); return `${item.color} ${start}% ${start + share}%` }).join(',')})` }}><div><strong>100 %</strong><span>av valgt budsjett</span></div></div><span className={selectedBudget.confidence === 'grouped-baseline' ? 'verified-pill' : 'estimate-pill'}>{selectedBudget.confidence === 'grouped-baseline' ? 'FORENKLET GRUNNLINJE' : 'TYDELIG MERKET ESTIMAT'}</span></div><div className="budget-table"><div className="budget-table-head"><span>Område</span><span>Andel</span><span>Din skatt</span><span>Indeksdiff.</span></div>{selectedBudget.items.map(item => { const share = budgetShare(selectedBudget, item); const currentItem = currentBudget.find(entry => entry.id === item.id); const difference = item.amount - (currentItem?.amount ?? 0); return <div className="budget-row" key={item.id}><span><i style={{ background: item.color }} />{item.name}</span><strong>{formatPercent(share)}</strong><strong>{kr(receiptTax.total * share / 100)}</strong><small className={difference > 0 ? 'budget-up' : difference < 0 ? 'budget-down' : ''}>{difference > 0 ? '+' : ''}{new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 1 }).format(difference)}</small></div>})}</div></div>
        <div className="budget-basis"><article><span>Konkret grunnlag</span><h3>{selectedBudget.budgetTitle}</h3><p>Dette grunnlaget brukes for retningen i 2026-visningen.</p><a href={selectedBudget.budgetUrl} target="_blank" rel="noreferrer">Åpne budsjettkilden <ExternalLink size={13} /></a></article><article><span>Langsiktig program</span><h3>{selectedBudget.programTitle}</h3><p>{selectedBudget.longTermGoal}</p><a href={selectedBudget.programUrl} target="_blank" rel="noreferrer">Åpne partiprogrammet <ExternalLink size={13} /></a></article></div>
        <div className="notice"><ShieldCheck /><div><strong>Prosentene og budsjettstørrelsen er forenklede</strong><p>Alternative budsjetter bruker ulike tabeller og kategorier. Appen viser derfor en sammenlignbar retningsmodell, ikke et offisielt statsregnskap. Totalindeksen gjør samtidig synlig at partiene kan ønske et større eller mindre budsjett enn dagens.</p></div></div>
      </section>}

      {view === 'method' && <section className="method-page">
        <div className="page-heading"><span className="eyebrow">Åpen metode</span><h1>Slik regner appen</h1><p>Samme profil og beregningsmotor brukes for alle partier.</p></div>
        <div className="method-grid"><article><b>1</b><h3>Vedtatte regler</h3><p>2026-reglene er grunnlinjen: personfradrag, minstefradrag, progressive skattetrinn, trygdeavgift og formuesskatt.</p></article><article><b>2</b><h3>Partiets årsbudsjett</h3><p>Konkrete fradrag, satser, trinn og verdsettelsesregler erstatter dagens regler der partiet har oppgitt tall.</p></article><article><b>3</b><h3>Nøytral sortering</h3><p>Lavest beregnet skatt kommer øverst. Uavklarte estimater vises under partiene med konkrete beregninger.</p></article></div>
        <div className="method-copy"><h2>Flere inntekter</h2><p>Lønn, ENK, pensjon, NAV-ytelser, annen inntekt og utleie kan kombineres. De behandles etter ulike skatteregler og slås først sammen etter at hver type er klassifisert.</p><h2>Utleie</h2><p>Skattefri utleie påvirker ikke skatten. Ved privat skattepliktig utleie skattlegges overskuddet normalt som alminnelig inntekt, mens fradragsberettiget underskudd kan redusere annen alminnelig inntekt. Påkostning gir ikke direkte fradrag. Næringsutleie beregnes som næringsinntekt.</p><h2>Forenklet formue</h2><p>Primærbolig, sekundærbolig, fritidsbolig, bank, aksjer, driftsmidler og annen formue får egne verdsettelsesregler. Gjeld trekkes forenklet fra samlet skattemessig formue. Resultatet er et estimat, ikke en skattemelding.</p><h2>Budsjettfordeling</h2><p>Årsbudsjettet og partiprogrammet vises separat. Fordelingen normaliseres til felles kategorier, mens en egen indeks viser om partiet anslås å ville ha et større eller mindre totalbudsjett.</p><h2>Kontrollpunkt: 130 000 kr i lønn</h2><p>Med ingen annen inntekt gir vedtatte 2026-regler omtrent 7 588 kr i trygdeavgift og ingen alminnelig inntektsskatt eller trinnskatt. Dette kontrolleres automatisk.</p><a className="source-link" href="https://www.regjeringen.no/no/tema/okonomi-og-budsjett/skatter-og-avgifter/skatte-og-avgiftssatser/skattesatser-2026/id3121978/" target="_blank" rel="noreferrer">Finansdepartementets vedtatte skattesatser 2026 <ExternalLink size={13} /></a><br /><button className="secondary" onClick={() => { setProfile(defaultProfile); setStep(0); navigate('form') }}><RotateCcw size={16} /> Nullstill opplysninger</button></div>
      </section>}
    </main>

    <footer><div><strong>Hva koster politikken?</strong><span>En åpen og nøytral beregningsprototype.</span></div><nav><button onClick={() => navigate('method')}>Metode og personvern</button><a href="https://github.com/Hva-koster-politikken/hva-koster-politikken">Åpen kildekode</a></nav></footer>
  </div>
}

export default App
