import { C } from '../lib/theme';

// Reslot locked palette — synkad med C.* i src/lib/theme.ts.
// Om någon färg ändras i theme.ts (säg C.forest), uppdateras alla doodles
// automatiskt här. paperDeep är darkare sand för shadowing på paper-floor.
export const COLORS = {
  paper:      C.paper,         // #EAD9B8 — warm sand floor
  paperDeep:  '#D9C8A0',
  ink:        C.dark,          // #111827 — primär line-ink
  green:      C.forest,        // #1F4D2A — Reslot brand-grön
  terracotta: C.coral,         // #D97757 — gnista, sparsamt
} as const;
