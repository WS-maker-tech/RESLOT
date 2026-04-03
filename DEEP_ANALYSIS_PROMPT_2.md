# BRUTAL DJUPANALYS DEL 2: TEKNISK SKULD & KODKVALITET
# OBLIGATORISKT FÖRSTA STEG
Använd /superpowers. Aktivera sedan dessa skills:
systematic-debugging → senior-frontend → code-reviewer → tech-debt-tracker → performance-profiler → senior-qa

## LÄS DESSA FILER
1. mobile/CLAUDE.md
2. TODO.md
3. Sök igenom kodbasen i mobile/src/ för att förstå arkitekturen och eventuella "fulhack"

## KÖR TEKNISKA CHECKS
Kör dessa kommandon och analysera outputen noggrant:
cd mobile && npx tsc --noEmit 2>&1
cd mobile && npx expo lint 2>&1 | head -50

## UTFÖR ANALYSEN
Skapa filen scripts/DJUPANALYS_TECH.md och inkludera:

### A. TEKNISK SKULDANALYS (FRONTEND)
- Sammanfatta TypeScript-fel och arkitektoniska brister.
- Identifiera styling-inkonsistenser.
- Lista konkreta performance-risker (renders, state management, tunga komponenter).
- Säkerhetsrisker på klientsidan.
