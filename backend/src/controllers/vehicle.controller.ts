import { Request, Response } from 'express';
import { VehicleService } from '../services/vehicle.service';
import { getQuery } from '../middleware/validate';

export const VehicleController = {
  async list(req: Request, res: Response) {
    const vehicles = await VehicleService.list(getQuery(req));
    res.json(vehicles);
  },
  async available(_req: Request, res: Response) {
    res.json(await VehicleService.listAvailableForDispatch());
  },
  async getById(req: Request, res: Response) {
    res.json(await VehicleService.getById(req.params.id));
  },
  async create(req: Request, res: Response) {
    res.status(201).json(await VehicleService.create(req.body));
  },
  async update(req: Request, res: Response) {
    res.json(await VehicleService.update(req.params.id, req.body));
  },
  async retire(req: Request, res: Response) {
    res.json(await VehicleService.retire(req.params.id));
  },
};
