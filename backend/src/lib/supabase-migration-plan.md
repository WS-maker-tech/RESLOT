# Supabase Migration Plan — Fas 2

> SQLite/Prisma → Supabase PostgreSQL

## 1. Översikt

Reslot använder idag SQLite via Prisma ORM. För produktion krävs en riktig databas med:
- Concurrent access (multi-user claims med race condition-skydd)
- Row Level Security (RLS) för säkerhet
- Realtime subscriptions (bevakningar, live-uppdateringar)
- Managed backups & scaling

**Mål:** Migrera till Supabase PostgreSQL med minimal nedtid och inga dataförluster.

## 2. Steg-för-steg migrering

### Steg 1: Skapa Supabase-projekt
```bash
# 1. Skapa projekt på supabase.com
# 2. Hämta connection string:
#    DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
# 3. Lägg till i backend/.env
```

### Steg 2: Uppdatera Prisma schema
```prisma
datasource db {
  provider = "postgresql"  // Ändra från "sqlite"
  url      = env("DATABASE_URL")
}
```

**Viktiga schema-ändringar för PostgreSQL:**
- `String @id @default(cuid())` → fungerar som det är
- `DateTime` → PostgreSQL native timestamps (ingen ändring i schema)
- `Float` → PostgreSQL `double precision` (automatisk mapping)
- `Int @default(0)` → fungerar som det är
- **JSON-fält:** Byt `tags String` till `tags Json` för bättre querying

### Steg 3: Generera och kör migration
```bash
cd backend
# Ta bort gamla SQLite-migrationer
rm -rf prisma/migrations

# Generera ny PostgreSQL-migration
bunx prisma migrate dev --name init_postgresql

# Verifiera
bunx prisma studio
```

### Steg 4: Datamigrering (om produktionsdata finns)
```bash
# Exportera från SQLite
bunx prisma db execute --stdin < export_sqlite.sql

# Importera till PostgreSQL via Supabase dashboard eller:
bunx prisma db seed
```

### Steg 5: Uppdatera env.ts
```typescript
// backend/src/env.ts — lägg till:
DATABASE_URL: z.string().url(),
DIRECT_URL: z.string().url().optional(), // För Supabase connection pooling
```

### Steg 6: Row Level Security (RLS)
```sql
-- Aktivera RLS på alla tabeller
ALTER TABLE "UserProfile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Reservation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Watch" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ActivityAlert" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read/write their own profile
CREATE POLICY "Users can view own profile"
  ON "UserProfile" FOR SELECT
  USING (phone = current_setting('app.current_user_phone'));

CREATE POLICY "Users can update own profile"
  ON "UserProfile" FOR UPDATE
  USING (phone = current_setting('app.current_user_phone'));
```

### Steg 7: Race condition-skydd med SELECT FOR UPDATE
```sql
-- Claim-operation med pessimistic locking
BEGIN;
SELECT * FROM "Reservation"
WHERE id = $1 AND status = 'active'
FOR UPDATE SKIP LOCKED;

UPDATE "Reservation"
SET status = 'grace_period',
    "claimerPhone" = $2,
    "claimedAt" = NOW(),
    "graceDeadline" = NOW() + INTERVAL '5 minutes'
WHERE id = $1 AND status = 'active';
COMMIT;
```

### Steg 8: Supabase Realtime (bevakningar)
```typescript
// Lyssna på nya bokningar för bevakade restauranger
const channel = supabase
  .channel('new-reservations')
  .on('postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'Reservation' },
    (payload) => {
      // Notifiera användare som bevakar restaurangen
      notifyWatchers(payload.new.restaurantId);
    }
  )
  .subscribe();
```

## 3. Prisma → Supabase Client (valfritt)

Om vi vill använda Supabase JS-klient istället för Prisma:
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Bara backend!
);

// Exempel: Hämta reservationer
const { data, error } = await supabase
  .from('Reservation')
  .select('*, restaurant:Restaurant(*)')
  .eq('status', 'active')
  .eq('restaurant.city', city);
```

**Rekommendation:** Behåll Prisma som ORM med PostgreSQL-provider. Lägg till Supabase JS-klient bara för Realtime och Storage.

## 4. Checklista innan migrering

- [ ] Supabase-projekt skapat
- [ ] DATABASE_URL i .env
- [ ] Schema uppdaterat till `provider = "postgresql"`
- [ ] `prisma migrate dev` kört utan fel
- [ ] Alla API-endpoints testade med cURL
- [ ] RLS-policies aktiva
- [ ] Race condition-test: två simultana claims → bara en lyckas
- [ ] Backup av SQLite-data
- [ ] Connection pooling konfigurerat (Supabase PgBouncer)

## 5. Tidsuppskattning

| Fas | Uppgift |
|-----|---------|
| 1 | Supabase setup + schema-migrering |
| 2 | RLS-policies + race condition-skydd |
| 3 | Realtime subscriptions |
| 4 | Testning + verifiering |
| 5 | Deploy + cutover |
