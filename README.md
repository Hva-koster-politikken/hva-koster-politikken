# Hva koster politikken?

En åpen prototype som viser hvordan politiske prioriteringer kan påvirke privatøkonomien, og hvordan et beløp tilsvarende skatten din fordeles på offentlige formål.

> **Viktig:** Partiberegningene og budsjettfordelingen er foreløpig illustrerende demodata. De skal ikke tolkes som partienes faktiske politikk.

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

## Oppdatere data

- Partier og demotiltak ligger i `src/data/parties.ts`.
- Fordelingen i skattekvitteringen ligger i `src/data/budget.ts`.
- Beregningslogikken ligger i `src/lib/calculations.ts`.

Før løsningen publiseres som faktagrunnlag må alle demotiltak erstattes med dokumenterte forslag fra partiprogrammer og alternative statsbudsjett. Hvert tiltak skal ha kilde, år, status og dato for kontroll.

## Personvern

Opplysningene behandles bare i nettleseren. Prototypen sender ikke økonomiske data til en server og bruker ingen sporing eller analyseverktøy.

## Publisering

Workflowen i `.github/workflows/deploy.yml` bygger og publiserer `main` automatisk til GitHub Pages. I repoets innstillinger må **Settings → Pages → Source** settes til **GitHub Actions**.
