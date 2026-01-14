# react-sidepanes

A headless React component library for building resizable, collapsible side panel layouts, which adjusts itself based on available space.

## Features

- **Headless/Unstyled** - Full control over styling, state is exposed via data attributes (`data-expanded`, `data-closed-style`, etc.), CSS custom properties (`--sidepane-width`), and components use render props

- **Smart and responsive** - Guarantees a minimum width for your main content, auto-closes the opposite pane when space is tight, and gracefully handles viewport resizing. Panes can still be hover-viewed even when there's no room to pin them.

- **Manually resizable panels** - Drag to resize with configurable min/max widths

- **Hidden or compact when closed** - Closed panes can be fully hidden or display a slim compact bar (useful for icon-based navigation that's always accessible)

- **Persistent state** - Pluggable persistence adapters (localStorage, cookies, or custom). Sensible defaults work out of the box, but everything is configurable or replaceable.

- **TypeScript** - Full type definitions included

- **Zero dependencies** - Only React as a peer dependency

## Installation

```bash
npm install @didmar/react-sidepanes
# or
pnpm add @didmar/react-sidepanes
# or
yarn add @didmar/react-sidepanes
```

## Quick Start

```tsx
import {
  SidepanesProvider,
  Sidepane,
  SidepaneToggle,
  CentralPane,
  EdgeHoverSensor
} from '@didmar/react-sidepanes'

function App() {
  return (
    <SidepanesProvider>
      <div className="app-layout">
        {/* Toggle buttons */}
        <SidepaneToggle anchor="left">
          {({ isOpen, onClick, ariaLabel }) => (
            <button onClick={onClick} aria-label={ariaLabel}>
              {isOpen ? '←' : '→'}
            </button>
          )}
        </SidepaneToggle>

        {/* Edge hover sensors */}
        <EdgeHoverSensor anchor="left" />
        <EdgeHoverSensor anchor="right" />

        {/* Left sidepane */}
        <Sidepane anchor="left" closedStyle="compact">
          <nav>Navigation content</nav>
        </Sidepane>

        {/* Central content */}
        <CentralPane>
          Main content
        </CentralPane>

        {/* Right sidepane */}
        <Sidepane anchor="right" closedStyle="hidden">
          <aside>Details panel</aside>
        </Sidepane>
      </div>
    </SidepanesProvider>
  )
}
```

## Components

### SidepanesProvider

Wraps your application and provides sidepane state management.

```tsx
<SidepanesProvider
  config={{
    persistence: localStorageAdapter, // or cookieAdapter, noopAdapter, or custom
    defaultWidth: 320,           // Default width for both panes (px)
    minWidth: 200,               // Minimum sidepane width (px)
    centralPaneMinWidth: 400,    // Minimum central pane width (px)
    centralPaneMaxWidth: 800,    // Maximum central pane width (px)
    compactWidth: 40,            // Width when closed in compact mode (px)
    animationDuration: 200,      // Animation duration (ms)
    defaultLeftPane: { openState: 'pinned', width: 280, closedStyle: 'compact' },
    defaultRightPane: { openState: 'closed', width: 320, closedStyle: 'hidden' }
  }}
>
  {children}
</SidepanesProvider>
```

**Config options:**
- `persistence` - Persistence adapter for saving pane state (default: `localStorageAdapter`)
- `defaultWidth` - Default width for both panes in pixels (default: 320)
- `minWidth` - Minimum sidepane width in pixels (default: 200)
- `centralPaneMinWidth` - Minimum central pane width in pixels (default: 400)
- `centralPaneMaxWidth` - Maximum central pane width in pixels (default: 800)
- `compactWidth` - Width when closed in compact mode in pixels (default: 40)
- `animationDuration` - Animation duration in milliseconds (default: 200)
- `defaultLeftPane` - Initial state for left pane: `{ openState?: 'closed' | 'pinned', width?: number, closedStyle?: 'hidden' | 'compact' }`
- `defaultRightPane` - Initial state for right pane: `{ openState?: 'closed' | 'pinned', width?: number, closedStyle?: 'hidden' | 'compact' }`

Note: `openState` can be 'closed', 'pinned', or 'hovered', but only 'closed' and 'pinned' are persisted. The 'hovered' state is always temporary.

### Sidepane

The main side panel component. Renders an `<aside>` element with data attributes.

```tsx
<Sidepane
  anchor="left"           // 'left' | 'right'
  closedStyle="compact"   // 'compact' | 'hidden'
  resizable               // Enable resize handle
  header={<h3>Title</h3>} // Optional header content
  className="my-sidepane"
>
  Panel content
</Sidepane>
```

**Render props pattern:**

Both `children` and `header` props can be render functions that receive pane state:

```tsx
<Sidepane
  anchor="left"
  closedStyle="compact"
  header={({ isCompact, isOpen, isPinned }) => (
    <div>
      <h3 style={{ opacity: isCompact ? 0 : 1 }}>
        Navigation
      </h3>
    </div>
  )}
>
  {({ isOpen, isTemporary, isPinned, isCompact, width, toggle, open, close }) => (
    <div>
      <p>Pane is {isOpen ? 'open' : 'closed'}</p>
      <p>Width: {width}px</p>
      <button onClick={toggle}>Toggle</button>
    </div>
  )}
</Sidepane>
```

**Data attributes for styling:**
- `data-sidepane` - Always present
- `data-anchor="left|right"` - Panel position
- `data-expanded="true|false"` - Whether the pane is expanded
- `data-temporary="true"` - When opened via hover
- `data-closed-style="compact|hidden"` - The closedStyle configuration (always present)
- `data-overlay="true"` - When displayed as overlay (temporary or compact hovering)

**CSS custom properties:**
- `--sidepane-width` - Current width in pixels
- `--sidepane-animation-duration` - Animation duration in milliseconds

**Wrapper elements:**

When using the `header` prop, the Sidepane component creates wrapper elements:

- `data-sidepane-header` - Wraps the header content
- `data-sidepane-content` - Wraps the main content
- `data-sidepane-placeholder` - Placeholder element to maintain layout when compact pane is displayed as overlay

### SidepaneToggle

Renders a toggle button using render props pattern.

```tsx
<SidepaneToggle anchor="left">
  {({ isOpen, isTemporary, isPinDisabled, onClick, ariaLabel }) => (
    <button onClick={onClick} aria-label={ariaLabel} disabled={isPinDisabled}>
      {isTemporary ? <PinIcon /> : isOpen ? <CloseIcon /> : <OpenIcon />}
    </button>
  )}
</SidepaneToggle>
```

### SidepaneResizeHandle

Drag handle for resizing panels.

```tsx
<Sidepane anchor="left" resizable>
  <nav>Content</nav>
  <SidepaneResizeHandle anchor="left" />
</Sidepane>
```

### EdgeHoverSensor

Invisible sensor area that triggers hover-to-open behavior.

```tsx
<EdgeHoverSensor
  anchor="right"
  disabled={false}
  zIndex={1202}
  getWidth={({ viewportWidth, centralPaneRect }) => {
    // Custom width calculation
    return Math.min(200, viewportWidth * 0.15)
  }}
>
  {({ width, isActive, anchor }) => (
    // Optional: Custom sensor visualization
    <div>Sensor width: {width}px</div>
  )}
</EdgeHoverSensor>
```

**Props:**
- `anchor` - 'left' | 'right' (required)
- `disabled` - Disable the sensor (default: false)
- `getWidth` - Custom width calculator function receiving `{ viewportWidth, centralPaneRect }`
- `children` - Optional render function for custom rendering
- `zIndex` - z-index value (default: 1202)
- `className` - Additional CSS class
- `style` - Additional inline styles

**Data attributes:**
- `data-edge-hover-sensor` - Always present
- `data-anchor="left|right"` - Sensor position
- `data-active="true"` - When sensor is active (pane closed)

**CSS custom properties:**
- `--edge-sensor-width` - Current width in pixels

### CentralPane

The main content area that adjusts based on open sidepanes.

```tsx
<CentralPane className="main-content">
  Your main content
</CentralPane>
```

## Styling

The library uses data attributes for styling, allowing you to target different states with CSS:

```css
/* Basic sidepane styling */
[data-sidepane] {
  position: fixed;
  top: 0;
  bottom: 0;
  width: var(--sidepane-width);
  background: white;
  transition: transform 0.3s ease;
}

/* Left sidepane positioning */
[data-sidepane][data-anchor="left"] {
  left: 0;
}

/* Right sidepane positioning */
[data-sidepane][data-anchor="right"] {
  right: 0;
}

/* Closed state */
[data-sidepane][data-expanded="false"][data-anchor="left"] {
  transform: translateX(-100%);
}

/* Compact mode (slim bar when closed) */
[data-sidepane][data-closed-style="compact"][data-expanded="false"] {
  width: 48px;
  transform: none;
}

/* Temporary/hover state overlay */
[data-sidepane][data-temporary="true"] {
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.2);
  z-index: 100;
}
```

## Persistence Adapters

The library includes built-in persistence adapters:

```tsx
import {
  localStorageAdapter,  // Uses localStorage
  cookieAdapter,        // Uses document.cookie
  noopAdapter           // No persistence
} from '@didmar/react-sidepanes'

// Use localStorage (default)
<SidepanesProvider config={{ persistence: localStorageAdapter }}>

// No persistence
<SidepanesProvider config={{ persistence: noopAdapter }}>

// Custom adapter
const myAdapter = {
  get: (key: string) => myStorage.get(`sidepanes:${key}`),
  set: (key: string, value: string) => myStorage.set(`sidepanes:${key}`, value)
}
<SidepanesProvider config={{ persistence: myAdapter }}>
```

## TypeScript

Full TypeScript support with exported types:

```tsx
import type {
  SidepaneAnchor,
  PaneState,
  SidepanesConfig,
  PersistenceAdapter,
  ToggleRenderProps
} from '@didmar/react-sidepanes'
```

## Development

```bash
# Install dependencies
pnpm install

# Start demo app
pnpm dev

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Build library
pnpm build

# Lint
pnpm lint
```

## Publishing the package

```bash
cd packages/react-sidepanes
npm pack --dry-run  # preview first
npm publish
```

## License

MIT
