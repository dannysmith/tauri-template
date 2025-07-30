import { cn } from '@/lib/utils'

interface MainWindowContentProps {
  children?: React.ReactNode
  className?: string
}

export function MainWindowContent({
  children,
  className,
}: MainWindowContentProps) {
  return (
    <div className={cn('flex h-full flex-col bg-background', className)}>
      {children || (
        <div className="flex flex-1 items-center justify-center">
          <h1 className="text-4xl font-bold text-foreground">Hello World</h1>
        </div>
      )}
    </div>
  )
}

export default MainWindowContent
