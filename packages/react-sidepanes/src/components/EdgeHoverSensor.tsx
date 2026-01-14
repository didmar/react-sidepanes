import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type FC,
  type MouseEvent as ReactMouseEvent,
  type ReactNode
} from 'react'
import { useSidepanes } from '../context/SidepanesContext'
import type { EdgeSensorRenderProps, SidepaneAnchor } from '../types'
import { getViewportWidth } from '../utils/getViewportWidth'
import {
  EDGE_SENSOR_MAX_WIDTH_IN_PX,
  EDGE_SENSOR_MIN_WIDTH_IN_PX,
  EDGE_SENSOR_TRIGGER_PADDING_IN_PX,
  EDGE_SENSOR_Z_INDEX,
  REOPEN_COOLDOWN_MS,
  SIDE_PANE_OPEN_ANIMATION_DURATION_MS
} from '../constants'

interface Props {
  /** Which edge to detect hover on */
  anchor: SidepaneAnchor
  /** When true, the sensor is disabled and will not react to pointer events */
  disabled?: boolean
  /**
   * Optional custom width calculator.
   * If not provided, width is calculated based on central pane position.
   */
  getWidth?: (params: {
    viewportWidth: number
    centralPaneRect: DOMRect | null
  }) => number
  /**
   * Optional render function for custom sensor rendering.
   * If not provided, renders an invisible div.
   */
  children?: (props: EdgeSensorRenderProps) => ReactNode
  /** Additional CSS class name */
  className?: string
  /** Additional inline styles */
  style?: CSSProperties
  /** z-index for the sensor element. Default: 1202 */
  zIndex?: number
}

/**
 * Headless edge hover sensor component.
 *
 * Detects when the user hovers over the edge of the screen and opens the
 * corresponding sidepane temporarily.
 *
 * Uses data attributes for styling:
 * - data-edge-hover-sensor: always present
 * - data-anchor: "left" or "right"
 * - data-active: "true" if the sensor is active (pane is closed)
 *
 * Sets CSS custom properties:
 * - --edge-sensor-width: current width in pixels
 */
export const EdgeHoverSensor: FC<Props> = ({
  anchor,
  disabled = false,
  getWidth: customGetWidth,
  children,
  className,
  style,
  zIndex = EDGE_SENSOR_Z_INDEX
}): JSX.Element | null => {
  const {
    leftPane,
    rightPane,
    centralPaneRef,
    openLeftPaneTemporary,
    openRightPaneTemporary,
    closeLeftPane,
    closeRightPane,
    config
  } = useSidepanes()

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastClosedAtRef = useRef<number>(0)
  const mouseMoveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null)

  const pane = anchor === 'left' ? leftPane : rightPane
  const isPaneOpen = pane.openState !== 'closed'

  // Use a ref to track the current pane state for use in timeouts
  // This avoids stale closure issues where the setTimeout captures old state
  const paneRef = useRef(pane)
  paneRef.current = pane

  // Record when the pane has just been closed
  useEffect(() => {
    if (pane.openState === 'closed') {
      lastClosedAtRef.current = Date.now()
    }
  }, [pane.openState])

  const triggerOpen = (): void => {
    const now = Date.now()
    const remainingCooldown = Math.max(0, REOPEN_COOLDOWN_MS - (now - lastClosedAtRef.current))

    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(() => {
      if (pane.openState === 'closed') {
        if (anchor === 'left') {
          openLeftPaneTemporary()
        } else {
          openRightPaneTemporary()
        }
      }
    }, remainingCooldown)
  }

  const handleMouseEnter = (e: ReactMouseEvent): void => {
    const sensorElement = e.currentTarget as HTMLElement

    // For the right edge sensor with padding, use mousemove tracking
    if (anchor === 'right' && EDGE_SENSOR_TRIGGER_PADDING_IN_PX > 0) {
      const sensorRect = sensorElement.getBoundingClientRect()
      const triggerZoneBoundary = sensorRect.left + EDGE_SENSOR_TRIGGER_PADDING_IN_PX

      if (e.clientX >= triggerZoneBoundary) {
        triggerOpen()
        return
      }

      const handleMouseMove = (moveEvent: MouseEvent): void => {
        if (moveEvent.clientX >= triggerZoneBoundary) {
          sensorElement.removeEventListener('mousemove', handleMouseMove)
          mouseMoveHandlerRef.current = null
          triggerOpen()
        }
      }

      mouseMoveHandlerRef.current = handleMouseMove
      sensorElement.addEventListener('mousemove', handleMouseMove)
      return
    }

    triggerOpen()
  }

  const handleMouseLeave = (e: ReactMouseEvent): void => {
    if (timeoutRef.current !== null) clearTimeout(timeoutRef.current)

    if (mouseMoveHandlerRef.current !== null) {
      ;(e.currentTarget as HTMLElement).removeEventListener('mousemove', mouseMoveHandlerRef.current)
      mouseMoveHandlerRef.current = null
    }

    // Store the leave position, but note that we'll check the current position after delay
    const leaveX = e.clientX
    const leaveY = e.clientY

    if (pane.openState === 'hovered') {
      setTimeout(() => {
        // Use the ref to get the CURRENT pane state, not the stale closure value
        if (paneRef.current.openState !== 'hovered') return

        // Check if mouse is now over the pane or the toggle button
        // We use the stored leave position since that's where the mouse went
        const elementAtLeavePoint = document.elementFromPoint(leaveX, leaveY)
        const enteredPane = elementAtLeavePoint?.closest('[data-sidepane]') !== null
        const enteredToggle = elementAtLeavePoint?.closest('[data-sidepane-toggle]') !== null

        if (!enteredPane && !enteredToggle) {
          if (anchor === 'left') {
            closeLeftPane()
          } else {
            closeRightPane()
          }
        }
      }, SIDE_PANE_OPEN_ANIMATION_DURATION_MS)
    }
  }

  const computeSensorWidth = useCallback((): number => {
    if (customGetWidth) {
      const centralRect = centralPaneRef.current?.getBoundingClientRect() ?? null
      return customGetWidth({
        viewportWidth: getViewportWidth(),
        centralPaneRect: centralRect
      })
    }

    // When the pane is minimized (compact), the sensor should match its width
    if (pane.closedStyle === 'compact') {
      return config.compactWidth
    }

    if (centralPaneRef.current === null) return EDGE_SENSOR_MAX_WIDTH_IN_PX

    const rect = centralPaneRef.current.getBoundingClientRect()

    if (anchor === 'left') {
      const distance = Math.max(0, rect.left)
      return Math.max(EDGE_SENSOR_MIN_WIDTH_IN_PX, Math.min(EDGE_SENSOR_MAX_WIDTH_IN_PX, distance))
    }

    // anchor === 'right'
    const viewportWidth = getViewportWidth()

    // Calculate distance from central pane's right edge to viewport's right edge
    const distance = Math.max(0, viewportWidth - rect.right)
    return Math.max(EDGE_SENSOR_MIN_WIDTH_IN_PX, Math.min(EDGE_SENSOR_MAX_WIDTH_IN_PX, distance))
  }, [customGetWidth, pane.closedStyle, config.compactWidth, anchor])

  const [sensorWidth, setSensorWidth] = useState<number>(computeSensorWidth())

  useLayoutEffect(() => {
    const handleResize = (): void => {
      setSensorWidth(computeSensorWidth())
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [anchor, leftPane, rightPane, pane.openState, pane.closedStyle, config, computeSensorWidth])

  if (disabled) {
    return null
  }

  const isActive = !isPaneOpen

  const cssVars = {
    '--edge-sensor-width': `${sensorWidth}px`
  } as CSSProperties

  const renderProps: EdgeSensorRenderProps = {
    anchor,
    isActive,
    width: sensorWidth
  }

  if (children) {
    return (
      <div
        data-edge-hover-sensor
        data-anchor={anchor}
        data-active={isActive || undefined}
        className={className}
        style={{
          position: 'fixed',
          top: 0,
          [anchor === 'left' ? 'left' : 'right']: 0,
          width: `${sensorWidth}px`,
          height: '100vh',
          zIndex,
          backgroundColor: 'transparent',
          pointerEvents: isPaneOpen ? 'none' : 'auto',
          ...cssVars,
          ...style
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children(renderProps)}
      </div>
    )
  }

  return (
    <div
      data-edge-hover-sensor
      data-anchor={anchor}
      data-active={isActive || undefined}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'fixed',
        top: 0,
        [anchor === 'left' ? 'left' : 'right']: 0,
        width: `${sensorWidth}px`,
        height: '100vh',
        zIndex,
        backgroundColor: 'transparent',
        pointerEvents: isPaneOpen ? 'none' : 'auto',
        ...cssVars,
        ...style
      }}
    />
  )
}

export default EdgeHoverSensor
