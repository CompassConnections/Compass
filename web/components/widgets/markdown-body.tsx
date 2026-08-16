import clsx from 'clsx'
import ReactMarkdown from 'react-markdown'
import {CustomLink} from 'web/components/links'

/**
 * The prose renderer for markdown that is part of the product — FAQ answers, `/privacy` sections.
 *
 * The old pages handed the entire file to `react-markdown` inside one `prose prose-neutral` div,
 * which is why they read as documents rather than as part of the product: `prose` is a *reset for
 * unstyled HTML*, not a design, so none of the tokens `/about` and `/home` are built on
 * (`text-ink-600`, `primary-*`, the leading scale) ever reached it. This maps the handful of node
 * types the markdown sources actually use onto those tokens instead.
 *
 * `a` goes through `CustomLink` — the sources link to `/news`, `/vote`, `/support`, `/settings` and a
 * dozen other internal routes, and `CustomLink` is what keeps those as client-side navigations while
 * still opening external links in a new tab.
 *
 * Lives in `widgets/` rather than beside either page for the reason `surface` does: two unrelated
 * pages share it, and `/privacy` importing its typography from `components/faq/` would be the kind of
 * dependency that quietly becomes load-bearing.
 */
export function MarkdownBody({children, className}: {children: string; className?: string}) {
  return (
    <div className={clsx('text-[15px] leading-relaxed text-ink-600', className)}>
      <ReactMarkdown
        components={{
          p: ({node: _node, children, ...props}) => (
            <p className="mb-4 last:mb-0" {...props}>
              {children}
            </p>
          ),
          a: ({node: _node, children, ...props}) => (
            <CustomLink
              className="font-medium text-primary-700 underline decoration-primary-500/35 underline-offset-2 transition-colors hover:decoration-primary-500"
              {...props}
            >
              {children}
            </CustomLink>
          ),
          strong: ({node: _node, children, ...props}) => (
            <strong className="font-semibold text-ink-900" {...props}>
              {children}
            </strong>
          ),
          // Subheadings inside a body — the per-cookie blocks on /privacy are what needs these.
          // globals.css puts Newsreader at 20px with 1.5rem of top margin on every `h3`, which at
          // body scale reads as a second document title sitting inside a paragraph; `font-figtree`
          // and a tighter rhythm make it a label for the block that follows it. `mt-0` on the first
          // one so a section that opens with a subheading does not start with dead space.
          h3: ({node: _node, children, ...props}) => (
            <h3
              className="mb-2 mt-7 font-figtree text-base font-semibold text-ink-900 first:mt-0"
              {...props}
            >
              {children}
            </h3>
          ),
          h4: ({node: _node, children, ...props}) => (
            <h4
              className="mb-1.5 mt-5 font-figtree text-[15px] font-semibold text-ink-800 first:mt-0"
              {...props}
            >
              {children}
            </h4>
          ),
          hr: ({node: _node, ...props}) => (
            <hr className="my-7 border-0 border-t border-canvas-200" {...props} />
          ),
          // A drawn marker rather than a native bullet: the bulleted answers are the page's densest
          // content, and a small primary dot pinned to the first line's optical centre is both calmer
          // than a default disc and consistent with the flow steps on /about. Done as a `before:` on
          // the children so the `li` renderer stays shared with ordered lists, which keep their real
          // numbers.
          //
          // `list-none pl-0 mt-0` undoes globals.css's blanket `ul { list-style: disc; padding-left:
          // 1.25rem; margin-top: 0.5rem }` — without it every bullet is drawn twice, once by the
          // browser and once by us, at two different indents.
          ul: ({node: _node, children, ...props}) => (
            <ul
              className={clsx(
                'mb-4 mt-0 list-none space-y-2.5 pl-0 last:mb-0',
                "[&>li]:relative [&>li]:pl-5 [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-[0.6em] [&>li]:before:h-1.5 [&>li]:before:w-1.5 [&>li]:before:rounded-full [&>li]:before:bg-primary-500/70 [&>li]:before:content-['']",
              )}
              {...props}
            >
              {children}
            </ul>
          ),
          // `list-outside` because the global `ol` rule sets `list-style-position: inside`, which puts
          // the number in the text flow and kills the hanging indent on wrapped lines.
          ol: ({node: _node, children, ...props}) => (
            <ol
              className="mb-4 mt-0 list-decimal list-outside space-y-2.5 pl-5 last:mb-0 marker:text-ink-400"
              {...props}
            >
              {children}
            </ol>
          ),
          code: ({node: _node, children, ...props}) => (
            <code
              className="rounded bg-canvas-100 px-1.5 py-0.5 font-mono text-[0.9em] text-ink-800"
              {...props}
            >
              {children}
            </code>
          ),
          blockquote: ({node: _node, children, ...props}) => (
            <blockquote
              className="mb-4 border-l-2 border-primary-300 pl-4 italic last:mb-0"
              {...props}
            >
              {children}
            </blockquote>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}
