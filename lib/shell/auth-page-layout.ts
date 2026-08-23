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
  "min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-6 sm:py-5 lg:px-10";

/** Top-align overflowing Step 5; `my-auto` on the child still centers short steps. */
export const AUTH_PAGE_CENTER_CLASS =
  "flex min-h-full w-full items-start justify-center";

export const AUTH_PAGE_CENTER_CHILD_CLASS = "my-auto w-full min-w-0";

const ITEMS_CENTER = /\b(?:sm:)?items-center\b/;

export function isUnsafeCenteredOverflowFlex(className: string): boolean {
  return /\boverflow-y-auto\b/.test(className) && ITEMS_CENTER.test(className);
}
