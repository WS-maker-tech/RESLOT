# DEL 5B: "DU MISSADE" — LOSS AVERSION FEATURE
# OBLIGATORISKT FÖRSTA STEG
Använd /superpowers. Aktivera dessa skills i ordning:
brainstorming → marketing-psychology → ux-researcher-designer → product-discovery → senior-pm → senior-frontend → frontend-app-design → emil-design-eng → database-auth → verification-before-completion

## KONTEXT
ResX (konkurrent, NYC) har en "What you missed"-funktion som visar användare bokningar de missat. Detta är en av deras starkaste features — ren loss aversion-psykologi. Reslot ska inte bara kopiera detta utan göra det BÄTTRE.

## LÄS DESSA FILER
1. RESLOT_BRAIN.md
2. mobile/src/app/(tabs)/index.tsx (hem-skärmen)
3. mobile/src/app/(tabs)/alerts.tsx (bevakningar)
4. backend/src/reservations.ts
5. backend/prisma/schema.prisma
6. scripts/DJUPANALYS_UX.md (om den finns)

## KÖR WEB-FETCHER
node scripts/web-fetcher.mjs https://resx.co

## STEG 1: STRATEGI & DESIGN (brainstorming + marketing-psychology)

### A. PSYKOLOGISK ANALYS
- Hur fungerar loss aversion i detta sammanhang?
- Vad är skillnaden mellan "Du missade" och "Se vad som finns"?
- Hur skapar vi FOMO utan att vara manipulativa?
- Hur gör vi det bättre än ResX?

### B. RESLOTS VERSION — "Du missade"
Designa en bättre version för Reslot:
- Var ska den visas? (Hem-skärmen? Egen tab? Push-notis?)
- Vad ska visas? (Restaurang, tid, hur snabbt det gick, vem som tog det?)
- Hur länge visas en missad bokning? (24h? 7 dagar?)
- Hur kopplas det till bevakningar? ("Aktivera bevakning för att aldrig missa igen")
- Personalisering: visa bara restauranger i användarens stad/grannskap

### C. COPY & TONALITET
Skriv konkret copy för:
- Rubriken på sektionen
- Enskild missad bokning (kort format)
- CTA under varje missad bokning
- Push-notis-text vid missad bokning

## STEG 2: TEKNISK IMPLEMENTATION

### A. BACKEND
- Ny endpoint: GET /api/reservations/missed
  - Returnerar claimed/expired bokningar senaste 48h
  - Filtrera på användarens stad
  - Sortera på claimedAt (senast först)
  - Inkludera: restaurangnamn, bokningstid, partySize, hur lång tid det tog att bli tagen
- Lägg till i Prisma-schema om nödvändigt

### B. FRONTEND
Bygg ny komponent: MissedBookingsSection
- Placering: på hem-skärmen direkt under header, FÖRE bokningslistan
- Design: horisontell scroll med kort (inte vertikal lista)
- Varje kort visar:
  * Restaurangbild (blur/overlay för att signalera "missad")
  * Restaurangnamn i Fraunces
  * "Togs för X minuter sedan" eller "Igår kl 19:00"
  * "⚡ Gick på 4 minuter" (urgency-data)
  * CTA: "Bevaka [restaurang]" knapp
- Animation: FadeInRight.stagger på korten
- Haptics vid scroll
- Tom state: dölj sektionen om inga missade bokningar

### C. PUSH-NOTIS (förbered struktur)
- Triggas när: en bokning på bevakad restaurang claimed
- Text: "Du missade ett bord på [restaurang] — aktivera fler bevakningar!"

## STEG 3: IMPLEMENTERA ALLT

Implementera direkt:
1. Backend-endpoint /api/reservations/missed
2. React Query hook: useMissedReservations()
3. MissedBookingsSection-komponent
4. Integration i index.tsx hem-skärmen
5. Lägg till länk från MissedBookingsSection → add-watch skärmen

Använd:
- react-native-reanimated v3 för animationer
- Spring-animationer, haptics
- Fraunces på rubriker
- Designsystemets färger
- Skeleton loader medan data hämtas

## AVSLUTANDE STEG
Skriv DONE_MISSED i scripts/progress.md när klart.
openclaw system event --text "🎯 'Du missade'-feature byggd och klar!" --mode now
