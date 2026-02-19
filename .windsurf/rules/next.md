---
trigger: manual
description:
globs:
---

### Translations

```typescript
import {useT} from 'web/lib/locale'

const t = useT()
t('common.key', 'English translations')
```

Translations should go to the JSON files in `web/messages` (`de.json` and `fr.json`, as of now).

### Misc coding tips

We have many useful hooks that should be reused rather than rewriting them again.

---

We prefer using lodash functions instead of reimplementing them with for loops:

```ts
import {keyBy, uniq} from 'lodash'

const betsByUserId = keyBy(bets, 'userId')
const betIds = uniq(bets, (b) => b.id)
```

---

Instead of Sets, consider using lodash's uniq function:

```ts
const betIds = uniq([])
for (const id of betIds) {
...
}
```
