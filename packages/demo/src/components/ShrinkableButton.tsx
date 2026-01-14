import type { FC, ReactNode, MouseEvent } from 'react'
import './ShrinkableButton.css'

interface ShrinkableButtonProps {
  /** Icon element to display */
  icon: ReactNode
  /** Text label (hidden in compact mode) */
  label: string
  /** Click handler */
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  /** Whether the button is in compact mode (icon only) */
  isCompact?: boolean
  /** Whether the button is currently active/selected */
  isActive?: boolean
  /** Additional CSS class name */
  className?: string
}

export const ShrinkableButton: FC<ShrinkableButtonProps> = ({
  icon,
  label,
  onClick,
  isCompact = false,
  isActive = false,
  className = ''
}) => {
  return (
    <button
      className={`shrinkable-button ${className}`}
      onClick={onClick}
      data-compact={isCompact || undefined}
      data-active={isActive || undefined}
      title={isCompact ? label : undefined}
      aria-label={label}
    >
      <span className="shrinkable-button__icon">{icon}</span>
      <span className="shrinkable-button__label">{label}</span>
    </button>
  )
}
