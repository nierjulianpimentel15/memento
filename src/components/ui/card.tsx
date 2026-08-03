import { cn } from '@/lib/utils';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-xl border border-white/10 bg-near-black shadow-soft', className)}
      {...props}
    />
  );
}
