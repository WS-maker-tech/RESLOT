# RESLOT — VÄRLDSKLASS APP BYGGUPPDRAG
# Deadline: 22:30. Kvalitet är allt. Ingen kompromiss.

## DU ÄR HUVUDORKESTRATORN
Läs RESLOT_BRAIN.md i projektets root INNAN du gör NÅGOT.
Använd /superpowers ALLTID.

## OBLIGATORISKA SKILLS — ANVÄND ALLA VARJE GÅNG
- /superpowers — ALLTID
- brainstorming — innan ALLT kreativt arbete
- writing-plans — innan du rör kod
- executing-plans — när du kör planer
- dispatching-parallel-agents — kör mobile + backend parallellt
- subagent-driven-development — för oberoende tasks
- systematic-debugging — vid VARJE bugg
- verification-before-completion — ALDRIG "klart" utan bevis
- test-driven-development — vid varje feature
- requesting-code-review — innan merge
- using-git-worktrees — för feature-isolation
- frontend-app-design — ALL React Native UI
- expo-docs — ALL Expo SDK
- database-auth — all auth + DB
- emil-design-eng — ALLA animationer och micro-interactions
- frontend-design — distinkt, production-grade UI
- claude-md-improver — håll CLAUDE.md uppdaterad

## DESIGN — VÄRLDSKLASS STANDARD
Inspirerat av: Airbnb, Bruce Studios, Karma, TooGoodToGo, ClassPass, Strava

### Ny färgpalett (ersätt allt gammalt)
- Primary: #E06A4E (coral) — CTA, actions
- Gold: #C9A96E — credits, premium
- Background: #FAFAF8 — varm off-white
- Surface: #FFFFFF — kort
- Dark: #111827 — primär text
- Muted: #6B7280 — sekundär text
- Success: #8B9E7E — bekräftelse
- Danger: #DC2626 — fel, no-show
- Border: rgba(0,0,0,0.07)

### Typografi (BYTA ALLT)
- Rubriker/Display: Fraunces (serif, nyinstallerad: @expo-google-fonts/fraunces)
- Body/UI: Plus Jakarta Sans (redan installerad)
- Fraunces ger Reslot unik karaktär — ingen annan matapp har serif-rubriker

### Animations (Emil Kowalski — OBLIGATORISKT)
- Spring-animationer ALLTID, aldrig linjära
- Knapptryck: scale 0.95-0.97 med withSpring
- Staggered FadeInDown med 50-80ms delay
- Haptics på ALLA interaktioner
- Skeleton loaders — ALDRIG spinners
- Shake-animation på fel

## FULLSTÄNDIG KRAVLISTA — INGET FÅR SAKNAS

### KRITISKT (fix INNAN allt annat)
1. Auth middleware på ALLA user-routes (säkerhetsbrist)
2. Credits-kostnad (2 credits) + saldo synlig i claim-flödet
3. Ångerfrist 5-min kommuniceras i UI + countdown-timer efter claim
4. Serviceavgift 29 kr synlig i claim-vyn
5. Fixa Reservation-typen (grace_period, completed saknas)
6. Stripe Connect — pre-auth vid claim + credits-köp (39 kr)
7. Backend cron auto-finalize grace period

### ONBOARDING — BYGG FRÅN GRUNDEN
Nuvarande är usel. Bygg världsklass:
- Steg 1: Animerad splash med Fraunces-rubrik "Din genväg till fullbokade restauranger" + restaurang-strip animation
- Steg 2: Telefonnummer (+46 prefix, smooth keyboard)
- Steg 3: OTP 6-siffrig (shake vid fel, resend fungerar)
- Steg 4: Namn + e-post (båda obligatoriska och verifieras)
- Steg 5: Stad (Stockholm default)
- Steg 6: Credits-intro — animation som visar loopen: dela bokning → tjäna credits → ta över bokning
- Steg 7: Welcome med social proof ("X bokningar delade denna vecka")
- Gäst-läge: "Utforska utan konto" — men med tydlig CTA att registrera sig

### HEM-SKÄRM — POLERA
- Header: "?"-knapp, "Bokningar i [stad]" dropdown, sök + credits-ikon
- Urgency: countdown-timer på bokningar nära avbokningsfönstret
- Social proof: "X bokningar delade denna vecka i Stockholm"
- Empty state: "Inga bokningar just nu — dela din och tjäna credits"
- Pull-to-refresh
- Skeleton loaders vid hämtning

### RESTAURANG/CLAIM-FLÖDE — VÄRLDSKLASS
- Hero-bild (fullbredd, 280px hög)
- Fraunces-rubrik för restaurangnamn
- Tydligt: "Denna bokning kostar 2 credits" + ditt saldo
- Serviceavgift 29 kr synlig INNAN claim
- Ångerfrist-info: "5 minuters ångerfrist efter du tar över"
- Countdown-timer efter claim (5:00 → 0:00)
- "Ångra"-knapp synlig under grace period
- Bekräftelseanimation vid lyckad claim (konfetti eller liknande)

### CREDITS-SKÄRM — BYGG OM
- Stor Fraunces-rubrik med antal credits
- Count-up animation när skärmen öppnas
- Köp credits: 39 kr/st, Stripe-integrerat
- Gratis credits-sektion: Bjud in vän / Lägg upp bokning
- Credits-historik (transaktion-log)
- TA BORT visuell skala (5/10/15/20)

### PROFIL — POLISH
- Trust-profil: visa historik (genomförda, avbokade i tid, no-shows)
- Profilbild-upload fungerar
- Verifieringsmärken (grön bock) på verifierad e-post/telefon
- TA BORT progress bar med milestones

### MINA BOKNINGAR
- Status-badges: Aktiv (grön), Under ångerfrist (orange), Övertagen (grå), Avbokad (röd)
- No-show-rapporteringsknapp (inom 24h efter bokningstid)

### LÄGG UPP BOKNING
- Auto-beräkning totalpris (per person × antal)
- Bekräftelse-steg innan submit
- Tydlig info: "Du får 2 credits när någon tar över din bokning"

### NYA FEATURES
- No-show-rapporteringsflöde (originalbokaren rapporterar, laddar upp bevis)
- Garantibadge på restaurangsidan: "Om bordet inte finns — 2 credits tillbaka"
- "X bevakar denna restaurang" på restaurangsidan

### BACKEND
- Google Places API + Supabase-cache för restaurangdata (förbered struktur)
- Race condition-skydd på claim med SELECT FOR UPDATE
- Rate limiting: max 10 claims/timme per användare
- Cron job: finalisera grace period var 60:e sekund

## TEKNISKA REGLER
- Fraunces_700Bold för ALLA rubriker/display-text
- PlusJakartaSans för ALLT annat
- Läs RESLOT_BRAIN.md för alla designbeslut
- Spring-animationer med react-native-reanimated v3
- Haptics på ALLT
- Pressable (aldrig TouchableOpacity)
- testID på alla interaktiva element
- TypeScript strict mode
- React Query för all server state

## ARBETSFLÖDE
1. Läs RESLOT_BRAIN.md
2. Uppdatera RESLOT_BRAIN.md med font-beslut och ny färgpalett
3. Använd writing-plans för att skapa detaljerad plan
4. Dispatcha subagents: mobile-developer + backend-developer parallellt
5. Mobile-developer: börja med font-installation + global typografi-sweep
6. Backend-developer: börja med auth middleware
7. Verifiera varje del med verification-before-completion
8. Fortsätt tills ALLT är implementerat med världsklass-kvalitet

När helt klart:
openclaw system event --text "RESLOT: Världsklass-app klar! Alla features implementerade med Fraunces + ny design." --mode now
