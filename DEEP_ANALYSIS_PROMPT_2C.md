# BRUTAL DJUPANALYS DEL 2C: BUSINESS PLAN COMPLIANCE
# OBLIGATORISKT FÖRSTA STEG
Använd /superpowers. Aktivera dessa skills i ordning:
brainstorming → senior-pm → product-discovery → ux-researcher-designer → onboarding-cro → marketing-psychology → writing-plans

## KONTEXT
Reslot har en detaljerad business plan och funktionsspecifikation. 
Uppgiften är att kontrollera att ALLT i planen faktiskt finns i appen — 
korrekt implementerat, tydligt kommunicerat och väldesignat.

## BUSINESS PLAN — FULLSTÄNDIGT INNEHÅLL
(Läs detta noggrant — varje punkt ska kontrolleras mot appen)

### Affärsmodell
- Andrahandsmarknadsplats för restaurangbokningar
- Credits-system: 1 credit = 39 kr, köps i appen
- Serviceavgift vid claim (29 kr)
- Administrationsavgift vid no-show (10-20%)
- Referral: +1 credit vid registrering via referral
- Credits vid upplagd bokning som tas över: +2 credits

### Ansvarsmodell (KRITISK)
- Ej claimad: ansvar hos originalbokaren
- Claimad: 5 minuters ångerfrist → ansvar övergår till claimant
- Vidareförsäljning: ansvar kvar hos senaste claimant
- Riskhantering: Appen debiterar claimant vid no-show, ersätter originalbokaren

### Betalning & Säkerhet
- Stripe för betalningar
- Kort registreras vid claim
- Pre-authorization reserverar belopp
- Escrow-princip tills bokning genomförd

### Restaurangkort — ska visa
- Namn och plats
- Typ av kök
- Typ av sittning (lunch, middag, brunch)
- Bokningstid och antal personer
- Eventuella villkor
- Google-recensioner (aggregerat betyg)
- Bilder

### Funktioner som MÅSTE finnas
1. Flöde med bokningar (hem-skärmen)
2. Sök och filtrering
3. Bevakningar (push-notiser vid match)
4. Profil med bokningshistorik, credits-saldo, sparade restauranger, betaluppgifter
5. Lägg upp bokning
6. Ta över bokning
7. Credits-köp (39 kr/credit)
8. Referral-system
9. FAQ / Frågor och svar
10. Hjälp och support
11. Kontoinställningar med verifiering

### Frågor och svar (8 st — exakt innehåll)
- Hur fungerar Reslot?
- Vad är Reslot credits?
- När betalar jag något?
- Varför behöver jag lägga in kortuppgifter?
- Vad händer om jag inte kan gå på bokningen?
- Kan jag ångra en bokning jag tagit över?
- Hur fungerar bevakningar?
- Hur får jag fler credits?

### Terminologi (ALDRIG avvik)
- credits / Reslot credits (INTE tokens/rewards)
- bokningar (INTE reservations i UI)
- bevakningar (INTE aviseringar)
- ta över bokning (INTE claima)

### Onboarding (WIP enligt spec)
- Telefonnummer-verifiering obligatorisk
- E-post-verifiering obligatorisk
- Stad-val

### Hem-flöde
- "?" → FAQ
- "Bokningar i Stockholm" med stadsväljare
- Sök-ikon
- Credits-ikon → credits-sidan
- Tab: Hem, Bokningar, +, Notiser, Profil
- INTE: VIP-symbol, "8 bord tillgängliga"

### Profil
- Credits som SIFFRA (inte visuell skala)
- Bokningshistorik: upplagda + övertagna
- INTE: "Belöningar tillgängliga"-sektion
- Konto: Bjud in vän, Betalningar, Hjälp, Logga ut

### Kontoinställningar
- Förnamn, efternamn, e-post, telefon, födelsedag, stad
- Verifieringsindikator (grön bock)
- Radera konto längst ner

### Betalningssida
- Kortuppgifter via Stripe
- "Inga pengar dras enbart av att du lägger in kortuppgifter"
- Förklaring av när betalningsansvar uppstår

### Credits-sida
- Antal credits tydligt
- Förklaring av vad credits är
- Köp: 1 credit = 39 kr
- Gratis credits: Bjud in vän (+1), Lägg upp bokning (+1)
- INTE: visuell skala 5/10/15/20

### Bjud in vän
- "Du och din vän får vardera 1 credit"
- Unik kod att kopiera
- Skydd mot missbruk

### Hjälp och support
- Chatt eller e-post
- Notis när svar kommit

## LÄS DESSA FILER
1. ALLA filer i mobile/src/app/
2. ALLA filer i mobile/src/app/(tabs)/
3. scripts/DJUPANALYS_UX.md (om den finns)

## UTFÖR ANALYSEN
Gå igenom VARJE punkt i business planen ovan och kontrollera mot koden:

### A. COMPLIANCE-RAPPORT
Skapa en tabell för varje sektion:

| Krav från spec | Finns i appen? | Korrekt implementerat? | Problem |
|---|---|---|---|
| Credits-kostnad synlig vid claim | ✅/❌ | ✅/⚠️/❌ | Beskrivning |

### B. SAKNADE FEATURES
Lista allt som finns i spec men INTE i appen.

### C. FELAKTIG IMPLEMENTATION
Lista allt som finns men är implementerat fel/otydligt/dåligt.

### D. KOMMUNIKATIONSPROBLEM
- Är ansvarsmodellen tillräckligt tydlig för användaren?
- Förstår en ny användare hur credits fungerar på 10 sekunder?
- Är serviceavgiften (29 kr) kommunicerad?
- Är ångerfristens konsekvenser tydliga?

### E. PRIORITERADE ÅTGÄRDER
Rangordna alla avvikelser: Kritisk / Viktig / Minor
Med: berörd fil, exakt fix, estimerad tid

## OUTPUT
Spara i scripts/DJUPANALYS_SPEC.md
Lägg till ALLA avvikelser i Del 4 (TOTAL_BACKLOG) åtgärdslistan.
