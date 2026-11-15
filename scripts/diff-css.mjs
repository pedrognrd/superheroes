// Compara dos CSS minificados regla a regla y lista las declaraciones que cambian.
// Sirve para pasar al código los ajustes hechos en el inspector del navegador:
//   node scripts/diff-css.mjs nuevo.css referencia.css
import { readFileSync } from 'node:fs'

function rules(css, prefix = '') {
  const out = new Map()
  let i = 0
  while (i < css.length) {
    const open = css.indexOf('{', i)
    if (open < 0) break
    const sel = css.slice(i, open).trim()
    let depth = 1
    let j = open + 1
    while (j < css.length && depth) {
      if (css[j] === '{') depth++
      else if (css[j] === '}') depth--
      j++
    }
    const body = css.slice(open + 1, j - 1)
    if (sel.startsWith('@media') || sel.startsWith('@supports')) {
      for (const [k, v] of rules(body, `${prefix}${sel} `)) out.set(k, v)
    } else {
      const decls = body
        .split(';')
        .map((d) => d.trim().replace(/\s*:\s*/, ':').replace(/\s+/g, ' '))
        .filter(Boolean)
      const key = prefix + sel
      out.set(key, out.has(key) ? out.get(key).concat(decls) : decls)
    }
    i = j
  }
  return out
}

const [a, b] = process.argv.slice(2).map((f) => rules(readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')))
const toMap = (decls) => new Map(decls.map((d) => [d.slice(0, d.indexOf(':')), d.slice(d.indexOf(':') + 1)]))
for (const [sel, decls] of a) {
  if (!b.has(sel)) {
    console.log(`+ REGLA NUEVA ${sel} { ${decls.join('; ')} }`)
    continue
  }
  const pa = toMap(decls)
  const pb = toMap(b.get(sel))
  for (const [k, v] of pa) if (pb.get(k) !== v) console.log(`~ ${sel} | ${k}: ${pb.get(k) ?? '(no había)'}  →  ${v}`)
  for (const [k, v] of pb) if (!pa.has(k)) console.log(`- ${sel} | ${k}: ${v}  →  (quitado)`)
}
for (const sel of b.keys()) if (!a.has(sel)) console.log(`- REGLA QUITADA ${sel}`)
