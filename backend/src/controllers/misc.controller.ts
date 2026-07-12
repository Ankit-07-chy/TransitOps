import { Request, Response } from 'express';
import { MaintenanceService } from '../services/maintenance.service';
import { FuelService } from '../services/fuel.service';
import { ExpenseService } from '../services/expense.service';
import { DashboardService } from '../services/dashboard.service';
import { ReportService } from '../services/report.service';
import { getQuery } from '../middleware/validate';

export const MaintenanceController = {
  async list(req: Request, res: Response) {
    const { isActive } = getQuery<{ isActive?: boolean }>(req);
    res.json(await MaintenanceService.list(isActive));
  },
  async listForVehicle(req: Request, res: Response) {
    res.json(await MaintenanceService.listForVehicle(req.params.vehicleId));
  },
  async open(req: Request, res: Response) {
    res.status(201).json(await MaintenanceService.open(req.body));
  },
  async close(req: Request, res: Response) {
    res.json(await MaintenanceService.close(req.params.id));
  },
};

export const FuelController = {
  async listForVehicle(req: Request, res: Response) {
    res.json(await FuelService.listForVehicle(req.params.vehicleId));
  },
  async listAll(req: Request, res: Response) {
    res.json(await FuelService.listAll());
  },
  async create(req: Request, res: Response) {
    res.status(201).json(await FuelService.create(req.body));
  },
};

export const ExpenseController = {
  async listForVehicle(req: Request, res: Response) {
    res.json(await ExpenseService.listForVehicle(req.params.vehicleId));
  },
  async listAll(req: Request, res: Response) {
    res.json(await ExpenseService.listAll(getQuery(req)));
  },
  async create(req: Request, res: Response) {
    res.status(201).json(await ExpenseService.create(req.body));
  },
};

export const DashboardController = {
  async get(req: Request, res: Response) {
    res.json(await DashboardService.get(getQuery(req)));
  },
};

export const ReportController = {
  async get(req: Request, res: Response) {
    res.json(await ReportService.build(getQuery(req)));
  },
  async exportCsv(req: Request, res: Response) {
    const csv = await ReportService.toCsv(getQuery(req));
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="transitops-report.csv"');
    res.send(csv);
  },
};
