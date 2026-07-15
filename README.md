# Hva koster politikken?

En åpen prototype som sammenligner hvordan dokumenterte politiske forslag kan påvirke privatøkonomien.

## Dette beregnes nå

- vedtatte norske skatteregler for 2026
- personfradrag og minstefradrag
- progressiv trinnskatt og trygdeavgift
- samtidige inntekter fra lønn, ENK, pensjon og NAV-ytelser
- skattefri, privat skattepliktig og næringsmessig utleie
- vedlikehold, driftskostnader og fradragsberettiget utleieunderskudd
- renteutgifter og utvalgte standardfradrag
- forenklet formuesskatt med egne verdier for primærbolig, sekundærbolig, aksjer og driftsmidler
- konkrete skatteforslag fra de ni stortingspartiene
- et tydelig merket estimat for Norgesdemokratene
- forenklet budsjettfordeling for alle partier, med dagens budsjett som indeks 100

Dokumenterte partiforslag rangeres etter lavest beregnet skatt for brukerens profil. Partier som mangler nødvendige satser merkes **uavklart** og vises under den ordinære rangeringen.

## Viktige avgrensninger

Dette er en forenklet beregning, ikke skatteråd. Kommunale forskjeller, detaljert ektefellefordeling, tilfeldig utvalg i arbeidsfradragsforsøket for unge, detaljert utbytteskatt og forbruksavgifter er foreløpig ikke med.

Budsjettfanen skiller mellom partienes konkrete årsbudsjett og langsiktige program. Utgiftene er normalisert til elleve felles kategorier og merkes som en forenklet retningsmodell. En egen totalindeks gjør synlig om partiet anslås å ville ha et større eller mindre budsjett enn dagens.

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
- Budsjettgruppering, kilder, usikkerhet og langsiktige programmål ligger i `src/data/budget.ts`.

## Personvern

Opplysningene behandles bare i nettleseren. Prototypen sender ikke økonomiske data til en server og bruker ingen sporing eller analyseverktøy.

## Publisering

Workflowen i `.github/workflows/main.yml` bygger og publiserer `main` automatisk til GitHub Pages. I repoets innstillinger må **Settings → Pages → Source** være satt til **GitHub Actions**.
