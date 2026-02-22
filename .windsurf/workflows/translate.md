---
description: Adding Translations to an Existing File (using useT)
---

## AI Assistant Workflow — Adding Translations to an Existing File (using `useT`)

This is **not** about adding a new language.
This is about correctly adding new translation keys to a feature or component that already exists.

Follow this strictly.

---

### 1️⃣ Identify All User-Facing Strings

Scan the file and list every:

- Button label
- Title
- Placeholder
- Tooltip
- Toast message
- Modal text
- Validation error
- SEO metadata
- Empty state message

If a string is visible to users, it must be translated.

Do **not** leave inline English in JSX.

Bad:

```tsx
<button>Delete account</button>
```

Correct:

```tsx
<button>{t('settings.delete_account', 'Delete account')}</button>
```

---

### 2️⃣ Import and Initialize `useT`

At the top of the file:

```tsx
import {useT} from 'web/lib/locale'
```

Inside the component:

```tsx
const t = useT()
```

No exceptions.
Do not manually access locale files.

---

### 3️⃣ Replace Hardcoded Strings

Wrap every string in:

```tsx
t('namespace.key', 'Default English text')
```

Example:

```tsx
t('news.seo.description_general', 'All news and code updates for Compass')
```

Rules:

- First argument = stable translation key
- Second argument = default English fallback
- The English text must exactly match what you want displayed

---

### 4️⃣ Naming Convention for Keys

Use structured namespaces.

Good:

```
profile.delete.confirm_title
profile.delete.confirm_body
settings.notifications.email_label
events.create.submit_button
```

Bad:

```
delete1
buttonText
labelNew
```

Keys must be:

- Hierarchical
- Feature-scoped
- Predictable
- Stable (never rename casually)

---

### 5️⃣ Add the Keys to All Existing Locale Files

After updating the component:

1. Open:

   ```
   web/messages/fr.json
   web/messages/de.json
   ...
   ```

2. Add the new keys to **every language file**

Keys must be identical across all files.

Example:

```json
{
  "confirm_title": "Delete account?",
  "confirm_body": "This action cannot be undone."
}
```

Then translate values for non-English files.

---

### 6️⃣ Use an LLM for Draft Translation (Correctly)

When translating large additions:

- Copy only the new JSON section
- Ask:

```
Translate the values of the JSON below to French.
Keep all keys unchanged.
Return valid JSON only.
```

Never let the model modify keys.

Then manually review.

LLMs make mistakes:

- Wrong tone
- Cultural mismatch
- Broken JSON
- Overly long mobile labels

You must verify.

---

### 7️⃣ Respect Mobile Constraints

Certain keys must stay short (< 10 characters):

```
nav.home
nav.messages
nav.more
nav.notifs
nav.people
```

If you add navigation items, enforce brevity.

---

### 8️⃣ Handle Variables Properly

For dynamic values:

```tsx
t('events.count', '{count} events', {count})
```

Make sure placeholders match across all languages.

Do not concatenate strings manually.

Bad:

```tsx
'Events: ' + count
```

Correct:

```tsx
t('events.count', '{count} events', {count})
```

---

### 9️⃣ SEO & Metadata

Even SEO descriptions must use translations:

```tsx
<meta
  name="description"
  content={t('profile.seo.description', 'View user profiles and connect with like-minded people.')}
/>
```

Do not hardcode metadata.

---

### 10️⃣ Final Verification Checklist

Before committing:

- No visible English strings left
- All new keys added to all locale files
- No missing translations warnings
- JSON is valid
- Mobile nav labels are short
- Variables work in all languages
- No duplicate keys
- Namespaces are consistent

---

### Example — Full Pattern

```tsx
import {useT} from 'web/lib/locale'

export default function DeleteModal() {
  const t = useT()

  return (
    <>
      <h2>{t('profile.delete.confirm_title', 'Delete account?')}</h2>
      <p>{t('profile.delete.confirm_body', 'This action cannot be undone.')}</p>
      <button>{t('profile.delete.confirm_button', 'Delete')}</button>
    </>
  )
}
```

---

### Summary

When adding translations to a file:

1. Replace every user-visible string
2. Use `useT()`
3. Create structured keys
4. Add keys to every locale file
5. Translate values carefully
6. Validate JSON
7. Test UI in multiple languages

If you skip any of these steps, you create future maintenance debt.

There is no shortcut.
