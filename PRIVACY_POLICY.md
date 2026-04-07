# SEKRETESSPOLICY FÖR RESLOT

**Senast uppdaterad:** 7 april 2026

---

## 1. INTRODUKTION

Reslot AB ("Vi", "Oss", "Vårt", "Företaget") är datakontroller för personuppgiftsbehandling under denna policy.

Denna sekretesspolicy förklarar:
- Vilken persondata vi samlar in
- Hur vi använder din data
- Dina rättigheter under GDPR
- Hur vi skyddar din data
- Vilka tredje parter vi delar data med

**Denna policy är juridiskt bindande.** Genom att använda Reslot accepterar du denna policy.

---

## 2. JURIDISK GRUND

Vi behandlar personuppgifter baserat på följande juridiska grunder enligt GDPR artikel 6:

| Datatyp | Juridisk grund | Ändamål |
|---------|---|---|
| E-post, telefonnummer | Avtalsåtagande | Registrering, autentisering, kommunikation |
| Lösenord (hashat) | Avtalsåtagande | Kontoåtkomst och säkerhet |
| Booking-uppgifter | Avtalsåtagande | Transaktioner, matchning |
| Betalningsuppgifter | Rättslig förpliktelse | Betalningshantering, bokföring |
| IP-adress, device-info | Legitim intresse | Bedrägeriprevention, säkerhet |
| Aktivitetsloggar | Legitim intresse | System-övervakning, prestandaanalys |
| Marknadsföringssamtycke | Uttryckligt samtycke | E-post-uppdateringar, push-notiser |

---

## 3. VAD VI SAMLAR IN

### 3.1 Information Du Tillhandahåller

**Vid Registrering:**
- Förnamn och efternamn
- E-postadress
- Telefonnummer (internationellt format)
- Lösenord (krypterat, aldrig lagrat i klartext)
- Vald stad (Stockholm, Göteborg, Malmö, Uppsala)
- Användarnamn (valfritt)

**Vid Bokningstransaktioner:**
- Restaurang och datum för bokning
- Partstorlek
- Speciella önskemål/anteckningar
- Betalningsmetod (hanterad av Stripe)
- Transaktionshistorik

**Vid Kundkommunikation:**
- Meddelanden till andra användare
- Supportärenden och svar
- Recensioner och feedback
- Rapporterad innehål

### 3.2 Information Vi Samlar Automatiskt

**Teknikdata:**
- IP-adress
- Device-typ (iOS, Android, Web)
- OS-version
- App-version
- Browser-typ och version
- Geografisk plats (ungefär, från IP)
- Datum och tid för aktivitet
- Sidor/funktioner besökta

**Beteendedata:**
- Vilka bokningar du visar/sparar
- Söksökningar
- Hur lång tid du spenderar i appen
- Klick och interaktioner
- Felrapporter

**Enhetsidentifier:**
- Advertising ID (IDFA för iOS, GAID för Android)
- Device UUID (unikt för Reslot)
- Installation-ID

---

## 4. COOKIES OCH SPÅRNING

### 4.1 Cookies Vi Använder

| Cookie | Typ | Ändamål | Varaktighet |
|--------|-----|---------|-------------|
| `session_token` | Funktionell | Autentisering | Tills logout |
| `user_id` | Funktionell | Personalisering | 1 år |
| `preferences` | Funktionell | Användarinställningar | 1 år |
| `analytics_id` | Analytics | Användarbeteende | 2 år |
| `marketing_consent` | Marknadsföring | Spårning av tillåtelse | 1 år |

**Du kan avvisa cookies** genom inställningar. Funktionella cookies är nödvändiga för att appen ska fungera.

### 4.2 Tredje Parts-Spårning

Vi använder följande för analys och marknadsföring:

- **Supabase Analytics:** Användarbeteende, konvertering
- **Mapbox:** Kartanvändning (vi ser inte dina kartsökningar)
- **Stripe:** Betalningsanalys

Du kan opt-out från marknadsföringsspårning i **Inställningar > Sekretess > Spårning**.

---

## 5. HUR VI ANVÄNDER DIN DATA

### 5.1 Primära Ändamål

| Ändamål | Laglig grund | Varighet |
|---------|---|---|
| **Kontohantering** | Avtal | Tills kontoborttagning |
| **Transaktioner** | Avtal | 7 år (bokföringslagen) |
| **Säkerhet & Bedrägeriprevention** | Legitim intresse | 3 år |
| **Kundstöd** | Avtal | 2 år efter kontakt |
| **Systemförbättringar** | Legitim intresse | 1 år (anonymiserad) |
| **Juridisk/Compliance** | Rättslig förpliktelse | 7 år |

### 5.2 Marknadsföring

Vi skickar endast marknadsförings-e-post om du:
- Uttryckligen samtyckt vid registrering
- Eller senare opt-in i appen

**Du kan när som helst opt-out** genom:
- Klicka "avsluta prenumeration" i e-postens sidfot
- Gå till **Inställningar > Meddelanden > Marknadsföring** och inaktivera

Vi kommer att respektera opt-out inom 48 timmar.

### 5.3 Profilerande

Vi använder automatiserad profilerande för att:
- Förutsäga vilka bokningar du är intresserad av
- Detektera bedrägeris och missbruk
- Optimera app-prestation

**Du har rätt att motsätta dig profilering** (se avsnitt 9).

---

## 6. DELA AV DATA MED TREDJE PARTER

### 6.1 Vi Delar Data Med

**Servicelevererare (Processer, GDPR Art. 28):**
- **Supabase** — Databaskryptering, lagring EU-west-2
- **Stripe** — Betalningshantering, PCI DSS-certifierad
- **Twilio** — SMS-sändning för OTP
- **ElevenLabs** — AI-kundsupport (data anonymiserad)
- **Mapbox** — Kartvisning (inte persondata)
- **Amazon AWS** — Server-hosting (EU-region)

Alla processor har datasäkeringsavtal (Data Processing Agreements, DPA).

**Vi DELAR INTE med:**
- Annonsörer (utan explicit samtycke)
- Social media-plattformar
- Databrokers
- Marknadsforare utanför vårt team

### 6.2 Juridisk Tvingning

Vi kan avslöja data om:
- Domstolsbeslut kräver det
- Myndighet (polis, skatteverket) med juridisk grund begär det
- Misstänkt illegal aktivitet som måste rapporteras

**Vi kommer att meddela dig** innan vi lämnar data (om juridiskt tillåtet).

### 6.3 Restauranger

Vi delar **inte** dina personuppgifter med restauranger. Vi delar endast:
- Bokningsnummer
- Datum/tid/partstorlek
- Att överlåtelse gjordes

Restauranger kan kontakta dig direkt om du gett dem ditt telefonnummer (deras ansvar).

---

## 7. DATAKRYPTERING OCH SÄKERHET

### 7.1 Överföringssäkerhet

- **SSL/TLS 1.3** för all data i transit
- **HTTPS-only** — ingen HTTP-tillåten
- **Certifikat-pinning** i app för man-in-the-middle-skydd

### 7.2 Lagringsäkerhet

- **Lösenord:** Bcrypt-hashade (aldrig i klartext)
- **Känslig data:** Krypterad vid vila med AES-256
- **Databaskryptering:** Supabase PostgreSQL med automatic encryption
- **Backups:** Krypterade backups dagligen, 30-dagars lagring

### 7.3 Åtkomst-Kontroller

- Endast auktoriserad personal har åtkomst till personuppgifter
- Två-faktorsautentisering för all admin-åtkomst
- Åtkomstloggar granskas månadsvis
- Non-disclosure-avtal för all personal

### 7.4 Incidenthantering

Om dataintrång inträffar:
- Vi meddelar berörda användare inom 72 timmar
- Vi rapporterar till Datainspektionen (om kräva enligt GDPR)
- Vi tillhandahåller ett incident-rapport
- Vi implementerar åtgärder för att förhindra upprepning

---

## 8. LAGRING AV DATA

### 8.1 Hur Länge Vi Lagrar Data

| Datatyp | Lagringsperiod | Anledning |
|---------|---|---|
| Kontoinfo (namn, email) | Tills borttagning | Kontohantering |
| Lösenord (hashat) | Tills borttagning | Autentisering |
| Transaktionshistorik | 7 år | Bokföringslagen |
| Aktivitetsloggar | 90 dagar | Prestandaanalys |
| Supportärenden | 2 år | Kundservice |
| Marketing-consent | 1 år | GDPR-compliance |
| IP-loggar | 30 dagar | Säkerhet |

### 8.2 Vid Kontoborttagning

När du begär permanent radering:
- Ditt konto avidentifieras omedelbar
- Namn, email, telefon raderas
- Transaktionshistorik behålls (anonymiserad) för 7 år (lag)
- Supportärenden anonymiseras
- Aktivitetsloggar raderas

**Radering slutförds inom 30 dagar.**

---

## 9. DINA GDPR-RÄTTIGHETER

Du har följande rättigheter under GDPR:

### 9.1 Rätt till Åtkomst (Art. 15)
Du kan begära en kopia av all data vi lagrar om dig.

**Hur:** Mejl support@reslot.se med ämne "Datautdrag"
**Svar:** Inom 30 dagar (gratis)

### 9.2 Rätt till Rättelse (Art. 16)
Du kan begära att vi korrigerar felaktig eller ofullständig data.

**Hur:** Logga in och redigera dina profiler, eller mejl support@reslot.se
**Svar:** Omedelbar eller inom 30 dagar

### 9.3 Rätt Till Radering ("Rätten Att Bli Glömd") (Art. 17)
Du kan begära att vi raderar din data helt.

**Begränsning:** Vi måste behålla transaktionsdata i 7 år för bokföring
**Hur:** Mejl support@reslot.se med ämne "Begäran om Radering"
**Svar:** Inom 30 dagar

### 9.4 Rätt till Dataporterbarhet (Art. 20)
Du kan begära dina data i maskinläsbar format (CSV/JSON).

**Hur:** Mejl support@reslot.se med ämne "Dataportabilitet"
**Svar:** Inom 30 dagar

### 9.5 Rätt till Begränsning av Behandling (Art. 18)
Du kan begära att vi pauserar behandlingen av dina data.

**Ändamål:** Medan du bestrider riktigheten, eller under juridisk prövning
**Hur:** Mejl support@reslot.se med ämne "Begränsning av Behandling"
**Svar:** Inom 14 dagar

### 9.6 Rätt till Motsägelse (Art. 21)
Du kan motsätta dig behandling för marknadsföring eller profilering.

**Hur:** Gå till **Inställningar > Sekretess > Motsäg Behandling**
**Eller:** Mejl support@reslot.se
**Svar:** Omedelbar

### 9.7 Rätt Till Inte Bli Föremål för Automatiserad Beslutfattning (Art. 22)
Du kan motsätta dig beslut baserade enbart på automatisk profilerande (t.ex. kontoblockeringar).

**Du har rätt till:**
- Förklaring av varför du blockerats
- Möjlighet att bestrida beslutet
- Manuell granskning

**Hur:** Mejl support@reslot.se och referera till Art. 22

---

## 10. INTERNATIONELLA DATAÖVERFÖRINGAR

### 10.1 EU/EES-Inom

All data lagras i **EU (Supabase: AWS eu-west-2, Irland)**. Ingen data överförs utanför EU.

### 10.2 Om Du Använder Från Utanför EU

Om du använder Reslot från USA, Asien eller annat tredjeland:
- Data lagras fortfarande i EU
- Du accepterar denna policy
- GDPR gäller för din data

### 10.3 Dataöverföringar Till Processorer

Processorer utanför EU (t.ex. Stripe i USA) har:
- **Standard Contractual Clauses (SCC)** från EU Commission
- **Adequacy Decisions** där tillämpligt
- GDPR-kompatibla datasäkeringsavtal

---

## 11. BARN OCH KÄNSLIG DATA

### 11.1 Minderåriga
Reslot är **inte avsedd för användare under 18 år**. Vi samlar inte medvetet in data från barn.

Om vi upptäcker att en minderårig använder Tjänsten:
- Vi inaktiverar omedelbar kontot
- Vi raderar all data
- Vi kontaktar förälder/vårdnadshavare

### 11.2 Känslig Data
Vi samlar **inte** medvetet in:
- Ras/etnisk härkomst
- Politiska åsikter
- Religiös tro
- Hälsodata
- Genetisk data
- Biometriska data

**Undantag:** Vi kan få indirekt kunskap om detta genom bokningsönskemål, men vi använder det inte för profilering.

---

## 12. DATASKYDDSOMBUDET

**Reslots Dataskyddsombud (DPO):**
- E-post: dpo@reslot.se
- Svar: Inom 5 arbetsdagar

Du kan kontakta DPO för:
- GDPR-relaterade frågor
- Dataklagomål
- Dataöverträdelser
- Sekretess-konsultation

---

## 13. DATAINSPEKTIONEN (SVENSKA MYNDIGHETER)

Om du är missnöjd med hur vi hanterar dina data kan du klaga till:

**Datainspektionen**
- Adress: Box 8114, 104 20 Stockholm
- Telefon: 08-657 61 00
- Webbplats: www.datainspektionen.se
- E-post: imy@datainspektionen.se

Du har rätt att lämna klagomål utan att kontakta oss först.

---

## 14. ÄNDRINGAR AV DENNA POLICY

Vi kan uppdatera denna policy när som helst. Ändringar träder i kraft när de publiceras.

Vid material ändringar:
- Vi meddelar via in-app-notis
- Vi skickar e-post till registrerad e-postadress
- Du får möjlighet att opt-out

Fortsatt användning innebär acceptans av nya villkor.

---

## 15. LÄNDER-SPECIFIKA RÄTTIGHETER

### 15.1 Sverige (GDPR + Dataskyddslagen)
- Du har alla GDPR-rättigheter ovan
- Du kan klaga till Datainspektionen
- Konsumentskyddslagen (2005:38) gäller för konsumenter

### 15.2 EU-Länder
- Du har alla GDPR-rättigheter
- Kontakta din lokala dataskyddsmyndighet
- Lokal konsumentskyddslag gäller

### 15.3 USA (Begränsad Skydd)
- Vi följer denna policy frivilligt
- GDPR gäller **inte** för USA-användare
- Vi följer CAN-SPAM-lagen för e-post

### 15.4 Övriga Länder
- Vi följer denna policy frivilligt
- Lokal dataskyddslag kan gälla (vi följer om den är mer restriktiv än denna policy)

---

## 16. TREDJE PARTS-WEBBPLATSER

Reslot kan innehålla länkar till:
- Restaurangwebbplatser
- Tredje part-tjänster

Vi är **inte ansvarig** för dessa webbplatser sekretess. Läs deras sekretesspolicy innan du besöker.

---

## 17. SOCIAL MEDIA INTEGRATION

Vi kan i framtiden tillåta inloggning via:
- Google
- Apple
- Facebook

Om du använder dessa tjänster:
- Social media-plattformen samlar sin egen data
- Vi får endast ditt namn, email och profilbild
- Vi delar inte din Reslot-data med social media

---

## 18. ANALYSVERKTYG

Vi använder följande för att förbättra Tjänsten:

**Supabase Analytics**
- Tracks: sidvisningar, användarflöde, konverteringsgrad
- Data: aggregerad, inte individ-nivå
- Retention: 12 månader (sedan anonymiserad)

Du kan opt-out från analytics:
- **Inställningar > Sekretess > Dela Analytik** → Inaktivera

---

## 19. KONTAKT OM DATASKYDDSFRÅGOR

**Support Team:**
- E-post: support@reslot.se
- Svar: Inom 2 arbetsdagar

**Dataskyddombud (DPO):**
- E-post: dpo@reslot.se
- Svar: Inom 5 arbetsdagar

**Juridisk Team:**
- E-post: legal@reslot.se
- Svar: Inom 10 arbetsdagar

---

## 20. SLUTORD

Vi tar dina sekretess på allvar. Denna policy är transparent och följer GDPR fullständig.

**Om du har frågor eller bekymmer, kontakta oss omedelbar — vi är här för att hjälpa.**

---

**Version:** 1.0
**Giltig från:** 7 april 2026
**Senast uppdaterad:** 7 april 2026

---

**Reslot AB**
Datakontroller enligt GDPR
Stockholm, Sverige
