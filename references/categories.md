# CJ German Category Labels

The raw CJ category names are English. We map them to natural German for display.

## Mapping (23 categories)

```typescript
const CATEGORY_LABELS_DE: Record<string, string> = {
  'Bedding Sets': 'Bettwäsche-Sets',
  Blazers: 'Blazer',
  'Bracelets & Bangles': 'Armbänder & Armreifen',
  Earrings: 'Ohrringe',
  'Facial Care': 'Gesichtspflege',
  'Fashion Backpacks': 'Mode-Rucksäcke',
  'Home Office Storage': 'Büro & Aufbewahrung',
  'Lady Dresses': 'Damenkleider',
  "Men's Shirts": 'Herrenhemden',
  'Necklace & Pendants': 'Halsketten & Anhänger',
  'Pet Clothings': 'Haustierkleidung',
  'Pet Clothing Sets': 'Haustier-Kleidungssets',
  'Pet Collar, Leash & Harness Sets': 'Halsband-, Leinen- & Geschirr-Sets',
  'Pet Collars': 'Halsbänder',
  'Pet Leashes': 'Hundeleinen',
  'Pet Nests': 'Haustierbetten',
  'Pet Tops': 'Haustier-Oberteile',
  'Pet Toy Set': 'Haustier-Spielzeugsets',
  Print: 'Prints & Drucke',
  Pumps: 'Pumps',
  Solid: 'Unifarben',
  Speakers: 'Lautsprecher',
  'Suits & Sets': 'Anzüge & Sets',
  'Vulcanize Shoe': 'Sneaker',
}
```

## Usage

```typescript
import { translateCategory } from '@/lib/category-labels'

const display = translateCategory(rawCategoryName)  // e.g. "Vulcanize Shoe" → "Sneaker"
```

## Fallback

If category not in map, returns original English name:
```typescript
translateCategory("New Category")  // → "New Category" (no translation)
```

## Adding new categories

When new categories appear in CJ imports, add them to the map:

```typescript
const CATEGORY_LABELS_DE: Record<string, string> = {
  // ...existing
  'New CJ Category': 'Neue Deutsche Übersetzung',
}
```

## See also

- SQL: `scripts/supabase/setup-category-translations.sql` (if you want to store in DB)
- Component: `app/components/mega-menu.tsx` (uses translateCategory)
- Filter: `app/components/filter-sidebar.tsx` (uses translateCategory + sorts)
- Query: `app/lib/supabase/queries.ts` (maps via `translateCategory`)
