/**
 * A `<script type="application/ld+json">` block, for structured data.
 *
 * Exists because the obvious way to write one is a trap. The convention everywhere — including in
 * this codebase until now — is:
 *
 * ```tsx
 * <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify(data)}} />
 * ```
 *
 * and that is how `/testimonials` ended up with stored XSS: `JSON.stringify` escapes nothing HTML
 * cares about, so a member-written testimonial containing `</script>` closed the tag and everything
 * after it parsed as markup.
 *
 * **Passing the JSON as children instead is safe by construction.** React does not HTML-escape text
 * inside a `<script>` — that would corrupt the JSON, since browsers do not decode entities in raw
 * text elements — but it does neutralise the one sequence that matters, emitting `</script>` as
 * `</\u0073cript>`. That is invisible to a JSON parser (`\u0073` is `s`) and inert to an HTML parser.
 * `dangerouslySetInnerHTML` opts out of exactly that protection, which is what made it dangerous
 * here. On the client, `next/head` assigns children to `textContent`, which is never parsed as HTML
 * at all.
 *
 * The `\u003c` pass on top is belt and braces: React's guarantee is what actually stops the attack,
 * and this keeps the output safe even somewhere that guarantee does not apply (a different renderer,
 * a string template, a future refactor out of `next/head`). It stays valid JSON, so consumers of the
 * structured data see identical values.
 */
export function JsonLd({data}: {data: unknown}) {
  return <script type="application/ld+json">{JSON.stringify(data).replace(/</g, '\\u003c')}</script>
}
