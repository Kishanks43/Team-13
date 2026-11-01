/**
 * Conflict navigation helpers: next / previous arithmetic and scroll-into-view.
 *
 * These are pure functions (no DOM, no session) so they are easy to test.
 * The page wires them to Prev/Next buttons and keyboard shortcuts in app.js.
 */

/**
 * Return the id of the conflict that comes after the currently selected one,
 * wrapping around from the last conflict back to the first.
 *
 * @param {Array}       conflicts  - the conflicts array from session.getState()
 * @param {number|null} selectedId - the currently selected conflict id, or null
 * @returns {number|null} the id to select next, or null if the list is empty
 */
export function nextConflictId(conflicts, selectedId) {
  if (conflicts.length === 0) return null;
  const idx = conflicts.findIndex((c) => c.id === selectedId);
  // If nothing is selected (idx === -1), start from the first conflict.
  const next = (idx + 1) % conflicts.length;
  return conflicts[next].id;
}

/**
 * Return the id of the conflict that comes before the currently selected one,
 * wrapping around from the first conflict back to the last.
 *
 * @param {Array}       conflicts  - the conflicts array from session.getState()
 * @param {number|null} selectedId - the currently selected conflict id, or null
 * @returns {number|null} the id to select next, or null if the list is empty
 */
export function prevConflictId(conflicts, selectedId) {
  if (conflicts.length === 0) return null;
  const idx = conflicts.findIndex((c) => c.id === selectedId);
  // If nothing is selected (idx === -1), start from the last conflict.
  if (idx === -1) return conflicts[conflicts.length - 1].id;
  const prev = (idx - 1 + conflicts.length) % conflicts.length;
  return conflicts[prev].id;
}

/**
 * Scroll targetEl into view inside scrollableEl, but only if it is not already
 * fully visible. Both arguments may be null (the function is then a no-op).
 *
 * @param {Element|null} scrollableEl - the scrollable container
 * @param {Element|null} targetEl     - the element to bring into view
 */
export function scrollConflictIntoView(scrollableEl, targetEl) {
  if (!scrollableEl || !targetEl) return;

  const containerRect = scrollableEl.getBoundingClientRect();
  const targetRect = targetEl.getBoundingClientRect();

  const above = targetRect.top < containerRect.top;
  const below = targetRect.bottom > containerRect.bottom;

  if (above) {
    scrollableEl.scrollTop -= containerRect.top - targetRect.top;
  } else if (below) {
    scrollableEl.scrollTop += targetRect.bottom - containerRect.bottom;
  }
}
