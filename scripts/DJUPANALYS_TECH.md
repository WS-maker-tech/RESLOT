# DJUPANALYS DEL 2: TEKNISK SKULD & KODKVALITET
*Genererad: 2026-04-01*

---

## SAMMANFATTNING

| Kategori | Status |
|----------|--------|
| TypeScript-kompilering (`tsc --noEmit`) | **0 fel** |
| ESLint-varningar | **50+** |
| Totalt antal rader (mobile/src/) | **~11 900** |
| Kritiska buggar | **2** |
| Medel-allvarliga problem | **5** |
| Lågprioriterade förbättringar | **6** |

---

## A. TEKNISK SKULDANALYS (FRONTEND)

### 1. TypeScript-fel & Arkitektoniska brister

#### TypeScript: Inga kompileringsfel
`tsc --noEmit` passerar utan fel. Bra grundnivå.

#### ESLint: 50+ varningar i 7 filer

**useEffect dependency-varningar (KRITISKT MÖNSTER)**
Samma bugg upprepas i 6 filer — animerade värden (opacity, scale, dotOpacity) saknas i dependency arrays:

| Fil | Rad | Saknade deps |
|-----|-----|-------------|
| `alerts.tsx` | 50 | `opacity` |
| `index.tsx` | 78, 103 | `opacity`, `dotOpacity`, `scale` |
| `profile.tsx` | 43 | `opacity` |
| `reservations.tsx` | 40 | `opacity` |
| `submit.tsx` | 212, 221 | `progressAnim`, `firstName`, `lastName` |
| `onboarding.tsx` | 171, 209, 380, 514, 725 | Flera animationsvärden |

**Konsekvens**: Animationer kan fastna eller inte triggas vid re-renders. submit.tsx rad 221 kan missa namnändringar.

**Oanvända variabler**
- `alerts.tsx`: 3x `err` (tyst felhantering)
- `reservations.tsx`: 1x `err`
- `index.tsx`: `FAQ_ITEMS`, `FAQItem` (dead code)

**Stilvarningar**
- `index.tsx` rad 826-827: 18x saknad space efter komma
- `submit.tsx` rad 53-54, 121, 124, 132: 28x saknad space efter komma
- Indikerar minifierade/kopierade SVG-paths

---

### 2. KRITISKA BUGGAR

#### BUG 1: Hardcoded test-email som fallback (`test@reslot.se`)
**Allvarlighet: HÖG** — Produktionsdata-läckagerisk

8 ställen i koden defaultar till `"test@reslot.se"` när telefonnummer saknas:

```
alerts.tsx (3 ställen):    phone || "test@reslot.se"
profile.tsx (2 ställen):   phone || "test@reslot.se"
index.tsx (1 ställe):      phone || "test@reslot.se"
reservations.tsx (1 st):   phone || "test@reslot.se"
_layout.tsx (1 ställe):    phone || "test@reslot.se"
```

**Konsekvens**:
- Oinloggade användare gör API-anrop med testdata
- API-loggar förorenas
- Potentiell dataläcka om test-kontot har riktig data

**Fix**: Använd `enabled: !!phone` i useQuery + LoginGate-komponent

#### BUG 2: Tyst felhantering (Silent Error Suppression)
**Allvarlighet: HÖG**

```typescript
// alerts.tsx rad 357
try {
  await markReadMutation.mutateAsync({ phone: phone || "test@reslot.se" });
} catch (err) {
  // silently ignore  ← DÅLIGT
}

// account-settings.tsx
} catch { /* ignore */ }
```

**Konsekvens**: Användaren får ingen feedback vid misslyckade åtgärder. Omöjligt att debugga i produktion.

---

### 3. ARKITEKTONISKA BRISTER

#### 3a. Inkonsistenta API-anropsmönster
`hooks.ts` blandar TRE olika fetch-metoder:

| Metod | Används av | Problem |
|-------|-----------|---------|
| `api.get/post()` helper | De flesta hooks | Korrekt — hanterar auth-tokens |
| Direkt `fetch()` | `useDeleteWatch` | Saknar auth-token! |
| Direkt `fetch()` + manuell unwrap | `useDeleteAccount` | Saknar auth-token! |

**Konsekvens**: DELETE-anrop kan misslyckas i produktion om backend kräver auth.

#### 3b. Överdimensionerade skärmkomponenter

| Fil | Rader | Rimlig gräns |
|-----|-------|-------------|
| `onboarding.tsx` | 1 821 | ~500 (4 steg → 4 filer) |
| `submit.tsx` | 1 791 | ~400 (bryt ut formulär-steg) |
| `restaurant/[id].tsx` | 1 482 | ~400 (bryt ut sektioner) |
| `(tabs)/index.tsx` | 1 412 | ~400 (bryt ut kort, filter, kalender) |

**Konsekvens**: Svårt att underhålla, testa och optimera.

#### 3c. Duplicerad skeleton-loader
Identisk `SkeletonLine`/`SkeletonBlock` definierad lokalt i:
- `alerts.tsx`
- `reservations.tsx`
- `profile.tsx`
- `index.tsx`

**Fix**: Extrahera till `src/components/Skeleton.tsx`

#### 3d. Inga Error Boundaries
Ingen React Error Boundary finns. Ett enda okänt fel i en komponent kan krascha hela appen.

---

### 4. STYLING-INKONSISTENSER

#### Tre parallella styling-system i bruk

| System | Antal förekomster | Exempel |
|--------|------------------|---------|
| Inline `style={{}}` | ~983 | `style={{ fontSize: 15, color: C.dark }}` |
| NativeWind `className` | ~80 | `className="flex-row items-center"` |
| Theme-konstanter | Genomgående | `FONTS.semiBold`, `C.coral`, `SPACING.md` |

**Problem**:
- Blandar `className` och `style` i samma fil, ibland på samma element
- Hardcoded färgvärden istället för theme-konstanter: `"rgba(224,106,78,0.1)"` borde vara `C.coralLight`
- Magiska tal: `borderRadius: 16`, `padding: 20` istället för `RADIUS.lg`, `SPACING.lg`
- `StyleSheet.create()` används INTE — ingen stil-optimering

#### Rekommendation
Välj ETT system (inline styles + theme-konstanter verkar vara det dominerande). Migrera alla `className`-användningar till inline styles, eller vice versa.

---

### 5. PERFORMANCE-RISKER

#### 5a. Ooptimerad sökfiltrering (alerts.tsx)
```typescript
// Rad ~816 — körs på varje render utan memoizering
const filtered = allRestaurants.filter((r: any) =>
  r.name.toLowerCase().includes(searchQuery.toLowerCase())
);
```
**Fix**: Wrappa i `useMemo` + lägg till debounce på sök-input.

#### 5b. Överdriven useState i home-skärmen (index.tsx)
14+ useState-variabler:
```typescript
const [selectedDate, setSelectedDate] = useState<Date>(new Date());
const [showCalendar, setShowCalendar] = useState<boolean>(false);
const [activeFilter, setActiveFilter] = useState<string>("Alla");
const [selectedCity, setSelectedCity] = useState<string>("Stockholm");
const [showCityPicker, setShowCityPicker] = useState<boolean>(false);
const [showSearch, setShowSearch] = useState<boolean>(false);
const [searchQuery, setSearchQuery] = useState<string>("");
// ... 7+ fler
```
**Konsekvens**: Varje state-ändring triggar re-render av hela skärmen (1 400 rader).

#### 5c. Saknad memoizering
- Inga `React.memo()` på återanvändbara kort-komponenter
- Inga `useMemo` på filtrerade listor (utom reservations.tsx som gör det korrekt)
- `useRestaurants()` har ingen `staleTime` — refetchar vid varje mount

#### 5d. ScrollView vs FlatList
Listor renderas i `ScrollView` istället för `FlatList` — alla items renderas direkt, inte lazy.

#### 5e. Ingen bildcaching-strategi
Restaurangbilder laddas från Unsplash utan cache-kontroll. Vid scroll renderas bilderna om varje gång.

---

### 6. SÄKERHETSRISKER PÅ KLIENTSIDAN

| Risk | Allvarlighet | Detalj |
|------|-------------|--------|
| Test-email fallback | HÖG | `"test@reslot.se"` kan exponera testdata |
| Telefonnummer i URL query-string | MEDEL | `?phone=${phone}` — synligt i loggar/analytics |
| `any`-typer på catch-block | LÅG | `catch (err: any)` — borde vara `unknown` |
| Ingen input-validering | LÅG | Sökfält skickas direkt utan sanitering |
| Inga API-keys i koden | OK | Miljövariabler används korrekt |
| Auth-token i Zustand+AsyncStorage | OK | Standard-mönster för RN |

---

### 7. DEAD CODE & MOCK-DATA

#### mock-data.ts (467 rader — OANVÄND)
Filen exporterar:
- `MOCK_USER`, `MOCK_RESTAURANTS`, `MOCK_MY_RESERVATIONS`, `MOCK_ALERTS`
- `CUISINE_FILTERS`, `NEIGHBORHOODS`, `SEARCHABLE_RESTAURANTS`

**Ingen av dessa importeras någonstans i appen.** Ren dead code.

#### Oanvända hooks
- `useReferralCode()` — fetchar data men inget UI visar det
- `useUseReferralCode()` — definierad men aldrig anropad

#### Oanvända typer i index.tsx
- `FAQ_ITEMS` och `FAQItem` — definierade men aldrig använda

---

## PRIORITERAD ÅTGÄRDSLISTA

### Omedelbart (före lansering)

| # | Åtgärd | Filer | Uppskattad insats |
|---|--------|-------|-------------------|
| 1 | Ersätt `"test@reslot.se"` fallback med `enabled: !!phone` | 5 filer | 30 min |
| 2 | Lägg till felhantering istället för tysta catches | 2 filer | 20 min |
| 3 | Migrera `useDeleteWatch`/`useDeleteAccount` till api-helper | hooks.ts | 15 min |
| 4 | Fixa useEffect dependency arrays (animations) | 6 filer | 45 min |

### Kort sikt (vecka 1-2)

| # | Åtgärd | Filer | Uppskattad insats |
|---|--------|-------|-------------------|
| 5 | Extrahera delad `Skeleton`-komponent | 4 filer | 30 min |
| 6 | Memoizera restaurang-filtrering + debounce sök | alerts.tsx | 20 min |
| 7 | Ersätt hardcoded färger med theme-konstanter | Alla skärmar | 1h |
| 8 | Ta bort dead code (mock-data.ts, FAQ_ITEMS, oanvända hooks) | 3 filer | 15 min |

### Medellång sikt (vecka 2-4)

| # | Åtgärd | Filer | Uppskattad insats |
|---|--------|-------|-------------------|
| 9 | Bryt ut stora skärmar i sub-komponenter | 4 skärmar | 4h |
| 10 | Välj ETT styling-system (inline eller NativeWind) | Alla | 2h |
| 11 | Byt ScrollView → FlatList för långa listor | index, alerts | 1h |
| 12 | Lägg till Error Boundary i _layout.tsx | 1 fil | 30 min |
| 13 | Flytta telefonnummer från query-string till headers/body | hooks.ts + backend | 1h |

---

## KODKVALITETSPOÄNG

| Dimension | Betyg (1-5) | Kommentar |
|-----------|-------------|-----------|
| TypeScript-strikthet | 4/5 | Kompilerar utan fel, men `any` förekommer |
| Felhantering | 2/5 | Tysta catches, inga error boundaries |
| Kodstruktur | 2/5 | Stora filer, duplicerad kod |
| Styling-konsistens | 2/5 | Tre parallella system |
| Performance | 3/5 | React Query bra, men saknad memoizering |
| Säkerhet | 3/5 | Test-email är kritisk, resten OK |
| State management | 4/5 | React Query + Zustand korrekt använt |
| API-integration | 3/5 | Inkonsistenta mönster i hooks |
| **Totalt** | **2.9/5** | **Fungerar men har teknisk skuld** |
