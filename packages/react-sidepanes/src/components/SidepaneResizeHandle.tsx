import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FC,
  type MouseEvent as ReactMouseEvent,
  type ReactNode
} from 'react'
import { useSidepanes } from '../context/SidepanesContext'
import type { ResizeHandleRenderProps, SidepaneAnchor, SidepaneWidth } from '../types'
import { getViewportWidth } from '../utils/getViewportWidth'
import { getSidepaneWidthInPx } from '../utils/getSidepaneWidthInPx'
import { RESIZE_HANDLE_WIDTH_IN_PX } from '../constants'

interface Props {
  /** Which side pane this handle resizes */
  anchor: SidepaneAnchor
  /**
   * Optional render function for custom handle rendering.
   * If not provided, renders a simple div with default styling hints.
   */
  children?: (props: ResizeHandleRenderProps) => ReactNode
  /** Additional CSS class name */
  className?: string
  /** Additional inline styles */
  style?: CSSProperties
  /**
   * Color for the guide line shown while dragging.
   * Default: '#ccc'
   */
  guideLineColor?: string
}

/**
 * Headless resize handle component for sidepanes.
 *
 * Allows users to drag to resize the sidepane width.
 *
 * Uses data attributes for styling:
 * - data-sidepane-resize-handle: always present
 * - data-anchor: "left" or "right"
 * - data-dragging: "true" while actively dragging
 *
 * Sets CSS custom properties:
 * - --resize-handle-width: width of the handle in pixels
 */
export const SidepaneResizeHandle: FC<Props> = ({
  anchor,
  children,
  className,
  style,
  guideLineColor = '#ccc'
}): JSX.Element => {
  const { leftPane, rightPane, setLeftPaneWidth, setRightPaneWidth, config, isResizingRef } = useSidepanes()

  const pane = anchor === 'left' ? leftPane : rightPane
  const setPaneWidth = anchor === 'left' ? setLeftPaneWidth : setRightPaneWidth

  const [isDragging, setIsDragging] = useState(false)
  const startXRef = useRef<number>(0)
  const startWidthRef = useRef<number>(getSidepaneWidthInPx(pane))
  const draggingRef = useRef<boolean>(false)
  const pendingWidthRef = useRef<number>(startWidthRef.current)
  const guideLineRef = useRef<HTMLDivElement | null>(null)

  const handleMouseMove = useCallback(
    (e: MouseEvent): void => {
      if (!draggingRef.current) return

      const deltaX = e.clientX - startXRef.current
      const desiredWidth = anchor === 'left' ? startWidthRef.current + deltaX : startWidthRef.current - deltaX

      const viewportWidth = getViewportWidth()
      const maxAllowedWidth = Math.max(
        config.minWidth,
        viewportWidth - config.centralPaneMinWidth - 100
      )

      const clampedWidth = Math.max(config.minWidth, Math.min(maxAllowedWidth, desiredWidth))

      pendingWidthRef.current = clampedWidth

      if (guideLineRef.current !== null) {
        const guideX = anchor === 'left' ? clampedWidth : viewportWidth - clampedWidth
        guideLineRef.current.style.left = `${guideX}px`
      }
    },
    [anchor, config]
  )

  const stopDragging = useCallback((): void => {
    if (!draggingRef.current) return
    draggingRef.current = false
    setIsDragging(false)
    isResizingRef.current = false

    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseup', stopDragging)

    const finalWidth = pendingWidthRef.current
    setPaneWidth(finalWidth as SidepaneWidth)

    if (guideLineRef.current !== null) {
      guideLineRef.current.remove()
      guideLineRef.current = null
    }

    document.body.style.cursor = ''
  }, [handleMouseMove, setPaneWidth, isResizingRef])

  const handleMouseDown = (e: ReactMouseEvent): void => {
    if (pane.openState === 'closed') return

    draggingRef.current = true
    setIsDragging(true)
    isResizingRef.current = true
    startXRef.current = e.clientX
    startWidthRef.current = getSidepaneWidthInPx(pane)

    // Create visual guide line
    const guideLine = document.createElement('div')
    guideLine.style.position = 'fixed'
    guideLine.style.top = '0'
    guideLine.style.bottom = '0'
    guideLine.style.width = '1px'
    guideLine.style.left = `${e.clientX}px`
    guideLine.style.backgroundColor = guideLineColor
    guideLine.style.zIndex = '99999'
    guideLine.style.pointerEvents = 'none'

    document.body.appendChild(guideLine)
    guideLineRef.current = guideLine

    document.body.style.cursor = 'col-resize'

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', stopDragging)

    e.preventDefault()
  }

  useEffect(() => {
    return () => {
      stopDragging()
    }
  }, [stopDragging])

  const cssVars = {
    '--resize-handle-width': `${RESIZE_HANDLE_WIDTH_IN_PX}px`
  } as CSSProperties

  const renderProps: ResizeHandleRenderProps = {
    anchor,
    isDragging,
    onMouseDown: handleMouseDown
  }

  if (children) {
    return (
      <div
        data-sidepane-resize-handle
        data-anchor={anchor}
        data-dragging={isDragging || undefined}
        className={className}
        style={{ ...cssVars, ...style }}
      >
        {children(renderProps)}
      </div>
    )
  }

  // Default rendering
  return (
    <div
      data-sidepane-resize-handle
      data-anchor={anchor}
      data-dragging={isDragging || undefined}
      className={className}
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        top: 0,
        [anchor === 'left' ? 'right' : 'left']: 0,
        width: `${RESIZE_HANDLE_WIDTH_IN_PX}px`,
        height: '100%',
        cursor: 'col-resize',
        ...cssVars,
        ...style
      }}
    />
  )
}

export default SidepaneResizeHandle
