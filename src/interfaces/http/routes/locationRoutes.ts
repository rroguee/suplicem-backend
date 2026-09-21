import { validate } from "../middlewares/validate";
import { UpdateLocationSchema } from "../schemas/locationSchemas";
import { Router } from "express";
import { LocationController } from "../controllers/LocationController";
import { authenticate } from "../middlewares/authenticate";
import { requireRole } from "../middlewares/authorize";

export const locationRoutes = (router: Router) => {
  const locationController = new LocationController();

 router.post(
    "/location",
    authenticate,
    requireRole(["driver"]),
    validate(UpdateLocationSchema),
    async (req, res) => {
      await locationController.update(req, res);
    }
  );

  router.get("/location/:driverId", authenticate, async (req, res) => {
    await locationController.get(req, res);
  });
};
