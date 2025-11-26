# Data Binding Flow: How LLM Schema + Photos Work Together

## The Problem
The LLM generates **UI structure** (layout, components, styling), but it doesn't know about **specific data** (photos, coordinates, prices).

## The Solution: Separation of Concerns

```
┌─────────────────────────────────────────────────────────────┐
│                    USER QUERY                               │
│              "Find romantic restaurants in Bali"            │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
   ┌─────────────┐              ┌──────────────────┐
   │ LLM (Schema)│              │ TravelService    │
   │ Generator   │              │ (Data Fetcher)   │
   └──────┬──────┘              └────────┬─────────┘
          │                              │
          │ Generates:                   │ Fetches:
          │ - Layout structure           │ - Recommendations
          │ - Component types            │ - Photos (Google Places)
          │ - Styling                    │ - Coordinates
          │ - Interactions               │ - Ratings
          │                              │ - Hours
          ▼                              ▼
   ┌──────────────────┐        ┌──────────────────┐
   │   UI Schema      │        │  Recommendations │
   │   (Layout Only)  │        │  (Data Only)     │
   └────────┬─────────┘        └────────┬─────────┘
            │                           │
            └───────────────┬───────────┘
                            │
                            ▼
                  ┌──────────────────────┐
                  │  TravelScreen        │
                  │  (Combines Both)     │
                  │                      │
                  │ schema + data =      │
                  │ Complete UI          │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │  Rendered UI         │
                  │  - Photos displayed  │
                  │  - Layout applied    │
                  │  - Data bound        │
                  └──────────────────────┘
```

## Step-by-Step Flow

### 1. LLM Generates Schema (Layout)
```typescript
// UIGenerator calls LLM
const schema = {
  id: "travel-recommendations",
  uiType: "list",
  components: [
    { type: "text", props: { text: "Destination" } },
    { type: "card", props: {} },  // Empty - no data yet!
    { type: "list", props: { items: [] } }  // Empty array
  ]
}
```

**Key Point:** Schema has NO data, just structure.

### 2. TravelService Fetches Data
```typescript
// TravelService calls LLM + Google Places API
const recommendations = [
  {
    destination: "Ubud, Bali",
    highlights: [
      {
        name: "Sacred Monkey Forest",
        photoUrl: "https://maps.googleapis.com/...",  // From Google Places
        latitude: -8.5149,
        longitude: 115.2583
      }
    ]
  }
]
```

**Key Point:** Data has NO layout, just information.

### 3. TravelScreen Combines Them
```typescript
// In TravelScreen.tsx
const uiSchema = { schema: validSchema, data: recommendations };

// When rendering:
{rec.highlights[0]?.photoUrl ? (
  <RNImage source={{ uri: rec.highlights[0].photoUrl }} />
) : (
  <Placeholder />
)}
```

**Key Point:** Schema provides structure, data fills the content.

## Why This Works

| Aspect | LLM | TravelService | TravelScreen |
|--------|-----|---------------|--------------|
| **Knows** | Layout, styling, components | Recommendations, photos, coords | How to combine both |
| **Doesn't know** | Specific photos, prices | UI layout, styling | How to fetch data |
| **Responsibility** | Generate UI structure | Fetch real data | Bind data to UI |

## Data Flow Example

```
User: "Find romantic restaurants in Bali"
  ↓
LLM generates:
  {
    components: [
      { type: "card", props: {} },
      { type: "image", props: {} },
      { type: "text", props: {} }
    ]
  }
  ↓
TravelService fetches:
  {
    destination: "Ubud",
    highlights: [
      {
        name: "Restaurant X",
        photoUrl: "https://...",
        cost: "$50"
      }
    ]
  }
  ↓
TravelScreen renders:
  <Card>
    <Image source={{ uri: photoUrl }} />
    <Text>{name}</Text>
    <Text>{cost}</Text>
  </Card>
```

## Key Principles

1. **LLM = Structure** - Generates layout, not data
2. **Services = Data** - Fetch from APIs, not generate
3. **Components = Binding** - Combine structure + data
4. **Separation** - Each layer has one job

## Benefits

✅ **Reusable schemas** - Same layout for different data
✅ **Flexible data** - Can swap data sources
✅ **Testable** - Each layer independent
✅ **Scalable** - Add new data sources without changing schema
✅ **Fast** - LLM doesn't wait for API calls

## Future: Data Binding in Schema

When we want LLM to know about data structure:

```typescript
// Schema with data binding hints
{
  components: [
    {
      type: "image",
      props: {},
      dataBinding: {
        source: "recommendations[].highlights[].photoUrl"
      }
    }
  ]
}
```

But for now, **manual binding in TravelScreen** is simpler and works great!
