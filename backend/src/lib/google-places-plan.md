# Google Places API + Supabase Cache — Implementation Plan

> Ersätt hårdkodad restaurangdata med riktiga Google Places-data

## 1. Översikt

Idag har Reslot hårdkodade restauranger i databasen. Med Google Places API kan vi:
- Hämta riktig restauranginformation (namn, adress, betyg, bilder, öppettider)
- Validera restauranger som användare söker efter
- Auto-complete i sökfältet
- Cacha data i Supabase för att minimera API-kostnader

## 2. Google Places API — Nyckelfunktioner

### 2.1 Text Search (New)
```typescript
// Sök restauranger i en stad
POST https://places.googleapis.com/v1/places:searchText
{
  "textQuery": "fine dining Stockholm",
  "includedType": "restaurant",
  "languageCode": "sv",
  "locationBias": {
    "circle": {
      "center": { "latitude": 59.3293, "longitude": 18.0686 },
      "radius": 10000.0
    }
  }
}
```

### 2.2 Autocomplete (New)
```typescript
// Autocomplete för restaurangsökning i submit-flödet
POST https://places.googleapis.com/v1/places:autocomplete
{
  "input": "Fran",
  "includedPrimaryTypes": ["restaurant"],
  "locationBias": {
    "circle": {
      "center": { "latitude": 59.3293, "longitude": 18.0686 },
      "radius": 15000.0
    }
  },
  "languageCode": "sv"
}
```

### 2.3 Place Details (New)
```typescript
// Hämta detaljer för en specifik restaurang
GET https://places.googleapis.com/v1/places/{PLACE_ID}
?fields=displayName,formattedAddress,rating,userRatingCount,
        photos,websiteUri,googleMapsUri,currentOpeningHours,
        priceLevel,types,editorialSummary
&languageCode=sv
```

### 2.4 Place Photos
```typescript
// Hämta restaurangbild
GET https://places.googleapis.com/v1/{PHOTO_REFERENCE}/media
?maxHeightPx=600&maxWidthPx=800
&key=API_KEY
```

## 3. Supabase Cache-strategi

### 3.1 Cache-tabell
```sql
CREATE TABLE restaurant_cache (
  place_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  neighborhood TEXT,
  latitude FLOAT,
  longitude FLOAT,
  rating FLOAT,
  review_count INT,
  price_level INT,
  cuisine TEXT,
  image_url TEXT,
  website TEXT,
  instagram TEXT,
  phone TEXT,
  opening_hours JSONB,
  tags JSONB,
  raw_google_data JSONB,  -- Spara hela Google-svaret
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

CREATE INDEX idx_restaurant_cache_city ON restaurant_cache(city);
CREATE INDEX idx_restaurant_cache_name ON restaurant_cache(name);
CREATE INDEX idx_restaurant_cache_expires ON restaurant_cache(expires_at);
```

### 3.2 Cache-logik
```typescript
async function getRestaurant(placeId: string): Promise<Restaurant> {
  // 1. Kolla cache
  const cached = await supabase
    .from('restaurant_cache')
    .select('*')
    .eq('place_id', placeId)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (cached.data) return mapToRestaurant(cached.data);

  // 2. Hämta från Google Places
  const googleData = await fetchPlaceDetails(placeId);

  // 3. Spara i cache
  await supabase.from('restaurant_cache').upsert({
    place_id: placeId,
    name: googleData.displayName.text,
    address: googleData.formattedAddress,
    rating: googleData.rating,
    review_count: googleData.userRatingCount,
    // ... mapping
    raw_google_data: googleData,
    cached_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return mapToRestaurant(googleData);
}
```

## 4. Backend-implementation

### 4.1 Ny route: `/api/restaurants/search`
```typescript
// backend/src/routes/restaurants.ts
restaurantsRouter.get('/search', async (c) => {
  const query = c.req.query('q');
  const city = c.req.query('city') || 'Stockholm';

  // Autocomplete via Google Places
  const suggestions = await placesAutocomplete(query, city);

  return c.json({ data: suggestions });
});
```

### 4.2 Ny route: `/api/restaurants/:placeId`
```typescript
restaurantsRouter.get('/:placeId', async (c) => {
  const placeId = c.req.param('placeId');
  const restaurant = await getRestaurant(placeId); // Cache-first

  return c.json({ data: restaurant });
});
```

### 4.3 Mapping Google → Reslot Restaurant
```typescript
function mapGoogleToRestaurant(place: GooglePlace): Restaurant {
  return {
    id: place.id, // Google Place ID
    name: place.displayName.text,
    address: place.formattedAddress,
    cuisine: extractCuisine(place.types), // "italian", "japanese", etc.
    neighborhood: extractNeighborhood(place.addressComponents),
    rating: place.rating,
    reviewCount: place.userRatingCount,
    priceLevel: place.priceLevel ? priceLevelMap[place.priceLevel] : 2,
    image: place.photos?.[0]
      ? buildPhotoUrl(place.photos[0].name)
      : 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0',
    description: place.editorialSummary?.text || '',
    latitude: place.location?.latitude,
    longitude: place.location?.longitude,
    website: place.websiteUri,
    city: extractCity(place.addressComponents),
  };
}
```

## 5. Env-variabler

```bash
# backend/.env
GOOGLE_PLACES_API_KEY=AIza...
GOOGLE_PLACES_FIELD_MASK=displayName,formattedAddress,rating,userRatingCount,photos,websiteUri,priceLevel,types,editorialSummary,location
```

## 6. Kostnadskontroll

| API-anrop | Pris (USD) | Strategi |
|-----------|-----------|----------|
| Text Search | $0.032/req | Cache 7 dagar |
| Autocomplete | $0.00283/req | Debounce 300ms, min 3 tecken |
| Place Details | $0.017/req | Cache 7 dagar |
| Place Photos | $0.007/foto | Cache permanent i Supabase Storage |

**Budgetskydd:**
- Sätt quota i Google Cloud Console (t.ex. 1000 req/dag)
- Cache-TTL: 7 dagar för restaurangdata, permanent för bilder
- Debounce autocomplete i frontend (300ms)
- Minimum 3 tecken innan autocomplete triggas

## 7. Migrering av befintliga restauranger

```typescript
// Engångsscript: matcha befintliga restauranger mot Google Places
async function migrateExistingRestaurants() {
  const restaurants = await prisma.restaurant.findMany();

  for (const r of restaurants) {
    const searchResult = await placesSearch(`${r.name} ${r.address} ${r.city}`);
    if (searchResult.places?.[0]) {
      const placeId = searchResult.places[0].id;
      await prisma.restaurant.update({
        where: { id: r.id },
        data: { googlePlaceId: placeId },
      });
    }
  }
}
```

## 8. Checklista

- [ ] Google Cloud-projekt med Places API (New) aktiverat
- [ ] API-nyckel skapad med HTTP-restriktioner
- [ ] `restaurant_cache`-tabell i Supabase
- [ ] `/api/restaurants/search` endpoint med autocomplete
- [ ] `/api/restaurants/:placeId` endpoint med cache-first
- [ ] Frontend submit-flöde använder autocomplete istället för freitext
- [ ] Befintliga restauranger matchade mot Google Place IDs
- [ ] Budget-alarm konfigurerat i Google Cloud
- [ ] Rate limiting på search-endpoint (max 30 req/min per user)
