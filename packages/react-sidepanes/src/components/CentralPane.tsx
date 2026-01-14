import type { CSSProperties, FC, ReactNode } from 'react'
import { useSidepanes } from '../context/SidepanesContext'

interface Props {
  /** The content of the central pane */
  children: ReactNode
  /** Additional CSS class name */
  className?: string
  /** Additional inline styles */
  style?: CSSProperties
  /** Accessible label for the pane */
  ariaLabel?: string
}

/**
 * Headless central pane component.
 *
 * This is the main content area that sits between the left and right sidepanes.
 * It provides the ref needed for the sidepanes system to track dimensions.
 *
 * Uses data attributes for styling:
 * - data-central-pane: always present
 *
 * Sets CSS custom properties:
 * - --central-pane-min-width: minimum width in pixels
 * - --central-pane-max-width: maximum width in pixels
 * - --central-pane-width: current width in pixels
 * - --central-pane-height: current height in pixels
 */
export const CentralPane: FC<Props> = ({
  children,
  className,
  style,
  ariaLabel = 'Central panel'
}): JSX.Element => {
  const { centralPaneRef, centralPane, config } = useSidepanes()

  const cssVars = {
    '--central-pane-min-width': `${config.centralPaneMinWidth}px`,
    '--central-pane-max-width': `${config.centralPaneMaxWidth}px`,
    '--central-pane-width': `${centralPane.width}px`,
    '--central-pane-height': `${centralPane.height}px`
  } as CSSProperties

  return (
    <main
      data-central-pane
      ref={centralPaneRef as React.RefObject<HTMLElement>}
      aria-label={ariaLabel}
      className={className}
      style={{ ...cssVars, ...style }}
    >
      {children}
    </main>
  )
}

export default CentralPane
