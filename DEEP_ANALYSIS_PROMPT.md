# BRUTAL DJUPANALYS — RESLOT APP
# Körs kl 23:00 när Claude Code usage återställs

## OBLIGATORISKT FÖRSTA STEG
Använd /superpowers. Aktivera sedan dessa skills i ordning:
brainstorming → writing-plans → systematic-debugging

## PROJEKTETS SKILLS (från claude-skills repo)
Dessa finns i /Users/williamsvanqvist/.openclaw/workspace/claude-skills/
Aktivera och använd dessa för analysen:
- ux-researcher-designer (UX-analys)
- ui-design-system (designsystem-granskning)
- a11y-audit (tillgänglighet)
- onboarding-cro (konvertering onboarding)
- signup-flow-cro (registreringsflöde)
- page-cro (skärm-för-skärm konvertering)
- form-cro (formulär-UX)
- marketing-psychology (psykologiska principer)
- competitive-teardown (vs Karma/TGTG/Airbnb/Strava/ResX)
- competitive-intel (marknadspositionering)
- product-discovery (gap-analys)
- senior-pm (produktperspektiv)
- senior-frontend (frontend-kodkvalitet)
- code-reviewer (kodgranskning)
- tech-debt-tracker (teknisk skuld)
- performance-profiler (prestanda)
- senior-qa (QA)
- api-design-reviewer (backend API)
- stripe-integration-expert (betalflöde)
- pricing-strategy (credits-ekonomi)
- referral-program (referral-systemet)
- launch-strategy (cold-start strategi)
- saas-metrics-coach (KPIs och metrics)
- frontend-design (designkvalitet)
- verification-before-completion (verifiera alla fynd)

## LÄS DESSA FILER FÖRST
1. RESLOT_BRAIN.md (hela — inkl. konkurrentanalys ResX)
2. TODO.md
3. scripts/design-research/MASTERRAPPORT.md
4. scripts/design-research/airbnb.json
5. scripts/design-research/karma.json
6. scripts/design-research/toogoodtogo.json
7. scripts/design-research/classpass.json
8. scripts/design-research/strava.json
9. scripts/design-research/storytel.json
10. scripts/design-research/planta.json
11. scripts/design-research/bruce.json
12. ALLA filer i mobile/src/app/
13. ALLA filer i mobile/src/components/
14. ALLA filer i backend/src/
15. mobile/CLAUDE.md

## KÖR WEB-FETCHER PÅ DESSA (live data)
node scripts/web-fetcher.mjs https://karma.life
node scripts/web-fetcher.mjs https://www.toogoodtogo.com
node scripts/web-fetcher.mjs https://www.airbnb.com
node scripts/web-fetcher.mjs https://www.strava.com
node scripts/web-fetcher.mjs https://getplanta.com
node scripts/web-fetcher.mjs https://www.storytel.com/se
node scripts/web-fetcher.mjs https://resx.co
node scripts/web-fetcher.mjs https://www.classpass.com

## KÖR TEKNISKA CHECKS
cd mobile && npx tsc --noEmit 2>&1
cd mobile && npx expo lint 2>&1 | head -50

## ANALYSEN SKA INNEHÅLLA

### A. KONKURRENT-TEARDOWN (per plattform)
För varje plattform (Karma, TGTG, Airbnb, Strava, Storytel, Planta, Bruce Studios, ResX):
- Vad gör de bättre än Reslot just nu?
- Specifika UI-element/animationer/flöden att stjäla
- Deras psykologiska konverteringsteknik
- Hur Reslot kan differentiera sig

### B. SKÄRM-FÖR-SKÄRM DESIGNANALYS
För varje skärm — jämför mot referensapparna:
- Typografisk hierarki: konsekvent? Type scale?
- Färganvändning: rätt kontrast? Designsystem följt?
- Animationer: spring-baserade? Rätt timing?
- Micro-interactions: haptics, press-feedback, skeleton loaders?
- Empty states: finns de? Är de engagerande?
- Error states: tydliga? Svenska?
- Betyg 1-10 per skärm

### C. KONVERTERINGSANALYS
- Hur många steg tar claim-flödet? (mät exakt)
- Var tappar man användare? (friction points)
- Onboarding drop-off risk (per steg)
- Jämför med ResX:s flöde
- Konkreta CRO-åtgärder prioriterade efter impact

### D. PSYKOLOGISK ANALYS
Baserat på marketing-psychology skill:
- Vilka triggers används? (scarcity, urgency, social proof)
- Vilka triggers saknas?
- Trust-signaler: starka eller svaga?
- Loss aversion: används det?
- FOMO: hur bygger appen det?

### E. TEKNISK SKULDANALYS
- Alla TypeScript-fel (kör tsc)
- Styling-inkonsistenser (NativeWind vs inline)
- Performance-risker (re-renders, Math.random i render etc)
- Säkerhetsrisker (test@reslot.se fallback etc)
- API-design problem

### F. STRIPE & BETALFLÖDE
Använd stripe-integration-expert skill:
- Är pre-auth implementerat korrekt?
- Webhook-säkerhet?
- Race condition-skydd tillräckligt?
- PSD2/SCA compliance?

### G. PRIORITERAD ÅTGÄRDSLISTA
Rangordna EXAKT efter: Impact × Effort
🔴 Kritiskt (blockar launch)
🟡 Viktigt (pre-launch)  
🟢 Nice-to-have (post-launch)

Varje åtgärd ska ha:
- Exakt vad som ska ändras
- Vilken fil
- Förväntad impact
- Estimerad effort (timmar)

## OUTPUT
Spara analysen i scripts/DJUPANALYS.md
Uppdatera TODO.md med nya fynd

När klart:
openclaw system event --text "🔍 BRUTAL DJUPANALYS KLAR! scripts/DJUPANALYS.md är redo för William." --mode now
