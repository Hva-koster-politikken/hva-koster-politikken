import { useMemo, useState } from 'react'
import { ArrowRight, BarChart3, Calculator, Check, ChevronDown, Landmark, LockKeyhole, ReceiptText, RotateCcw, ShieldCheck } from 'lucide-react'
import { parties } from './data/parties'
import { currentBudget, getBudgetScenario } from './data/budget'
import { defaultProfile, estimateTax, kr, partyEffect, sortParties } from './lib/calculations'
import type { UserProfile } from './types'

type View = 'home' | 'form' | 'results' | 'receipt' | 'method'

const NumberField = ({ label, value, onChange, suffix = 'kr' }: { label: string; value: number; onChange: (n: number) => void; suffix?: string }) => (
  <label className="field">
    <span>{label}</span>
    <div className="input-wrap"><input type="number" min="0" value={value || ''} onChange={e => onChange(Math.max(0, Number(e.target.value)))} /><em>{suffix}</em></div>
  </label>
)

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
  ['worker', 'Arbeidstaker'], ['pensioner', 'Pensjonist'], ['both', 'Jobb + pensjon'],
  ['disabled', 'Uføretrygdet'], ['youngDisabled', 'Ung ufør'], ['aap', 'AAP'],
  ['student', 'Student'], ['unemployed', 'Arbeidsledig'], ['selfEmployed', 'Selvstendig næringsdrivende'],
]

const incomeStatusLabel = Object.fromEntries(incomeStatusOptions) as Record<UserProfile['incomeType'], string>
const formatPercent = (value: number) => `${new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 1 }).format(value)} %`

const ChoiceGrid = ({ options, selected, onToggle }: { options: readonly (readonly [string, string])[]; selected: string[]; onToggle: (id: string) => void }) => (
  <div className="choice-grid">{options.map(([id, label]) => <button type="button" key={id} className={selected.includes(id) ? 'choice selected' : 'choice'} aria-pressed={selected.includes(id)} onClick={() => onToggle(id)}><span>{selected.includes(id) && <Check size={15} />}</span>{label}</button>)}</div>
)

function App() {
  const [view, setView] = useState<View>('home')
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const [budgetPartyId, setBudgetPartyId] = useState('current')
  const ranked = useMemo(() => sortParties(parties, profile), [profile])
  const tax = estimateTax(profile)
  const childrenCount = profile.childrenUnder6 + profile.children6to12 + profile.children13to17
  const salaryIncome = ['worker', 'both', 'student', 'selfEmployed'].includes(profile.incomeType) ? profile.salary : 0
  const pensionIncome = ['pensioner', 'both'].includes(profile.incomeType) ? profile.pensionIncome : 0
  const benefitIncome = ['disabled', 'youngDisabled', 'aap', 'unemployed'].includes(profile.incomeType) ? profile.benefitIncome : 0
  const profileIncome = salaryIncome + pensionIncome + benefitIncome + profile.otherIncome + profile.rentalIncome
  const selectedBudget = getBudgetScenario(budgetPartyId)
  const selectedBudgetName = budgetPartyId === 'current' ? 'Dagens regjering' : parties.find(p => p.id === budgetPartyId)?.name ?? 'Valgt parti'
  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => setProfile(p => ({ ...p, [key]: value }))
  const toggleList = (key: 'supportNeeds' | 'deductionSelections', id: string) => setProfile(p => ({ ...p, [key]: p[key].includes(id) ? p[key].filter(item => item !== id) : [...p[key], id] }))
  const navigate = (next: View) => { setView(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const steps = [
    { title: 'Deg og inntekten din', hint: 'Vi trenger bare omtrentlige tall.', content: <>
      <div className="grid-2"><NumberField label="Alder" value={profile.age} suffix="år" onChange={v => update('age', v)} /><label className="field"><span>Bostedskommune</span><input value={profile.municipality} onChange={e => update('municipality', e.target.value)} /></label></div>
      <div className="section-label">Hva beskriver deg best?</div><div className="income-options" role="radiogroup" aria-label="Hovedsituasjon">{incomeStatusOptions.map(([id, label]) => <button type="button" role="radio" aria-checked={profile.incomeType === id} key={id} className={profile.incomeType === id ? 'active' : ''} onClick={() => update('incomeType', id)}>{profile.incomeType === id && <Check size={14} />}{label}</button>)}</div>
      <div className="grid-2">{['worker', 'both', 'student', 'selfEmployed'].includes(profile.incomeType) && <NumberField label={profile.incomeType === 'selfEmployed' ? 'Årlig nærings-/arbeidsinntekt' : 'Brutto årslønn'} value={profile.salary} onChange={v => update('salary', v)} />}{['pensioner', 'both'].includes(profile.incomeType) && <NumberField label="Årlig pensjonsinntekt" value={profile.pensionIncome} onChange={v => update('pensionIncome', v)} />}{['disabled', 'youngDisabled', 'aap', 'unemployed'].includes(profile.incomeType) && <NumberField label="Årlige skattepliktige ytelser" value={profile.benefitIncome} onChange={v => update('benefitIncome', v)} />}<NumberField label="Annen skattepliktig inntekt" value={profile.otherIncome} onChange={v => update('otherIncome', v)} /></div>
      <NumberField label="Årlig skattepliktig utleieinntekt" value={profile.rentalIncome} onChange={v => update('rentalIncome', v)} />
      <p className="field-help">Ta bare med utleieinntekt som faktisk er skattepliktig. Skattefri utleie skal ikke føres her.</p>
    </> },
    { title: 'Bolig og gjeld', hint: 'Renter og gjeld er to forskjellige tall.', content: <>
      <div className="grid-2"><NumberField label="Markedsverdi på bolig" value={profile.homeValue} onChange={v => update('homeValue', v)} /><NumberField label="Din eierandel" value={profile.ownershipShare} suffix="%" onChange={v => update('ownershipShare', Math.min(100, v))} /></div>
      <div className="grid-2"><NumberField label="Samlet gjeld" value={profile.debt} onChange={v => update('debt', v)} /><NumberField label="Årlige renteutgifter" value={profile.interestExpenses} onChange={v => update('interestExpenses', v)} /></div>
    </> },
    { title: 'Formue og barn', hint: 'Barnets alder avgjør hvilke ordninger og forslag som kan være relevante.', content: <>
      <div className="grid-2"><NumberField label="Bankinnskudd" value={profile.bankSavings} onChange={v => update('bankSavings', v)} /><NumberField label="Aksjer og fond" value={profile.shares} onChange={v => update('shares', v)} /></div>
      <div className="section-label">Barn under 18 år</div><div className="grid-3"><NumberField label="0–5 år" value={profile.childrenUnder6} suffix="barn" onChange={v => update('childrenUnder6', v)} /><NumberField label="6–12 år" value={profile.children6to12} suffix="barn" onChange={v => update('children6to12', v)} /><NumberField label="13–17 år" value={profile.children13to17} suffix="barn" onChange={v => update('children13to17', v)} /></div>
      <div className="grid-2"><NumberField label="Barn i barnehage" value={profile.kindergartenChildren} suffix="barn" onChange={v => update('kindergartenChildren', v)} /><NumberField label="Barn i SFO" value={profile.sfoChildren} suffix="barn" onChange={v => update('sfoChildren', v)} /></div>
      <button type="button" className={profile.singleParent ? 'single-choice selected' : 'single-choice'} aria-pressed={profile.singleParent} onClick={() => update('singleParent', !profile.singleParent)}><span>{profile.singleParent && <Check size={15} />}</span>Jeg er enslig forsørger</button>
    </> },
    { title: 'Tjenester og støtte', hint: 'Velg områdene som er relevante for deg eller husstanden.', content: <>
      <ChoiceGrid options={supportOptions} selected={profile.supportNeeds} onToggle={id => toggleList('supportNeeds', id)} />
      <div className="info-box"><strong>Dette påvirker ikke kronebeløpet ennå</strong><p>Valgene skal senere kobles til dokumenterte forslag fra hvert parti, for eksempel brillestøtte, tannhelse, tolketjenester og hjelpemidler.</p></div>
    </> },
    { title: 'Mulige fradrag', hint: 'Velg det som kan være aktuelt. Vi kontrollerer vilkår og beløpsgrenser før dette regnes inn.', content: <>
      <ChoiceGrid options={deductionOptions} selected={profile.deductionSelections} onToggle={id => toggleList('deductionSelections', id)} />
      {profile.deductionSelections.includes('rentalMaintenance') && <NumberField label="Vedlikeholdskostnader på skattepliktig utleie" value={profile.rentalMaintenance} onChange={v => update('rentalMaintenance', v)} />}
      {profile.deductionSelections.includes('rentalOperating') && <NumberField label="Andre driftskostnader ved skattepliktig utleie" value={profile.rentalOperatingCosts} onChange={v => update('rentalOperatingCosts', v)} />}
      {profile.deductionSelections.includes('union') && <NumberField label="Betalt fagforeningskontingent" value={profile.unionFee} onChange={v => update('unionFee', v)} />}
      {profile.deductionSelections.includes('childcare') && <NumberField label="Utgifter til pass og stell av barn" value={profile.childcareExpenses} onChange={v => update('childcareExpenses', v)} />}
      {profile.deductionSelections.includes('commute') && <NumberField label="Reise- og pendlerkostnader" value={profile.commuteExpenses} onChange={v => update('commuteExpenses', v)} />}
      {profile.deductionSelections.includes('donations') && <NumberField label="Gaver til godkjente organisasjoner" value={profile.donations} onChange={v => update('donations', v)} />}
      {profile.deductionSelections.includes('investmentLoss') && <NumberField label="Realisert tap på aksjer eller fond" value={profile.investmentLosses} onChange={v => update('investmentLosses', v)} />}
      <div className="warning-box"><strong>Forslag – ikke skatteråd</strong><p>Et valgt punkt betyr ikke automatisk at du har krav på fradrag. Vilkår, grenser og dokumentasjon må bygges inn fra offisielle skatteregler.</p></div>
    </> },
    { title: 'Bil og transport', hint: 'Vi bruker dette til relevante avgifter og lettelser.', content: <>
      <label className="field"><span>Biltype</span><select value={profile.carType} onChange={e => update('carType', e.target.value as UserProfile['carType'])}><option value="none">Ingen bil</option><option value="fossil">Bensin eller diesel</option><option value="electric">Elbil</option></select></label>
      <div className="grid-2"><NumberField label="Kjørelengde per år" value={profile.annualKm} suffix="km" onChange={v => update('annualKm', v)} /><NumberField label="Bomutgifter per år" value={profile.tolls} onChange={v => update('tolls', v)} /></div>
    </> },
  ]

  return <div className="app">
    <header className="site-header"><button className="brand" onClick={() => navigate('home')}><span><Landmark size={21} /></span>Hva koster politikken?</button><nav><button onClick={() => navigate('results')}>Partier</button><button onClick={() => navigate('receipt')}>Skattekvittering</button><button onClick={() => navigate('method')}>Metode</button></nav></header>
    <div className="demo-banner"><strong>Prototype med demodata</strong><span> Tallene er kun illustrasjoner og ikke partienes faktiske politikk.</span></div>

    <main>
      {view === 'home' && <>
        <section className="hero"><div><span className="eyebrow">Politikk oversatt til kroner</span><h1>Hva betyr politikken<br /><i>for din lommebok?</i></h1><p>Fyll inn noen enkle opplysninger. Se hvilke forslag som påvirker deg, og få en kvittering på hvordan fellesskapet bruker pengene.</p><button className="primary" onClick={() => navigate('form')}>Start beregningen <ArrowRight size={18} /></button><div className="trust"><span><LockKeyhole size={16} />Ingen innlogging</span><span><ShieldCheck size={16} />Data blir i nettleseren</span></div></div><div className="hero-card"><div className="mini-label">Illustrerende resultat</div><h3>Din økonomiske forskjell</h3><div className="big-number">+ 640 kr <small>/ mnd.</small></div><div className="mini-bars">{ranked.slice(0, 4).map((p, i) => <div key={p.id}><span>{p.shortName}</span><b style={{ width: `${92 - i * 14}%`, background: p.color }}></b></div>)}</div><small className="demo-pill">DEMOBEREGNING</small></div></section>
        <section className="feature-grid"><button onClick={() => navigate('form')}><span><Calculator /></span><h3>Beregn din økonomi</h3><p>Se anslått utslag per måned og år basert på din situasjon.</p><ArrowRight /></button><button onClick={() => navigate('results')}><span><BarChart3 /></span><h3>Sammenlign partiene</h3><p>Se tiltakene side om side uten at vi kårer en politisk vinner.</p><ArrowRight /></button><button onClick={() => navigate('receipt')}><span><ReceiptText /></span><h3>Se hvor pengene går</h3><p>Få en enkel skattekvittering fordelt på viktige formål.</p><ArrowRight /></button></section>
        <section className="principles"><span className="eyebrow">Bygget for tillit</span><h2>Ingen skjulte beregninger</h2><p>Alle resultater skal kunne spores tilbake til et konkret tiltak og en tydelig kilde. Usikre løfter får ikke falsk presisjon.</p><div><span><Check /> Kilder på hvert tiltak</span><span><Check /> Synlig beregningsmetode</span><span><Check /> Nøytral presentasjon</span></div></section>
      </>}

      {view === 'form' && <section className="form-page"><div className="form-intro"><span className="eyebrow">Steg {step + 1} av {steps.length}</span><h1>{steps[step].title}</h1><p>{steps[step].hint}</p><div className="progress"><i style={{ width: `${((step + 1) / steps.length) * 100}%` }} /></div></div><div className="form-card">{steps[step].content}<div className="form-actions">{step > 0 ? <button className="secondary" onClick={() => setStep(s => s - 1)}>Tilbake</button> : <button className="text-button" onClick={() => navigate('home')}>Avbryt</button>}<button className="primary" onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : navigate('results')}>{step < steps.length - 1 ? 'Neste' : 'Se resultatet'} <ArrowRight size={17} /></button></div></div><p className="privacy"><LockKeyhole size={15} /> Opplysningene behandles lokalt og sendes ikke til oss.</p></section>}

      {view === 'results' && <section className="results-page"><div className="page-heading"><span className="eyebrow">Din partisammenligning</span><h1>Hva kan endres i lommeboken?</h1><p>Resultatet viser illustrerende utslag mot dagens situasjon – ikke hvilket parti som er «best».</p></div><div className="result-summary"><div><span>Størst beregnet utslag i demoen</span><h2>{ranked[0].name}</h2><p>{kr(partyEffect(ranked[0], profile) / 12)} per måned</p></div><div className="profile-chip">Profil: {profile.age} år · {incomeStatusLabel[profile.incomeType].toLowerCase()} · {kr(profileIncome)} i inntekt · {childrenCount} barn<button onClick={() => navigate('form')}>Endre</button></div></div>{(profile.supportNeeds.length > 0 || profile.deductionSelections.length > 0) && <div className="relevance-summary"><div><strong>{profile.supportNeeds.length}</strong><span>valgte støtteområder</span></div><div><strong>{profile.deductionSelections.length}</strong><span>mulige fradrag</span></div><p>Disse valgene blir synlige nå, og kobles til dokumenterte partitiltak i neste datafase.</p></div>}<div className="party-list">{ranked.map((party, index) => { const effect = partyEffect(party, profile); return <article key={party.id} className="party-card"><div className="rank">{index + 1}</div><div className="party-logo" style={{ background: party.color }}>{party.shortName}</div><div className="party-name"><h3>{party.name}</h3><span>{party.measures.length} demotiltak treffer profilen</span></div><div className="effect"><strong>{effect >= 0 ? '+' : ''}{kr(effect / 12)}</strong><span>per måned</span></div><details><summary><ChevronDown /> Se beregningen</summary><div className="measure-list">{party.measures.map(m => <div key={m.id}><span className="measure-tag">{m.category}</span><div><strong>{m.name}</strong><p>{m.description}</p></div><b>{kr(m.effect(profile))}/år</b></div>)}</div></details></article>})}</div><div className="bottom-actions"><button className="secondary" onClick={() => navigate('form')}>Endre opplysninger</button><button className="primary" onClick={() => navigate('receipt')}>Sammenlign budsjettene <ArrowRight size={17} /></button></div></section>}

      {view === 'receipt' && <section className="receipt-page"><div className="page-heading"><span className="eyebrow">Budsjettfordeling</span><h1>Hva vil partiene bruke pengene på?</h1><p>Sammenlign dagens fordeling med prioriteringen til et parti du velger selv.</p></div><div className="budget-selector"><button className={budgetPartyId === 'current' ? 'active' : ''} onClick={() => setBudgetPartyId('current')}>Dagens regjering</button>{parties.map(p => <button key={p.id} className={budgetPartyId === p.id ? 'active' : ''} style={budgetPartyId === p.id ? { borderColor: p.color } : undefined} onClick={() => setBudgetPartyId(p.id)}>{p.shortName}</button>)}</div><div className="tax-total"><span>Din anslåtte skatt i prototypen</span><strong>{kr(tax)}</strong><small>Fordelingen under vises i prosent – uavhengig av inntektsnivå.</small></div><div className="budget-comparison"><div className="budget-visual"><div className="donut" style={{ background: `conic-gradient(${selectedBudget.map((b, i) => { const start = selectedBudget.slice(0, i).reduce((s, x) => s + x.percent, 0); return `${b.color} ${start}% ${start + b.percent}%` }).join(',')})` }}><div><strong>100 %</strong><span>{selectedBudgetName}</span></div></div><span className="demo-pill">ILLUSTRERENDE FORDELING</span></div><div className="budget-table"><div className="budget-row budget-head"><span>Område</span><b>I dag</b><b>{budgetPartyId === 'current' ? 'Valgt' : parties.find(p => p.id === budgetPartyId)?.shortName}</b><b>Forskjell</b></div>{selectedBudget.map((item, index) => { const today = currentBudget[index].percent; const difference = item.percent - today; return <div className="budget-row" key={item.name}><span><i style={{ background: item.color }} />{item.name}</span><b>{formatPercent(today)}</b><strong>{formatPercent(item.percent)}</strong><em className={difference > 0 ? 'up' : difference < 0 ? 'down' : ''}>{difference > 0 ? '+' : ''}{formatPercent(difference)}</em></div>})}</div></div><div className="notice"><ShieldCheck /><div><strong>Funksjonen er klar – tallgrunnlaget er fortsatt demo</strong><p>Dagens fordeling skal senere hentes fra offentlige regnskap og statsbudsjettet. Partienes fordeling skal hentes fra alternative statsbudsjett. Valgt parti er uavhengig av rangeringen på privatøkonomisiden.</p></div></div></section>}

      {view === 'method' && <section className="method-page"><div className="page-heading"><span className="eyebrow">Åpen metode</span><h1>Slik skal beregningene fungere</h1><p>Troverdighet krever at vi skiller mellom dokumenterte tall og politiske ambisjoner.</p></div><div className="method-grid"><article><b>1</b><h3>Vedtatt politikk</h3><p>Dagens regler er utgangspunktet beregningene sammenlignes mot.</p></article><article><b>2</b><h3>Alternative budsjett</h3><p>Tallfestede forslag kan beregnes og får direkte kilde og sidenummer.</p></article><article><b>3</b><h3>Partiprogram</h3><p>Løfter uten sats eller beløp vises som retning, ikke som et oppdiktet kronebeløp.</p></article></div><div className="method-copy"><h2>Hva vi ikke kan love</h2><p>Renter, boligpriser, arbeidsplasser og økonomisk vekst påvirkes av langt mer enn ett partitiltak. Slike virkninger skal derfor ikke presenteres som sikre personlige beløp.</p><h2>Personvern</h2><p>Prototypen beregner alt i nettleseren. Det brukes ingen innlogging, sporing eller analyseverktøy.</p><button className="secondary" onClick={() => { setProfile(defaultProfile); setStep(0) }}><RotateCcw size={16} /> Nullstill opplysninger</button></div></section>}
    </main>
    <footer><div><strong>Hva koster politikken?</strong><span>En åpen og nøytral prototype.</span></div><nav><button onClick={() => navigate('method')}>Metode og personvern</button><a href="https://github.com/Hva-koster-politikken/hva-koster-politikken">Åpen kildekode</a></nav></footer>
  </div>
}

export default App
