import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { authenticate } from "../middlewares/authenticate";

export const authRoutes = (router: Router) => {
  const authController = new AuthController();

  router.post("/auth/login", (req, res) => authController.login(req, res));
  router.post("/auth/refresh-token", (req, res) =>
    authController.refreshToken(req, res)
  );
  router.get("/auth/me", authenticate, (req, res) =>
    authController.getCurrentUser(req, res)
  );
  router.post("/auth/recover-password", (req, res) =>
    authController.recoverPassword(req, res)
  );
};
