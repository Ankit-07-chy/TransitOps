import { Link } from 'react-router-dom';
import {
  Activity,
  BadgeCheck,
  CalendarClock,
  Fuel,
  MapPin,
  Route as RouteIcon,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/spinner';
import { TripStatusBadge, DriverStatusBadge } from '@/components/shared/StatusBadge';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { api } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { DriverDashboardData } from '@/lib/types';
import { formatDate, formatDateTime, formatNumber } from '@/lib/utils';

export function DriverDashboard() {
  const { data, loading, error } = useApi<DriverDashboardData>(() => api.get('/dashboard'), []);

  return (
    <div>
      <PageHeader
        title="My Dashboard"
        subtitle="Your trips, assigned vehicle, and safety profile"
        actions={
          <Link to="/trips">
            <Button>
              <RouteIcon /> My Trips
            </Button>
          </Link>
        }
      />

      {loading && <LoadingState />}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <KpiCard label="My Trips" value={data.kpis.totalTrips} icon={RouteIcon} />
            <KpiCard
              label="Completed"
              value={data.kpis.completedTrips}
              icon={BadgeCheck}
              accent="success"
              hint={`${data.kpis.draftTrips} draft pending`}
            />
            <KpiCard
              label="Distance Driven"
              value={`${formatNumber(data.kpis.totalDistance)} km`}
              icon={MapPin}
              accent="info"
            />
            <KpiCard
              label="Safety Score"
              value={data.kpis.safetyScore}
              icon={ShieldCheck}
              accent={data.kpis.safetyScore >= 70 ? 'success' : 'danger'}
              hint="Rolling average of trip reviews"
            />
            <KpiCard
              label="License Status"
              value={
                data.kpis.licenseExpired ? 'Expired' : `${data.kpis.licenseDaysLeft}d left`
              }
              icon={CalendarClock}
              accent={
                data.kpis.licenseExpired
                  ? 'danger'
                  : data.kpis.licenseDaysLeft <= 30
                    ? 'warning'
                    : 'success'
              }
              hint={`Expires ${formatDate(data.profile.licenseExpiryDate)}`}
            />
            <KpiCard
              label="On Trip Now"
              value={data.kpis.onTrip ? 'Yes' : 'No'}
              icon={Activity}
              accent={data.kpis.onTrip ? 'info' : 'primary'}
            />
            <KpiCard
              label="Fuel Logged Today"
              value={`${formatNumber(data.todaysFuel.liters, 1)} L`}
              icon={Fuel}
              accent="warning"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Current Trip</CardTitle>
              </CardHeader>
              <CardContent>
                {!data.activeTrip ? (
                  <EmptyState
                    icon={Truck}
                    title="No active trip"
                    description="You have no dispatched trip right now."
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-lg font-bold">{data.activeTrip.tripNumber}</span>
                      <TripStatusBadge status={data.activeTrip.status} />
                    </div>
                    <p className="text-muted-foreground">
                      {data.activeTrip.source} → {data.activeTrip.destination}
                    </p>
                    <div className="grid gap-2 sm:grid-cols-2 text-sm">
                      <p>
                        <span className="text-muted-foreground">Vehicle:</span>{' '}
                        <span className="font-medium">
                          {data.activeTrip.vehicle.name} ({data.activeTrip.vehicle.registrationNo})
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Cargo:</span>{' '}
                        <span className="font-medium">
                          {formatNumber(data.activeTrip.cargoWeight)} kg
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Planned distance:</span>{' '}
                        <span className="font-medium">
                          {formatNumber(data.activeTrip.plannedDistance)} km
                        </span>
                      </p>
                      <p>
                        <span className="text-muted-foreground">Dispatched:</span>{' '}
                        <span className="font-medium">
                          {formatDateTime(data.activeTrip.dispatchedAt)}
                        </span>
                      </p>
                    </div>
                    <Link to="/trips" className="inline-block">
                      <Button variant="outline" size="sm">
                        Manage trip
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>My Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3 text-sm">
                  <ProfileRow label="Name" value={data.profile.name} />
                  <ProfileRow label="License No" value={data.profile.licenseNumber} />
                  <ProfileRow label="Category" value={data.profile.licenseCategory} />
                  <ProfileRow
                    label="License Expiry"
                    value={
                      <Badge tone={data.kpis.licenseExpired ? 'danger' : 'success'}>
                        {formatDate(data.profile.licenseExpiryDate)}
                      </Badge>
                    }
                  />
                  <ProfileRow label="Contact" value={data.profile.contactNumber} />
                  <ProfileRow
                    label="Status"
                    value={<DriverStatusBadge status={data.profile.status} />}
                  />
                </dl>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>My Recent Trips</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentTrips.length === 0 ? (
                <EmptyState icon={RouteIcon} title="No trips yet" />
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Trip</TH>
                      <TH>Route</TH>
                      <TH>Vehicle</TH>
                      <TH>Cargo</TH>
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
                        <TD>{formatNumber(t.cargoWeight)} kg</TD>
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
        </div>
      )}
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}
