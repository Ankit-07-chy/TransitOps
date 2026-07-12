import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Fuel,
  LayoutDashboard,
  Route as RouteIcon,
  Truck,
  Users,
  Wrench,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/vehicles', label: 'Vehicles', icon: Truck },
  { to: '/drivers', label: 'Drivers', icon: Users },
  { to: '/trips', label: 'Trips', icon: RouteIcon },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/fuel-expenses', label: 'Fuel & Expenses', icon: Fuel },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center gap-2 border-b px-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Truck className="size-5" />
        </div>
        <div className="leading-tight">
          <p className="font-bold">TransitOps</p>
          <p className="text-[11px] text-muted-foreground">Fleet Operations</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="border-t p-4 text-[11px] text-muted-foreground">
        TransitOps v1.0 · Smart Transport Ops
      </div>
    </div>
  );
}
