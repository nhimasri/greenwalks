import { cn } from '../../lib/utils';

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("w-full bg-slate-100 rounded-full overflow-hidden", className)}>
      <div 
        className="h-full bg-eco-500 transition-all duration-1000 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}
