import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FC,
  type ReactNode
} from 'react'
import { useSidepanes } from '../context/SidepanesContext'
import type { ClosedStyle, SidepaneAnchor, SidepaneRenderProps } from '../types'
import { getSidepaneWidthInPx } from '../utils/getSidepaneWidthInPx'
import { SIDE_PANE_OPEN_ANIMATION_DURATION_MS } from '../constants'

interface Props {
  /** Which side the pane is anchored to */
  anchor: SidepaneAnchor
  /**
   * Whether the pane can be resized.
   * If true, you should render a SidepaneResizeHandle as a child.
   */
  resizable?: boolean
  /**
   * The content of the sidepane.
   * Can be a React node or a render function that receives the pane state.
   */
  children: ReactNode | ((props: SidepaneRenderProps) => ReactNode)
  /**
   * Optional header content.
   * Can be a React node or a render function that receives the pane state.
   */
  header?: ReactNode | ((props: SidepaneRenderProps) => ReactNode)
  /**
   * Defines how the side pane looks when its state is "closed".
   * - "hidden" (default): the pane is completely collapsed and invisible
   * - "compact": the pane remains visible with a reduced, fixed width
   */
  closedStyle?: ClosedStyle
  /** Accessible label for the pane */
  ariaLabel?: string
  /** Additional CSS class name */
  className?: string
  /** Additional inline styles */
  style?: CSSProperties
}

/**
 * Headless sidepane component.
 * Renders a side panel that can be opened, closed, and optionally resized.
 *
 * Uses data attributes for styling:
 * - data-sidepane: always present
 * - data-anchor: "left" or "right"
 * - data-expanded: "true" or "false"
 * - data-temporary: "true" if temporarily open (hovered)
 * - data-closed-style: "compact" or "hidden" (always present, reflects closedStyle prop)
 *
 * Sets CSS custom properties:
 * - --sidepane-width: current width in pixels
 * - --sidepane-animation-duration: animation duration in ms
 */
export const Sidepane: FC<Props> = ({
  anchor,
  resizable = false,
  children,
  header,
  closedStyle = 'hidden',
  ariaLabel = 'Side pane',
  className,
  style
}): JSX.Element => {
  const {
    leftPane,
    rightPane,
    openLeftPane,
    openRightPane,
    closeLeftPane,
    closeRightPane,
    config,
    leftPaneCloseTimeoutRef,
    rightPaneCloseTimeoutRef,
    isResizingRef
  } = useSidepanes()
  const pane = anchor === 'left' ? leftPane : rightPane
  // Use the shared timeout ref from context so other components can cancel pending closes
  const sharedCloseTimeoutRef = anchor === 'left' ? leftPaneCloseTimeoutRef : rightPaneCloseTimeoutRef

  const isPaneOpen = pane.openState !== 'closed'
  const isCompact = !isPaneOpen && closedStyle === 'compact'
  const isTemporary = pane.openState === 'hovered'

  // Manage the width of the sidepane based on the relevant pane state
  const [width, setWidth] = useState<number>(0)

  // Track when opening from hidden state to allow smooth opening transition
  // Use a ref to detect the first render after element was hidden
  const wasHiddenRef = useRef<boolean>(true)
  const paneRef = useRef(pane)
  const isPaneOpenRef = useRef(isPaneOpen)
  paneRef.current = pane
  isPaneOpenRef.current = isPaneOpen

  useLayoutEffect(() => {
    if (isCompact) {
      setWidth(config.compactWidth)
      wasHiddenRef.current = false
      return
    }

    if (!isPaneOpen && closedStyle === 'hidden') {
      setWidth(0)
      wasHiddenRef.current = true
      return
    }

    // Pane is open - check if we're opening from a hidden state
    if (wasHiddenRef.current && closedStyle === 'hidden') {
      wasHiddenRef.current = false
      setWidth(0) // Start at 0 for smooth transition
      // After paint, transition to open width
      requestAnimationFrame(() => {
        // Use refs to avoid stale closure
        if (isPaneOpenRef.current) {
          setWidth(getSidepaneWidthInPx(paneRef.current))
        }
      })
      return
    }

    wasHiddenRef.current = false
    setWidth(getSidepaneWidthInPx(pane))
  }, [pane, isCompact, isPaneOpen, closedStyle, config.compactWidth])

  // Keep overlay positioning while the pane is closing from a hovered state
  const [wasTemporary, setWasTemporary] = useState<boolean>(false)
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Note: We use sharedCloseTimeoutRef from context for mouse leave handling
  // to allow SidepaneToggle to cancel pending closes when hovering over it

  // Keep element rendered during close animation for hidden panes
  const [wasOpen, setWasOpen] = useState<boolean>(false)
  const wasOpenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isTemporary) {
      if (closeTimeoutRef.current !== null) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
      setWasTemporary(true)
      return
    }

    if (!isPaneOpen && wasTemporary) {
      closeTimeoutRef.current = setTimeout(() => {
        setWasTemporary(false)
      }, SIDE_PANE_OPEN_ANIMATION_DURATION_MS)
    }

    return () => {
      if (closeTimeoutRef.current !== null) {
        clearTimeout(closeTimeoutRef.current)
        closeTimeoutRef.current = null
      }
    }
  }, [isTemporary, isPaneOpen, wasTemporary])

  useEffect(() => {
    return () => {
      if (sharedCloseTimeoutRef.current !== null) {
        clearTimeout(sharedCloseTimeoutRef.current)
        sharedCloseTimeoutRef.current = null
      }
    }
  }, [sharedCloseTimeoutRef])

  useEffect(() => {
    if (pane.openState === 'pinned') {
      setWasTemporary(false)
    }
  }, [pane.openState])

  // Delay DOM removal to allow close animation for hidden panes
  useEffect(() => {
    if (isPaneOpen) {
      if (wasOpenTimeoutRef.current !== null) {
        clearTimeout(wasOpenTimeoutRef.current)
        wasOpenTimeoutRef.current = null
      }
      setWasOpen(true)
      return
    }

    // Pane just closed - delay DOM removal to allow animation
    if (wasOpen && closedStyle === 'hidden') {
      wasOpenTimeoutRef.current = setTimeout(() => {
        setWasOpen(false)
      }, config.animationDuration)
    } else {
      setWasOpen(false)
    }

    return () => {
      if (wasOpenTimeoutRef.current !== null) {
        clearTimeout(wasOpenTimeoutRef.current)
        wasOpenTimeoutRef.current = null
      }
    }
  }, [isPaneOpen, wasOpen, closedStyle, config.animationDuration])

  const overlay = isTemporary || wasTemporary
  const showPlaceholder = overlay && pane.closedStyle === 'compact'

  const openPane = anchor === 'left' ? openLeftPane : openRightPane
  const closePane = anchor === 'left' ? closeLeftPane : closeRightPane

  const renderProps: SidepaneRenderProps = {
    isOpen: isPaneOpen,
    isTemporary,
    isPinned: pane.openState === 'pinned',
    isCompact,
    isResizable: resizable,
    width,
    anchor,
    open: openPane,
    close: closePane,
    toggle: () => (isPaneOpen ? closePane() : openPane())
  }

  const cssVars = {
    '--sidepane-width': `${width}px`,
    '--sidepane-animation-duration': `${config.animationDuration}ms`
  } as CSSProperties

  const handleMouseEnter = (): void => {
    // Cancel any pending close when mouse re-enters the pane
    if (sharedCloseTimeoutRef.current !== null) {
      clearTimeout(sharedCloseTimeoutRef.current)
      sharedCloseTimeoutRef.current = null
    }
  }

  const handleMouseLeave = (): void => {
    // Don't close the pane during resize - the user is interacting with the resize handle
    if (isResizingRef.current) return

    if (isTemporary && isPaneOpen) {
      // Cancel any existing timeout
      if (sharedCloseTimeoutRef.current !== null) {
        clearTimeout(sharedCloseTimeoutRef.current)
      }
      // Schedule close - this can be cancelled by SidepaneToggle's mouseEnter
      sharedCloseTimeoutRef.current = setTimeout(() => {
        closePane()
      }, 100)
    }
  }

  const shouldRender = isPaneOpen || isCompact || wasOpen

  return (
    <>
      {/* Placeholder to keep layout stable when a compact pane is displayed as an overlay */}
      {showPlaceholder && anchor === 'left' && (
        <div
          data-sidepane-placeholder
          data-anchor="left"
          style={{ width: `${config.compactWidth}px`, height: '100vh', flexShrink: 0 }}
        />
      )}

      {shouldRender && (
        <aside
          data-sidepane
          data-anchor={anchor}
          data-expanded={isPaneOpen ? 'true' : 'false'}
          data-temporary={isTemporary || undefined}
          data-closed-style={closedStyle}
          data-overlay={overlay || undefined}
          aria-label={ariaLabel}
          aria-expanded={isPaneOpen}
          className={className}
          style={{ ...cssVars, ...style }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {header && (
            <div data-sidepane-header>
              {typeof header === 'function' ? header(renderProps) : header}
            </div>
          )}
          <div data-sidepane-content>
            {typeof children === 'function' ? children(renderProps) : children}
          </div>
        </aside>
      )}

      {showPlaceholder && anchor === 'right' && (
        <div
          data-sidepane-placeholder
          data-anchor="right"
          style={{ width: `${config.compactWidth}px`, height: '100vh', flexShrink: 0 }}
        />
      )}
    </>
  )
}

export default Sidepane
