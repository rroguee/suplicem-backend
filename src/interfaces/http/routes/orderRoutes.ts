import { Router } from "express";
import { normalizeOrderData } from "../middlewares/normalizeOrderData";
import { OrderController } from "../controllers/OrderController";
import { authenticate } from "../middlewares/authenticate";
import { requireRole } from "../middlewares/authorize";
import { ordersLimiter } from "../middlewares/rateLimiter";
import { validate, validateParams, validateQuery } from "../middlewares/validate";
import {
  CreateOrderSchema,
  UpdateOrderStatusSchema,
  UpdateOrderDeliveriesSchema,
  OrderIdParamSchema,
  GetOrdersQuerySchema,
} from "../schemas/orderSchemas";
import { validateReceiptUpload } from "../middlewares/validateReceiptUpload";
import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB límite
});

export const orderRoutes = (router: Router) => {
  const orderController = new OrderController();
  router.get(
    "/orders/:id/tracking",
    authenticate,
    validateParams(OrderIdParamSchema),
    async (req, res) => {
      await orderController.getTracking(req, res);
    }
  );

  router.post(
    "/orders",
    ordersLimiter,
    authenticate,
    requireRole(["client", "seller", "admin"]),
    upload.single("receiptImage"),
    normalizeOrderData,
    validate(CreateOrderSchema),
    async (req, res) => {
      await orderController.create(req, res);
    }
  );

  // 2. Mis órdenes (Clientes)
  router.get("/orders/my", authenticate, async (req, res) => {
    await orderController.getMyOrders(req, res);
  });

  // 3. Ver todas las órdenes (Administradores y Vendedores)
  router.get(
    "/orders",
    authenticate,
    requireRole(["admin", "seller"]),
    validateQuery(GetOrdersQuerySchema),
    async (req, res) => {
      await orderController.getAll(req, res);
    }
  );

  // 3.1. Obtener plan sugerido de despacho (Administradores)
  router.get(
    "/orders/:id/dispatch-plan",
    authenticate,
    requireRole(["admin"]),
    validateParams(OrderIdParamSchema),
    async (req, res) => {
      await orderController.getDispatchPlan(req, res);
    }
  );

  // 4. Ver orden por ID (Cualquier usuario autenticado involucrado)
  router.get(
    "/orders/:id",
    authenticate,
    validateParams(OrderIdParamSchema),
    async (req, res) => {
      await orderController.getById(req, res);
    }
  );

  // 5. Aprobar o rechazar orden (Solo Administradores)
  router.patch(
    "/orders/:id/status",
    authenticate,
    requireRole(["admin"]),
    validateParams(OrderIdParamSchema),
    validate(UpdateOrderStatusSchema),
    async (req, res) => {
      await orderController.updateStatus(req, res);
    }
  );

  // 6. Asignar/actualizar entregas (Administradores)
  router.put(
    "/orders/:id/deliveries",
    authenticate,
    requireRole(["admin"]),
    validateParams(OrderIdParamSchema),
    validate(UpdateOrderDeliveriesSchema),
    async (req, res) => {
      await orderController.updateDeliveries(req, res);
    }
  );

  router.patch(
    "/orders/:id/deliveries",
    authenticate,
    requireRole(["admin"]),
    validateParams(OrderIdParamSchema),
    validate(UpdateOrderDeliveriesSchema),
    async (req, res) => {
      await orderController.updateDeliveries(req, res);
    }
  );

  // 7. Adjuntar o actualizar comprobante de transferencia (Clientes y Administradores)
  router.patch(
    "/orders/:id/receipt",
    authenticate,
    requireRole(["client", "admin"]),
    validateParams(OrderIdParamSchema),
    upload.single("receiptImage"),
    validateReceiptUpload,
    async (req, res) => {
      await orderController.updateReceipt(req, res);
    }
  );
};