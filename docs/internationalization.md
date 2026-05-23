# Adding a new language

Adding a new language is very easy, especially with translating tools like large language models (ChatGPT, Claude, etc.)
which
you can use as first draft.

- Add the language to the LOCALES dictionary in [constants.ts](../common/src/constants.ts) (the key is the locale code,
  the value is the original language name (not in English)).
- Duplicate [fr.json](../common/messages/fr.json) and rename it to the locale code (e.g., `de.json` for German).
  Translate
  all the strings in the new file (keep the keys identical). LLMs like ChatGPT may not be able to translate the whole
  file in one go; try to copy-paste by batch of 300 lines and ask the LLM to
  `translate the values of the json above to <new language> (keep the keys unchanged)`. In order to fit the bottom
  navigation bar on mobile, make sure the values for those keys are less than 10 characters: "nav.home", "
  nav.messages", "nav.more", "nav.notifs", "nav.people".
- Duplicate the [fr](../web/public/md/fr) folder and rename it to the locale code (e.g., `de` for German). Translate all
  the markdown files in the new folder. To do so, you can copy-paste each file into an LLM and ask it to
  `translate the markdown above to <new language>`.

That's all, no code needed!
