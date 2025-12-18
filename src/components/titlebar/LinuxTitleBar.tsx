import { cn } from '@/lib/utils'
import {
  TitleBarLeftActions,
  TitleBarRightActions,
  TitleBarTitle,
} from './TitleBarContent'

interface LinuxTitleBarProps {
  className?: string
  title?: string
}

/**
 * Linux title bar / toolbar.
 *
 * On Linux, native window decorations are used (decorations: true in config).
 * This component renders only the toolbar content without any window controls.
 * The native decorations provide close/minimize/maximize buttons.
 *
 * The toolbar sits below the native title bar and contains app-specific
 * toolbar buttons and the title.
 */
export function LinuxTitleBar({ className, title }: LinuxTitleBarProps) {
  return (
    <div
      className={cn(
        'relative flex h-8 w-full shrink-0 items-center justify-between border-b bg-background',
        className
      )}
    >
      {/* Left side - Actions */}
      <div className="flex items-center pl-2">
        <TitleBarLeftActions />
      </div>

      {/* Center - Title */}
      <TitleBarTitle title={title} />

      {/* Right side - Actions */}
      <div className="flex items-center pr-2">
        <TitleBarRightActions />
      </div>
    </div>
  )
}
