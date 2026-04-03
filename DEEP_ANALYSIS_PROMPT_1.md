# BRUTAL DJUPANALYS DEL 1: UX, KONKURRENTER & KONVERTERING
# OBLIGATORISKT FÖRSTA STEG
Använd /superpowers. Aktivera sedan dessa skills i ordning:
brainstorming → ux-researcher-designer → marketing-psychology → competitive-teardown → ui-design-system → onboarding-cro → frontend-design

## LÄS DESSA FILER
1. RESLOT_BRAIN.md
2. scripts/design-research/MASTERRAPPORT.md
3. Läs igenom de 8 JSON-filerna i scripts/design-research/
4. Sök igenom relevanta UI-komponenter i mobile/src/components/ och mobile/src/app/

## KÖR WEB-FETCHER PÅ ALLA PLATTFORMAR (live data — OBLIGATORISKT)
Kör VARJE kommando och spara output. Dessa är de plattformar William och hans systrar gillar — analysera VAD SOM FAKTISKT FUNGERAR på dem.

node scripts/web-fetcher.mjs https://karma.life
node scripts/web-fetcher.mjs https://getplanta.com
node scripts/web-fetcher.mjs https://bonvoyage.app
node scripts/web-fetcher.mjs https://www.bruce.se
node scripts/web-fetcher.mjs https://www.airbnb.com
node scripts/web-fetcher.mjs https://airbnb.design
node scripts/web-fetcher.mjs https://www.toogoodtogo.com
node scripts/web-fetcher.mjs https://www.strava.com
node scripts/web-fetcher.mjs https://www.classpass.com
node scripts/web-fetcher.mjs https://www.storytel.com/se
node scripts/web-fetcher.mjs https://resx.co

## FOKUSOMRÅDEN PER PLATTFORM (HEAVY analys)
För VARJE plattform — använd live web-fetcher data + JSON-filer i scripts/design-research/:

**Karma** — Hur bygger de urgency kring mat som snart försvinner? Vilka färger, typsnitt, kortdesign?
**Planta** — Hur onboardar de användaren? Hur kommunicerar de värde på splash-skärmen?
**Bon Voyage** — Hur presenterar de resor/upplevelser? Layout, bilder, call-to-action?
**Bruce Studios** — Vilka typografival, spacing, minimalism? Vad ger den premium-känslan?
**Airbnb** — Hur presenteras listkort? Trust-signaler? Bokningsflödets psykologi?
**TooGoodToGo** — Scarcity-mekanik, urgency-design, hur driver de claim-beteende?
**Strava** — Social proof, aktivitetsflöde, gamification. Hur håller de användaren engagerad?
**ClassPass** — Credits-system UX: hur förklarar de värdet? Hur presenteras prissättningen?
**Storytel** — Onboarding-flöde: hur introducerar de produkten? Animationer, copy, steg.

För varje plattform, svara på:
1. Vad gör de EXCEPTIONELLT bra som Reslot ska kopiera?
2. Vilka SPECIFIKA animationer/transitions/micro-interactions är signifikanta?
3. Hur kommunicerar de TRUST till nya användare?
4. Vad är deras primära KONVERTERINGSTEKNIK?
5. Splash/onboarding: hur ser det ut och vad kan Reslot ta?

## PRIORITET 0 — FIX DIREKT INNAN ANALYS
Bygg om SplashStep i mobile/src/app/onboarding.tsx:
- Tre bildkolumner fyller hela skärmen (height 100%), ingen tom whitespace
- Kolumn 1 upp, kolumn 2 ner, kolumn 3 upp — kontinuerlig loop
- Gradient overlay: transparent → #FAFAF8 längst ner
- 'Reslot' i Fraunces_700Bold fontSize 42, letterSpacing -1.5
- Tagline i Fraunces_700Bold fontSize 24
- Pulsande grön dot + 'X bord tillgängliga nu'
- Coral knapp borderRadius 28, fullbredd
- Spring-animation + haptics på knappar

## UTFÖR ANALYSEN
Skapa filen scripts/DJUPANALYS_UX.md och inkludera:

### A. KONKURRENT-TEARDOWN (per plattform)
- Vad gör de bättre än Reslot?
- Specifika UI/animationer/flöden att stjäla
- Psykologisk konverteringsteknik och hur Reslot differentierar sig

### B. SKÄRM-FÖR-SKÄRM DESIGNANALYS
- Typografisk hierarki, färg, animationer, micro-interactions
- Empty states, error states
- Betyg 1-10 per skärm

### C. KONVERTERINGS- OCH PSYKOLOGIANALYS
- Exakt antal steg i claim-flödet, friction points och drop-off risk
- Jämförelse med ResX
- Vilka triggers (Trust-signaler, Loss aversion, FOMO) används/saknas?
