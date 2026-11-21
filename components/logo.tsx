import Link from 'next/link'
import { cn } from '@/lib/utils'

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn('grid size-8 grid-cols-2 gap-0.5 rounded-md bg-primary/15 p-1', className)}
    >
      <span className="rounded-[3px] bg-primary" />
      <span className="rounded-[3px] bg-primary/50" />
      <span className="rounded-[3px] bg-primary/50" />
      <span className="rounded-[3px] bg-primary" />
    </span>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn('flex items-center gap-2.5', className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span className="text-lg font-black tracking-tight">ساتکو</span>
        <span className="text-[10px] font-medium tracking-[0.2em] text-muted-foreground">SATCO</span>
      </span>
    </Link>
  )
}
