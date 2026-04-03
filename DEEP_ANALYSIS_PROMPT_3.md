# BRUTAL DJUPANALYS DEL 3: STRIPE, BACKEND & ACTION PLAN
# OBLIGATORISKT FÖRSTA STEG
Använd /superpowers. Aktivera sedan dessa skills:
api-design-reviewer → stripe-integration-expert → senior-pm → verification-before-completion

## LÄS DESSA FILER
1. Sök igenom ALLA filer i backend/src/ med fokus på betalningar, webhooks och auth.
2. Läs scripts/DJUPANALYS_UX.md
3. Läs scripts/DJUPANALYS_TECH.md
4. Läs TODO.md

## UTFÖR ANALYSEN
Skapa filen scripts/DJUPANALYS_BACKEND_ACTION.md och inkludera:

### A. STRIPE & BETALFLÖDE
- Är Pre-auth korrekt implementerat?
- Granska webhook-säkerhet, risk för race conditions och hantering av PSD2.

### B. PRIORITERAD ÅTGÄRDSLISTA (MASTER PLAN)
Sammanställ insikterna från UX-, Tech- och Backend-analyserna.
- Gör en matris: Impact × Effort
- Varje åtgärdspunkt måste innehålla: Berörd fil, exakt åtgärd, förväntad impact och estimerad tid.

## AVSLUTANDE STEG
1. Skriv om TODO.md HELT från grunden med ALLA åtgärder från UX-, Tech- och Backend-analyserna.
   - Sortera från mest kritiskt till minst kritiskt
   - Varje punkt ska ha: berörd fil, exakt åtgärd, impact, estimerad tid
   - Inga åtgärder får utelämnas — hellre för mycket än för lite
2. Kör: openclaw system event --text "🔍 BRUTAL DJUPANALYS KLAR! Alla tre delar klara. TODO.md uppdaterad med alla åtgärder." --mode now
