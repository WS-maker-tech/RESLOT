# Reslot — Visual Foundation v1

> Co-founder-driven identity-pivot. Golvet byter från flat off-white till warm paper-textured background. Headings flippas till Unisketch hand-drawn. Inga features, layouts eller copy rörs.

## TL;DR — vad ändras visuellt

| Före | Efter |
|------|-------|
| Bg `#FAFAF8` flat off-white | Bg `#F0E1CB` warm oat paper + tiled texture (`paper.jpg`) |
| Headings i Plus Jakarta Sans Bold | Headings i Unisketch Bold (hand-drawn) |
| Cards `#FFFFFF` | Cards `#FFFFFF` (oförändrat — paper-on-paper layering) |
| Splash flat off-white | Splash transparent → paper-texturen syns vid första frame |

Body-text, CTAs, ikoner, animationer, layouts — allt oförändrat.

## Locked decisions

1. **`C.paper = #F0E1CB`** — sampled avg från `paper-texture.png` (n=16k pixels). Center pixel `#F1E2CC`, hörn-variation `#ECDEC7 → #F4E6D1` (mild noise, no clipping).
2. **`C.bg → #F0E1CB`** — alias för paper. 42 callsites som hardcodar `backgroundColor: C.bg` ärver warmth automatiskt.
3. **Texture-leverans:** `<ImageBackground source={require("../../assets/textures/paper.jpg")} resizeMode="repeat">` på root + CSS `background-image` i `+html.tsx` body för web.
4. **Stack `contentStyle.backgroundColor: 'transparent'`** — Stack-screens som inte målar egen bg avslöjar texturen.
5. **`FONTS.displayBold + FONTS.displaySemiBold → "Unisketch-Bold"`** — single heading weight (Unisketch zip har bara Bold + Light; Light ignoreras per co-founder).
6. **Font loading konsoliderat till root** `_layout.tsx`. Fixade en latent bug där non-tab-routes (modals, onboarding, restaurant detail) saknade fonts på cold-start.
7. **Splash overlay transparent** — texturen syns direkt vid app-boot.

## Glyph coverage

Unisketch-Bold-TTF:n täcker alla svenska + nordiska + accenttecken (cmap-parsed):

```
✓ å ä ö Å Ä Ö é É ø Ø
✓ Alla ASCII (A-Z a-z 0-9) + interpunktion
```

226 totala kodpunkter — "limited" syftar bara på subset av extended Latin (kyrilliska, grek, CJK saknas). Inget vi behöver i Reslot.

## Asset budget

| Asset | Size | Path |
|-------|------|------|
| `Unisketch-Bold.ttf` | 298 KB | `mobile/assets/fonts/` |
| `paper.jpg` (native) | 245 KB | `mobile/assets/textures/` |
| `paper.jpg` (web) | 245 KB | `mobile/public/textures/` |
| **Total bundle delta** | **~543 KB** | |

JPG valdes över medlevererad PNG (1.2 MB) — paper-texturen behöver varken alpha eller lossless. Sparar 1 MB i web-bundle.

Texturen är 1254×1254 pre-processed seamless (verified via 2×2-grid preview). Om Android perf blir janky vid scroll: downsamplera till 768×768 eller 512×512 (post-v1 optimering).

## Verifiering

### Lokalt
```bash
cd mobile && bun install && bun run web    # localhost:8081

# Glyph-test (manuellt): cold-boot, kolla att svenska å/ä/ö renderar
# i Unisketch på "Något gick fel" (ErrorBoundary), "Frågor och svar"
# (modal-title), profil-screens, etc.

# Type-check (6 baseline-errors finns sedan tidigare, inga nya)
bunx tsc --noEmit
```

### Screenshots
```bash
# Before-baseline från main
git checkout main && cd mobile && bun run web
node mobile/scripts/screenshot-foundation.mjs --mode=before

# After-baseline från branch
git checkout reslot/visual-foundation-v1 && bun run web
node mobile/scripts/screenshot-foundation.mjs --mode=after

# Output: /screenshots/{before,after}/{01-home..05-help}.png
```

### Production efter merge
```bash
H=$(curl -sL https://mobile-three-sable.vercel.app/ | grep -oE "index-[a-f0-9]+\.js" | head -1)
curl -s "https://mobile-three-sable.vercel.app/_expo/static/js/web/$H" \
  | grep -oE "Unisketch|F0E1CB|FAFAF8|paper\.jpg" | sort | uniq -c

# Förvänta: Unisketch ≥1, F0E1CB ≥3, FAFAF8 = 0, paper.jpg ≥1

# Verifiera texture servas på web
curl -sI https://mobile-three-sable.vercel.app/textures/paper.jpg | grep -E "HTTP|content-type|content-length"
# Förvänta: 200 OK, image/jpeg, ~251 KB
```

## Gotchas + dev-notes

- **`+html.tsx` är Node SSR** — kan inte referera runtime tokens. `#F0E1CB` + `/textures/paper.jpg` är hardcodade där. Om `C.paper` ändras: uppdatera `theme.ts` + `app.json:splash.backgroundColor` + `+html.tsx` (tre platser).
- **Native font-cache på fysiska devices** — Unisketch kan kräva en `bun expo prebuild --clean` en gång för att rensa cache. Expo Go / simulator får hela bundle:n via JS — inget cache-problem.
- **ImageBackground perf på Android** — paper.jpg @ 1254×1254 är på gränsen. Om scroll-FPS dippar: downsamplera assets till 768×768 (50 KB) eller byt till `expo-image` `<Image contentFit="repeat">`.
- **Vercel public/ static serving** — Expo Web build kopierar `mobile/public/*` till dist-root. Filen servas på `https://...vercel.app/textures/paper.jpg`. Den SPA-rewrite i `vercel.json` (`/((?!api/).*)` → `/index.html`) kör BARA om filen inte finns på disk. Statisk asset vinner.
- **Tab-bar bg är `C.creamSoft` (#FCFCFB)** — ljus, kallare än paper. Avsiktligt: ger tab-bar:en en lätt elevation från golvet utan att behöva shadow.

## Deferred till v1.1+

- Selective `backgroundColor: 'transparent'` på utvalda screens för mer textur-visibility. Just nu syns texturen mest vid:
  - Status-bar gutter
  - Modal sheet-seams
  - Tab-transitions
  - Onboarding/restaurant-detail där `C.bg` inte hardcodas
- Hand-drawn illustrationer per screen (Butter-app-style line-doodles).
- Italic microcopy där det känns naturligt.
- Codemod för resterande hardcoded `fontFamily`-strings (audit + grep-sweep).
- Preview-deploy GitHub Action — automatisk before/after på Vercel-URL utan local dev.

## Commit-historik

```
3ce8278 chore(screenshots): add Playwright capture script for v1 baseline
c9f8975 feat(layout): splash overlay transparent so paper texture shows
2fc2c89 chore(theme): flip 4 hardcoded font strings to FONTS token
acb3230 feat(layout): apply paper texture as global ImageBackground
c2afacc feat(layout): consolidate font loading to root + register Unisketch
769a13a feat(theme): swap displayBold + displaySemiBold to Unisketch
73dd903 feat(theme): introduce C.paper + flip bg to warm cream
8b73a6e chore(assets): add Unisketch Bold + paper texture
17ff50d chore(visual): create reslot/visual-foundation-v1 baseline
```

Varje commit är en logisk enhet — `git revert <sha>` rullar tillbaka en enstaka decision utan att bryta grannarna.
