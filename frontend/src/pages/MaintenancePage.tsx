import { FormEvent, useEffect, useState } from 'react';
import { Plus, Wrench } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Input, Label, Select } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/spinner';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
import { api, ApiError } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { MaintenanceLog, Vehicle } from '@/lib/types';
import { can } from '@/lib/permissions';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatDate } from '@/lib/utils';

export function MaintenancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const canManage = can.manageMaintenance(user?.role);

  const [filter, setFilter] = useState('open');
  const isActive = filter === 'open' ? true : filter === 'closed' ? false : undefined;

  const { data, loading, error, refetch } = useApi<MaintenanceLog[]>(
    () => api.get('/maintenance', isActive === undefined ? {} : { isActive }),
    [filter],
  );

  const [openDialog, setOpenDialog] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [form, setForm] = useState({ vehicleId: '', description: '', cost: '' });
  const [saving, setSaving] = useState(false);
  const [closeTarget, setCloseTarget] = useState<MaintenanceLog | null>(null);

  useEffect(() => {
    if (!openDialog) return;
    void api
      .get<Vehicle[]>('/vehicles')
      .then((v) => setVehicles(v.filter((x) => x.status !== 'RETIRED')))
      .catch(() => toast('Failed to load vehicles', 'error'));
  }, [openDialog, toast]);

  const openLog = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/maintenance', {
        vehicleId: form.vehicleId,
        description: form.description,
        cost: Number(form.cost),
      });
      toast('Maintenance opened — vehicle set to In Shop');
      setOpenDialog(false);
      setForm({ vehicleId: '', description: '', cost: '' });
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to open maintenance', 'error');
    } finally {
      setSaving(false);
    }
  };

  const closeLog = async () => {
    if (!closeTarget) return;
    try {
      await api.patch(`/maintenance/${closeTarget.id}/close`);
      toast('Maintenance closed — vehicle restored');
      refetch();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to close', 'error');
    }
  };

  return (
    <div>
      <PageHeader
        title="Maintenance"
        subtitle="Open and close maintenance logs — vehicle status stays in sync"
        actions={
          canManage && (
            <Button onClick={() => setOpenDialog(true)}>
              <Plus /> Open Maintenance
            </Button>
          )
        }
      />

      <Card className="mb-4 p-4">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-52">
          <option value="open">Open (In Shop)</option>
          <option value="closed">Closed</option>
          <option value="all">All</option>
        </Select>
      </Card>

      <Card>
        {loading ? (
          <LoadingState />
        ) : error ? (
          <p className="p-6 text-sm text-destructive">{error}</p>
        ) : !data || data.length === 0 ? (
          <EmptyState
            icon={Wrench}
            title="No maintenance logs"
            description="Open a maintenance log to move a vehicle into the shop."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Vehicle</TH>
                <TH>Description</TH>
                <TH>Cost</TH>
                <TH>Opened</TH>
                <TH>Closed</TH>
                <TH>State</TH>
                {canManage && <TH className="text-right">Actions</TH>}
              </TR>
            </THead>
            <TBody>
              {data.map((m) => (
                <TR key={m.id}>
                  <TD className="font-medium">
                    {m.vehicle.registrationNo}
                    <span className="ml-1 text-muted-foreground">({m.vehicle.name})</span>
                  </TD>
                  <TD>{m.description}</TD>
                  <TD>{formatCurrency(m.cost)}</TD>
                  <TD className="text-muted-foreground">{formatDate(m.openedAt)}</TD>
                  <TD className="text-muted-foreground">{formatDate(m.closedAt)}</TD>
                  <TD>
                    <Badge tone={m.isActive ? 'warning' : 'success'}>
                      {m.isActive ? 'Open' : 'Closed'}
                    </Badge>
                  </TD>
                  {canManage && (
                    <TD className="text-right">
                      {m.isActive ? (
                        <Button variant="outline" size="sm" onClick={() => setCloseTarget(m)}>
                          Close
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TD>
                  )}
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </Card>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        title="Open Maintenance Log"
        description="A vehicle that is On Trip must finish its trip first."
      >
        <form onSubmit={openLog} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Vehicle</Label>
            <Select
              value={form.vehicleId}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              required
            >
              <option value="">Select vehicle…</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} disabled={v.status !== 'AVAILABLE'}>
                  {v.registrationNo} — {v.name}
                  {v.status !== 'AVAILABLE' ? ` (${v.status})` : ''}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Oil change, brake pads…"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Cost</Label>
            <Input
              type="number"
              min="0"
              step="any"
              value={form.cost}
              onChange={(e) => setForm({ ...form, cost: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpenDialog(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Opening…' : 'Open & set In Shop'}
            </Button>
          </div>
        </form>
      </Dialog>

      <ConfirmDialog
        open={!!closeTarget}
        onClose={() => setCloseTarget(null)}
        onConfirm={closeLog}
        title="Close maintenance?"
        message={`Closing this log will restore ${closeTarget?.vehicle.registrationNo} to Available (unless it has been retired).`}
        confirmLabel="Close log"
      />
    </div>
  );
}
