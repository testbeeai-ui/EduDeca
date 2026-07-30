/**
 * Normalize challenge question text so bare LaTeX fragments render with KaTeX.
 * Seeds store units like `km h^{-1}` and powers like `x^2` without `$` delimiters.
 */

const DELIMITED =
  /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\\\([\s\S]+?\\\)|\\\[[\s\S]+?\\\])/g;

/** Wrap naked TeX tokens that appear in EduDeca stems/options. */
export function wrapNakedLatex(raw: string): string {
  if (!raw) return raw;

  const parts = raw.split(DELIMITED);
  return parts
    .map((part, i) => {
      // Odd indices are already delimited math from the split keep-groups.
      if (i % 2 === 1) return part;
      return wrapPlainSegment(part);
    })
    .join("");
}

function wrapPlainSegment(text: string): string {
  let out = text;

  // Units / expressions with braced exponents: m s^{-2}, km h^{-1}, 10^{-3}
  out = out.replace(
    /((?:[A-Za-z]+\s+)*[A-Za-z0-9]+)\s*(\^\{-?\d+\})/g,
    (_m, base: string, exp: string) => `$${base.trim()}${exp}$`,
  );

  // Simple powers: x^2, y^{-1} (unbraced)
  out = out.replace(
    /(^|[^$\\A-Za-z])([A-Za-z])\^(-?\d+)\b/g,
    (_m, pre: string, base: string, exp: string) => `${pre}$${base}^{${exp}}$`,
  );

  // Chemical-ish subscripts written as N_2, H_2, NH_3
  out = out.replace(
    /(^|[^$\\])([A-Z][a-z]?(?:[A-Z][a-z]?)*)_(\d+)\b/g,
    (_m, pre: string, elem: string, n: string) => `${pre}$${elem}_{${n}}$`,
  );

  // Equilibrium arrow written as <=>
  out = out.replace(/<=>/g, "$\\rightleftharpoons$");

  // Chemistry molecules: N2(g), 3H2(g), 2NH3 → subscripts
  out = out.replace(
    /\b(\d*)((?:[A-Z][a-z]?\d*)+)(\([gsalq]\))?/g,
    (_m, coef: string, body: string, state: string | undefined) => {
      if (!/\d/.test(body)) return _m;
      const withSub = body.replace(/([A-Z][a-z]?)(\d+)/g, "$1_{$2}");
      const st = state ? `(\\mathrm{${state.slice(1, -1)}})` : "";
      return `$${coef}${withSub}${st}$`;
    },
  );

  // Simple educational fractions only (1/4, 3/4) — not currency like 60,000/300
  out = out.replace(
    /(^|[^0-9$,])(\d{1,2})\/(\d{1,2})(?![0-9])/g,
    (_m, pre: string, a: string, b: string) => `${pre}$\\frac{${a}}{${b}}$`,
  );

  return out;
}

export type MathChunk = {
  text: string;
  isMath: boolean;
  displayMode: boolean;
};

/** Split text into plain + math chunks after naked-LaTeX wrapping. */
export function splitMathChunks(raw: string): MathChunk[] {
  const source = wrapNakedLatex(raw);
  const chunks: MathChunk[] = [];
  const re =
    /\$\$([\s\S]+?)\$\$|\$([^$\n]+?)\$|\\\(([\s\S]+?)\\\)|\\\[([\s\S]+?)\\\]/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source)) !== null) {
    if (match.index > last) {
      chunks.push({ text: source.slice(last, match.index), isMath: false, displayMode: false });
    }
    if (match[1] != null) {
      chunks.push({ text: match[1], isMath: true, displayMode: true });
    } else if (match[2] != null) {
      chunks.push({ text: match[2], isMath: true, displayMode: false });
    } else if (match[3] != null) {
      chunks.push({ text: match[3], isMath: true, displayMode: false });
    } else if (match[4] != null) {
      chunks.push({ text: match[4], isMath: true, displayMode: true });
    }
    last = match.index + match[0].length;
  }
  if (last < source.length) {
    chunks.push({ text: source.slice(last), isMath: false, displayMode: false });
  }
  return chunks.length ? chunks : [{ text: raw, isMath: false, displayMode: false }];
}
