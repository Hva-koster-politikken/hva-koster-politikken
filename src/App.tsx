import { useMemo, useState } from 'react'
import { ArrowRight, BarChart3, Calculator, Check, ChevronDown, Landmark, LockKeyhole, ReceiptText, RotateCcw, ShieldCheck } from 'lucide-react'
import { parties } from './data/parties'
import { budget } from './data/budget'
import { defaultProfile, estimateTax, kr, partyEffect, sortParties } from './lib/calculations'
import type { UserProfile } from './types'

type View = 'home' | 'form' | 'results' | 'receipt' | 'method'

const NumberField = ({ label, value, onChange, suffix = 'kr' }: { label: string; value: number; onChange: (n: number) => void; suffix?: string }) => (
  <label className="field">
    <span>{label}</span>
    <div className="input-wrap"><input type="number" min="0" value={value || ''} onChange={e => onChange(Math.max(0, Number(e.target.value)))} /><em>{suffix}</em></div>
  </label>
)

function App() {
  const [view, setView] = useState<View>('home')
  const [step, setStep] = useState(0)
  const [profile, setProfile] = useState<UserProfile>(defaultProfile)
  const ranked = useMemo(() => sortParties(parties, profile), [profile])
  const tax = estimateTax(profile)
  const update = <K extends keyof UserProfile>(key: K, value: UserProfile[K]) => setProfile(p => ({ ...p, [key]: value }))
  const navigate = (next: View) => { setView(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const steps = [
    { title: 'Deg og inntekten din', hint: 'Vi trenger bare omtrentlige tall.', content: <>
      <div className="grid-2"><NumberField label="Alder" value={profile.age} suffix="år" onChange={v => update('age', v)} /><label className="field"><span>Bostedskommune</span><input value={profile.municipality} onChange={e => update('municipality', e.target.value)} /></label></div>
      <div className="grid-2"><NumberField label="Brutto årslønn" value={profile.salary} onChange={v => update('salary', v)} /><NumberField label="Annen skattepliktig inntekt" value={profile.otherIncome} onChange={v => update('otherIncome', v)} /></div>
      <NumberField label="Årlig utleieinntekt" value={profile.rentalIncome} onChange={v => update('rentalIncome', v)} />
    </> },
    { title: 'Bolig og gjeld', hint: 'Renter og gjeld er to forskjellige tall.', content: <>
      <div className="grid-2"><NumberField label="Markedsverdi på bolig" value={profile.homeValue} onChange={v => update('homeValue', v)} /><NumberField label="Din eierandel" value={profile.ownershipShare} suffix="%" onChange={v => update('ownershipShare', Math.min(100, v))} /></div>
      <div className="grid-2"><NumberField label="Samlet gjeld" value={profile.debt} onChange={v => update('debt', v)} /><NumberField label="Årlige renteutgifter" value={profile.interestExpenses} onChange={v => update('interestExpenses', v)} /></div>
    </> },
    { title: 'Formue og familie', hint: 'Dette brukes til å vise hvilke tiltak som treffer deg.', content: <>
      <div className="grid-2"><NumberField label="Bankinnskudd" value={profile.bankSavings} onChange={v => update('bankSavings', v)} /><NumberField label="Aksjer og fond" value={profile.shares} onChange={v => update('shares', v)} /></div>
      <div className="grid-3"><NumberField label="Antall barn" value={profile.children} suffix="barn" onChange={v => update('children', v)} /><NumberField label="Barn i barnehage" value={profile.kindergartenChildren} suffix="barn" onChange={v => update('kindergartenChildren', v)} /><NumberField label="Barn i SFO" value={profile.sfoChildren} suffix="barn" onChange={v => update('sfoChildren', v)} /></div>
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

      {view === 'results' && <section className="results-page"><div className="page-heading"><span className="eyebrow">Din partisammenligning</span><h1>Hva kan endres i lommeboken?</h1><p>Resultatet viser illustrerende utslag mot dagens situasjon – ikke hvilket parti som er «best».</p></div><div className="result-summary"><div><span>Størst beregnet utslag i demoen</span><h2>{ranked[0].name}</h2><p>{kr(partyEffect(ranked[0], profile) / 12)} per måned</p></div><div className="profile-chip">Profil: {profile.age} år · {kr(profile.salary)} i lønn · {kr(profile.debt)} i gjeld<button onClick={() => navigate('form')}>Endre</button></div></div><div className="party-list">{ranked.map((party, index) => { const effect = partyEffect(party, profile); return <article key={party.id} className="party-card"><div className="rank">{index + 1}</div><div className="party-logo" style={{ background: party.color }}>{party.shortName}</div><div className="party-name"><h3>{party.name}</h3><span>{party.measures.length} demotiltak treffer profilen</span></div><div className="effect"><strong>{effect >= 0 ? '+' : ''}{kr(effect / 12)}</strong><span>per måned</span></div><details><summary><ChevronDown /> Se beregningen</summary><div className="measure-list">{party.measures.map(m => <div key={m.id}><span className="measure-tag">{m.category}</span><div><strong>{m.name}</strong><p>{m.description}</p></div><b>{kr(m.effect(profile))}/år</b></div>)}</div></details></article>})}</div><div className="bottom-actions"><button className="secondary" onClick={() => navigate('form')}>Endre opplysninger</button><button className="primary" onClick={() => navigate('receipt')}>Se skattekvitteringen <ArrowRight size={17} /></button></div></section>}

      {view === 'receipt' && <section className="receipt-page"><div className="page-heading"><span className="eyebrow">Din skattekvittering</span><h1>Hvor går fellesskapets penger?</h1><p>Hvis et beløp tilsvarende din skatt fordeles som offentlige utgifter i demoen.</p></div><div className="tax-total"><span>Anslått skatt i denne prototypen</span><strong>{kr(tax)}</strong><small>{kr(tax / 12)} per måned</small></div><div className="receipt-layout"><div className="donut" style={{ background: `conic-gradient(${budget.map((b, i) => { const start = budget.slice(0, i).reduce((s, x) => s + x.percent, 0); return `${b.color} ${start}% ${start + b.percent}%` }).join(',')})` }}><div><strong>100 kr</strong><span>fordelt</span></div></div><div className="receipt-table">{budget.map(item => <div key={item.name}><i style={{ background: item.color }} /><span>{item.name}</span><b>{item.percent} kr</b><strong>{kr(tax * item.percent / 100)}</strong></div>)}</div></div><div className="notice"><ShieldCheck /><div><strong>Dette er ikke en øremerking</strong><p>Dine skatteinnbetalinger går ikke direkte til bestemte formål. Fordelingen og skatteanslaget er foreløpig illustrerende demodata.</p></div></div></section>}

      {view === 'method' && <section className="method-page"><div className="page-heading"><span className="eyebrow">Åpen metode</span><h1>Slik skal beregningene fungere</h1><p>Troverdighet krever at vi skiller mellom dokumenterte tall og politiske ambisjoner.</p></div><div className="method-grid"><article><b>1</b><h3>Vedtatt politikk</h3><p>Dagens regler er utgangspunktet beregningene sammenlignes mot.</p></article><article><b>2</b><h3>Alternative budsjett</h3><p>Tallfestede forslag kan beregnes og får direkte kilde og sidenummer.</p></article><article><b>3</b><h3>Partiprogram</h3><p>Løfter uten sats eller beløp vises som retning, ikke som et oppdiktet kronebeløp.</p></article></div><div className="method-copy"><h2>Hva vi ikke kan love</h2><p>Renter, boligpriser, arbeidsplasser og økonomisk vekst påvirkes av langt mer enn ett partitiltak. Slike virkninger skal derfor ikke presenteres som sikre personlige beløp.</p><h2>Personvern</h2><p>Prototypen beregner alt i nettleseren. Det brukes ingen innlogging, sporing eller analyseverktøy.</p><button className="secondary" onClick={() => { setProfile(defaultProfile); setStep(0) }}><RotateCcw size={16} /> Nullstill opplysninger</button></div></section>}
    </main>
    <footer><div><strong>Hva koster politikken?</strong><span>En åpen og nøytral prototype.</span></div><nav><button onClick={() => navigate('method')}>Metode og personvern</button><a href="https://github.com/Hva-koster-politikken/hva-koster-politikken">Åpen kildekode</a></nav></footer>
  </div>
}

export default App
