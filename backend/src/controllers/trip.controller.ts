import { Request, Response } from 'express';
import { TripService } from '../services/trip.service';
import { getQuery } from '../middleware/validate';

export const TripController = {
  async list(req: Request, res: Response) {
    res.json(await TripService.list(getQuery(req)));
  },
  async active(_req: Request, res: Response) {
    res.json(await TripService.listActive());
  },
  async getById(req: Request, res: Response) {
    res.json(await TripService.getById(req.params.id));
  },
  async create(req: Request, res: Response) {
    res.status(201).json(await TripService.create(req.body));
  },
  async dispatch(req: Request, res: Response) {
    res.json(await TripService.dispatch(req.params.id));
  },
  async complete(req: Request, res: Response) {
    res.json(await TripService.complete(req.params.id, req.body));
  },
  async cancel(req: Request, res: Response) {
    res.json(await TripService.cancel(req.params.id));
  },
  async pendingSafetyReview(req: Request, res: Response) {
    res.json(await TripService.listPendingSafetyReview());
  },
  async review(req: Request, res: Response) {
    const reviewerId = req.user!.userId;
    res.status(201).json(await TripService.createSafetyReview(req.params.id, reviewerId, req.body));
  },
};
