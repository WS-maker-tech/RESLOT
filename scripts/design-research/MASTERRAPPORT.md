# MASTERRAPPORT: Design Research för Reslot

> Analys av 8 referenstjänster med konkreta rekommendationer för Reslot-appen.
> Genererad: 2026-04-01

---

## 1. Sammanfattning

Reslot opererar i skärningspunkten mellan **restaurangbokning** (Bruce, Karma), **marknadsplats med credits** (ClassPass), och **peer-to-peer delning med hållbarhetsfokus** (Too Good To Go). Denna rapport destillerar de bästa mönstren från 8 framgångsrika appar till konkreta designrekommendationer.

### Viktigaste insikterna:
1. **Credits-systemet** bör inspireras av ClassPass gamifiering och Strava-achievements
2. **Trust & ansvar** bör byggas som Airbnb (tydliga steg, tydlig ansvarsöverföring)
3. **Onboarding** bör följa Too Good To Gos location-first mönster
4. **Visuell identitet** bör ta efter Storytel/Plantans svenska, varma premium-känsla

---

## 2. Färgpalett — Rekommendation för Reslot

| Referens | Primärfärg | Känsla |
|----------|-----------|--------|
| Too Good To Go | #00473E (djupgrön) | Hållbarhet, tillit |
| Airbnb | #FF385C (rausch-rosa) | Energi, glädje |
| Strava | #FC4C02 (orange) | Aktivitet, gemenskap |
| ClassPass | #00B0FF (blå) | Tillgänglighet |
| Planta | Grön | Skandinavisk, naturlig |

### Rekommendation för Reslot:
- **Primärfärg:** Varm, mörk grön (#1B4332 eller liknande) — signalerar premium + ansvarstagande
- **Accent:** Guld/amber (#D4A853) — kopplar till credits, exklusivitet
- **Semantic:** Grön för success (#22C55E), röd för urgency (#EF4444)
- **Bakgrunder:** #FFFFFF (canvas), #F8F9FA (sections), #1A1A2E (dark headers)
- **Undvik:** För ljusa neon-färger (billig känsla), rent svart text (för hårt — använd #2D2D2D)

---

## 3. Typografi

| App | Typsnitt | Karaktär |
|-----|---------|----------|
| Airbnb | Cereal VF (custom variable font) | Premium, modern |
| Storytel | Euclid (custom) | Litterärt, vuxet |
| Too Good To Go | Too Good Display + Poppins | Vänligt, runt |
| Strava/Planta | System fonts | Rent, snabbt |

### Rekommendation för Reslot:
- **Primärt:** SF Pro (iOS) / Roboto (Android) — system fonts för prestanda
- **Accent/headings:** Överväg Inter eller DM Sans — moderna, geometriska, lätta att läsa
- **Storlekar:** Följ Airbnbs skala:
  - Display: 2rem (32px) semibold
  - Titlar: 1.375rem (22px) semibold
  - Body: 1rem (16px) regular
  - Small: 0.875rem (14px) regular
- **Line-height:** 1.4x body, 1.2x headings

---

## 4. Trust Elements — Bygga förtroende

### Vad referenserna gör:

| Mönster | Vem | Applicerbart? |
|---------|-----|---------------|
| "100M+ users" stor siffra | Strava, TGTG | ✅ Skala ner — "500+ restaurangbokningar delade" |
| Partner-logokarusell | Karma | ✅ Visa restauranger som finns i systemet |
| Kvantifierade resultat | Karma ("30% ökning") | ⚠️ Senare — kräver data |
| B-Corp/hållbarhet | TGTG | ✅ "Minskar matsvinn genom att minska no-shows" |
| Individuella ratings | Storytel (4.0-4.7) | ✅ Restaurangbetyg + användarrating |
| Uptime/garanti | Karma (99.9%) | ❌ Inte relevant för consumer app |

### Rekommendation för Reslot:
1. **Social proof counter** på startsidan: "X bokningar delade denna vecka i Stockholm"
2. **Restaurang-badges**: Visa kända restauranger som användare delat bokningar till
3. **Ansvarsöverföring visuellt**: Inspirerat av Airbnbs checkout-steg — visa tydligt vem som är ansvarig i varje steg
4. **Verifieringsmärken**: Grön bock på verifierade email/telefon (som i kontoinställningar-specen)
5. **Betygsystem**: Synligt rating för användare som delar/claimar bokningar — bygger community-tillit

---

## 5. Konverteringspsykologi

### Bästa mönstren:

| Teknik | Bäst utfört av | Reslot-tillämpning |
|--------|---------------|-------------------|
| **Prisankring** | TGTG ("värt X, du betalar Y") | "Restaurangen är fullbokad. 1 credit = din genväg in." |
| **Scarcity/urgency** | TGTG (begränsat antal), ClassPass (limited spots) | "2 bord tillgängliga just nu" + timer till avbokningsfönster |
| **Credits som valuta** | ClassPass (gamifierat credits-system) | Reslot credits — visa tydligt hur man tjänar/spenderar |
| **Freemium hook** | Strava (gratis + premium), Storytel (50% intro) | 1 gratis credit vid signup + referral-credits |
| **Cancel anytime** | Storytel ("Avsluta när du vill") | "Inga dolda avgifter. Du betalar bara om du no-showar." |
| **Exclusivity** | Bruce (curated restaurants) | Premium-känsla: "Din genväg till fullbokade restauranger" |

### Rekommendation för Reslot:
1. **Hem-skärm**: Visa countdown-timers på bokningar som snart stängs
2. **Restaurangkort**: "X personer bevakar denna restaurang" — social proof + urgency
3. **Credits-sida**: Prisankring — "1 credit = 39 kr. Spara genom att dela dina bokningar (gratis credits!)"
4. **Claim-flöde**: Tydligt steg-för-steg: Välj bokning → Acceptera villkor → Bekräfta → Klar
5. **Referral**: "Bjud in en vän — ni får båda 1 credit" — dubbelsidig belöning som TGTG

---

## 6. Onboarding-mönster

### Referensernas approach:

| App | Onboarding-stil | Steg |
|-----|----------------|------|
| Too Good To Go | Location-first | Plats → Browse → Reservera → Hämta |
| Strava | Multi-auth + aktivitetsval | Google/Apple login → Välj sport → Klar |
| ClassPass | City + intressen | Stad → Intressen → Plan → Boka |
| Storytel | Pris-first | Se priser → Välj plan → Provperiod |
| Planta | Download-first | Ladda ner → Lägg till växt → Påminnelser |

### Rekommendation för Reslot:
**3-stegs onboarding:**

1. **Auth** (låg friktion)
   - Apple Sign In / Google / Email
   - Inspirerat av Strava — multi-auth minskar friktion

2. **Plats + intressen**
   - "Vilken stad äter du i?" (Stockholm default)
   - "Vilken typ av mat gillar du?" (optional, skip-bar)
   - Inspirerat av ClassPass personalization

3. **Credits-intro**
   - "Välkommen! Här är din första credit."
   - Kort animation som visar loop: dela → tjäna → claima
   - Inspirerat av TGTG impact-dashboard

**Viktigt:**
- Max 3 skärmar innan användaren ser innehåll
- "Skippa"-knapp på varje steg
- Visa riktiga bokningar i bakgrunden under onboarding (som Airbnb)

---

## 7. Unika designmönster att stjäla

### Från varje app:

| Mönster | Källa | Reslot-implementering |
|---------|-------|----------------------|
| **Surprise Bag-konceptet** | TGTG | Bokningar som "överraskningar" — spänningselement |
| **Credit-system med dynamisk prissättning** | ClassPass | Populära restauranger = fler credits (framtida feature) |
| **Achievement-badges** | Strava | "Delat 10 bokningar!", "Första claim!" |
| **Provlyssna/preview** | Storytel | Preview av restauranginfo innan man spenderar credits |
| **Spring-based animations** | Airbnb | Naturliga, mjuka animationer i UI |
| **Karuseller med "Visa alla"** | Storytel | Restaurang-karuseller per kategori |
| **Map-view** | TGTG, Airbnb | Karta över tillgängliga bokningar i Stockholm |
| **Minimal landing** | Bruce | App-first approach — webben pekar till appen |
| **Logo-karusell** | Karma | Restaurang-logos bygger trust |
| **Dr. Planta diagnostik** | Planta | "Behöver du hjälp?" smart support |

---

## 8. App Store-optimering

### Lärdomar:

| App | Rating | Downloads | Taktik |
|-----|--------|-----------|--------|
| Too Good To Go | 4.8 ⭐ | 100M+ | Impact-fokus i beskrivning |
| ClassPass | 4.8 ⭐ | — | "One membership" budskap |
| Strava | — | 100M+ | Community-vinkel |
| Planta | — | 7M+ | "Made in Sweden" |

### Rekommendation för Reslot:
- **Titel:** "Reslot — Fullbokade restauranger"
- **Undertitel:** "Dela & hitta restaurangbokningar"
- **Keywords:** restaurang, bokning, Stockholm, mat, bord, lastminute
- **Screenshots:** Visa credits-loop, restauranger, claim-flöde
- **Social proof i beskrivning:** "Över X bokningar delade i Stockholm"

---

## 9. Prioriterad åtgärdslista för Reslot

### 🔴 Kritiskt (implementera nu)
1. **Tydligt ansvarflöde vid claim** — steg-för-steg som Airbnb checkout
2. **Credits-visualisering** — inspirerat av ClassPass, med tydlig tjäna/spendera-vy
3. **Onboarding 3 steg** — auth → stad → credits-intro
4. **Urgency-element** — countdown-timer på avbokningsfönster

### 🟡 Viktigt (nästa sprint)
5. **Social proof** — "X bokningar delade denna vecka"
6. **Restaurang-karuseller** — per kategori/stad, som Storytel
7. **Achievement-badges** — gamifiering av delande
8. **Betygsystem** — användarrating efter claim

### 🟢 Nice-to-have (backlog)
9. **Kart-vy** — bokningar på karta, som TGTG
10. **Dynamisk prissättning** — populära restauranger = fler credits
11. **Spring-animations** — Airbnb-inspirerade micro-interactions
12. **Impact-dashboard** — "Du har hjälpt X restauranger undvika no-shows"

---

## 10. Designsystem-tokens (förslag)

```json
{
  "colors": {
    "primary": "#1B4332",
    "primaryLight": "#2D6A4F",
    "accent": "#D4A853",
    "accentLight": "#E8C87A",
    "background": "#FFFFFF",
    "backgroundSecondary": "#F8F9FA",
    "surface": "#FFFFFF",
    "textPrimary": "#2D2D2D",
    "textSecondary": "#6B7280",
    "textOnPrimary": "#FFFFFF",
    "success": "#22C55E",
    "warning": "#F59E0B",
    "error": "#EF4444",
    "info": "#3B82F6",
    "border": "#E5E7EB",
    "divider": "#F3F4F6"
  },
  "typography": {
    "displayLarge": { "size": 32, "weight": "700", "lineHeight": 38 },
    "displayMedium": { "size": 24, "weight": "600", "lineHeight": 30 },
    "titleLarge": { "size": 22, "weight": "600", "lineHeight": 28 },
    "titleMedium": { "size": 18, "weight": "600", "lineHeight": 24 },
    "bodyLarge": { "size": 16, "weight": "400", "lineHeight": 24 },
    "bodyMedium": { "size": 14, "weight": "400", "lineHeight": 20 },
    "labelLarge": { "size": 14, "weight": "600", "lineHeight": 20 },
    "labelSmall": { "size": 12, "weight": "500", "lineHeight": 16 }
  },
  "spacing": {
    "xs": 4,
    "sm": 8,
    "md": 16,
    "lg": 24,
    "xl": 32,
    "xxl": 48
  },
  "borderRadius": {
    "sm": 8,
    "md": 12,
    "lg": 16,
    "full": 9999
  },
  "animation": {
    "springConfig": { "damping": 20, "stiffness": 200 },
    "enterDuration": 300,
    "exitDuration": 200,
    "curve": "cubic-bezier(0.2, 0, 0, 1)"
  }
}
```

---

## Källdata

| Sajt | Fil | Status |
|------|-----|--------|
| Karma | `karma.json` | ✅ Fullständig |
| Too Good To Go | `toogoodtogo.json` | ⚠️ HTTP 429 — kompletterad med känd data |
| ClassPass | `classpass.json` | ⚠️ HTTP 403 — kompletterad med känd data |
| Strava | `strava.json` | ✅ Fullständig |
| Storytel | `storytel.json` | ✅ Fullständig |
| Planta | `planta.json` | ✅ Fullständig |
| Airbnb | `airbnb.json` | ✅ Fullständig |
| Bruce | `bruce.json` | ⚠️ Minimal sajt — kompletterad med känd data |

---

*Genererad med Claude Code för Reslot design research.*
