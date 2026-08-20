import { Router } from "express";
import { TripController } from "../controllers/TripController";
import { authenticate } from "../middlewares/authenticate";

export const tripRoutes = (router: Router) => {
  const tripController = new TripController();

  router.post("/trips", authenticate, async (req, res) => {
    await tripController.create(req, res);
  });

  router.post("/trips/status/update", authenticate, async (req, res) => {
    await tripController.updateTripStatus(req, res);
  });

  router.get("/trips", authenticate, async (req, res) => {
    await tripController.getAll(req, res);
  });

  router.get("/trips/available", authenticate, async (req, res) => {
    await tripController.getAvailable(req, res);
  });

  router.get("/trips/driver/history", authenticate, async (req, res) => {
    await tripController.getDriverTripHistory(req, res);
  });

  router.get("/trips/driver/actual", authenticate, async (req, res) => {
    await tripController.getDriverActualTrips(req, res);
  });

  router.patch("/trips/:id/accept", authenticate, async (req, res) => {
    await tripController.accept(req, res);
  });

  router.get("/trips/:id", authenticate, async (req, res) => {
    await tripController.getById(req, res);
  });
  router.get("/trips/order/:id", authenticate, async (req, res) => {
    await tripController.getTripByOrderId(req, res);
  });
};
