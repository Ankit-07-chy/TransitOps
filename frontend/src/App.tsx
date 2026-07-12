import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/components/ui/toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { VehiclesPage } from '@/pages/VehiclesPage';
import { DriversPage } from '@/pages/DriversPage';
import { TripsPage } from '@/pages/TripsPage';
import { MaintenancePage } from '@/pages/MaintenancePage';
import { FuelExpensesPage } from '@/pages/FuelExpensesPage';
import { ReportsPage } from '@/pages/ReportsPage';

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/vehicles" element={<VehiclesPage />} />
                <Route path="/drivers" element={<DriversPage />} />
                <Route path="/trips" element={<TripsPage />} />
                <Route path="/maintenance" element={<MaintenancePage />} />
                <Route path="/fuel-expenses" element={<FuelExpensesPage />} />
                <Route path="/reports" element={<ReportsPage />} />
              </Route>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </ToastProvider>
    </ThemeProvider>
  );
}
