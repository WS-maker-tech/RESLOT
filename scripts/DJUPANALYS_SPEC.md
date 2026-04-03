# DJUPANALYS DEL 2C: BUSINESS PLAN COMPLIANCE

> Genererad: 2026-04-01
> Analyserade filer: Samtliga i mobile/src/app/, mobile/src/app/(tabs)/, mobile/src/components/, mobile/src/lib/

---

## A. COMPLIANCE-RAPPORT

### A1. Affärsmodell

| Krav från spec | Finns i appen? | Korrekt implementerat? | Problem |
|---|---|---|---|
| Andrahandsmarknadsplats för bokningar | ✅ | ✅ | — |
| Credits-system: 1 credit = 39 kr | ✅ | ✅ | Visas korrekt i credits.tsx |
| Serviceavgift vid claim (29 kr) | ✅ | ✅ | Visas i restaurant/[id].tsx kostnad-sektion |
| Administrationsavgift vid no-show (10-20%) | ❌ | ❌ | **Nämns aldrig i appen** — varken i FAQ, claim-flödet eller payment |
| Referral: +1 credit vid registrering via referral | ✅ | ✅ | invite.tsx visar korrekt |
| Credits vid upplagd bokning som tas över: +2 credits | ✅ | ⚠️ | credits.tsx visar "+2 credits" vid uppladdning, men spec säger credits ges **när bokningen tas över**, inte vid uppladdning |

### A2. Ansvarsmodell

| Krav från spec | Finns i appen? | Korrekt implementerat? | Problem |
|---|---|---|---|
| Ej claimad: ansvar hos originalbokaren | ❌ | ❌ | **Kommuniceras aldrig** till användaren |
| Claimad: 5 min ångerfrist → ansvar övergår | ✅ | ✅ | Grace period overlay med 5 min countdown |
| Vidareförsäljning: ansvar kvar hos senaste claimant | ❌ | ❌ | **Vidareförsäljning som koncept finns ej i appen** |
| Debitering vid no-show + ersättning till originalbokare | ❌ | ❌ | **Logik/kommunikation saknas helt** |
| Escrow-princip tills bokning genomförd | ❌ | ❌ | **Varken kommunicerat eller implementerat** |
| Pre-authorization vid claim | ❌ | ❌ | **Stripe-integration saknas** — payment.tsx sparar bara kort lokalt |

### A3. Betalning & Säkerhet

| Krav från spec | Finns i appen? | Korrekt implementerat? | Problem |
|---|---|---|---|
| Stripe för betalningar | ❌ | ❌ | **Ej integrerat** — payment.tsx har manuell kortinput utan Stripe SDK |
| Kort registreras vid claim | ❌ | ❌ | Kort registreras separat, inte vid claim |
| Pre-authorization reserverar belopp | ❌ | ❌ | Saknas helt |
| Escrow-princip | ❌ | ❌ | Saknas helt |

### A4. Restaurangkort (Detail)

| Krav från spec | Finns i appen? | Korrekt implementerat? | Problem |
|---|---|---|---|
| Namn och plats | ✅ | ✅ | restaurant/[id].tsx |
| Typ av kök | ✅ | ✅ | Cuisine + tags visas |
| Typ av sittning (lunch/middag/brunch) | ❌ | ❌ | Visar "Inomhus/Utomhus" men **inte lunch/middag/brunch** |
| Bokningstid och antal personer | ✅ | ✅ | BookingPill-komponent |
| Eventuella villkor | ⚠️ | ⚠️ | Checkbox "Jag godkänner villkoren" men **villkoren visas inte** — bara generisk text |
| Google-recensioner (aggregerat betyg) | ✅ | ⚠️ | Betyg visas med stjärnor, men det är **inte verifierat att det är Google-data** — mock-data |
| Bilder | ✅ | ✅ | Hero image med parallax |
| Om + Bokning på SAMMA sida | ✅ | ✅ | Allt på en scrollbar sida, inga tabbar |
| Website/Instagram-länkar | ✅ | ✅ | Globe + Instagram ikoner med Linking |
| Karta-symbol med länk | ✅ | ✅ | MapPin → Apple Maps |
| Terms checkbox + "Ta över bokning" (disabled tills checked) | ✅ | ✅ | Korrekt implementerat |

### A5. Funktioner som MÅSTE finnas

| Krav från spec | Finns i appen? | Korrekt implementerat? | Problem |
|---|---|---|---|
| 1. Flöde med bokningar (hem-skärmen) | ✅ | ✅ | index.tsx med feed |
| 2. Sök och filtrering | ✅ | ✅ | Sökfält + stadsfilter + dagsfilter + stadsdelschips |
| 3. Bevakningar (push-notiser vid match) | ⚠️ | ⚠️ | Bevakningar finns, men **push-notiser är ej implementerade** — ingen expo-notifications setup |
| 4. Profil med historik, credits, sparade, betaluppgifter | ⚠️ | ⚠️ | Profil finns men **saknar bokningshistorik direkt** — länk till Bokningar-tabben istället. **Sparade restauranger** finns ej |
| 5. Lägg upp bokning | ✅ | ✅ | submit.tsx med 6-stegs formulär |
| 6. Ta över bokning | ✅ | ✅ | restaurant/[id].tsx med claim-flöde |
| 7. Credits-köp (39 kr/credit) | ⚠️ | ⚠️ | Knappen finns men **köpet gör inget** — bara haptic feedback, ingen Stripe checkout |
| 8. Referral-system | ✅ | ⚠️ | UI finns, men **anti-abuse (raderade konton)** saknar implementation |
| 9. FAQ / Frågor och svar | ✅ | ✅ | faq.tsx med alla 8 frågor |
| 10. Hjälp och support | ✅ | ⚠️ | support.tsx finns, men **chatten gör ingenting** — bara placeholder |
| 11. Kontoinställningar med verifiering | ✅ | ✅ | account-settings.tsx med verifieringsindikator |

### A6. Frågor och svar (8 st)

| FAQ-fråga från spec | Finns? | Korrekt? | Problem |
|---|---|---|---|
| Hur fungerar Reslot? | ✅ | ✅ | — |
| Vad är Reslot credits? | ✅ | ✅ | — |
| När betalar jag något? | ✅ | ✅ | — |
| Varför behöver jag lägga in kortuppgifter? | ✅ | ✅ | — |
| Vad händer om jag inte kan gå på bokningen? | ✅ | ✅ | — |
| Kan jag ångra en bokning jag tagit över? | ✅ | ⚠️ | Nämner "avbokningsfönstret" men **inte 5-minutersregeln specifikt** |
| Hur fungerar bevakningar? | ✅ | ✅ | — |
| Hur får jag fler credits? | ✅ | ✅ | — |

### A7. Terminologi

| Krav | Status | Problem |
|---|---|---|
| credits / Reslot credits (INTE tokens/rewards) | ✅ | Konsekvent — "Reslot credits" och "credits" |
| bokningar (INTE reservations i UI) | ✅ | Svenska "bokning/bokningar" genomgående |
| bevakningar (INTE aviseringar) | ✅ | Tab heter "Bevakningar" |
| ta över bokning (INTE claima) | ✅ | "Ta över bokning" konsekvent |

### A8. Hem-flöde

| Krav från spec | Finns i appen? | Korrekt implementerat? | Problem |
|---|---|---|---|
| "?" → FAQ | ✅ | ✅ | HelpCircle-ikon top-left → /faq |
| "Bokningar i Stockholm" med stadsväljare | ✅ | ✅ | "Bokningar i {stad}" med ChevronDown |
| Sök-ikon | ✅ | ✅ | Search-ikon → expanderbar sökruta |
| Credits-ikon → credits-sidan | ✅ | ✅ | Coins-pill → /credits |
| Tab: Hem, Bokningar, +, Notiser, Profil | ✅ | ⚠️ | Tabs heter: Hem, Bokningar, (+ Lägg upp), **Bevakningar**, Profil — spec säger "Notiser" men appen säger "Bevakningar". **Bevakningar är korrekt per terminologikrav** |
| INTE: VIP-symbol | ❌ | ❌ | **VIP/Exklusiv-badge finns fortfarande** i restaurant/[id].tsx rad 926-947 (`isExclusive`) |
| INTE: "8 bord tillgängliga" | ✅ | ✅ | Ej synlig |

### A9. Profil

| Krav från spec | Finns i appen? | Korrekt implementerat? | Problem |
|---|---|---|---|
| Credits som SIFFRA (inte visuell skala) | ✅ | ✅ | Siffra (t.ex. "5") visas |
| Bokningshistorik: upplagda + övertagna | ❌ | ❌ | **Profilen visar INTE bokningshistorik** — bara trust-stats. Bokningshistorik finns i separat Bokningar-tab |
| INTE: "Belöningar tillgängliga"-sektion | ✅ | ✅ | Finns inte |
| Konto: Bjud in vän | ✅ | ✅ | "Bjud in en vän och få en credit" |
| Konto: Betalningar | ✅ | ✅ | → /payment |
| Konto: Hjälp | ✅ | ✅ | "Hjälp & Support" → /support |
| Konto: Logga ut | ✅ | ✅ | "Logga ut" med logout |
| Konto: Kontoinställningar | ✅ | ✅ | → /account-settings |
| "Köp fler credits"-knapp | ❌ | ❌ | **Saknas i profilen** — credits-card visar bara saldo, ingen CTA till credits-sida |

### A10. Kontoinställningar

| Krav från spec | Finns i appen? | Korrekt implementerat? | Problem |
|---|---|---|---|
| Förnamn | ✅ | ✅ | — |
| Efternamn | ✅ | ✅ | — |
| E-post | ✅ | ✅ | Med verifieringsindikator |
| Telefon | ✅ | ✅ | Ej redigerbar, med verifieringsindikator |
| Födelsedag | ✅ | ✅ | — |
| Stad | ✅ | ✅ | — |
| Verifieringsindikator (grön bock) | ✅ | ✅ | Grön/guld badge per fält |
| Radera konto längst ner | ✅ | ✅ | Med GDPR-bekräftelse |

### A11. Betalningssida

| Krav från spec | Finns i appen? | Korrekt implementerat? | Problem |
|---|---|---|---|
| Kortuppgifter via Stripe | ❌ | ❌ | **Manuell input, inte Stripe Elements** |
| "Inga pengar dras enbart av att du lägger in kortuppgifter" | ✅ | ✅ | Exakt text finns |
| Förklaring av när betalningsansvar uppstår | ✅ | ✅ | Två förklaringsrader |

### A12. Credits-sida

| Krav från spec | Finns i appen? | Korrekt implementerat? | Problem |
|---|---|---|---|
| Antal credits tydligt | ✅ | ✅ | Stor siffra med count-up animation |
| Förklaring av vad credits är | ✅ | ✅ | "Tjäna och använd credits för att ta över bokningar" |
| Köp: 1 credit = 39 kr | ✅ | ✅ | "Köp 1 credit · 39 kr" |
| Gratis credits: Bjud in vän (+1) | ✅ | ✅ | — |
| Gratis credits: Lägg upp bokning (+1) | ⚠️ | ⚠️ | Visar **+2 credits** — spec säger "+1" vid uppladdning |
| INTE: visuell skala 5/10/15/20 | ✅ | ✅ | Ingen skala |

### A13. Bjud in vän

| Krav från spec | Finns i appen? | Korrekt implementerat? | Problem |
|---|---|---|---|
| "Du och din vän får vardera 1 credit" | ✅ | ✅ | Exakt text |
| Unik kod att kopiera | ✅ | ✅ | Referralkod med kopiera/dela |
| Skydd mot missbruk | ❌ | ❌ | **Ingen anti-abuse implementation** |

### A14. Hjälp och support

| Krav från spec | Finns i appen? | Korrekt implementerat? | Problem |
|---|---|---|---|
| Chatt eller e-post | ✅ | ⚠️ | Båda alternativ finns, men **chatt gör inget** |
| Notis när svar kommit | ⚠️ | ⚠️ | Text nämner det ("Du får en notis"), men **push-notiser ej implementerade** |

### A15. Onboarding

| Krav från spec | Finns i appen? | Korrekt implementerat? | Problem |
|---|---|---|---|
| Telefonnummer-verifiering obligatorisk | ✅ | ⚠️ | Flöde finns men **ingen riktig SMS-verifiering** — mock OTP |
| E-post-verifiering obligatorisk | ⚠️ | ⚠️ | E-post samlas in i registrering men **ingen verifieringsmail** |
| Stad-val | ✅ | ✅ | Steg 5 i onboarding |

---

## B. SAKNADE FEATURES

### Kritiskt (affärsmodellen fungerar ej utan dessa)
1. **Stripe-integration** — inga riktiga betalningar fungerar
2. **Pre-authorization vid claim** — pengadebitering vid no-show omöjlig
3. **No-show avgift (10-20%)** — kommuniceras aldrig, logik saknas
4. **Escrow-princip** — varken implementerat eller kommunicerat
5. **Vidareförsäljning av bokningar** — konceptet finns ej

### Viktigt
6. **Bokningshistorik i profilen** — spec kräver det, finns bara i separat tab
7. **Sparade restauranger** — nämns i spec men saknas helt
8. **Push-notiser** (expo-notifications) — bevakningar finns men notifierar inte
9. **Köp credits-knapp i profilen** — saknas
10. **Sittningstyp (lunch/middag/brunch)** — visar bara inomhus/utomhus
11. **Riktiga villkor vid claim** — checkbox finns men villkorstext saknas
12. **Ansvarsmodell-kommunikation** — vem som ansvarar och när synliggörs inte

### Minor
13. **VIP/Exklusiv-badge** ska bort per spec
14. **FAQ ångerfristen** borde specifikt nämna 5 minuter
15. **Credits vid bokning: +2 vs +1** — inkonsekvent med spec
16. **Anti-abuse för referrals** — ingen validering
17. **Chatt-support** — placeholder utan funktion

---

## C. FELAKTIG IMPLEMENTATION

| # | Vad | Problem | Fil | Rad |
|---|---|---|---|---|
| C1 | Credits vid uppladdning | Visar "+2 credits" direkt vid uppladdning. Spec: credits ges när bokningen **tas över** av någon annan. Och spec säger +1, inte +2. | credits.tsx | 292, 374 |
| C2 | Payment-sida | Manuell kortinput utan Stripe SDK. Spar-knappen gör ingenting med kortet (bara haptic + router.back). **Falsk trygghet.** | payment.tsx | 33-37 |
| C3 | Credits-köp | "Köp 1 credit · 39 kr"-knappen ger bara haptic feedback — inget köp sker. | credits.tsx | 376-399 |
| C4 | VIP-badge kvar | `isExclusive`-badge med "Exklusiv" text finns kvar i restaurang-detalj. Spec säger explicit att denna SKA BORT. | restaurant/[id].tsx | 926-947 |
| C5 | Ansvarsmodell dold | Ångerfristen (5 min) visas vid claim, men **vem som ansvarar** (originalbokare vs claimant) kommuniceras aldrig. Kritiskt för juridiska skäl. | restaurant/[id].tsx | 1246-1293 |
| C6 | No-show kostnad otydlig | Checkbox säger "kan debiteras vid no-show" men **säger inte hur mycket** (10-20%). | restaurant/[id].tsx | 1410-1412 |
| C7 | Profil utan historik | Profilen visar trust-stats men inte faktisk bokningshistorik (upplagda + övertagna). | profile.tsx | 375-537 |
| C8 | Settings-knapp = "Coming Soon" | Kugghjulet i profil-headern visar "Coming Soon"-modal istället för att navigera till /account-settings. **Account settings finns redan!** | profile.tsx | 188-201 |

---

## D. KOMMUNIKATIONSPROBLEM

### D1. Ansvarsmodellen — OTILLRÄCKLIG
- **Situation:** Användaren ser inte vem som ansvarar för bokningen i olika stadier.
- **Risk:** Juridisk — om en claimant inte vet att ansvar överförs efter 5 min kan de disputera avgifter.
- **Fix:** Lägg till ansvarsflödesdiagram eller tydlig text i claim-flödet OCH i FAQ.

### D2. Credits-förståelse — GODKÄNT med anmärkning
- Credits förklaras tydligt i credits.tsx ("Tjäna och använd credits").
- +2/-2 visas tydligt.
- **Anmärkning:** Det framgår inte att credits ges EFTER att bokningen tas över, inte vid uppladdning.

### D3. Serviceavgiften (29 kr) — GODKÄNT
- Visas tydligt i kostnad-sektionen i restaurant/[id].tsx.
- Visas i CTA-knappen: "Ta över — 2 credits + 29 kr".

### D4. Ångerfristens konsekvenser — DELVIS GODKÄNT
- 5 minuters ångerfrist kommuniceras bra i claim-flödet (blå info-ruta + overlay med countdown).
- **Problem:** Det framgår inte tydligt vad som händer EFTER att ångerfristen löper ut:
  - Ansvaret övergår (nämns inte explicit)
  - Kortet kan debiteras vid no-show (nämns i checkbox men inte i ångerfrist-infon)
  - Credits returneras inte (nämns inte)

### D5. No-show kostnad — OTYDLIG
- Nämns vagt i checkbox: "kan debiteras vid no-show"
- **Saknas:** Specifikt belopp (10-20% av restaurangens avgift)
- **Saknas:** Att originalbokaren ersätts

---

## E. PRIORITERADE ÅTGÄRDER

### KRITISK (P0) — Affärsmodellen fungerar inte utan

| # | Åtgärd | Fil(er) | Estimering |
|---|---|---|---|
| E1 | **Stripe-integration** — ersätt manuell kortinput med Stripe Elements/PaymentSheet | payment.tsx, backend/src/stripe.ts | Stor |
| E2 | **Pre-authorization vid claim** — reservera belopp på kort vid övertagande | restaurant/[id].tsx, backend | Stor |
| E3 | **No-show logik + avgift** — implementera debitering vid no-show (10-20%), ersättning till originalbokare | Ny backend-logik + kommunikation i UI | Stor |
| E4 | **Credits-köp** — koppla "Köp credits"-knappen till Stripe checkout | credits.tsx, backend | Medium |
| E5 | **Ansvarsmodell-kommunikation** — lägg till tydlig ansvarstext vid claim + i FAQ | restaurant/[id].tsx, faq.tsx | Liten |

### VIKTIG (P1) — Spec-avvikelser som påverkar användarupplevelsen

| # | Åtgärd | Fil(er) | Estimering |
|---|---|---|---|
| E6 | **Ta bort VIP/Exklusiv-badge** — spec kräver det | restaurant/[id].tsx:926-947 | Liten |
| E7 | **Bokningshistorik i profilen** — lägg till upplagda + övertagna direkt i profilen | profile.tsx | Medium |
| E8 | **Köp credits-CTA i profilen** — lägg knapp under credits-card | profile.tsx:358-373 | Liten |
| E9 | **Push-notiser** — installera expo-notifications, implementera vid bevaknings-match | alerts.tsx, backend | Medium |
| E10 | **Sittningstyp** — lägg till lunch/middag/brunch istället för bara inomhus/utomhus | submit.tsx, restaurant/[id].tsx, types.ts | Medium |
| E11 | **Settings-knapp → account-settings** — fixa kugghjulet i profil-headern | profile.tsx:188-201 | Liten |
| E12 | **Villkorstext vid claim** — visa faktiska villkor (ej bara "Jag godkänner villkoren") | restaurant/[id].tsx:1410-1412 | Liten |

### MINOR (P2)

| # | Åtgärd | Fil(er) | Estimering |
|---|---|---|---|
| E13 | **Credits-belopp: +2 → +1** vid uppladdning (per spec) + ges först vid övertagande | credits.tsx:292, submit success msg | Liten |
| E14 | **FAQ ångerfrist** — nämn 5 minuter specifikt i frågan "Kan jag ångra..." | faq.tsx:44-46 | Liten |
| E15 | **Anti-abuse för referrals** — validera att raderade konton inte kan farma credits | Backend referral route | Liten |
| E16 | **Sparade restauranger** — lägg till möjlighet att favoritmarkera | Ny feature | Medium |
| E17 | **Chatt-support** — implementera riktig chatt (eller ta bort alternativet) | support.tsx | Medium |
| E18 | **No-show avgift-belopp i UI** — visa 10-20% i checkbox/FAQ | restaurant/[id].tsx, faq.tsx | Liten |

---

## SAMMANFATTNING

| Kategori | Totalt krav | Uppfyllt | Delvis | Saknas |
|---|---|---|---|---|
| Affärsmodell | 6 | 3 | 1 | 2 |
| Ansvarsmodell | 6 | 1 | 0 | 5 |
| Betalning & Säkerhet | 4 | 0 | 0 | 4 |
| Restaurangkort | 11 | 9 | 2 | 0 |
| Kärnfunktioner (11 st) | 11 | 5 | 5 | 1 |
| FAQ (8 st) | 8 | 7 | 1 | 0 |
| Terminologi | 4 | 4 | 0 | 0 |
| Hem-flöde | 7 | 5 | 1 | 1 |
| Profil | 9 | 7 | 0 | 2 |
| Kontoinställningar | 8 | 8 | 0 | 0 |
| Credits-sida | 6 | 5 | 1 | 0 |
| **TOTALT** | **80** | **54 (68%)** | **11 (14%)** | **15 (19%)** |

### Slutsats
**Terminologi, kontoinställningar och FAQ är fullt compliant.** Appens UI-implementation är genomgående professionell med polerade animationer och tydlig design.

**Kritiska luckor:** Betalningsflödet och ansvarsmodellen saknar implementation. Stripe-integration, pre-authorization, no-show-hantering och escrow är alla nödvändiga innan appen kan lanseras. Dessa utgör kärnan i affärsmodellen och utan dem är appen en visuell prototyp snarare än en fungerande marknadsplats.

**Nästa steg:** Prioritera E1-E5 (Stripe + ansvarsmodell) följt av E6-E12 (spec-avvikelser).
