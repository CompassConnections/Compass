import fs from 'fs'
import path from 'path'
import ts from 'typescript'

const PG_METHODS = new Set([
  'none',
  'one',
  'oneOrNone',
  'many',
  'manyOrNone',
  'any',
  'result',
  'map',
  'each',
])

export type ExtractedQuery = {location: string; sql: string}

export type Extraction = {
  queries: ExtractedQuery[]
  /** Built at runtime (`${...}` or a variable), so the text is not in the source to check. */
  dynamic: string[]
}

const listSourceFiles = (dir: string): string[] =>
  fs.readdirSync(dir, {withFileTypes: true}).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) return listSourceFiles(entryPath)
    return /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [entryPath] : []
  })

/** Every query passed to a pg-promise method in the given directories. */
export function extractQueries(rootDir: string, dirs: string[]): Extraction {
  const result: Extraction = {queries: [], dynamic: []}

  for (const file of dirs.flatMap(listSourceFiles)) {
    const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest)

    const visit = (node: ts.Node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        PG_METHODS.has(node.expression.name.text)
      ) {
        const [firstArg] = node.arguments
        const {line} = source.getLineAndCharacterOfPosition(node.getStart(source))
        const location = `${path.relative(rootDir, file)}:${line + 1}`

        if (firstArg && ts.isStringLiteralLike(firstArg)) {
          result.queries.push({location, sql: firstArg.text})
        } else if (firstArg && ts.isTemplateExpression(firstArg)) {
          result.dynamic.push(location)
        } else if (firstArg && ts.isIdentifier(firstArg) && isPgReceiver(node.expression)) {
          result.dynamic.push(location)
        }
      }
      ts.forEachChild(node, visit)
    }
    visit(source)
  }

  return result
}

// `.map`, `.any` and friends also exist on arrays and lodash, whose first argument can be an identifier.
const isPgReceiver = (call: ts.PropertyAccessExpression) =>
  ts.isIdentifier(call.expression) && /^(pg|tx|t|db|client|task)$/.test(call.expression.text)

// Identifiers and raw text are spliced in by pg-promise, so what Postgres would see is not knowable here.
const SPLICED =
  /\$(?:\d+(?::(?:name|raw|alias|list|csv|value)|[~^#])|\([^)]*:(?:name|raw|alias|list|csv|value)\))/

/**
 * Rewrites pg-promise placeholders into the `$1` form `prepare` understands.
 * Returns null if the query cannot be checked without knowing its values.
 */
export function toPreparableSql(sql: string): string | null {
  const trimmed = sql.trim().replace(/;$/, '')
  if (SPLICED.test(trimmed)) return null
  if (!/^(select|insert|update|delete|with|values)\b/i.test(trimmed)) return null

  const positions = new Map<string, number>()
  return trimmed
    .replace(/\$\(([^)]+?)(?::\w+)?\)/g, (_match, name: string) => {
      if (!positions.has(name)) positions.set(name, positions.size + 1)
      return `$${positions.get(name)}`
    })
    .replace(/(\$\d+):json/g, '$1')
}
