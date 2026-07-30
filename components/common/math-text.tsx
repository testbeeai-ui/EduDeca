"use client";

import { useMemo } from "react";
import katex from "katex";

import { splitMathChunks } from "@/lib/challenge/math-text";
import { cn } from "@/lib/utils";

type MathTextProps = {
  children: string;
  className?: string;
  as?: "span" | "p" | "div";
};

function renderLatex(latex: string, displayMode: boolean): string | null {
  try {
    return katex.renderToString(latex, {
      throwOnError: false,
      displayMode,
      strict: "ignore",
      trust: false,
    });
  } catch {
    return null;
  }
}

/**
 * Renders challenge stems/options with KaTeX (bare `km h^{-1}`, `x^2`, `$...$`, etc.).
 */
export function MathText({ children, className, as: Tag = "span" }: MathTextProps) {
  const chunks = useMemo(() => splitMathChunks(String(children ?? "")), [children]);

  return (
    <Tag className={cn("edudeca-math-text", className)}>
      {chunks.map((chunk, i) => {
        if (!chunk.isMath) {
          return <span key={`t-${i}`}>{chunk.text}</span>;
        }
        const html = renderLatex(chunk.text, chunk.displayMode);
        if (!html) {
          return <span key={`m-${i}`}>{chunk.text}</span>;
        }
        return (
          <span
            key={`m-${i}`}
            className={cn(
              "[&_.katex]:text-[1em] [&_.katex]:leading-none",
              chunk.displayMode && "block my-1 overflow-x-auto",
            )}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </Tag>
  );
}
