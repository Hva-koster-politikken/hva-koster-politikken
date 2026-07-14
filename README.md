# Hva koster politikken?

En åpen prototype som sammenligner hvordan dokumenterte politiske forslag kan påvirke privatøkonomien.

## Dette beregnes nå

- vedtatte norske skatteregler for 2026
- personfradrag og minstefradrag
- progressiv trinnskatt og trygdeavgift
- renteutgifter og utvalgte standardfradrag
- forenklet formuesskatt
- konkrete skatteforslag fra de ni stortingspartiene
- et tydelig merket estimat for Norgesdemokratene

Dokumenterte partiforslag rangeres etter lavest beregnet skatt for brukerens profil. Partier som mangler nødvendige satser merkes **uavklart** og vises under den ordinære rangeringen.

## Viktige avgrensninger

Dette er en forenklet beregning, ikke skatteråd. Kommunale forskjeller, ektefellefordeling, tilfeldig utvalg i arbeidsfradragsforsøket for unge, detaljert utbytteskatt og forbruksavgifter er foreløpig ikke med.

Budsjettfanen viser ikke lenger oppdiktede partiforskjeller. Partienes utgifter må først normaliseres fra alternative statsbudsjett til like kategorier.

## Kom i gang

```bash
npm install
npm run dev
```

## Kontroll og bygg

```bash
npm test
npm run build
```

Kontrolltesten for en lønn på 130 000 kroner forventer 7 588 kroner i skatt etter vedtatte 2026-regler.

## Data og metode

- Partienes regler og kilder ligger i `src/data/parties.ts`.
- Vedtatte regler og beregningsmotor ligger i `src/lib/calculations.ts`.
- Den foreløpige budsjettgrupperingen ligger i `src/data/budget.ts`.

## Personvern

Opplysningene behandles bare i nettleseren. Prototypen sender ikke økonomiske data til en server og bruker ingen sporing eller analyseverktøy.

## Publisering

Workflowen i `.github/workflows/main.yml` bygger og publiserer `main` automatisk til GitHub Pages. I repoets innstillinger må **Settings → Pages → Source** være satt til **GitHub Actions**.
