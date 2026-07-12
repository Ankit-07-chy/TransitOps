import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  accent = 'primary',
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  accent?: 'primary' | 'success' | 'warning' | 'info' | 'danger';
}) {
  const accents: Record<string, string> = {
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    info: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    danger: 'bg-red-500/15 text-red-600 dark:text-red-400',
  };
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className={cn('flex size-9 items-center justify-center rounded-lg', accents[accent])}>
          <Icon className="size-5" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}
