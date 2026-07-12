import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { startOfToday } from './eligibility';
import { DashboardQuery } from '../validation/schemas';

const EXPIRY_WINDOW_DAYS = 30;

export const DashboardService = {
  async get(filters: DashboardQuery) {
    // Vehicle scope from optional type/status/region filters.
    const vehicleWhere: Prisma.VehicleWhereInput = { isActive: true };
    if (filters.type) vehicleWhere.type = { equals: filters.type, mode: 'insensitive' };
    if (filters.region) vehicleWhere.region = { equals: filters.region, mode: 'insensitive' };
    if (filters.status) vehicleWhere.status = filters.status;

    // Trips scoped to the same vehicle filter (via relation) when type/region set.
    const tripVehicleFilter: Prisma.VehicleWhereInput = {};
    if (filters.type) tripVehicleFilter.type = { equals: filters.type, mode: 'insensitive' };
    if (filters.region) tripVehicleFilter.region = { equals: filters.region, mode: 'insensitive' };
    const tripWhere: Prisma.TripWhereInput =
      Object.keys(tripVehicleFilter).length > 0 ? { vehicle: tripVehicleFilter } : {};

    const activeFleetWhere: Prisma.VehicleWhereInput = {
      ...vehicleWhere,
      status: filters.status ?? { not: 'RETIRED' },
    };

    const now = new Date();
    const expiryCutoff = new Date();
    expiryCutoff.setDate(expiryCutoff.getDate() + EXPIRY_WINDOW_DAYS);

    const [
      activeVehicles,
      availableVehicles,
      vehiclesInMaintenanceCount,
      onTripVehicles,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      recentTrips,
      maintenanceLogs,
      expiringLicenses,
      todaysExpenses,
      todaysFuel,
    ] = await Promise.all([
      // KPIs
      prisma.vehicle.count({ where: activeFleetWhere }),
      prisma.vehicle.count({ where: { ...vehicleWhere, status: 'AVAILABLE' } }),
      prisma.vehicle.count({ where: { ...vehicleWhere, status: 'IN_SHOP' } }),
      prisma.vehicle.count({ where: { ...vehicleWhere, status: 'ON_TRIP' } }),
      prisma.trip.count({ where: { ...tripWhere, status: 'DISPATCHED' } }),
      prisma.trip.count({ where: { ...tripWhere, status: 'DRAFT' } }),
      prisma.driver.count({
        where: { isActive: true, status: { in: ['AVAILABLE', 'ON_TRIP'] } },
      }),
      // Widgets
      prisma.trip.findMany({
        where: tripWhere,
        include: {
          vehicle: { select: { id: true, name: true, registrationNo: true } },
          driver: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
      prisma.maintenanceLog.findMany({
        where: { isActive: true, ...(Object.keys(vehicleWhere).length ? { vehicle: vehicleWhere } : {}) },
        include: { vehicle: { select: { id: true, name: true, registrationNo: true, region: true } } },
        orderBy: { openedAt: 'desc' },
      }),
      prisma.driver.findMany({
        where: { isActive: true, licenseExpiryDate: { lte: expiryCutoff } },
        orderBy: { licenseExpiryDate: 'asc' },
        select: {
          id: true,
          name: true,
          licenseNumber: true,
          licenseCategory: true,
          licenseExpiryDate: true,
          status: true,
        },
      }),
      prisma.expense.groupBy({
        by: ['type'],
        where: { date: { gte: startOfToday() }, ...(Object.keys(vehicleWhere).length ? { vehicle: vehicleWhere } : {}) },
        _sum: { amount: true },
      }),
      prisma.fuelLog.aggregate({
        where: { date: { gte: startOfToday() }, ...(Object.keys(vehicleWhere).length ? { vehicle: vehicleWhere } : {}) },
        _sum: { liters: true },
      }),
    ]);

    // Fleet utilization % = ON_TRIP / active-non-retired fleet * 100 (spec Section 10).
    const fleetUtilizationPct =
      activeVehicles > 0 ? Math.round((onTripVehicles / activeVehicles) * 1000) / 10 : 0;

    const breakdown = { TOLL: 0, MAINTENANCE: 0, OTHER: 0 } as Record<string, number>;
    for (const row of todaysExpenses) {
      breakdown[row.type] = row._sum.amount ?? 0;
    }
    const total = breakdown.TOLL + breakdown.MAINTENANCE + breakdown.OTHER;

    // Flag which expiring licenses are already expired for the UI.
    const expiring = expiringLicenses.map((d) => ({
      ...d,
      expired: d.licenseExpiryDate < startOfToday(),
      daysUntilExpiry: Math.ceil(
        (d.licenseExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      ),
    }));

    return {
      kpis: {
        activeVehicles,
        availableVehicles,
        vehiclesInMaintenance: vehiclesInMaintenanceCount,
        activeTrips,
        pendingTrips,
        driversOnDuty,
        fleetUtilizationPct,
        todaysFuelLiters: todaysFuel._sum.liters ?? 0,
      },
      recentTrips,
      vehiclesInMaintenance: maintenanceLogs,
      expiringLicenses: expiring,
      todaysExpenses: { total, breakdown },
    };
  },
};
