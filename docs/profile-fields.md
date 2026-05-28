# Adding a new profile field

A profile field is any variable associated with a user profile (age, politics, diet, orientation, etc.).

## Field types

Choose the right storage type before starting:

| Kind                 | DB type               | Example fields                        |
| -------------------- | --------------------- | ------------------------------------- |
| Single-select choice | `TEXT`                | `gender`, `mbti`, `education_level`   |
| Multi-select choices | `TEXT[]`              | `diet`, `religion`, `orientation`     |
| Free text            | `TEXT`                | `political_details`, `gender_details` |
| Numeric              | `INTEGER` / `NUMERIC` | `age`, `drinks_per_month`             |

Array fields need a GIN index; scalar choice/text fields use btree.

---

## Step-by-step checklist

### 1. `common/src/choices.ts`

For choice fields, add a choices constant and its inverse:

```ts
export const MY_CHOICES = {
  'Label A': 'value_a',
  'Label B': 'value_b',
} as const

export const INVERTED_MY_CHOICES = invert(MY_CHOICES)
export type MyChoiceTuple = {
  [K in keyof typeof MY_CHOICES]: [K, (typeof MY_CHOICES)[K]]
}[keyof typeof MY_CHOICES]
```

**"Show more" pattern** — when the list is long and a few choices cover most cases (such as man/woman for gender),
export defaults and extras so the UI can collapse the uncommon ones:

```ts
export const DEFAULT_MY_CHOICES = [MY_CHOICES.ValueA, MY_CHOICES.ValueB]
export const EXTRA_MY_CHOICES = Object.values(MY_CHOICES).filter(
  (v) => !DEFAULT_MY_CHOICES.includes(v as any),
)
```

For gender, the defaults live in `common/src/gender.ts` (`DEFAULT_GENDERS`, `EXTRA_GENDERS`).

### 2. `common/src/supabase/schema.ts`

Add the column to the `Row`, `Insert`, and `Update` blocks of the `profiles` table (around line 1115):

```ts
// Row:
my_field: string | null          // scalar
my_field: string[] | null        // array
my_field_details: string | null  // free-text companion

// Insert / Update (same but optional):
my_field ? : string | null
```

### 3. Database migration

Create `backend/supabase/migrations/YYYYMMDD_add_<field>.sql`:

```sql
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS my_field         TEXT, -- scalar
    ADD COLUMN IF NOT EXISTS my_field         TEXT[], -- array
    ADD COLUMN IF NOT EXISTS my_field_details TEXT;
-- free-text companion

-- Array fields need GIN; scalar choice/text fields use btree:
CREATE INDEX IF NOT EXISTS profiles_my_field_gin ON profiles USING GIN (my_field);
CREATE INDEX IF NOT EXISTS idx_profiles_my_field ON profiles USING btree (my_field);
```

Run it (user runs this, not Claude):

```bash
yarn test:db:reset
```

### 4. `common/src/api/zod-types.ts`

Add to `optionalProfilesSchema`:

```ts
my_field: z.string().optional().nullable(),           // scalar
    my_field
:
z.array(z.string()).optional().nullable(),  // array
    my_field_details
:
z.string().optional().nullable(),   // free-text
```

### 5. `backend/api/src/get-profiles.ts`

Add a filter WHERE clause. The column is already selected automatically (see step 2).

**Scalar choice:**

```ts
my_field?.length && where(`my_field = ANY($(my_field))`, {my_field}),
```

**Array (allow profiles with no value set):**

```ts
my_field?.length &&
where(`my_field IS NULL OR my_field = '{}' OR my_field && $(my_field)`, {my_field}),
```

**Keyword search** — add to `textFields` (free text) or `arrayChoiceFields` / `choiceFields` (choices):

```ts
// free text:
const textFields = [..., 'my_field_details'
]

// single-select choice:
const choiceFields = [..., {field: 'my_field', choices: MY_CHOICES}
]

// multi-select choice:
const arrayChoiceFields = [..., {field: 'my_field', choices: MY_CHOICES}
]
```

Also add `my_field?: string[]` to `profileQueryType`.

### 6. `common/src/api/schema.ts`

Add to the `get-profiles` props:

```ts
my_field: arraybeSchema.optional(),   // array
    my_field
:
z.string().optional(),      // scalar
```

### 7. `common/src/filters.ts`

Add to the `FilterFields` Pick and set a default in `initialFilters`:

```ts
// in FilterFields Pick:
|
'my_field'

// in initialFilters:
my_field: undefined,
```

### 8. `common/src/filters-format.ts`

Add a branch in the array-value formatter so filter chips display human-readable labels:

```ts
} else
if (key === 'my_field') {
    value = value.map(
        (s) => translate(`profile.my_field.${s}`, INVERTED_MY_CHOICES[s] ?? s),
    )
}
```

Also add `my_field: ''` to `filterLabels`.

### 9. `web/components/filters/my-field-filter.tsx` (new file)

Follow the pattern of `orientation-filter.tsx`:

- `MyFieldFilterText` — renders the chip summary ("Any X", specific labels, or "Multiple")
- `MyFieldFilter` — renders `<MultiCheckbox>` with optional "show more" button

**"Show more" pattern:**

```tsx
const [showAll, setShowAll] = useState(
  selected.some((v) => !DEFAULT_MY_CHOICES.includes(v)) ||
    EXTRA_MY_CHOICES.includes(profile?.my_field as any),
)
const visibleChoices = Object.fromEntries(
  Object.entries(MY_CHOICES).filter(
    ([, v]) => showAll || DEFAULT_MY_CHOICES.includes(v) || selected.includes(v),
  ),
)
// ...
{
  !showAll && (
    <button type="button" onClick={() => setShowAll(true)}>
      {t('filter.my_field.show_more', 'Show more options')}
    </button>
  )
}
```

### 10. `web/components/filters/filters.tsx`

Import and add a `<FilterSection>` for the new filter. Keep imports sorted alphabetically.

### 11. `web/components/optional-profile-form.tsx`

Add the field to the profile edit form. Free-text companion fields use `<Input placeholder={t(...)} />`.

**"Show more" in the form** uses the same pattern as the filter (§9) but reads `profile.my_field` to decide whether to
expand by default.

### 12. `web/components/profile-about.tsx`

Add a display component following existing patterns (e.g., `Religion`, `Orientation`):

```tsx
function MyField(props: {profile: Profile}) {
  const {profile} = props
  const t = useT()
  const values = (profile as any).my_field as string[] | null | undefined
  const details = (profile as any).my_field_details as string | null | undefined
  if (!values?.length && !details) return null
  const text = values
    ?.map((v) => t(`profile.my_field.${v}`, INVERTED_MY_CHOICES[v] ?? v))
    .join(', ')
  return (
    <Col>
      <span className="font-semibold">{t('profile.my_field_label', 'My Field')}</span>
      {text && <span>{text}</span>}
      {details && <span className="text-ink-600 italic">"{details}"</span>}
    </Col>
  )
}
```

### 13. `web/components/filters/use-filters.ts`

If the field reflects the viewer's own profile data (like `diet`, `religion`), add it to `yourFilters` and
`isYourFilters` so the "My Filters" preset works:

```ts
// yourFilters:
my_field: you?.my_field?.length ? you.my_field : undefined,

// isYourFilters:
isEqual(new Set(filters.my_field), new Set(you.my_field)) &&
```

Skip this step if the field isn't part of the viewer's profile (e.g., a filter-only concept).

### 14. `tests/e2e/backend/utils/userInformation.ts`

Add the field to `UserAccountInformationForSeeding` with realistic faker values so E2E seeds work.

### 15. Translations

Add keys to `common/messages/fr.json` and `common/messages/de.json` (alphabetically sorted). Required key groups for a
typical choice field:

| Key pattern                            | English fallback      | Notes                            |
| -------------------------------------- | --------------------- | -------------------------------- |
| `filter.any_my_field`                  | `'Any X'`             | chip when nothing selected       |
| `filter.my_field.show_more`            | `'Show more options'` | show-more button in filter       |
| `profile.my_field`                     | `'X'`                 | section heading in profile-about |
| `profile.my_field.<value>`             | label                 | one per choice value             |
| `profile.my_field.details_placeholder` | `'Details about…'`    | form input placeholder           |
| `profile.my_field.show_more`           | `'Show more options'` | show-more button in form         |
| `profile.optional.my_field`            | `'X'`                 | form section label               |

Translation key naming: values use the DB value (e.g., `gray-asexual`, not `gray_asexual`). The `toKey()` helper in
`common/src/parsing.ts` converts spaces to underscores and lowercases — the `translationPrefix` prop on
`<MultiCheckbox>` uses this automatically.

---

## Quick reference: which files change per field type

| File                        | Scalar choice       | Array choices         | Free text only |
| --------------------------- | ------------------- | --------------------- | -------------- |
| `choices.ts`                | ✓                   | ✓                     | —              |
| `schema.ts`                 | ✓                   | ✓                     | ✓              |
| Migration SQL               | ✓                   | ✓                     | ✓              |
| `zod-types.ts`              | ✓                   | ✓                     | ✓              |
| `get-profiles.ts` (filter)  | ✓                   | ✓                     | —              |
| `get-profiles.ts` (search)  | ✓ (choiceFields)    | ✓ (arrayChoiceFields) | ✓ (textFields) |
| `api/schema.ts`             | ✓                   | ✓                     | —              |
| `filters.ts`                | ✓                   | ✓                     | —              |
| `filters-format.ts`         | ✓                   | ✓                     | —              |
| `*-filter.tsx` (new)        | ✓                   | ✓                     | —              |
| `filters.tsx`               | ✓                   | ✓                     | —              |
| `optional-profile-form.tsx` | ✓                   | ✓                     | ✓              |
| `profile-about.tsx`         | ✓                   | ✓                     | ✓              |
| `use-filters.ts`            | if self-referential | if self-referential   | —              |
| `userInformation.ts`        | ✓                   | ✓                     | ✓              |
| Translation JSONs           | ✓                   | ✓                     | ✓              |
