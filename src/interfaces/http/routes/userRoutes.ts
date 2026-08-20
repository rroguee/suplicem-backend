import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { authenticate } from "../middlewares/authenticate";

export const userRoutes = (router: Router) => {
  const userController = new UserController();

  router.post("/users", (req, res) => userController.create(req, res));
  router.patch("/users/update", (req, res) =>
    userController.updateUser(req, res)
  );
  router.patch("/users/status", (req, res) =>
    userController.updateStatus(req, res)
  );
  router.get("/users", authenticate, (req, res) =>
    userController.getAll(req, res)
  );
};
