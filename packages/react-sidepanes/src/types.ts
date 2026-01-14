/**
 * The width of the side pane, in pixels, or a fraction of the screen width.
 */
export type SidepaneWidth = number | 'one-third' | 'half' | 'two-thirds'

/**
 * The open state of the side pane:
 * - closed: the side pane is closed
 * - hovered: the side pane is temporarily opened, for as long as the user hovers over it
 * - pinned: the side pane is permanently opened (until the user clicks the toggle button)
 */
export type SidepaneOpenState = 'closed' | 'hovered' | 'pinned'

/**
 * The anchor position of the side pane.
 */
export type SidepaneAnchor = 'left' | 'right'

/**
 * How the pane looks when closed.
 */
export type ClosedStyle = 'hidden' | 'compact'

/**
 * The state of a side pane.
 */
export interface SidepaneState {
  /** Current open state of the pane: closed, hovered (temporary) or pinned (locked open) */
  openState: SidepaneOpenState
  /** Width of the side pane */
  width: SidepaneWidth
  /** Behaviour when the pane is closed: fully hidden or compact (visible slim) */
  closedStyle: ClosedStyle
}

/**
 * The state of the central pane.
 */
export interface CentralPaneState {
  offset: number
  width: number
}

/**
 * Persistence adapter interface for storing pane state.
 * Implement this interface to persist pane state across page reloads.
 */
export interface PersistenceAdapter {
  /**
   * Get a value from storage.
   * @param key - The key to retrieve
   * @returns The stored value, or null if not found
   */
  get: (key: string) => string | null
  /**
   * Set a value in storage.
   * @param key - The key to store
   * @param value - The value to store
   */
  set: (key: string, value: string) => void
}

/**
 * Result of checking if a pane can be pinned.
 */
export interface CanPinResult {
  /** Whether the pane can be pinned (possibly after closing the opposite pane) */
  canPin: boolean
  /** Whether pinning requires auto-closing the opposite pane first */
  requiresClosingOpposite: boolean
}

/**
 * Configuration for the sidepanes system.
 */
export interface SidepanesConfig {
  /** Default width of sidepanes in pixels. Default: 320 */
  defaultWidth?: number
  /** Minimum width of sidepanes in pixels. Default: 200 */
  minWidth?: number
  /** Minimum width of central pane in pixels. Default: 400 */
  centralPaneMinWidth?: number
  /** Maximum width of central pane in pixels. Default: 800 */
  centralPaneMaxWidth?: number
  /** Width of compact (closed) sidepane in pixels. Default: 40 */
  compactWidth?: number
  /** Animation duration in milliseconds. Default: 200 */
  animationDuration?: number
  /** Persistence adapter for saving pane state. Set to null to disable persistence. */
  persistence?: PersistenceAdapter | null
  /** Initial state for left pane. Default: { openState: 'pinned', width: 320, closedStyle: 'compact' } */
  defaultLeftPane?: Partial<SidepaneState>
  /** Initial state for right pane. Default: { openState: 'closed', width: 320, closedStyle: 'hidden' } */
  defaultRightPane?: Partial<SidepaneState>
}

// ============================================================================
// Render Props Types
// ============================================================================

/**
 * Props passed to Sidepane render functions.
 */
export interface SidepaneRenderProps {
  /** Whether the pane is currently open (pinned or hovered) */
  isOpen: boolean
  /** Whether the pane is temporarily open (hovered state) */
  isTemporary: boolean
  /** Whether the pane is permanently pinned open */
  isPinned: boolean
  /** Whether the pane is in compact mode (closed but visible) */
  isCompact: boolean
  /** Whether the pane is resizable */
  isResizable: boolean
  /** Current width of the pane in pixels */
  width: number
  /** Which side the pane is anchored to */
  anchor: SidepaneAnchor
  /** Open the pane (pin it) */
  open: () => void
  /** Close the pane */
  close: () => void
  /** Toggle the pane open/closed */
  toggle: () => void
}

/**
 * Props passed to SidepaneToggle render functions.
 */
export interface ToggleRenderProps {
  /** Whether the pane is currently open */
  isOpen: boolean
  /** Whether the pane is temporarily open (hovered state) */
  isTemporary: boolean
  /** Whether the pin action is disabled (not enough space) */
  isPinDisabled: boolean
  /** Whether the pane can be pinned */
  canPin: boolean
  /** Which side the pane is anchored to */
  anchor: SidepaneAnchor
  /** Click handler for the toggle button */
  onClick: () => void
  /** Mouse enter handler (for hover-to-open behavior) */
  onMouseEnter: () => void
  /** Accessible label for the current state */
  ariaLabel: string
}

/**
 * Props passed to EdgeHoverSensor render functions.
 */
export interface EdgeSensorRenderProps {
  /** Which side the sensor is on */
  anchor: SidepaneAnchor
  /** Whether the sensor is currently active (pane is closed) */
  isActive: boolean
  /** Current width of the sensor in pixels */
  width: number
}

/**
 * Props passed to SidepaneResizeHandle render functions.
 */
export interface ResizeHandleRenderProps {
  /** Which side the pane is anchored to */
  anchor: SidepaneAnchor
  /** Whether currently dragging */
  isDragging: boolean
  /** Mouse down handler to start resize */
  onMouseDown: (e: React.MouseEvent) => void
}
