import { expect } from '@playwright/test'
import { createBdd } from 'playwright-bdd'

const { Given, When, Then } = createBdd()

// Selectors using data attributes
const SELECTORS = {
  leftPane: '[data-sidepane][data-anchor="left"]',
  rightPane: '[data-sidepane][data-anchor="right"]',
  leftToggle: '[data-sidepane-toggle][data-anchor="left"]',
  rightToggle: '[data-sidepane-toggle][data-anchor="right"]',
  leftEdgeSensor: '[data-edge-hover-sensor][data-anchor="left"]',
  rightEdgeSensor: '[data-edge-hover-sensor][data-anchor="right"]',
  leftResizeHandle: '[data-sidepane-resize-handle][data-anchor="left"]',
  rightResizeHandle: '[data-sidepane-resize-handle][data-anchor="right"]',
  centralPane: '[data-central-pane]'
}

// Constants matching the library
const DEFAULT_SIDE_PANE_WIDTH = 320
const MIN_SIDE_PANE_WIDTH = 200
const COMPACT_SIDE_PANE_WIDTH = 40

Given('I am on the demo page', async ({ page }) => {
  // Clear localStorage to ensure clean state between tests
  await page.goto('/')
  await page.evaluate(() => {
    localStorage.clear()
  })
  // Reload to apply clean state
  await page.reload()
  await page.waitForSelector(SELECTORS.centralPane)
})

Given('the viewport is {int} pixels wide', async ({ page }, width: number) => {
  await page.setViewportSize({ width, height: 800 })
})

Given('the left pane is pinned', async ({ page }) => {
  const leftPane = page.locator(SELECTORS.leftPane)
  const expanded = await leftPane.getAttribute('data-expanded')
  if (expanded !== 'true') {
    await page.click(`${SELECTORS.leftToggle} button`)
    await expect(leftPane).toHaveAttribute('data-expanded', 'true')
  }
})

Given('the left pane is closed', async ({ page }) => {
  const leftPane = page.locator(SELECTORS.leftPane)
  if (await leftPane.count() > 0) {
    const expanded = await leftPane.getAttribute('data-expanded')
    if (expanded === 'true') {
      await page.click(`${SELECTORS.leftToggle} button`)
      await page.waitForTimeout(300)
      // Verify pane is now closed
      await expect(leftPane).toHaveAttribute('data-expanded', 'false')
    }
  }
})

Given('the right pane is closed', async ({ page }) => {
  const rightPane = page.locator(SELECTORS.rightPane)
  if (await rightPane.count() > 0) {
    await page.click(`${SELECTORS.rightToggle} button`)
    await page.waitForTimeout(300)
  }
})

Given('the right pane is pinned', async ({ page }) => {
  const rightPane = page.locator(SELECTORS.rightPane)
  if (await rightPane.count() === 0 || await rightPane.getAttribute('data-expanded') !== 'true') {
    // Open the right pane by hovering then clicking
    const sensor = page.locator(SELECTORS.rightEdgeSensor)
    const box = await sensor.boundingBox()
    if (box) {
      // Move mouse to the trigger zone (right part of the sensor)
      await page.mouse.move(box.x + box.width - 10, box.y + box.height / 2)
      await page.waitForTimeout(600)
    }
    await page.click(`${SELECTORS.rightToggle} button`)
    await expect(rightPane).toHaveAttribute('data-expanded', 'true')
  }
})

// Note: the purpose of this step is to make the configuration of the sidepanes explicit
// when reading the test scenarios. This should pass as long as the default configuration
// stays the same.
Given(/^the (left|right) pane is in (compact|hidden) closed style$/, async ({ page }, side: 'left' | 'right', style: 'compact' | 'hidden') => {
  const paneSelector = side === 'left' ? SELECTORS.leftPane : SELECTORS.rightPane
  const pane = page.locator(paneSelector)

  // data-closed-style is always present on the pane, reflecting the closedStyle prop
  // For hidden style when closed, the pane may not be in DOM, so we need to handle that case
  const count = await pane.count()
  if (count > 0) {
    await expect(pane).toHaveAttribute('data-closed-style', style)
  } else if (style === 'hidden') {
    // Pane not in DOM is expected for hidden closed style when closed
    expect(count).toBe(0)
  } else {
    throw new Error(`Expected pane to be in DOM for ${style} closed style, but it was not found`)
  }
})

When('I hover over the right edge sensor area', async ({ page }) => {
  const sensor = page.locator(SELECTORS.rightEdgeSensor)
  const box = await sensor.boundingBox()
  if (box) {
    // Hover in the trigger zone (past the dead zone)
    await page.mouse.move(box.x + box.width - 10, box.y + box.height / 2)
    await page.waitForTimeout(600)
  }
})

When('I hover over the center of the content area', async ({ page }) => {
  const central = page.locator(SELECTORS.centralPane)
  const box = await central.boundingBox()
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(100)
  }
})

When('I click to pin the right pane', async ({ page }) => {
  const rightPane = page.locator(SELECTORS.rightPane)
  const toggleButton = page.locator(`${SELECTORS.rightToggle} button`)

  // Check if pane is already visible (in hover mode)
  const paneCount = await rightPane.count()
  const isOpen = paneCount > 0 && (await rightPane.getAttribute('data-expanded')) === 'true'

  if (isOpen) {
    // Pane is in hover mode - move mouse to toggle button and click
    // We need to move to the toggle button first to ensure hover state is maintained
    const toggleBox = await toggleButton.boundingBox()
    if (toggleBox) {
      await page.mouse.move(toggleBox.x + toggleBox.width / 2, toggleBox.y + toggleBox.height / 2)
      // Wait for mouse move to be processed and hover state to stabilize
      await page.waitForTimeout(100)
    }
    // Use native click to ensure proper event handling across browsers
    await toggleButton.click({ force: true })
  } else {
    // Pane is closed - use evaluate to click via JS to avoid hover events
    // This simulates a direct click that pins without triggering hover-to-open first
    await toggleButton.evaluate((el) => (el as HTMLButtonElement).click())
  }
  // Wait for state transition to complete
  await page.waitForTimeout(300)
})

When('I click the right pane toggle button', async ({ page }) => {
  await page.click(`${SELECTORS.rightToggle} button`)
  await page.waitForTimeout(300)
})

When('I click the left pane toggle button', async ({ page }) => {
  await page.click(`${SELECTORS.leftToggle} button`)
  await page.waitForTimeout(300)
})

When('I move the mouse to the center of the content area', async ({ page }) => {
  const central = page.locator(SELECTORS.centralPane)
  const box = await central.boundingBox()
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  }
})

Then('the right pane should be visible', async ({ page }) => {
  const rightPane = page.locator(SELECTORS.rightPane)
  await expect(rightPane).toBeVisible()
})

Then('the right pane should be visible in hover mode', async ({ page }) => {
  const rightPane = page.locator(SELECTORS.rightPane)
  await expect(rightPane).toBeVisible()
  await expect(rightPane).toHaveAttribute('data-temporary', 'true')
})

Then('the right pane should still be visible in hover mode', async ({ page }) => {
  const rightPane = page.locator(SELECTORS.rightPane)
  await expect(rightPane).toBeVisible()
  await expect(rightPane).toHaveAttribute('data-temporary', 'true')
})

Then('the right pane should be pinned', async ({ page }) => {
  const rightPane = page.locator(SELECTORS.rightPane)
  await expect(rightPane).toBeVisible()
  await expect(rightPane).toHaveAttribute('data-expanded', 'true')
  await expect(rightPane).not.toHaveAttribute('data-temporary')
})

Then('the right pane should remain closed', async ({ page }) => {
  const rightPane = page.locator(SELECTORS.rightPane)
  const count = await rightPane.count()
  if (count > 0) {
    await expect(rightPane).toHaveAttribute('data-expanded', 'false')
  }
})

Then('the right pane should be closed', async ({ page }) => {
  const rightPane = page.locator(SELECTORS.rightPane)
  const count = await rightPane.count()
  expect(count).toBe(0)
})

Then('the right pane should close after debounce period', async ({ page }) => {
  // Wait for the debounce period + animation duration
  // The pane has a 100ms leave timeout in Sidepane + animation duration (200ms by default)
  // Plus additional buffer for browser event processing differences
  await page.waitForTimeout(500)
  const rightPane = page.locator(SELECTORS.rightPane)
  // Use waitForSelector with state: 'detached' for more reliable cross-browser behavior
  await rightPane.waitFor({ state: 'detached', timeout: 2000 }).catch(() => {
    // If still attached, check if it's at least not visible
  })
  const count = await rightPane.count()
  expect(count).toBe(0)
})

Then('the left pane should be closed', async ({ page }) => {
  const leftPane = page.locator(SELECTORS.leftPane)
  await expect(leftPane).toHaveAttribute('data-expanded', 'false')
  await expect(leftPane).toHaveAttribute('data-closed-style', 'compact')
})

Then('the left pane should be pinned', async ({ page }) => {
  const leftPane = page.locator(SELECTORS.leftPane)
  await expect(leftPane).toHaveAttribute('data-expanded', 'true')
})

Then('the left pane should remain pinned', async ({ page }) => {
  const leftPane = page.locator(SELECTORS.leftPane)
  await expect(leftPane).toHaveAttribute('data-expanded', 'true')
})

Then('the right pane should have aria-expanded set to true', async ({ page }) => {
  const rightPane = page.locator(SELECTORS.rightPane)
  await expect(rightPane).toHaveAttribute('aria-expanded', 'true')
})

Then('the right pane should have an aria-label', async ({ page }) => {
  const rightPane = page.locator(SELECTORS.rightPane)
  const ariaLabel = await rightPane.getAttribute('aria-label')
  expect(ariaLabel).toBeTruthy()
})

// ============================================
// Resize Handle Steps
// ============================================

When('I move the mouse into the right pane', async ({ page }) => {
  const rightPane = page.locator(SELECTORS.rightPane)
  const box = await rightPane.boundingBox()
  if (box) {
    // Move to the center of the pane to ensure we're fully inside
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(100)
  }
})

When(/^I drag the (left|right) resize handle (\d+) pixels to the (left|right)$/, async ({ page }, anchor: 'left' | 'right', pixels: number, direction: 'left' | 'right') => {
  const handleSelector = anchor === 'left' ? SELECTORS.leftResizeHandle : SELECTORS.rightResizeHandle
  const handle = page.locator(handleSelector)

  // Wait for handle to be visible
  await expect(handle).toBeVisible({ timeout: 5000 })

  const box = await handle.boundingBox()
  if (!box) {
    throw new Error(`Could not get bounding box for resize handle: ${handleSelector}`)
  }

  // Calculate positions
  const startX = box.x + box.width / 2
  const startY = box.y + box.height / 2
  const offsetX = direction === 'right' ? pixels : -pixels
  const endX = startX + offsetX

  // Use manual mouse operations to simulate dragging more accurately
  // This ensures proper mousedown/mousemove/mouseup event sequence
  await page.mouse.move(startX, startY)
  await page.mouse.down()
  await page.mouse.move(endX, startY, { steps: 5 })
  await page.mouse.up()

  // Wait for state to update
  await page.waitForTimeout(300)
})

Then('the left pane width should be larger than default', async ({ page }) => {
  const leftPane = page.locator(SELECTORS.leftPane)
  const widthStyle = await leftPane.evaluate((el) => {
    return getComputedStyle(el).getPropertyValue('--sidepane-width')
  })
  const width = parseInt(widthStyle, 10)
  expect(width).toBeGreaterThan(DEFAULT_SIDE_PANE_WIDTH)
})

Then('the left pane width should be at least the minimum width', async ({ page }) => {
  const leftPane = page.locator(SELECTORS.leftPane)
  const widthStyle = await leftPane.evaluate((el) => {
    return getComputedStyle(el).getPropertyValue('--sidepane-width')
  })
  const width = parseInt(widthStyle, 10)
  expect(width).toBeGreaterThanOrEqual(MIN_SIDE_PANE_WIDTH)
})

// ============================================
// Left Edge Sensor Steps
// ============================================

When('I hover over the left edge sensor area', async ({ page }) => {
  const sensor = page.locator(SELECTORS.leftEdgeSensor)
  const box = await sensor.boundingBox()
  if (box) {
    // Hover in the sensor area (left edge has no dead zone)
    await page.mouse.move(box.x + 10, box.y + box.height / 2)
    await page.waitForTimeout(600)
  }
})

When('I hover over the left toggle button', async ({ page }) => {
  const toggle = page.locator(SELECTORS.leftToggle)
  const box = await toggle.boundingBox()
  if (box) {
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(600)
  }
})

When('I hover over the right toggle button', async ({ page }) => {
  const toggle = page.locator(SELECTORS.rightToggle)
  const rightPane = page.locator(SELECTORS.rightPane)
  const box = await toggle.boundingBox()
  if (box) {
    // If pane is open, first move to the pane area to ensure we don't trigger mouse leave
    const paneCount = await rightPane.count()
    if (paneCount > 0) {
      const paneBox = await rightPane.boundingBox()
      if (paneBox) {
        await page.mouse.move(paneBox.x + paneBox.width / 2, paneBox.y + paneBox.height / 2)
        await page.waitForTimeout(50)
      }
    }
    // Then move to the toggle button
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(200)
  }
})

When('I quickly move from the right toggle button to the content area', async ({ page }) => {
  const toggle = page.locator(SELECTORS.rightToggle)
  const central = page.locator(SELECTORS.centralPane)
  const toggleBox = await toggle.boundingBox()
  const centralBox = await central.boundingBox()

  if (toggleBox && centralBox) {
    // Move to toggle button quickly (no wait)
    await page.mouse.move(toggleBox.x + toggleBox.width / 2, toggleBox.y + toggleBox.height / 2)
    // Immediately move to center of content area (no wait between moves)
    await page.mouse.move(centralBox.x + centralBox.width / 2, centralBox.y + centralBox.height / 2)
  }
})

Then('the left pane should be visible in hover mode', async ({ page }) => {
  const leftPane = page.locator(SELECTORS.leftPane)
  await expect(leftPane).toBeVisible()
  await expect(leftPane).toHaveAttribute('data-temporary', 'true')
})

// ============================================
// Space Management Steps
// ============================================

Then('the right pane pin button should be disabled', async ({ page }) => {
  const toggle = page.locator(SELECTORS.rightToggle)
  await expect(toggle).toHaveAttribute('data-disabled', 'true')
})

// ============================================
// Window Resize Steps
// ============================================

When(/^I resize the viewport to (\d+) pixels wide$/, async ({ page }, width: number) => {
  await page.setViewportSize({ width, height: 800 })
  await page.waitForTimeout(300)
})

Then('at least one pane should be closed', async ({ page }) => {
  const leftPane = page.locator(SELECTORS.leftPane)
  const rightPane = page.locator(SELECTORS.rightPane)

  const leftExpanded = await leftPane.getAttribute('data-expanded')
  const rightCount = await rightPane.count()
  const rightExpanded = rightCount > 0 ? await rightPane.getAttribute('data-expanded') : 'false'

  // At least one should be closed (not expanded)
  const leftClosed = leftExpanded === 'false'
  const rightClosed = rightCount === 0 || rightExpanded === 'false'

  expect(leftClosed || rightClosed).toBe(true)
})

// ============================================
// Closed Style Steps
// ============================================

Then('the left pane should be visible as compact bar', async ({ page }) => {
  const leftPane = page.locator(SELECTORS.leftPane)
  await expect(leftPane).toBeVisible()
  await expect(leftPane).toHaveAttribute('data-expanded', 'false')
  await expect(leftPane).toHaveAttribute('data-closed-style', 'compact')
})

Then('the left pane should have the compact width', async ({ page }) => {
  const leftPane = page.locator(SELECTORS.leftPane)
  const widthStyle = await leftPane.evaluate((el) => {
    return getComputedStyle(el).getPropertyValue('--sidepane-width')
  })
  const width = parseInt(widthStyle, 10)
  expect(width).toBe(COMPACT_SIDE_PANE_WIDTH)
})

Then('the right pane should not be in the DOM', async ({ page }) => {
  const rightPane = page.locator(SELECTORS.rightPane)
  const count = await rightPane.count()
  expect(count).toBe(0)
})

// ============================================
// Cooldown Steps
// ============================================

When('I wait for the right pane to close', async ({ page }) => {
  // Wait for close timeout (100ms) + animation (200ms) + small buffer
  // This ensures the pane state has changed to 'closed' and the cooldown timestamp is set
  await page.waitForTimeout(350)
  // Verify pane is actually closed (detached from DOM for hidden style)
  const rightPane = page.locator(SELECTORS.rightPane)
  await rightPane.waitFor({ state: 'detached', timeout: 1000 })
})

When('I immediately hover over the right edge sensor area again', async ({ page }) => {
  const sensor = page.locator(SELECTORS.rightEdgeSensor)
  const box = await sensor.boundingBox()
  if (box) {
    // Hover in the trigger zone immediately (no wait)
    await page.mouse.move(box.x + box.width - 10, box.y + box.height / 2)
    // Wait a very short time - just enough for the hover event to trigger
    // We check immediately after to verify the pane hasn't opened due to cooldown
    // The cooldown is 500ms from when state changed to 'closed', but ~250ms
    // have already elapsed by the time we get here (waiting for DOM removal).
    // So we have ~250ms of remaining cooldown, and we wait only 50ms.
    await page.waitForTimeout(50)
  }
})

Then('the right pane should remain closed due to cooldown', async ({ page }) => {
  const rightPane = page.locator(SELECTORS.rightPane)
  const count = await rightPane.count()
  expect(count).toBe(0)
})
