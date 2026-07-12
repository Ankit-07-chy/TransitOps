import { Link } from 'react-router-dom';
import {
  BarChart3,
  DollarSign,
  Fuel,
  Receipt,
  TrendingUp,
  Wallet,
  Wrench,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/shared/PageHeader';
import { KpiCard } from '@/components/shared/KpiCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingState } from '@/components/ui/spinner';
import { ExpenseTypeBadge } from '@/components/shared/StatusBadge';
import { Table, TBody, TD, TH, THead, TR } from '@/components/ui/table';
import { api } from '@/lib/api';
import { useApi } from '@/lib/useApi';
import { FinanceDashboardData } from '@/lib/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';

const EXPENSE_COLORS: Record<string, string> = {
  TOLL: '#0ea5e9',
  MAINTENANCE: '#f59e0b',
  OTHER: '#8b5cf6',
};

export function FinancialAnalystDashboard() {
  const { data, loading, error } = useApi<FinanceDashboardData>(() => api.get('/dashboard'), []);

  const pieData = data
    ? Object.entries(data.monthExpenseBreakdown)
        .map(([name, value]) => ({ name, value }))
        .filter((d) => d.value > 0)
    : [];

  return (
    <div>
      <PageHeader
        title="Finance Dashboard"
        subtitle="Operational spend, revenue, and cost per vehicle (month to date)"
        actions={
          <Link to="/reports">
            <Button>
              <BarChart3 /> Full Reports
            </Button>
          </Link>
        }
      />

      {loading && <LoadingState />}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {data && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <KpiCard
              label="Today's Expenses"
              value={formatCurrency(data.kpis.todaysExpensesTotal)}
              icon={Receipt}
              accent="danger"
            />
            <KpiCard
              label="Expenses (Month)"
              value={formatCurrency(data.kpis.monthExpenses)}
              icon={Wallet}
              accent="warning"
            />
            <KpiCard
              label="Fuel Cost (Month)"
              value={formatCurrency(data.kpis.monthFuelCost)}
              icon={Fuel}
              accent="info"
            />
            <KpiCard
              label="Maintenance (Month)"
              value={formatCurrency(data.kpis.monthMaintenanceCost)}
              icon={Wrench}
              accent="warning"
            />
            <KpiCard
              label="Operational Cost (Month)"
              value={formatCurrency(data.kpis.monthOperationalCost)}
              icon={DollarSign}
              accent="danger"
              hint="Expenses + fuel + maintenance"
            />
            <KpiCard
              label="Revenue (Month)"
              value={formatCurrency(data.kpis.monthRevenue)}
              icon={TrendingUp}
              accent="success"
              hint="From completed trips"
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Expense Breakdown (Month)</CardTitle>
              </CardHeader>
              <CardContent>
                {pieData.length === 0 ? (
                  <EmptyState icon={DollarSign} title="No expenses this month" />
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

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Costliest Vehicles (Month)</CardTitle>
              </CardHeader>
              <CardContent>
                {data.costPerVehicle.length === 0 ? (
                  <EmptyState icon={BarChart3} title="No vehicle costs this month" />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.costPerVehicle} margin={{ left: 8, right: 8 }}>
                        <XAxis dataKey="registrationNo" fontSize={12} tickLine={false} />
                        <YAxis fontSize={12} tickLine={false} axisLine={false} />
                        <RTooltip formatter={(v: number) => formatCurrency(v)} />
                        <Bar dataKey="fuelCost" name="Fuel" stackId="c" fill="#0ea5e9" />
                        <Bar
                          dataKey="maintenanceCost"
                          name="Maintenance"
                          stackId="c"
                          fill="#f59e0b"
                        />
                        <Bar
                          dataKey="expenseCost"
                          name="Expenses"
                          stackId="c"
                          fill="#8b5cf6"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              {data.recentExpenses.length === 0 ? (
                <EmptyState icon={Receipt} title="No expenses recorded" />
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Type</TH>
                      <TH>Amount</TH>
                      <TH>Vehicle</TH>
                      <TH>Driver</TH>
                      <TH>Notes</TH>
                      <TH>Date</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {data.recentExpenses.map((e) => (
                      <TR key={e.id}>
                        <TD>
                          <ExpenseTypeBadge type={e.type} />
                        </TD>
                        <TD className="font-semibold">{formatCurrency(e.amount)}</TD>
                        <TD>{e.vehicle?.registrationNo ?? '—'}</TD>
                        <TD>{e.driver?.name ?? '—'}</TD>
                        <TD className="text-muted-foreground">{e.notes || '—'}</TD>
                        <TD className="text-muted-foreground">{formatDateTime(e.date)}</TD>
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
