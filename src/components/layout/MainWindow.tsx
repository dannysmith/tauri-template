import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable'
import { TitleBar } from '@/components/titlebar/TitleBar'
import { LeftSideBar } from './LeftSideBar'
import { RightSideBar } from './RightSideBar'
import { MainWindowContent } from './MainWindowContent'
import { CommandPalette } from '@/components/command-palette/CommandPalette'
import { PreferencesDialog } from '@/components/preferences/PreferencesDialog'
import { Toaster } from 'sonner'
import { useTheme } from '@/hooks/use-theme'
import { useUIStore } from '@/store/ui-store'
import { useMainWindowEventListeners } from '@/hooks/useMainWindowEventListeners'
import { cn } from '@/lib/utils'

export function MainWindow() {
  const { theme } = useTheme()
  const { leftSidebarVisible, rightSidebarVisible } = useUIStore()

  // Set up global event listeners (keyboard shortcuts, etc.)
  useMainWindowEventListeners()

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden rounded-xl bg-background">
      {/* Title Bar */}
      <TitleBar />

      {/* Main Content Area with Resizable Panels */}
      <div className="flex flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Sidebar */}
          <ResizablePanel
            defaultSize={20}
            minSize={15}
            maxSize={40}
            className={cn(!leftSidebarVisible && 'hidden')}
          >
            <LeftSideBar />
          </ResizablePanel>

          <ResizableHandle className={cn(!leftSidebarVisible && 'hidden')} />

          {/* Main Content */}
          <ResizablePanel defaultSize={60} minSize={30}>
            <MainWindowContent />
          </ResizablePanel>

          <ResizableHandle className={cn(!rightSidebarVisible && 'hidden')} />

          {/* Right Sidebar */}
          <ResizablePanel
            defaultSize={20}
            minSize={15}
            maxSize={40}
            className={cn(!rightSidebarVisible && 'hidden')}
          >
            <RightSideBar />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Global UI Components (hidden until triggered) */}
      <CommandPalette />
      <PreferencesDialog />
      <Toaster
        position="bottom-right"
        theme={
          theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : 'system'
        }
        className="toaster group"
        toastOptions={{
          classNames: {
            toast:
              'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
            description: 'group-[.toast]:text-muted-foreground',
            actionButton:
              'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
            cancelButton:
              'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
          },
        }}
      />
    </div>
  )
}

export default MainWindow
