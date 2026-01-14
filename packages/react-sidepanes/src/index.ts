// Types
export type {
  SidepaneWidth,
  SidepaneOpenState,
  SidepaneAnchor,
  ClosedStyle,
  SidepaneState,
  CentralPaneState,
  PersistenceAdapter,
  CanPinResult,
  SidepanesConfig,
  SidepaneRenderProps,
  ToggleRenderProps,
  EdgeSensorRenderProps,
  ResizeHandleRenderProps
} from './types'

// Constants
export {
  DEFAULT_SIDE_PANE_WIDTH_IN_PX,
  CENTRAL_PANE_MAX_WIDTH_IN_PX,
  CENTRAL_PANE_MIN_WIDTH_IN_PX,
  MIN_SIDE_PANE_WIDTH_IN_PX,
  COMPACT_SIDE_PANE_WIDTH_IN_PX,
  SIDE_PANE_OPEN_ANIMATION_DURATION_MS,
  RESIZE_HANDLE_WIDTH_IN_PX,
  EDGE_SENSOR_MAX_WIDTH_IN_PX,
  EDGE_SENSOR_MIN_WIDTH_IN_PX,
  REOPEN_COOLDOWN_MS,
  EDGE_SENSOR_TRIGGER_PADDING_IN_PX,
  SIDEPANE_Z_INDEX,
  EDGE_SENSOR_Z_INDEX,
  TOGGLE_BUTTON_Z_INDEX
} from './constants'

// Context and hooks
export {
  SidepanesContext,
  SidepanesProvider,
  useSidepanes,
  defaultLeftPaneState,
  defaultRightPaneState,
  computePanesToClose,
  type SidepanesContextValue
} from './context/SidepanesContext'

// Components
export { Sidepane } from './components/Sidepane'
export { SidepaneToggle } from './components/SidepaneToggle'
export { SidepaneResizeHandle } from './components/SidepaneResizeHandle'
export { CentralPane } from './components/CentralPane'
export { EdgeHoverSensor } from './components/EdgeHoverSensor'

// Utilities
export { getViewportWidth } from './utils/getViewportWidth'
export { useContainerDimensions } from './utils/useContainerDimensions'
export { getSidepaneWidthInPx } from './utils/getSidepaneWidthInPx'
export { localStorageAdapter, cookieAdapter, noopAdapter } from './utils/persistence'
