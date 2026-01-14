import { act, renderHook } from '@testing-library/react'
import { type FC, type ReactNode } from 'react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  computePanesToClose,
  SidepanesProvider,
  useSidepanes
} from '../../src/context/SidepanesContext'
import {
  CENTRAL_PANE_MAX_WIDTH_IN_PX,
  CENTRAL_PANE_MIN_WIDTH_IN_PX,
  DEFAULT_SIDE_PANE_WIDTH_IN_PX
} from '../../src/constants'
import { getSidepaneWidthInPx } from '../../src/utils/getSidepaneWidthInPx'
import * as getViewportWidthModule from '../../src/utils/getViewportWidth'

interface WrapperProps {
  children: ReactNode
}

const Wrapper: FC<WrapperProps> = ({ children }): JSX.Element => (
  <SidepanesProvider config={{ persistence: null }}>{children}</SidepanesProvider>
)

/**
 * Creates a wrapper with custom default pane configurations
 */
const createWrapper = (options?: {
  defaultLeftPane?: Partial<{ openState: string; width: number; closedStyle: 'hidden' | 'compact' }>
  defaultRightPane?: Partial<{ openState: string; width: number; closedStyle: 'hidden' | 'compact' }>
}): FC<WrapperProps> => {
  const CustomWrapper: FC<WrapperProps> = ({ children }): JSX.Element => (
    <SidepanesProvider
      config={{
        persistence: null,
        defaultLeftPane: options?.defaultLeftPane,
        defaultRightPane: options?.defaultRightPane
      }}
    >
      {children}
    </SidepanesProvider>
  )
  return CustomWrapper
}

/**
 * Helper function to mock the viewport width
 */
const mockViewportWidth = (width: number): void => {
  vi.spyOn(getViewportWidthModule, 'default').mockReturnValue(width)
  vi.spyOn(getViewportWidthModule, 'getViewportWidth').mockReturnValue(width)
}

/**
 * Tests for the SidepanesContext component.
 */
describe('SidepanesContext', () => {
  beforeEach(() => {
    // Mock viewport width with just enough space
    // for both panes and the central pane at its maximum width
    mockViewportWidth(DEFAULT_SIDE_PANE_WIDTH_IN_PX * 2 + CENTRAL_PANE_MAX_WIDTH_IN_PX)
    // Mock window resize event
    global.dispatchEvent(new Event('resize'))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSidepanes(), { wrapper: Wrapper })

    // Left pane is permanently open by default
    expect(result.current.leftPane).toEqual({
      openState: 'pinned',
      width: DEFAULT_SIDE_PANE_WIDTH_IN_PX,
      closedStyle: 'compact'
    })

    // Right pane is closed by default
    expect(result.current.rightPane).toEqual({
      openState: 'closed',
      width: DEFAULT_SIDE_PANE_WIDTH_IN_PX,
      closedStyle: 'hidden'
    })
  })

  it('should open and close left pane', () => {
    const { result } = renderHook(() => useSidepanes(), { wrapper: Wrapper })

    act(() => {
      result.current.closeLeftPane()
    })
    expect(result.current.leftPane.openState).toBe('closed')

    act(() => {
      result.current.openLeftPane()
    })
    expect(result.current.leftPane.openState).toBe('pinned')
  })

  it('should open and close right pane', () => {
    const { result } = renderHook(() => useSidepanes(), { wrapper: Wrapper })

    act(() => {
      result.current.openRightPane()
    })
    expect(result.current.rightPane.openState).toBe('pinned')

    act(() => {
      result.current.closeRightPane()
    })
    expect(result.current.rightPane.openState).toBe('closed')
  })

  it('should close both panes when window becomes too small', () => {
    const { result } = renderHook(() => useSidepanes(), { wrapper: Wrapper })

    // Open both panes
    act(() => {
      result.current.openLeftPane()
      result.current.openRightPane()
    })

    // Both panes are opened
    expect(result.current.leftPane.openState).toBe('pinned')
    expect(result.current.rightPane.openState).toBe('pinned')

    // Simulate shrinking the window
    act(() => {
      // Set viewport width to just the minimum for the central pane
      mockViewportWidth(CENTRAL_PANE_MIN_WIDTH_IN_PX)
      global.dispatchEvent(new Event('resize'))
    })

    // Both panes should be closed
    expect(result.current.leftPane.openState).toBe('closed')
    expect(result.current.rightPane.openState).toBe('closed')
  })

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error')
    consoleSpy.mockImplementation(() => {})

    expect(() => {
      renderHook(() => useSidepanes())
    }).toThrow('useSidepanes must be used within a SidepanesProvider')

    // Restore console.error
    consoleSpy.mockRestore()
  })

  it('should resize pane when changing its width', () => {
    const { result } = renderHook(() => useSidepanes(), { wrapper: Wrapper })

    const previousWidth = result.current.leftPane.width as number

    act(() => {
      result.current.setLeftPaneWidth(previousWidth + 10)
    })

    expect(getSidepaneWidthInPx(result.current.leftPane)).toBe(previousWidth + 10)
  })

  describe('with non-default closedStyle configuration', () => {
    it('should initialize left pane with closedStyle hidden when configured', () => {
      const wrapper = createWrapper({ defaultLeftPane: { closedStyle: 'hidden' } })
      const { result } = renderHook(() => useSidepanes(), { wrapper })

      expect(result.current.leftPane.closedStyle).toBe('hidden')
      // Right pane should still have default closedStyle
      expect(result.current.rightPane.closedStyle).toBe('hidden')
    })

    it('should initialize right pane with closedStyle compact when configured', () => {
      const wrapper = createWrapper({ defaultRightPane: { closedStyle: 'compact' } })
      const { result } = renderHook(() => useSidepanes(), { wrapper })

      // Left pane should still have default closedStyle
      expect(result.current.leftPane.closedStyle).toBe('compact')
      expect(result.current.rightPane.closedStyle).toBe('compact')
    })

    it('should initialize both panes with closedStyle hidden when configured', () => {
      const wrapper = createWrapper({
        defaultLeftPane: { closedStyle: 'hidden' },
        defaultRightPane: { closedStyle: 'hidden' }
      })
      const { result } = renderHook(() => useSidepanes(), { wrapper })

      expect(result.current.leftPane.closedStyle).toBe('hidden')
      expect(result.current.rightPane.closedStyle).toBe('hidden')
    })

    it('should initialize both panes with closedStyle compact when configured', () => {
      const wrapper = createWrapper({
        defaultLeftPane: { closedStyle: 'compact' },
        defaultRightPane: { closedStyle: 'compact' }
      })
      const { result } = renderHook(() => useSidepanes(), { wrapper })

      expect(result.current.leftPane.closedStyle).toBe('compact')
      expect(result.current.rightPane.closedStyle).toBe('compact')
    })
  })
})

describe('computePanesToClose', () => {
  describe('when there is enough space', () => {
    it('should not close any panes when enough space and left pane changed', () => {
      const result = computePanesToClose({
        enoughSpace: true,
        paneChanged: 'left',
        leftPaneOpen: true,
        rightPaneOpen: true
      })
      expect(result).toEqual({ closeLeft: false, closeRight: false })
    })

    it('should not close any panes when enough space and right pane changed', () => {
      const result = computePanesToClose({
        enoughSpace: true,
        paneChanged: 'right',
        leftPaneOpen: true,
        rightPaneOpen: true
      })
      expect(result).toEqual({ closeLeft: false, closeRight: false })
    })

    it('should not close any panes when enough space and no pane changed', () => {
      const result = computePanesToClose({
        enoughSpace: true,
        paneChanged: null,
        leftPaneOpen: true,
        rightPaneOpen: true
      })
      expect(result).toEqual({ closeLeft: false, closeRight: false })
    })
  })

  describe('when there is not enough space and left pane changed', () => {
    it('should close right pane if it is open', () => {
      const result = computePanesToClose({
        enoughSpace: false,
        paneChanged: 'left',
        leftPaneOpen: true,
        rightPaneOpen: true
      })
      expect(result).toEqual({ closeLeft: false, closeRight: true })
    })

    it('should not close right pane if it is already closed', () => {
      const result = computePanesToClose({
        enoughSpace: false,
        paneChanged: 'left',
        leftPaneOpen: true,
        rightPaneOpen: false
      })
      expect(result).toEqual({ closeLeft: false, closeRight: false })
    })

    it('should not close any pane when left pane just closed', () => {
      const result = computePanesToClose({
        enoughSpace: false,
        paneChanged: 'left',
        leftPaneOpen: false,
        rightPaneOpen: true
      })
      // Left pane just closed, freeing up space - don't close right pane
      expect(result).toEqual({ closeLeft: false, closeRight: false })
    })
  })

  describe('when there is not enough space and right pane changed', () => {
    it('should close left pane if it is open', () => {
      const result = computePanesToClose({
        enoughSpace: false,
        paneChanged: 'right',
        leftPaneOpen: true,
        rightPaneOpen: true
      })
      expect(result).toEqual({ closeLeft: true, closeRight: false })
    })

    it('should not close left pane if it is already closed', () => {
      const result = computePanesToClose({
        enoughSpace: false,
        paneChanged: 'right',
        leftPaneOpen: false,
        rightPaneOpen: true
      })
      expect(result).toEqual({ closeLeft: false, closeRight: false })
    })

    it('should not close any pane when right pane just closed', () => {
      const result = computePanesToClose({
        enoughSpace: false,
        paneChanged: 'right',
        leftPaneOpen: true,
        rightPaneOpen: false
      })
      // Right pane just closed, freeing up space - don't close left pane
      expect(result).toEqual({ closeLeft: false, closeRight: false })
    })
  })

  describe('when there is not enough space and no specific pane changed', () => {
    it('should close both panes if both are open', () => {
      const result = computePanesToClose({
        enoughSpace: false,
        paneChanged: null,
        leftPaneOpen: true,
        rightPaneOpen: true
      })
      expect(result).toEqual({ closeLeft: true, closeRight: true })
    })

    it('should close only left pane if only left is open', () => {
      const result = computePanesToClose({
        enoughSpace: false,
        paneChanged: null,
        leftPaneOpen: true,
        rightPaneOpen: false
      })
      expect(result).toEqual({ closeLeft: true, closeRight: false })
    })

    it('should close only right pane if only right is open', () => {
      const result = computePanesToClose({
        enoughSpace: false,
        paneChanged: null,
        leftPaneOpen: false,
        rightPaneOpen: true
      })
      expect(result).toEqual({ closeLeft: false, closeRight: true })
    })

    it('should not close any panes if both are already closed', () => {
      const result = computePanesToClose({
        enoughSpace: false,
        paneChanged: null,
        leftPaneOpen: false,
        rightPaneOpen: false
      })
      expect(result).toEqual({ closeLeft: false, closeRight: false })
    })
  })
})
