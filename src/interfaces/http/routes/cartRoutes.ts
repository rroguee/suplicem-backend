import { Router } from "express";
import { CartController } from "../controllers/CartController";
import { authenticate } from "../middlewares/authenticate";

export const cartRoutes = (router: Router) => {
  const cartController = new CartController();

  router.post("/cart", authenticate, async (req, res) => {
    await cartController.add(req, res);
  });

  router.get("/cart", authenticate, async (req, res) => {
    await cartController.get(req, res);
  });

  router.delete("/cart/:productId", authenticate, async (req, res) => {
    await cartController.remove(req, res);
  });
};
