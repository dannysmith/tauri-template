import { cn } from '@/lib/utils'
import { commands } from '@/lib/tauri-bindings'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/ui-store'

interface MainWindowContentProps {
  children?: React.ReactNode
  className?: string
}

export function MainWindowContent({
  children,
  className,
}: MainWindowContentProps) {
  const lastQuickPaneEntry = useUIStore(state => state.lastQuickPaneEntry)

  const handleShowQuickPane = async () => {
    const result = await commands.showQuickPane()
    if (result.status === 'error') {
      console.error('Failed to show quick pane:', result.error)
    }
  }

  return (
    <div className={cn('flex h-full flex-col bg-background', className)}>
      {children || (
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <h1 className="text-4xl font-bold text-foreground">
            {lastQuickPaneEntry
              ? `Last entry: ${lastQuickPaneEntry}`
              : 'Hello World'}
          </h1>
          {/* TODO: Remove this button after testing */}
          <Button onClick={handleShowQuickPane} variant="outline">
            Show Quick Pane (Test)
          </Button>
        </div>
      )}
    </div>
  )
}

export default MainWindowContent
