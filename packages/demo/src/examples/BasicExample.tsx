import { useState, type FC } from 'react'
import {
  Sidepane,
  SidepaneToggle,
  SidepaneResizeHandle,
  CentralPane,
  EdgeHoverSensor,
  EDGE_SENSOR_TRIGGER_PADDING_IN_PX
} from 'react-sidepanes'
import { ShrinkableButton } from '../components/ShrinkableButton'
import { HomeIcon, DocumentIcon, SettingsIcon, ProfileIcon, HelpIcon } from '../components/icons'

// Simple SVG icons
const SidebarIcon: FC<{ flipped?: boolean }> = ({ flipped }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{ transform: flipped ? 'scaleX(-1)' : undefined }}
  >
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
  </svg>
)

const PinIcon: FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" />
  </svg>
)

export const BasicExample: FC = () => {
  const [debugSensors, setDebugSensors] = useState(false)

  return (
    <div className="sidepanes-layout">
      {/* Right Sidepane Toggle */}
      <SidepaneToggle anchor="right">
        {({ isOpen, isTemporary, onClick, ariaLabel, isPinDisabled }) => (
          <button
            className="toggle-button"
            onClick={onClick}
            aria-label={ariaLabel}
            disabled={isPinDisabled}
          >
            {isTemporary ? <PinIcon /> : <SidebarIcon flipped={!isOpen} />}
          </button>
        )}
      </SidepaneToggle>

      {/* Edge Hover Sensors */}
      <EdgeHoverSensor anchor="left">
        {({ isActive }) =>
          debugSensors && isActive && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(0, 200, 0, 0.3)',
                border: '2px dashed green',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                color: 'green',
                fontWeight: 'bold'
              }}
            >
              ACTIVE
            </div>
          )
        }
      </EdgeHoverSensor>
      <EdgeHoverSensor anchor="right">
        {({ width, isActive }) =>
          debugSensors &&
          isActive && (
            <>
              {/* Dead zone (left part - no trigger) */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: `${Math.min(width, EDGE_SENSOR_TRIGGER_PADDING_IN_PX)}px`,
                  height: '100%',
                  backgroundColor: 'rgba(200, 0, 0, 0.2)',
                  border: '2px dashed red',
                  borderRight: 'none',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: 'red',
                  fontWeight: 'bold',
                  overflow: 'hidden',
                  textAlign: 'center',
                  lineHeight: 1.2
                }}
              >
                DEAD
                <br />
                ZONE
              </div>
              {/* Active zone (right part - triggers open) */}
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: `${Math.max(0, width - EDGE_SENSOR_TRIGGER_PADDING_IN_PX)}px`,
                  height: '100%',
                  backgroundColor: 'rgba(0, 200, 0, 0.3)',
                  border: '2px dashed green',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  color: 'green',
                  fontWeight: 'bold'
                }}
              >
                ACTIVE
              </div>
            </>
          )
        }
      </EdgeHoverSensor>

      {/* Left Sidepane */}
      <Sidepane
        anchor="left"
        closedStyle="compact"
        resizable
        header={({ isCompact }) => (
          <>
            <SidepaneToggle anchor="left">
              {({ isOpen, isTemporary, onClick, ariaLabel, isPinDisabled }) => (
                <button
                  className="toggle-button"
                  onClick={onClick}
                  aria-label={ariaLabel}
                  disabled={isPinDisabled}
                >
                  {isTemporary ? <PinIcon /> : <SidebarIcon flipped={isOpen} />}
                </button>
              )}
            </SidepaneToggle>
            <h3
              style={{
                margin: 0,
                fontSize: '14px',
                opacity: isCompact ? 0 : 1,
                transition: 'opacity 0.15s ease',
                flex: 1
              }}
            >
              Navigation
            </h3>
          </>
        )}
      >
        {({ isCompact }) => (
          <>
            <nav className="nav-buttons">
              <ShrinkableButton
                icon={<HomeIcon />}
                label="Home"
                isCompact={isCompact}
                isActive
              />
              <ShrinkableButton
                icon={<DocumentIcon />}
                label="Documents"
                isCompact={isCompact}
              />
              <ShrinkableButton
                icon={<SettingsIcon />}
                label="Settings"
                isCompact={isCompact}
              />
              <ShrinkableButton
                icon={<ProfileIcon />}
                label="Profile"
                isCompact={isCompact}
              />
              <ShrinkableButton
                icon={<HelpIcon />}
                label="Help"
                isCompact={isCompact}
              />
            </nav>
            <SidepaneResizeHandle anchor="left" />
          </>
        )}
      </Sidepane>

      {/* Central Pane */}
      <CentralPane>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1>react-sidepanes Demo</h1>
          <p style={{ marginTop: '16px', lineHeight: 1.6 }}>
            This is a demonstration of the headless sidepanes library. The panels on either side
            can be opened, closed, resized, and pinned.
          </p>

          <h2 style={{ marginTop: '32px' }}>Features</h2>
          <ul style={{ marginTop: '16px', lineHeight: 1.8 }}>
            <li><strong>Headless:</strong> No styling included - fully customizable</li>
            <li><strong>Resizable:</strong> Drag the edge to resize panels</li>
            <li><strong>Hover-to-open:</strong> Hover near the edge to temporarily open</li>
            <li><strong>Pinnable:</strong> Click the pin icon to keep a panel open</li>
            <li><strong>Responsive:</strong> Automatically closes panels when space is limited</li>
            <li><strong>Compact mode:</strong> Left panel shows a slim bar when closed</li>
            <li><strong>Persistence:</strong> Panel state is saved to localStorage</li>
          </ul>

          <h2 style={{ marginTop: '32px' }}>Try it out</h2>
          <ul style={{ marginTop: '16px', lineHeight: 1.8 }}>
            <li>Click the sidebar icons in the corners to toggle panels</li>
            <li>Hover near the left or right edge to temporarily open a panel</li>
            <li>While a panel is temporarily open, click the pin icon to keep it open</li>
            <li>Drag the edge of an open panel to resize it</li>
            <li>Make the window smaller to see automatic panel closing</li>
          </ul>

          <h2 style={{ marginTop: '32px' }}>Debug</h2>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={debugSensors}
              onChange={(e) => setDebugSensors(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span>Show edge sensor zones</span>
          </label>
          <p style={{ marginTop: '8px', fontSize: '14px', color: '#666', lineHeight: 1.6 }}>
            When enabled, displays the edge hover sensor areas. Green zones trigger the panel to open on hover.
            The right edge has a red &quot;dead zone&quot; where hovering won&apos;t trigger the panel.
          </p>
        </div>
      </CentralPane>

      {/* Right Sidepane */}
      <Sidepane
        anchor="right"
        closedStyle="hidden"
        resizable
        header={<h3 style={{ margin: 0, fontSize: '14px' }}>Details</h3>}
      >
        <div>
          <h4 style={{ marginBottom: '16px' }}>Panel State</h4>
          <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6 }}>
            This right panel demonstrates the hidden closed style. When closed, it completely
            disappears from the layout. Hover near the right edge to temporarily open it, then
            click the pin icon to keep it open.
          </p>

          <h4 style={{ marginTop: '24px', marginBottom: '16px' }}>Data Attributes</h4>
          <p style={{ fontSize: '14px', color: '#666', lineHeight: 1.6 }}>
            The library uses data attributes for styling, allowing you to target different states
            with CSS. Check the browser inspector to see attributes like:
          </p>
          <ul style={{ fontSize: '14px', color: '#666', marginTop: '8px', lineHeight: 1.8 }}>
            <li><code>data-sidepane</code></li>
            <li><code>data-anchor=&quot;left|right&quot;</code></li>
            <li><code>data-state=&quot;open|closed&quot;</code></li>
            <li><code>data-temporary</code></li>
            <li><code>data-overlay</code></li>
          </ul>
        </div>
        <SidepaneResizeHandle anchor="right" />
      </Sidepane>
    </div>
  )
}
