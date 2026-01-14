import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type MutableRefObject,
  type ReactNode,
  type RefObject
} from 'react'
import type {
  CanPinResult,
  PersistenceAdapter,
  SidepanesConfig,
  SidepaneState,
  SidepaneWidth
} from '../types'
import {
  CENTRAL_PANE_MAX_WIDTH_IN_PX,
  CENTRAL_PANE_MIN_WIDTH_IN_PX,
  COMPACT_SIDE_PANE_WIDTH_IN_PX,
  DEFAULT_SIDE_PANE_WIDTH_IN_PX,
  MIN_SIDE_PANE_WIDTH_IN_PX
} from '../constants'
import { getViewportWidth } from '../utils/getViewportWidth'
import { getSidepaneWidthInPx } from '../utils/getSidepaneWidthInPx'
import { useContainerDimensions } from '../utils/useContainerDimensions'
import { localStorageAdapter } from '../utils/persistence'

const LEFT_PANE_STATE_KEY = 'leftPaneOpenState'
const RIGHT_PANE_STATE_KEY = 'rightPaneOpenState'

/**
 * Compute the offset from each side pane, e.g., how much space do each pane take from the central pane.
 * If the pane is temporary opened (overlay), the offset will be 0 as it does not take space
 * from the central pane.
 */
const computeOffset = (pane: SidepaneState, compactWidth: number): number => {
  if (pane.openState === 'pinned') {
    return getSidepaneWidthInPx(pane)
  }
  // If the pane is compact, it will always take the compact width regardless of the open state
  if (pane.closedStyle === 'compact') {
    return compactWidth
  }
  return 0
}

/**
 * Compute the width of the central pane such that it will fit in the available space,
 * that is what is left after subtracting the width of the left and right panes from the window width.
 */
const computeCentralPaneWidth = (
  leftOffset: number,
  rightOffset: number,
  minWidth: number,
  maxWidth: number
): number => {
  const viewportWidth = getViewportWidth()
  return Math.max(minWidth, Math.min(maxWidth, viewportWidth - leftOffset - rightOffset))
}

/**
 * Determines which panes should be closed when there is not enough space.
 */
export const computePanesToClose = (params: {
  enoughSpace: boolean
  paneChanged: 'left' | 'right' | null
  leftPaneOpen: boolean
  rightPaneOpen: boolean
}): { closeLeft: boolean; closeRight: boolean } => {
  const { enoughSpace, paneChanged, leftPaneOpen, rightPaneOpen } = params

  // If there's enough space, don't close anything
  if (enoughSpace) {
    return { closeLeft: false, closeRight: false }
  }

  // Not enough space - determine what to close based on which pane changed
  if (paneChanged === 'left' && leftPaneOpen) {
    // Left pane was just OPENED - close right pane to make room
    return { closeLeft: false, closeRight: rightPaneOpen }
  }

  if (paneChanged === 'right' && rightPaneOpen) {
    // Right pane was just OPENED - close left pane to make room
    return { closeLeft: leftPaneOpen, closeRight: false }
  }

  // If a pane just CLOSED (paneChanged is set but that pane is not open),
  // don't close the other pane - the closed pane freed up space
  if (paneChanged === 'left' && !leftPaneOpen) {
    return { closeLeft: false, closeRight: false }
  }

  if (paneChanged === 'right' && !rightPaneOpen) {
    return { closeLeft: false, closeRight: false }
  }

  // No specific pane changed (e.g., window resize) - close both if they're open
  return { closeLeft: leftPaneOpen, closeRight: rightPaneOpen }
}

/**
 * Compute the available space for a side pane when pinning it.
 */
const computeAvailableSpaceForPane = (
  side: 'left' | 'right',
  leftPane: SidepaneState,
  rightPane: SidepaneState,
  compactWidth: number,
  centralPaneMinWidth: number
): number => {
  const viewportWidth = getViewportWidth()
  const oppositePane = side === 'left' ? rightPane : leftPane
  const oppositeOffset = computeOffset(oppositePane, compactWidth)
  return viewportWidth - centralPaneMinWidth - oppositeOffset
}

/**
 * Compute the available space for a side pane if the opposite pane were closed.
 */
const computeAvailableSpaceIfClosingOpposite = (
  side: 'left' | 'right',
  leftPane: SidepaneState,
  rightPane: SidepaneState,
  compactWidth: number,
  centralPaneMinWidth: number
): number => {
  const viewportWidth = getViewportWidth()
  const oppositePane = side === 'left' ? rightPane : leftPane
  const oppositeOffsetIfClosed = oppositePane.closedStyle === 'compact' ? compactWidth : 0
  return viewportWidth - centralPaneMinWidth - oppositeOffsetIfClosed
}

export interface SidepanesContextValue {
  leftPane: SidepaneState
  rightPane: SidepaneState
  centralPane: { width: number; height: number }
  centralPaneRef: RefObject<HTMLElement | null>
  config: Required<Omit<SidepanesConfig, 'persistence'>> & { persistence: PersistenceAdapter | null }
  openRightPane: () => void
  openLeftPane: () => void
  openRightPaneTemporary: () => void
  openLeftPaneTemporary: () => void
  closeRightPane: () => void
  closeLeftPane: () => void
  setLeftPaneWidth: (width: SidepaneWidth) => void
  setRightPaneWidth: (width: SidepaneWidth) => void
  /** Check if a pane can be pinned (has enough space for minimum width) */
  canPinPane: (side: 'left' | 'right') => CanPinResult
  /** Refs for pending close timeouts - allows components to coordinate close cancellation */
  leftPaneCloseTimeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>
  rightPaneCloseTimeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>
  /** Ref to track if any pane is currently being resized (synchronous, avoids race conditions) */
  isResizingRef: MutableRefObject<boolean>
}

export const SidepanesContext = createContext<SidepanesContextValue | undefined>(undefined)

export const defaultLeftPaneState: SidepaneState = {
  openState: 'pinned',
  width: DEFAULT_SIDE_PANE_WIDTH_IN_PX,
  closedStyle: 'compact'
}

export const defaultRightPaneState: SidepaneState = {
  openState: 'closed',
  width: DEFAULT_SIDE_PANE_WIDTH_IN_PX,
  closedStyle: 'hidden'
}

const defaultConfig: Required<Omit<SidepanesConfig, 'persistence'>> & {
  persistence: PersistenceAdapter | null
} = {
  defaultWidth: DEFAULT_SIDE_PANE_WIDTH_IN_PX,
  minWidth: MIN_SIDE_PANE_WIDTH_IN_PX,
  centralPaneMinWidth: CENTRAL_PANE_MIN_WIDTH_IN_PX,
  centralPaneMaxWidth: CENTRAL_PANE_MAX_WIDTH_IN_PX,
  compactWidth: COMPACT_SIDE_PANE_WIDTH_IN_PX,
  animationDuration: 200,
  persistence: localStorageAdapter,
  defaultLeftPane: defaultLeftPaneState,
  defaultRightPane: defaultRightPaneState
}

interface Props {
  children: ReactNode
  config?: SidepanesConfig
}

/**
 * Provides a context for managing both left and right side panes and the central pane.
 */
export const SidepanesProvider: FC<Props> = ({
  children,
  config: userConfig
}): JSX.Element => {
  // Merge user config with defaults
  const config = useMemo(
    () => ({
      ...defaultConfig,
      ...userConfig,
      persistence: userConfig?.persistence === null ? null : (userConfig?.persistence ?? defaultConfig.persistence)
    }),
    [userConfig]
  )

  // Extract pane defaults from config
  const defaultLeftPane = userConfig?.defaultLeftPane
  const defaultRightPane = userConfig?.defaultRightPane

  // Initialize the left pane state from persistence (if any)
  const savedOpenState = config.persistence?.get(LEFT_PANE_STATE_KEY)
  const savedRightOpenState = config.persistence?.get(RIGHT_PANE_STATE_KEY)

  const initialLeftPaneState: SidepaneState = {
    ...defaultLeftPaneState,
    ...defaultLeftPane,
    // Persist only the meaningful states: 'closed' or 'pinned'.
    openState:
      savedOpenState === 'closed' || savedOpenState === 'pinned'
        ? savedOpenState
        : (defaultLeftPane?.openState ?? defaultLeftPaneState.openState)
  }

  const [leftPane, setLeftPane] = useState<SidepaneState>(initialLeftPaneState)

  const initialRightPaneState: SidepaneState = {
    ...defaultRightPaneState,
    ...defaultRightPane,
    openState:
      savedRightOpenState === 'closed' || savedRightOpenState === 'pinned'
        ? savedRightOpenState
        : (defaultRightPane?.openState ?? defaultRightPaneState.openState)
  }

  const [rightPane, setRightPane] = useState<SidepaneState>(initialRightPaneState)

  const centralPaneRef = useRef<HTMLElement>(null)
  const centralPane = useContainerDimensions(centralPaneRef)

  // Shared refs for pending close timeouts - allows components to coordinate close cancellation
  const leftPaneCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rightPaneCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Track when any pane is being resized - using a ref for synchronous updates
  // This avoids race conditions where mouseLeave triggers before React state updates
  const isResizingRef = useRef<boolean>(false)

  /**
   * Updates the state of the sidepanes and central pane.
   */
  const updateState = useCallback(
    (paneChanged: 'left' | 'right' | null): void => {
      // Compute the offset from each side pane
      const leftOffset = computeOffset(leftPane, config.compactWidth)
      const rightOffset = computeOffset(rightPane, config.compactWidth)

      // Compute the width of the central panel
      const newCentralPaneWidth = computeCentralPaneWidth(
        leftOffset,
        rightOffset,
        config.centralPaneMinWidth,
        config.centralPaneMaxWidth
      )

      // Is there enough space to view everything?
      const viewportWidth = getViewportWidth()
      const enoughSpace = leftOffset + rightOffset + newCentralPaneWidth <= viewportWidth

      // Determine which panes should be closed based on available space
      const { closeLeft, closeRight } = computePanesToClose({
        enoughSpace,
        paneChanged,
        leftPaneOpen: leftPane.openState === 'pinned',
        rightPaneOpen: rightPane.openState === 'pinned'
      })

      // Apply the state changes
      if (closeLeft) {
        setLeftPane((prev) => ({ ...prev, openState: 'closed' }))
      }
      if (closeRight) {
        setRightPane((prev) => ({ ...prev, openState: 'closed' }))
      }
    },
    [leftPane, rightPane, config]
  )

  // Set the initial state and add a listener for future changes in window size.
  useEffect(() => {
    const handleResize = (): void => {
      updateState(null)
    }

    updateState(null)
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [updateState])

  // Trigger a complete update when the panes change
  useEffect(() => {
    updateState('left')
  }, [leftPane, updateState])

  useEffect(() => {
    updateState('right')
  }, [rightPane, updateState])

  const openRightPane = useCallback((): void => {
    const availableSpace = computeAvailableSpaceForPane(
      'right',
      leftPane,
      rightPane,
      config.compactWidth,
      config.centralPaneMinWidth
    )

    // Check if we need to auto-close the left pane to make room
    let effectiveLeftPaneState = leftPane
    if (availableSpace < config.minWidth && leftPane.openState === 'pinned') {
      const availableIfClosing = computeAvailableSpaceIfClosingOpposite(
        'right',
        leftPane,
        rightPane,
        config.compactWidth,
        config.centralPaneMinWidth
      )
      if (availableIfClosing >= config.minWidth) {
        setLeftPane((prev) => ({ ...prev, openState: 'closed' }))
        effectiveLeftPaneState = { ...leftPane, openState: 'closed' }
      }
    }

    setRightPane((prev) => {
      const newAvailableSpace = computeAvailableSpaceForPane(
        'right',
        effectiveLeftPaneState,
        prev,
        config.compactWidth,
        config.centralPaneMinWidth
      )
      const currentWidth = getSidepaneWidthInPx(prev)

      if (currentWidth <= newAvailableSpace) {
        if (prev.openState === 'pinned') {
          return prev
        }
        return { ...prev, openState: 'pinned' }
      }

      if (newAvailableSpace < config.minWidth) {
        return prev
      }

      if (prev.openState === 'pinned' && prev.width === newAvailableSpace) {
        return prev
      }
      return { ...prev, openState: 'pinned', width: newAvailableSpace }
    })
  }, [leftPane, rightPane, config])

  const openLeftPane = useCallback((): void => {
    const availableSpace = computeAvailableSpaceForPane(
      'left',
      leftPane,
      rightPane,
      config.compactWidth,
      config.centralPaneMinWidth
    )

    let effectiveRightPaneState = rightPane
    if (availableSpace < config.minWidth && rightPane.openState === 'pinned') {
      const availableIfClosing = computeAvailableSpaceIfClosingOpposite(
        'left',
        leftPane,
        rightPane,
        config.compactWidth,
        config.centralPaneMinWidth
      )
      if (availableIfClosing >= config.minWidth) {
        setRightPane((prev) => ({ ...prev, openState: 'closed' }))
        effectiveRightPaneState = { ...rightPane, openState: 'closed' }
      }
    }

    setLeftPane((prev) => {
      const newAvailableSpace = computeAvailableSpaceForPane(
        'left',
        prev,
        effectiveRightPaneState,
        config.compactWidth,
        config.centralPaneMinWidth
      )
      const currentWidth = getSidepaneWidthInPx(prev)

      if (currentWidth <= newAvailableSpace) {
        if (prev.openState === 'pinned') {
          return prev
        }
        return { ...prev, openState: 'pinned' }
      }

      if (newAvailableSpace < config.minWidth) {
        return prev
      }

      if (prev.openState === 'pinned' && prev.width === newAvailableSpace) {
        return prev
      }
      return { ...prev, openState: 'pinned', width: newAvailableSpace }
    })
  }, [leftPane, rightPane, config])

  const openRightPaneTemporary = useCallback((): void => {
    setRightPane((prev) => ({ ...prev, openState: 'hovered' }))
  }, [])

  const openLeftPaneTemporary = useCallback((): void => {
    setLeftPane((prev) => ({ ...prev, openState: 'hovered' }))
  }, [])

  const closeRightPane = useCallback((): void => {
    setRightPane((prev) => ({ ...prev, openState: 'closed' }))
  }, [])

  const closeLeftPane = useCallback((): void => {
    setLeftPane((prev) => ({ ...prev, openState: 'closed' }))
  }, [])

  const setLeftPaneWidth = useCallback((width: SidepaneWidth): void => {
    setLeftPane((prev) => ({ ...prev, width }))
  }, [])

  const setRightPaneWidth = useCallback((width: SidepaneWidth): void => {
    setRightPane((prev) => ({ ...prev, width }))
  }, [])

  const canPinPane = useCallback(
    (side: 'left' | 'right'): CanPinResult => {
      const availableSpace = computeAvailableSpaceForPane(
        side,
        leftPane,
        rightPane,
        config.compactWidth,
        config.centralPaneMinWidth
      )

      if (availableSpace >= config.minWidth) {
        return { canPin: true, requiresClosingOpposite: false }
      }

      const availableIfClosing = computeAvailableSpaceIfClosingOpposite(
        side,
        leftPane,
        rightPane,
        config.compactWidth,
        config.centralPaneMinWidth
      )
      if (availableIfClosing >= config.minWidth) {
        return { canPin: true, requiresClosingOpposite: true }
      }

      return { canPin: false, requiresClosingOpposite: false }
    },
    [leftPane, rightPane, config]
  )

  // Persist the openState of the left pane whenever it changes
  useEffect(() => {
    if (config.persistence && (leftPane.openState === 'closed' || leftPane.openState === 'pinned')) {
      config.persistence.set(LEFT_PANE_STATE_KEY, leftPane.openState)
    }
  }, [leftPane.openState, config.persistence])

  // Persist the openState of the right pane whenever it changes
  useEffect(() => {
    if (config.persistence && (rightPane.openState === 'closed' || rightPane.openState === 'pinned')) {
      config.persistence.set(RIGHT_PANE_STATE_KEY, rightPane.openState)
    }
  }, [rightPane.openState, config.persistence])

  const contextValue = useMemo(
    () => ({
      leftPane,
      rightPane,
      centralPane,
      centralPaneRef,
      config,
      openRightPane,
      openLeftPane,
      openRightPaneTemporary,
      openLeftPaneTemporary,
      closeRightPane,
      closeLeftPane,
      setLeftPaneWidth,
      setRightPaneWidth,
      canPinPane,
      leftPaneCloseTimeoutRef,
      rightPaneCloseTimeoutRef,
      isResizingRef
    }),
    [
      leftPane,
      rightPane,
      centralPane,
      config,
      openRightPane,
      openLeftPane,
      openRightPaneTemporary,
      openLeftPaneTemporary,
      closeRightPane,
      closeLeftPane,
      setLeftPaneWidth,
      setRightPaneWidth,
      canPinPane
    ]
  )

  return <SidepanesContext.Provider value={contextValue}>{children}</SidepanesContext.Provider>
}

export const useSidepanes = (): SidepanesContextValue => {
  const context = useContext(SidepanesContext)
  if (context === undefined) {
    throw new Error('useSidepanes must be used within a SidepanesProvider')
  }
  return context
}

export default useSidepanes
