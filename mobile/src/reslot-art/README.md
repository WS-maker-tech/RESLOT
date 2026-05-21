# reslot-art — personlighets-kit v1 (test)

Handritade scribbles + doodles som transparenta PNG, bundlade som lokala
kod-assets via `require()`. Ingen Supabase-URL. Svart bläck + alpha —
omfärgas i runtime med `tintColor`, så ETT asset funkar i hela paletten.

## Installera
Lägg `reslot-art/` i appens källträd (t.ex. `src/reslot-art/`).
Inga beroenden utöver `react-native`.

## Använd
```tsx
import { Scribble, Doodle, COLORS } from './reslot-art';

// understrykning under en rubrik
<Scribble name="underline" color={COLORS.ink} width={140} />

// terracotta-stjärna som accent (sparsamt!)
<Scribble name="star" color={COLORS.terracotta} width={26} />

// café-doodle i ett tomt tillstånd
<Doodle name="bell" color={COLORS.ink} width={64} />
```

`width` styr storleken, höjden räknas ut från assetens proportion.
`color` tar valfri palett-färg.

## Innehåll
- **Scribbles (16):** underline, underline-double, underline-flick, ring, arrow-right, arrow-down, arrow-curved, cursor, strike, check, star, spark, bracket-left, bracket-right, speedlines, squiggle
- **Doodles (9):** cup, wineglass, candle, cutlery, plate, bell, key, table, coin

## Saknas (väntar på omkörning)
- `scribble-ring` finns, men den andra ovalen (grå fyllnadsmiss) är utesluten.
- `doodle-bottle` utesluten — flaskan var ifylld silhuett, ska köras om som linje.
Lägg till båda i resp. asset-map när de nya arken kommer.

## Disciplin
Detta är krydda. En markering per skärm, sällan. Terracotta = gnista, inte default.
