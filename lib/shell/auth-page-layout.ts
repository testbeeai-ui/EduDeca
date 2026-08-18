/**
 * Auth (/signin) shell layout tokens.
 *
 * Do not put `items-center` on the same flex box as `overflow-y-auto`.
 * That combo clips the top of overflowing content (step pills / form) and
 * makes zoomed or short viewports feel stuck.
 *
 * Vertical centering belongs on a `min-h-full` inner wrapper so the scroller
 * can still start at the top when content is taller than the viewport.
 */
export const AUTH_PAGE_SCROLL_CLASS =
  "min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3 sm:px-5 sm:py-4";

export const AUTH_PAGE_CENTER_CLASS =
  "flex min-h-full w-full items-center justify-center";

const ITEMS_CENTER = /\b(?:sm:)?items-center\b/;

export function isUnsafeCenteredOverflowFlex(className: string): boolean {
  return /\boverflow-y-auto\b/.test(className) && ITEMS_CENTER.test(className);
}
