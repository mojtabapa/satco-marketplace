import type { ComponentProps } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export function NativeSelect({ className, children, ...props }: ComponentProps<'select'>) {
  return (
    <div className={cn('relative', className)}>
      <select
        className="h-9 w-full appearance-none rounded-lg border border-input bg-background ps-3 pe-8 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute end-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
    </div>
  )
}
