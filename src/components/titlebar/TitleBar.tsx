import { cn } from '@/lib/utils'
import { MacOSWindowControls } from './MacOSWindowControls'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/ui-store'
import { executeCommand, useCommandContext } from '@/lib/commands'
import {
  PanelLeft,
  PanelLeftClose,
  PanelRight,
  PanelRightClose,
  Settings,
} from 'lucide-react'

interface TitleBarProps {
  className?: string
  title?: string
}

export function TitleBar({ className, title = 'Tauri App' }: TitleBarProps) {
  const {
    leftSidebarVisible,
    rightSidebarVisible,
    toggleLeftSidebar,
    toggleRightSidebar,
  } = useUIStore()
  const commandContext = useCommandContext()
  return (
    <div
      data-tauri-drag-region
      className={cn(
        'relative flex h-8 w-full shrink-0 items-center justify-between border-b bg-background',
        className
      )}
    >
      {/* Left side - Window Controls + Left Actions */}
      <div className="flex items-center">
        <MacOSWindowControls />

        {/* Left Action Buttons */}
        <div className="flex items-center gap-1">
          <Button
            onClick={toggleLeftSidebar}
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-foreground/70 hover:text-foreground"
            title={
              leftSidebarVisible ? 'Hide Left Sidebar' : 'Show Left Sidebar'
            }
          >
            {leftSidebarVisible ? (
              <PanelLeftClose className="h-3 w-3" />
            ) : (
              <PanelLeft className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>

      {/* Center - Title */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <span className="text-sm font-medium text-foreground/80">{title}</span>
      </div>

      {/* Right side - Right Actions */}
      <div className="flex items-center gap-1 pr-2">
        <Button
          onClick={() => executeCommand('open-preferences', commandContext)}
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-foreground/70 hover:text-foreground"
          title="Settings"
        >
          <Settings className="h-3 w-3" />
        </Button>

        <Button
          onClick={toggleRightSidebar}
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-foreground/70 hover:text-foreground"
          title={
            rightSidebarVisible ? 'Hide Right Sidebar' : 'Show Right Sidebar'
          }
        >
          {rightSidebarVisible ? (
            <PanelRightClose className="h-3 w-3" />
          ) : (
            <PanelRight className="h-3 w-3" />
          )}
        </Button>
      </div>
    </div>
  )
}

export default TitleBar
