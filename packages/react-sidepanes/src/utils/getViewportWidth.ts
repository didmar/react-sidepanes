/**
 * Get the viewport width.
 * Use documentElement.clientWidth instead of window.innerWidth to get a stable width
 * that doesn't change when scrollbars appear/disappear
 */
export const getViewportWidth = (): number => {
  if (typeof document === 'undefined') {
    return 0
  }
  return document.documentElement.clientWidth > 0
    ? document.documentElement.clientWidth
    : window.innerWidth
}

export default getViewportWidth
