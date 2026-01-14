import { useState, useEffect, useCallback, type RefObject } from 'react'

/**
 * Hook to track the dimensions of a container element.
 * Uses ResizeObserver for efficient updates.
 */
export const useContainerDimensions = (
  myRef: RefObject<HTMLElement | null>
): { width: number; height: number } => {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  const getDimensions = useCallback((): { width: number; height: number } => {
    const width = myRef.current?.offsetWidth ?? 0
    const height = myRef.current?.offsetHeight ?? 0
    return { width, height }
  }, [myRef])

  useEffect(() => {
    const handleResize = (): void => {
      setDimensions(getDimensions())
    }

    let resizeObserver: ResizeObserver | null = null
    let animationFrameId: number | null = null

    const observeElement = (): void => {
      const element = myRef.current
      if (element === null) return

      // Set initial dimensions
      setDimensions(getDimensions())

      // Create ResizeObserver to monitor element size changes
      if (typeof ResizeObserver !== 'undefined') {
        resizeObserver = new ResizeObserver(() => {
          // Use requestAnimationFrame to debounce resize events
          if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId)
          }
          animationFrameId = requestAnimationFrame(() => {
            handleResize()
          })
        })
        resizeObserver.observe(element)
      }
    }

    // Try to observe immediately
    observeElement()

    // If element doesn't exist yet, poll with exponential backoff
    let timeoutId: ReturnType<typeof setTimeout> | null = null
    if (myRef.current === null) {
      let delay = 10 // Start with 10ms
      const maxDelay = 500 // Cap at 500ms

      const pollForElement = (): void => {
        if (myRef.current !== null) {
          observeElement()
          timeoutId = null
        } else {
          // Schedule next check with exponential backoff
          delay = Math.min(delay * 2, maxDelay)
          timeoutId = setTimeout(pollForElement, delay)
        }
      }

      // Start polling
      timeoutId = setTimeout(pollForElement, delay)
    }

    // Also listen to window resize events as a fallback
    window.addEventListener('resize', handleResize)

    return () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId)
      }
      if (resizeObserver !== null) {
        resizeObserver.disconnect()
      }
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
      }
      window.removeEventListener('resize', handleResize)
    }
  }, [myRef, getDimensions])

  return dimensions
}

export default useContainerDimensions
