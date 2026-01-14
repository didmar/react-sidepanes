import { useRef, type FC, type ReactNode } from 'react'
import { useSidepanes } from '../context/SidepanesContext'
import type { SidepaneAnchor, ToggleRenderProps } from '../types'

interface Props {
  /** Which side pane this toggle controls */
  anchor: SidepaneAnchor
  /**
   * Render function that receives toggle state and handlers.
   * Use this to render your own button with your own icons.
   */
  children: (props: ToggleRenderProps) => ReactNode
  /** Additional CSS class name for the wrapper */
  className?: string
}

/**
 * Headless toggle button component for sidepanes.
 *
 * This component provides all the logic and state for a sidepane toggle button,
 * but lets you render your own button with your own icons.
 *
 * Uses data attributes for styling:
 * - data-sidepane-toggle: always present
 * - data-anchor: "left" or "right"
 * - data-expanded: "true" or "false"
 * - data-temporary: "true" if the pane is temporarily open
 * - data-disabled: "true" if pinning is disabled
 *
 * @example
 * ```tsx
 * <SidepaneToggle anchor="right">
 *   {({ isOpen, isTemporary, onClick, ariaLabel }) => (
 *     <button onClick={onClick} aria-label={ariaLabel}>
 *       {isTemporary ? <PinIcon /> : isOpen ? <CloseIcon /> : <OpenIcon />}
 *     </button>
 *   )}
 * </SidepaneToggle>
 * ```
 */
export const SidepaneToggle: FC<Props> = ({ anchor, children, className }): JSX.Element => {
  const {
    leftPane,
    rightPane,
    canPinPane,
    openLeftPane,
    openRightPane,
    openLeftPaneTemporary,
    openRightPaneTemporary,
    closeLeftPane,
    closeRightPane,
    leftPaneCloseTimeoutRef,
    rightPaneCloseTimeoutRef
  } = useSidepanes()

  const pane = anchor === 'left' ? leftPane : rightPane
  const isOpen = pane.openState !== 'closed'
  const isTemporary = pane.openState === 'hovered'

  // Use refs to track current state for event handlers to avoid stale closures
  const paneRef = useRef(pane)
  paneRef.current = pane

  // Shared timeout ref from context - allows cancelling pending closes from Sidepane
  const sharedCloseTimeoutRef = anchor === 'left' ? leftPaneCloseTimeoutRef : rightPaneCloseTimeoutRef
  const leaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pinResult = canPinPane(anchor)
  // Button is disabled when the pane is in hover mode and either:
  // - There's no space to pin at all (!canPin)
  // - There's only space if we close the other pane (requiresClosingOpposite)
  const isPinDisabled = isOpen && isTemporary && (!pinResult.canPin || pinResult.requiresClosingOpposite)

  const openPane = anchor === 'left' ? openLeftPane : openRightPane
  const openPaneTemporary = anchor === 'left' ? openLeftPaneTemporary : openRightPaneTemporary
  const closePane = anchor === 'left' ? closeLeftPane : closeRightPane

  const handleClick = (): void => {
    if (isPinDisabled) {
      return
    }
    if (isOpen && isTemporary) {
      // Convert temporary pane to pinned
      openPane()
      return
    }
    if (isOpen) {
      closePane()
    } else {
      openPane()
    }
  }

  const handleMouseEnter = (): void => {
    // Clear any pending close timeout from this toggle
    if (leaveTimeoutRef.current !== null) {
      clearTimeout(leaveTimeoutRef.current)
      leaveTimeoutRef.current = null
    }
    // Also cancel any pending close from the Sidepane component
    // This is crucial for when the mouse moves from pane to toggle button
    if (sharedCloseTimeoutRef.current !== null) {
      clearTimeout(sharedCloseTimeoutRef.current)
      sharedCloseTimeoutRef.current = null
    }
    if (!isOpen) {
      openPaneTemporary()
    }
  }

  const handleMouseLeave = (): void => {
    // Clear any existing timeout
    if (leaveTimeoutRef.current !== null) {
      clearTimeout(leaveTimeoutRef.current)
    }
    // Use a small delay to allow for quick re-entry and to ensure state is current
    leaveTimeoutRef.current = setTimeout(() => {
      // Check current state via ref to avoid stale closure
      if (paneRef.current.openState === 'hovered') {
        closePane()
      }
    }, 100)
  }

  // Generate aria label based on state
  let ariaLabel: string
  if (isOpen && isTemporary) {
    ariaLabel = isPinDisabled ? 'Not enough space to pin this panel' : 'Lock side panel'
  } else if (isOpen) {
    ariaLabel = 'Close side panel'
  } else {
    ariaLabel = 'Open side panel'
  }

  const renderProps: ToggleRenderProps = {
    isOpen,
    isTemporary,
    isPinDisabled,
    canPin: pinResult.canPin,
    anchor,
    onClick: handleClick,
    onMouseEnter: handleMouseEnter,
    ariaLabel
  }

  return (
    <div
      data-sidepane-toggle
      data-anchor={anchor}
      data-expanded={isOpen ? 'true' : 'false'}
      data-temporary={isTemporary || undefined}
      data-disabled={isPinDisabled || undefined}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children(renderProps)}
    </div>
  )
}

export default SidepaneToggle
