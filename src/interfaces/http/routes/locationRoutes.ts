import { Router } from "express";
import { LocationController } from "../controllers/LocationController";
import { authenticate } from "../middlewares/authenticate";

export const locationRoutes = (router: Router) => {
  const locationController = new LocationController();

  router.post("/location", authenticate, async (req, res) => {
    await locationController.update(req, res);
  });

  router.get("/location/:driverId", authenticate, async (req, res) => {
    await locationController.get(req, res);
  });
};
