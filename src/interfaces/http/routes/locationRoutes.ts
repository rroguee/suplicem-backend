import { validate, validateParams } from "../middlewares/validate";
import { UpdateLocationSchema, DriverLocationParamSchema } from "../schemas/locationSchemas";
import { Router } from "express";
import { LocationController } from "../controllers/LocationController";
import { authenticate } from "../middlewares/authenticate";
import { requireRole } from "../middlewares/authorize";
import { locationLimiter } from "../middlewares/rateLimiter";

export const locationRoutes = (router: Router) => {
  const locationController = new LocationController();

  router.post(
    "/location",
    locationLimiter,
    authenticate,
    requireRole(["driver"]),
    validate(UpdateLocationSchema),
    async (req, res) => {
      await locationController.update(req, res);
    }
  );

  router.get(
    "/location/:driverId",
    authenticate,
    validateParams(DriverLocationParamSchema),
    async (req, res) => {
      await locationController.get(req, res);
    }
  );
};
