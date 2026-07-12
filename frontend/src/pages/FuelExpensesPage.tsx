import { FormEvent, useEffect, useMemo, useState } from 'react';
import { DollarSign, Droplet, Fuel, Plus, Wrench } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { ExpenseTypeBadge } from '@/components/shared/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Input, Label, Select, Textarea } from '@/components/ui/input';
import { LoadingState } from '@/components/ui/spinner';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { useToast } from '@/components/ui/toast';
import { api, ApiError } from '@/lib/api';
import { Expense, FuelLog, MaintenanceLog, Vehicle } from '@/lib/types';
import { can } from '@/lib/permissions';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils';

export function FuelExpensesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const canLogFuel = can.logFuel(user?.role);
  const canLogExpense = can.manageExpenses(user?.role);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceLog[]>([]);
  const [loading, setLoading] = useState(false);

  const [fuelOpen, setFuelOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [fuelForm, setFuelForm] = useState({ liters: '', cost: '' });
  const [expenseForm, setExpenseForm] = useState({ type: 'TOLL', amount: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void api
      .get<Vehicle[]>('/vehicles')
      .then((v) => {
        setVehicles(v);
        if (v.length && !vehicleId) setVehicleId(v[0].id);
      })
      .catch(() => toast('Failed to load vehicles', 'error'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = useMemo(
    () => async (id: string) => {
      if (!id) return;
      setLoading(true);
      try {
        const [f, e, m] = await Promise.all([
          api.get<FuelLog[]>(`/fuel-logs/${id}`),
          api.get<Expense[]>(`/expenses/${id}`),
          api.get<MaintenanceLog[]>(`/maintenance/${id}`),
        ]);
        setFuelLogs(f);
        setExpenses(e);
        setMaintenance(m);
      } catch (err) {
        toast(err instanceof ApiError ? err.message : 'Failed to load', 'error');
      } finally {
        setLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    if (vehicleId) void loadData(vehicleId);
  }, [vehicleId, loadData]);

  const fuelCost = fuelLogs.reduce((s, f) => s + f.cost, 0);
  const expenseCost = expenses.reduce((s, e) => s + e.amount, 0);
  const maintenanceCost = maintenance.reduce((s, m) => s + m.cost, 0);
  const operationalCost = fuelCost + expenseCost + maintenanceCost;

  const logFuel = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/fuel-logs', {
        vehicleId,
        liters: Number(fuelForm.liters),
        cost: Number(fuelForm.cost),
      });
      toast('Fuel logged');
      setFuelOpen(false);
      setFuelForm({ liters: '', cost: '' });
      void loadData(vehicleId);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to log fuel', 'error');
    } finally {
      setSaving(false);
    }
  };

  const logExpense = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/expenses', {
        vehicleId,
        type: expenseForm.type,
        amount: Number(expenseForm.amount),
        notes: expenseForm.notes || undefined,
      });
      toast('Expense logged');
      setExpenseOpen(false);
      setExpenseForm({ type: 'TOLL', amount: '', notes: '' });
      void loadData(vehicleId);
    } catch (err) {
      toast(err instanceof ApiError ? err.message : 'Failed to log expense', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Fuel & Expenses"
        subtitle="Log fuel and expenses; track running operational cost per vehicle"
      />

      <Card className="mb-4 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Label className="shrink-0">Vehicle</Label>
          <Select
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
            className="w-72"
          >
            {vehicles.map((v) => (
              <option key={v.id} value={v.id}>
                {v.registrationNo} — {v.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <CostTile label="Fuel Cost" value={fuelCost} icon={Droplet} accent="text-sky-500" />
        <CostTile
          label="Maintenance Cost"
          value={maintenanceCost}
          icon={Wrench}
          accent="text-amber-500"
        />
        <CostTile
          label="Other Expenses"
          value={expenseCost}
          icon={DollarSign}
          accent="text-violet-500"
        />
        <CostTile
          label="Operational Cost"
          value={operationalCost}
          icon={DollarSign}
          accent="text-primary"
          bold
        />
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Fuel Logs</CardTitle>
              {canLogFuel && (
                <Button size="sm" onClick={() => setFuelOpen(true)}>
                  <Plus /> Log Fuel
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {fuelLogs.length === 0 ? (
                <EmptyState icon={Fuel} title="No fuel logs" />
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Date</TH>
                      <TH>Liters</TH>
                      <TH>Cost</TH>
                      <TH>Trip</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {fuelLogs.map((f) => (
                      <TR key={f.id}>
                        <TD>{formatDate(f.date)}</TD>
                        <TD>{formatNumber(f.liters, 1)} L</TD>
                        <TD>{formatCurrency(f.cost)}</TD>
                        <TD className="text-muted-foreground">{f.trip?.tripNumber ?? '—'}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Expenses</CardTitle>
              {canLogExpense && (
                <Button size="sm" onClick={() => setExpenseOpen(true)}>
                  <Plus /> Log Expense
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <EmptyState icon={DollarSign} title="No expenses" />
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Date</TH>
                      <TH>Type</TH>
                      <TH>Amount</TH>
                      <TH>Notes</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {expenses.map((ex) => (
                      <TR key={ex.id}>
                        <TD>{formatDate(ex.date)}</TD>
                        <TD>
                          <ExpenseTypeBadge type={ex.type} />
                        </TD>
                        <TD>{formatCurrency(ex.amount)}</TD>
                        <TD className="text-muted-foreground">{ex.notes ?? '—'}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={fuelOpen} onClose={() => setFuelOpen(false)} title="Log Fuel">
        <form onSubmit={logFuel} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Liters</Label>
            <Input
              type="number"
              min="0"
              step="any"
              value={fuelForm.liters}
              onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Cost</Label>
            <Input
              type="number"
              min="0"
              step="any"
              value={fuelForm.cost}
              onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setFuelOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Log fuel'}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={expenseOpen} onClose={() => setExpenseOpen(false)} title="Log Expense">
        <form onSubmit={logExpense} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select
              value={expenseForm.type}
              onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value })}
            >
              <option value="TOLL">Toll</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="OTHER">Other</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input
              type="number"
              min="0"
              step="any"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea
              value={expenseForm.notes}
              onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setExpenseOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Log expense'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

function CostTile({
  label,
  value,
  icon: Icon,
  accent,
  bold,
}: {
  label: string;
  value: number;
  icon: typeof DollarSign;
  accent: string;
  bold?: boolean;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className={`size-4 ${accent}`} />
        {label}
      </div>
      <p className={`mt-2 text-2xl ${bold ? 'font-bold' : 'font-semibold'}`}>
        {formatCurrency(value)}
      </p>
    </Card>
  );
}
