import { Router } from "express";
import { OrderController } from "../controllers/OrderController";
import { authenticate } from "../middlewares/authenticate";
import multer from "multer";
const upload = multer({ storage: multer.memoryStorage() });

export const orderRoutes = (router: Router) => {
  const orderController = new OrderController();

  router.post("/orders", authenticate, async (req, res) => {
    await orderController.create(req, res);
  });

  router.get("/orders/my", authenticate, async (req, res) => {
    await orderController.getMyOrders(req, res);
  });

  router.get("/orders", authenticate, async (req, res) => {
    await orderController.getAll(req, res);
  });

  router.get("/orders/:id", authenticate, async (req, res) => {
    await orderController.getById(req, res);
  });

  router.patch("/orders/:id/status", authenticate, async (req, res) => {
    await orderController.updateStatus(req, res);
  });

  router.patch(
    "/orders/:id/deliveries/:index",
    authenticate,
    async (req, res) => {
      await orderController.completeDelivery(req, res);
    }
  );

  router.patch(
    "/orders/:id/deliveries/:index/attachment",
    authenticate,
    upload.single("image"),
    async (req, res) => {
      await orderController.attachToDelivery(req, res);
    }
  );
};
