import { cn } from '@/lib/utils'

interface RightSideBarProps {
  children?: React.ReactNode
  className?: string
}

export function RightSideBar({ children, className }: RightSideBarProps) {
  return (
    <div
      className={cn('flex h-full flex-col border-l bg-background', className)}
    >
      {children}
    </div>
  )
}
