/**
 * Kertakäyttöinen codemod: korvaa kovakoodatut toimitusarvot (6,90 € / 79 € / 3-10 arkipäivää)
 * merkkijonoissa, template-literaaleissa ja JSX-tekstissä viittauksilla src/config/toimitus.ts:ään
 * ja lisää importin. Käyttö (repon juuresta):
 *   node scripts/toimitus-codemod.cjs . src/data/landingPages.ts src/components/layout/Header.tsx
 * Tarkista diff ja poista tiedosto src/config/toimitus.test.ts:n VALIAIKAISESTI_OHITETUT-listalta.
 */
const ts = require(require("path").resolve(process.argv[2] || ".", "node_modules/typescript"));
const fs = require("fs");
const path = require("path");

const [repo, ...files] = process.argv.slice(2);
const CONFIG = path.join(repo, "src/config/toimitus");

const RULES = [
  [/(?<![\d,.])6,90(?=\s?(€|&euro;|e\b|euro))/g, "TOIMITUSMAKSU_TEKSTI"],
  [/(?<![\d,.])79(?=\s?(€|&euro;|euro))/g, "ILMAINEN_RAJA_TEKSTI"],
  [/(?<![\d,.])3\s?[–-]\s?10(?=\s(arkipäiv|pv\b|päivä))/g, "TOIMITUSAIKA_TEKSTI"],
];

function split(text) {
  // returns array of {lit} / {expr}
  let parts = [{ lit: text }];
  for (const [re, name] of RULES) {
    const next = [];
    for (const p of parts) {
      if (!("lit" in p)) { next.push(p); continue; }
      let last = 0; let m; re.lastIndex = 0;
      while ((m = re.exec(p.lit))) {
        next.push({ lit: p.lit.slice(last, m.index) });
        next.push({ expr: name });
        last = m.index + m[0].length;
      }
      next.push({ lit: p.lit.slice(last) });
    }
    parts = next;
  }
  return parts;
}
const hits = (t) => RULES.some(([re]) => { re.lastIndex = 0; return re.test(t); });

function escTpl(cooked) {
  return cooked.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
}

for (const rel of files) {
  const file = path.resolve(repo, rel);
  const src = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const edits = [];
  const used = new Set();
  const visit = (node) => {
    if (ts.isStringLiteral(node) && hits(node.text) && !ts.isImportDeclaration(node.parent) && !ts.isLiteralTypeNode(node.parent)) {
      const parts = split(node.text);
      parts.forEach((p) => p.expr && used.add(p.expr));
      let tpl = "`" + parts.map((p) => (p.expr ? "${" + p.expr + "}" : escTpl(p.lit))).join("") + "`";
      if (ts.isJsxAttribute(node.parent)) tpl = "{" + tpl + "}";
      if (ts.isPropertyAssignment(node.parent) && node.parent.name === node) throw new Error(`${rel}: property key hit`);
      edits.push([node.getStart(sf), node.getEnd(), tpl]);
      return;
    }
    if ((ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node) || ts.isTemplateMiddle(node) || ts.isTemplateTail(node))) {
      const start = node.getStart(sf);
      const raw = src.slice(start, node.getEnd());
      // strip delimiters: ` or } at start; ` or ${ at end
      const open = 1;
      const close = raw.endsWith("${") ? 2 : 1;
      const inner = raw.slice(open, raw.length - close);
      if (hits(inner)) {
        const parts = split(inner);
        parts.forEach((p) => p.expr && used.add(p.expr));
        const out = raw.slice(0, open) + parts.map((p) => (p.expr ? "${" + p.expr + "}" : p.lit)).join("") + raw.slice(raw.length - close);
        edits.push([start, node.getEnd(), out]);
      }
      return;
    }
    if (node.kind === ts.SyntaxKind.JsxText && hits(node.getText(sf))) {
      const start = node.getStart(sf, false);
      const raw = src.slice(node.pos, node.end);
      const parts = split(raw);
      parts.forEach((p) => p.expr && used.add(p.expr));
      edits.push([node.pos, node.end, parts.map((p) => (p.expr ? "{" + p.expr + "}" : p.lit)).join("")]);
      return;
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  if (edits.length === 0) { console.log(`${rel}: 0`); continue; }
  edits.sort((a, b) => b[0] - a[0]);
  let out = src;
  for (const [s, e, t] of edits) out = out.slice(0, s) + t + out.slice(e);
  // import
  let spec = path.relative(path.dirname(file), CONFIG).split(path.sep).join("/");
  if (!spec.startsWith(".")) spec = "./" + spec;
  if (rel === "middleware.ts") spec += ".js";
  // Sovelluksen tiedostot käyttävät "@/"-aliasta; middlewaren tuomat tiedostot suhteellista polkua.
  else if (src.includes('from "@/')) spec = "@/config/toimitus";
  const names = [...used].sort();
  const existing = new RegExp(`import \\{([^}]*)\\} from "${spec.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}";`);
  if (existing.test(out)) {
    out = out.replace(existing, (m, inner) => {
      const all = new Set([...inner.split(",").map((s) => s.trim()).filter(Boolean), ...names]);
      return `import { ${[...all].sort().join(", ")} } from "${spec}";`;
    });
  } else {
    const q = rel === "middleware.ts" ? "'" : '"';
    const line = `import { ${names.join(", ")} } from ${q}${spec}${q};\n`;
    // after the last top-level import
    const imports = sf.statements.filter((s) => ts.isImportDeclaration(s));
    if (imports.length) {
      // recompute position in edited text: find end of last import statement text
      const lastText = src.slice(imports[imports.length - 1].getStart(sf), imports[imports.length - 1].getEnd());
      const idx = out.indexOf(lastText);
      if (idx < 0) throw new Error(`${rel}: last import changed`);
      const pos = idx + lastText.length;
      out = out.slice(0, pos) + "\n" + line.trimEnd() + out.slice(pos);
    } else {
      // after leading comment block
      const m = out.match(/^(\s*\/\*[\s\S]*?\*\/\s*\n)?/);
      const pos = m ? m[0].length : 0;
      out = out.slice(0, pos) + line + (pos ? "" : "\n") + out.slice(pos);
    }
  }
  fs.writeFileSync(file, out);
  console.log(`${rel}: ${edits.length} edits, ${names.join(",")}`);
}
