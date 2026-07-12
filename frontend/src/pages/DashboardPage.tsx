import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Activity,
  CircleCheck,
  DollarSign,
  Gauge,
  Truck,
  UserCheck,
  Wrench,
} from 'lucide-react';
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
} from 'recharts';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/spinner';
import { TripStatusBadge } from '@/components/shared/StatusBadge';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { api } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { DashboardData } from '@/lib/types';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';

const EXPENSE_COLORS: Record<string, string> = {
  TOLL: '#0ea5e9',
  MAINTENANCE: '#f59e0b',
  OTHER: '#8b5cf6',
};

export function DashboardPage() {
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [region, setRegion] = useState('');

  const { data, loading, error } = useApi<DashboardData>(
    () => api.get('/dashboard', { type, status, region }),
    [type, status, region],
  );

  const pieData = data
    ? (Object.entries(data.todaysExpenses.breakdown)
        .map(([name, value]) => ({ name, value }))
        .filter((d) => d.value > 0) as { name: string; value: number }[])
    : [];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Live overview of your fleet operations"
        actions={
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Filter region…"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-36"
            />
            <Input
              placeholder="Filter type…"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-36"
            />
            <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
              <option value="">All statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="ON_TRIP">On Trip</option>
              <option value="IN_SHOP">In Shop</option>
              <option value="RETIRED">Retired</option>
            </Select>
          </div>
        }
      />

      {loading && <LoadingState />}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Active Vehicles" value={data.kpis.activeVehicles} icon={Truck} />
            <KpiCard
              label="Available"
              value={data.kpis.availableVehicles}
              icon={CircleCheck}
              accent="success"
            />
            <KpiCard
              label="In Maintenance"
              value={data.kpis.vehiclesInMaintenance}
              icon={Wrench}
              accent="warning"
            />
            <KpiCard
              label="Active Trips"
              value={data.kpis.activeTrips}
              icon={Activity}
              accent="info"
              hint={`${data.kpis.pendingTrips} draft pending`}
            />
            <KpiCard
              label="Drivers On Duty"
              value={data.kpis.driversOnDuty}
              icon={UserCheck}
              accent="success"
            />
            <KpiCard
              label="Fleet Utilization"
              value={`${data.kpis.fleetUtilizationPct}%`}
              icon={Gauge}
              accent="primary"
              hint="Vehicles on trip vs active fleet"
            />
            <KpiCard
              label="Today's Expenses"
              value={formatCurrency(data.todaysExpenses.total)}
              icon={DollarSign}
              accent="danger"
            />
            <KpiCard
              label="Pending Trips"
              value={data.kpis.pendingTrips}
              icon={Activity}
              accent="warning"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Trips</CardTitle>
              </CardHeader>
              <CardContent>
                {data.recentTrips.length === 0 ? (
                  <EmptyState icon={Activity} title="No trips yet" />
                ) : (
                  <Table>
                    <THead>
                      <TR>
                        <TH>Trip</TH>
                        <TH>Route</TH>
                        <TH>Vehicle</TH>
                        <TH>Driver</TH>
                        <TH>Status</TH>
                        <TH>Created</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {data.recentTrips.map((t) => (
                        <TR key={t.id}>
                          <TD className="font-medium">{t.tripNumber}</TD>
                          <TD className="text-muted-foreground">
                            {t.source} → {t.destination}
                          </TD>
                          <TD>{t.vehicle.registrationNo}</TD>
                          <TD>{t.driver.name}</TD>
                          <TD>
                            <TripStatusBadge status={t.status} />
                          </TD>
                          <TD className="text-muted-foreground">{formatDateTime(t.createdAt)}</TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Today's Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <EmptyState icon={DollarSign} title="No expenses today" />
                ) : (
                  <>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                          >
                            {pieData.map((d) => (
                              <Cell key={d.name} fill={EXPENSE_COLORS[d.name]} />
                            ))}
                          </Pie>
                          <RTooltip formatter={(v: number) => formatCurrency(v)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-3 space-y-2">
                      {pieData.map((d) => (
                        <div key={d.name} className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2">
                            <span
                              className="size-3 rounded-full"
                              style={{ background: EXPENSE_COLORS[d.name] }}
                            />
                            {d.name}
                          </span>
                          <span className="font-medium">{formatCurrency(d.value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Vehicles in Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                {data.vehiclesInMaintenance.length === 0 ? (
                  <EmptyState icon={Wrench} title="No open maintenance" />
                ) : (
                  <ul className="space-y-3">
                    {data.vehiclesInMaintenance.map((m) => (
                      <li key={m.id} className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium">
                            {m.vehicle.name}{' '}
                            <span className="text-muted-foreground">
                              ({m.vehicle.registrationNo})
                            </span>
                          </p>
                          <p className="text-sm text-muted-foreground">{m.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(m.cost)}</p>
                          <p className="text-xs text-muted-foreground">
                            since {formatDate(m.openedAt)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Expiring Licenses (next 30 days)</CardTitle>
              </CardHeader>
              <CardContent>
                {data.expiringLicenses.length === 0 ? (
                  <EmptyState icon={CircleCheck} title="All licenses current" />
                ) : (
                  <ul className="space-y-3">
                    {data.expiringLicenses.map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle
                            className={d.expired ? 'size-4 text-red-500' : 'size-4 text-amber-500'}
                          />
                          <div>
                            <Link to="/drivers" className="font-medium hover:underline">
                              {d.name}
                            </Link>
                            <p className="text-sm text-muted-foreground">{d.licenseNumber}</p>
                          </div>
                        </div>
                        <Badge tone={d.expired ? 'danger' : 'warning'}>
                          {d.expired
                            ? `Expired ${formatDate(d.licenseExpiryDate)}`
                            : `${d.daysUntilExpiry}d left`}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
