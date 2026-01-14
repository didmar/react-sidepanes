Feature: Sidepanes behavior

  As a user
  I want the sidepanes to adapt to available space
  So that I can easily use them without interfering with the main content

  Background:
    Given I am on the demo page
    And the left pane is in compact closed style
    And the right pane is in hidden closed style

  # ============================================
  # Edge Hover Sensor
  # ============================================

  Scenario: Hovering over right edge sensor opens right pane
    Given the viewport is 1920 pixels wide
    And the left pane is pinned
    And the right pane is closed
    When I hover over the right edge sensor area
    Then the right pane should be visible

  Scenario: Hovering over left edge sensor opens left pane when closed
    Given the viewport is 1920 pixels wide
    And the left pane is closed
    And the right pane is closed
    When I hover over the left edge sensor area
    Then the left pane should be visible in hover mode

  Scenario: Hover-opened pane closes when leaving via toggle button
    Given the viewport is 1920 pixels wide
    And the left pane is pinned
    And the right pane is closed
    When I hover over the right edge sensor area
    Then the right pane should be visible in hover mode
    When I hover over the right toggle button
    Then the right pane should still be visible in hover mode
    When I move the mouse to the center of the content area
    Then the right pane should close after debounce period

  Scenario: Hover-opened pane closes when quickly moving from toggle to content
    Given the viewport is 1920 pixels wide
    And the left pane is pinned
    And the right pane is closed
    When I hover over the right edge sensor area
    Then the right pane should be visible in hover mode
    When I quickly move from the right toggle button to the content area
    Then the right pane should close after debounce period

  Scenario: Hovering over content area does not trigger edge sensor
    Given the viewport is 1280 pixels wide
    And the left pane is pinned
    And the right pane is closed
    When I hover over the center of the content area
    Then the right pane should remain closed

  Scenario: Hovered pane closes when mouse leaves
    Given the viewport is 1920 pixels wide
    And the left pane is pinned
    And the right pane is closed
    When I hover over the right edge sensor area
    Then the right pane should be visible in hover mode
    When I move the mouse to the center of the content area
    Then the right pane should close after debounce period

  Scenario: Pane does not reopen immediately after closing via mouse leave
    Given the viewport is 1920 pixels wide
    And the left pane is pinned
    And the right pane is closed
    When I hover over the right edge sensor area
    Then the right pane should be visible in hover mode
    When I move the mouse to the center of the content area
    And I wait for the pane to close
    And I immediately hover over the right edge sensor area again
    Then the right pane should remain closed due to cooldown

  # ============================================
  # Toggle Button
  # ============================================

  Scenario: Pin right pane from hover mode
    Given the viewport is 1920 pixels wide
    And the left pane is pinned
    And the right pane is closed
    When I hover over the right edge sensor area
    Then the right pane should be visible in hover mode
    When I click to pin the right pane
    Then the right pane should be pinned

  Scenario: Close pinned right pane via toggle button
    Given the viewport is 1920 pixels wide
    And the left pane is pinned
    And the right pane is pinned
    When I click the right pane toggle button
    Then the right pane should be closed

  Scenario: Toggle left pane between pinned and closed states
    Given the viewport is 1280 pixels wide
    And the left pane is pinned
    When I click the left pane toggle button
    Then the left pane should be closed
    When I click the left pane toggle button
    Then the left pane should be pinned

  # ============================================
  # Closed Styles
  # ============================================

  Scenario: Left pane in compact mode shows slim bar when closed
    Given the viewport is 1280 pixels wide
    And the left pane is closed
    Then the left pane should be visible as compact bar
    And the left pane should have the compact width

  Scenario: Right pane in hidden mode is completely hidden when closed
    Given the viewport is 1280 pixels wide
    And the right pane is closed
    Then the right pane should not be in the DOM

  # ============================================
  # Responsive Space Management
  # ============================================

  Scenario: Both panes can be pinned on wide viewport
    Given the viewport is 1920 pixels wide
    And the left pane is pinned
    And the right pane is closed
    When I click to pin the right pane
    Then the left pane should remain pinned
    And the right pane should be pinned

  Scenario: Opening right pane auto-closes left pane on narrow viewport
    Given the viewport is 900 pixels wide
    And the left pane is pinned
    And the right pane is closed
    When I click to pin the right pane
    Then the right pane should be pinned
    And the left pane should be closed

  Scenario: Window resize auto-closes pane when space becomes insufficient
    Given the viewport is 1920 pixels wide
    And the left pane is pinned
    And the right pane is pinned
    When I resize the viewport to 800 pixels wide
    Then at least one pane should be closed

  Scenario: Pin button disabled when not enough space
    Given the viewport is 900 pixels wide
    And the left pane is pinned
    And the right pane is closed
    When I hover over the right toggle button
    Then the right pane should be visible in hover mode
    And the right pane pin button should be disabled

  # ============================================
  # Resize Handle
  # ============================================

  Scenario: Resizing a hover-opened pane does not close it
    Given the viewport is 1920 pixels wide
    And the left pane is pinned
    And the right pane is closed
    When I hover over the right edge sensor area
    Then the right pane should be visible in hover mode
    When I move the mouse into the right pane
    And I drag the right resize handle 50 pixels to the left
    Then the right pane should still be visible in hover mode

  # ============================================
  # Accessibility
  # ============================================

  Scenario: Sidepane has correct ARIA attributes when open
    Given the viewport is 1920 pixels wide
    And the right pane is pinned
    Then the right pane should have aria-expanded set to true
    And the right pane should have an aria-label
