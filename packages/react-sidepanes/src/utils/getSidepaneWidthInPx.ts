import type { SidepaneState } from '../types'
import { getViewportWidth } from './getViewportWidth'

/**
 * Convert a SidepaneWidth value to pixels.
 */
export const getSidepaneWidthInPx = (paneState: SidepaneState): number => {
  const { width } = paneState
  if (typeof width === 'number') {
    return width
  }
  const viewportWidth = getViewportWidth()
  if (width === 'one-third') {
    return viewportWidth / 3
  }
  if (width === 'half') {
    return viewportWidth / 2
  }
  if (width === 'two-thirds') {
    return (viewportWidth * 2) / 3
  }
  throw new Error(`Invalid sidepane width in state: ${JSON.stringify(paneState)}`)
}

export default getSidepaneWidthInPx
