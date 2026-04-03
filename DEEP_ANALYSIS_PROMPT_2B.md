# BRUTAL DJUPANALYS DEL 2B: FÄRGTEMA & DESIGNIDENTITET
# OBLIGATORISKT FÖRSTA STEG
Använd /superpowers. Aktivera dessa skills i ordning:
brainstorming → ui-design-system → frontend-design → ux-researcher-designer → marketing-psychology → competitive-teardown → brand-guidelines

## KONTEXT
Nuvarande primärfärg: #E06A4E (coral/orange)
Problemet: Appen känns "vibe-coded" och generisk. Vi vill ha känslan av:
- Karma (organisk, varm, uppdragsdriven)
- Bruce Studios (polerat, minimalistiskt, karaktärsfullt)
- Airbnb (distinkt, trustbyggande, premium)
- TooGoodToGo (tydlig, engagerande, mat-fokuserad)
- ClassPass (sofistikerad marknadsplats)
- Storytel (karaktärsfull typografi, mjuk)
- Planta (naturlig, omsorgsfull)

## LÄS DESSA FILER
1. RESLOT_BRAIN.md (sektion 2 — Designsystem)
2. scripts/design-research/MASTERRAPPORT.md
3. scripts/design-research/airbnb.json
4. scripts/design-research/karma.json
5. scripts/design-research/toogoodtogo.json
6. scripts/design-research/classpass.json
7. scripts/design-research/storytel.json
8. scripts/design-research/planta.json
9. scripts/design-research/bruce.json
10. scripts/design-research/strava.json
11. mobile/src/lib/theme.ts (nuvarande tema)

## KÖR WEB-FETCHER PÅ DESSA
node scripts/web-fetcher.mjs https://karma.life
node scripts/web-fetcher.mjs https://www.bruce.se
node scripts/web-fetcher.mjs https://www.airbnb.com
node scripts/web-fetcher.mjs https://www.toogoodtogo.com
node scripts/web-fetcher.mjs https://getplanta.com
node scripts/web-fetcher.mjs https://www.storytel.com/se
node scripts/web-fetcher.mjs https://www.classpass.com

## ANALYSEN SKA INNEHÅLLA

### A. FÄRGANALYS PER PLATTFORM
För varje plattform — extrahera från web-fetcher + JSON:
- Exakt primärfärg (hex)
- Sekundär accent (hex)
- Bakgrundsfärg (hex)
- Hur de använder färg för att bygga TRUST
- Hur de använder färg för att skapa URGENCY
- Hur de använder färg för att kommunicera PREMIUM

### B. PSYKOLOGI BAKOM FÄRGVAL
Använd marketing-psychology skill:
- Varför fungerar Karmas gröna?
- Varför fungerar Airbnbs korall/rosa?
- Varför fungerar TooGoodToGos gröna?
- Vad kommunicerar orange/coral (#E06A4E) — och varför känns det "billigt"?
- Vilka färger associeras med: mat, exklusivitet, förtroende, spontanitet?

### C. RESLOTS DESIGNIDENTITET
Besvara dessa frågor:
- Vad är Reslots personlighet? (Exklusiv? Lekfull? Organisk? Sofistikerad?)
- Vilken känsla ska användaren få när de öppnar appen?
- Hur skiljer sig Reslot från ResX designmässigt?

### D. TRE KONKRETA FÄRGFÖRSLAG
Presentera 3 kompletta färgpaletter för Reslot:

**Palett 1:** [namn] — inspirerat av [plattform]
- Primär CTA: #[hex] + motivering
- Accent/credits: #[hex]
- Bakgrund: #[hex]
- Text: #[hex]
- Success: #[hex]
- Känsla: [beskriv]
- Passar för Reslot för: [motivering]

**Palett 2:** [namn] — inspirerat av [plattform]
(samma struktur)

**Palett 3:** [namn] — inspirerat av [plattform]
(samma struktur)

### E. REKOMMENDATION
- Vilken palett rekommenderas och VARFÖR?
- Hur appliceras den på: CTA-knappar, credits-visning, status-badges, onboarding, restaurangkort?
- Konkret: ersätt #E06A4E med #[ny färg] och #C9A96E med #[ny färg]

### F. TYPOGRAFI-BESLUT — FRAUNCES
Användaren har sett att Fraunces på restaurangnamnen i listan (Frantzén, Babette, Ekstedt) ger en stark premiumkänsla. Analysera:
- Ska Fraunces användas på restaurangnamnen i listkortet? (index.tsx RestaurantRow)
- Ska Fraunces användas på restaurangnamnet i detaljsidan? ([id].tsx)
- Vad är rätt fontstorlek och vikt för restaurangnamn i lista vs detalj?
- Jämför: PlusJakartaSans_700Bold vs Fraunces_700Bold på restaurangnamn
- Se screenshot: användaren gillar Fraunces på restaurangnamnen i listan
- Rekommendera: vilka specifika textelement ska ha Fraunces vs Plus Jakarta Sans?

Implementera sedan din rekommendation direkt i koden.

## OUTPUT
Spara i scripts/DJUPANALYS_FARG.md
