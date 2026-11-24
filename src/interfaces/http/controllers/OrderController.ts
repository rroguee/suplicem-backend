import { Request, Response } from "express";
import { OrderFirestoreRepository } from "../../../infrastructure/firestore/OrderFirestoreRepository";
import { CreateOrderUseCase } from "../../../application/use-cases/order/CreateOrderUseCase";
import { GetMyOrdersUseCase } from "../../../application/use-cases/order/GetMyOrdersUseCase";
import { GetAllOrdersUseCase } from "../../../application/use-cases/order/GetAllOrdersUseCase";
import { UpdateOrderStatusUseCase } from "../../../application/use-cases/order/UpdateOrderStatusUseCase";
import { UpdateOrderDeliveriesUseCase } from "../../../application/use-cases/order/UpdateOrderDeliveriesUseCase";
import { UpdateOrderReceiptUseCase } from "../../../application/use-cases/order/UpdateOrderReceiptUseCase";
import { GetOrderDispatchPlanUseCase } from "../../../application/use-cases/order/GetOrderDispatchPlanUseCase";
import { uploadReceiptImage } from "../../../infrastructure/services/ImageStorageService";
import { GetOrderByIdUseCase } from "../../../application/use-cases/order/GetOrderByIdUseCase";
import { UserFirestoreRepository } from "../../../infrastructure/firestore/UserFirestoreRepository";
import { GetOrderTrackingUseCase } from "../../../application/use-cases/order/GetOrderTrackingUseCase";
import { LocationFirestoreRepository } from "../../../infrastructure/firestore/LocationFirestoreRepository";
import { ProductFirestoreRepository } from "../../../infrastructure/firestore/ProductFirestoreRepository";
import { TripFirestoreRepository } from "../../../infrastructure/firestore/TripFirestoreRepository";
import { IdempotencyFirestoreRepository } from "../../../infrastructure/firestore/IdempotencyFirestoreRepository";
import { NotificationFirestoreRepository } from "../../../infrastructure/firestore/NotificationFirestoreRepository";
import { NotificationDispatcherService } from "../../../application/services/NotificationDispatcherService";

const tripRepo = new TripFirestoreRepository();
const locationRepo = new LocationFirestoreRepository();
const orderRepo = new OrderFirestoreRepository();
const userRepo = new UserFirestoreRepository();
const productRepo = new ProductFirestoreRepository();
const idempotencyRepo = new IdempotencyFirestoreRepository();
const notificationRepo = new NotificationFirestoreRepository();
const notificationDispatcher = new NotificationDispatcherService(notificationRepo);

export class OrderController {
  constructor(
    private createOrderUseCase = new CreateOrderUseCase(
      orderRepo,
      productRepo,
      idempotencyRepo,
      userRepo,
      undefined,
      undefined,
      undefined,
      undefined,
      notificationDispatcher
    ),
    private getMyOrdersUseCase = new GetMyOrdersUseCase(orderRepo, userRepo),
    private getOrderTrackingUseCase = new GetOrderTrackingUseCase(orderRepo, tripRepo, locationRepo, userRepo),
    private getOrderByIdUseCase = new GetOrderByIdUseCase(orderRepo, tripRepo),
    private getAllOrdersUseCase = new GetAllOrdersUseCase(orderRepo, userRepo),
    private updateOrderStatusUseCase = new UpdateOrderStatusUseCase(orderRepo, tripRepo, userRepo, notificationDispatcher),
    private updateOrderDeliveriesUseCase = new UpdateOrderDeliveriesUseCase(orderRepo),
    private updateOrderReceiptUseCase = new UpdateOrderReceiptUseCase(orderRepo),
    private getOrderDispatchPlanUseCase = new GetOrderDispatchPlanUseCase(orderRepo)
  ) {}
    async create(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      let receiptImageUrl = req.body.receiptImage;
      // Si el cliente adjuntó el archivo del comprobante, subirlo a Firebase Storage
      if (req.file) {
        receiptImageUrl = await uploadReceiptImage(req.file, authUser?.uid || "general");
      }
      const idempotencyKey =
        (req.headers["idempotency-key"] as string) ||
        (req.headers["x-idempotency-key"] as string) ||
        req.body?.idempotencyKey;

      let orderUserId = authUser?.uid;
      let createdBySellerId: string | undefined = undefined;
      let createdByAdminId: string | undefined = undefined;

      if (authUser?.userType === "seller") {
        createdBySellerId = authUser.uid;
        if (req.body.userId && typeof req.body.userId === "string" && req.body.userId.trim()) {
          orderUserId = req.body.userId.trim();
        }
      } else if (authUser?.userType === "admin") {
        createdByAdminId = authUser.uid;
        if (req.body.userId && typeof req.body.userId === "string" && req.body.userId.trim()) {
          orderUserId = req.body.userId.trim();
        }
      }

      const { orderId, orderNumber } = await this.createOrderUseCase.execute({
        ...req.body,
        receiptImage: receiptImageUrl,
        userId: orderUserId,
        createdBySellerId,
        createdByAdminId,
        idempotencyKey,
      });
      res.status(201).json({ success: true, orderId, orderNumber });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Error al crear el pedido" });
    }
  }

    async getTracking(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const authUser = (req as any).user;

      const tracking = await this.getOrderTrackingUseCase.execute(
        id,
        authUser?.uid,
        authUser?.userType
      );

      if (!tracking) {
        return res.status(404).json({ success: false, message: "Orden no encontrada" });
      }


      res.status(200).json({ success: true, tracking });
    } catch (error: any) {
      const status = error.message?.includes("permiso") ? 403 : 500;
      res.status(status).json({ success: false, message: error.message || "Error al obtener el tracking" });
    }
  }

  async getMyOrders(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.uid;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Usuario no autenticado" });
      }

      const { search, status } = req.query;
      const orders = await this.getMyOrdersUseCase.execute(userId, {
        search: typeof search === "string" ? search : undefined,
        status: typeof status === "string" ? status : undefined,
      });

      res.status(200).json({ success: true, orders });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Error al obtener los pedidos" });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const authUser = (req as any).user;
      if (!authUser) {
        return res.status(401).json({ success: false, message: "Usuario no autenticado" });
      }

      const order = await this.getOrderByIdUseCase.execute(id, authUser);
      if (!order) {
        return res.status(404).json({ success: false, message: "Orden no encontrada" });
      }

      res.status(200).json({ success: true, order });
    } catch (error: any) {
      const isForbidden =
        error.statusCode === 403 ||
        error.message?.includes("permiso") ||
        error.message?.includes("Acceso denegado");
      const status = isForbidden ? 403 : 500;
      res.status(status).json({
        success: false,
        message: isForbidden ? "No tienes permiso para consultar esta orden" : (error.message || "Error al obtener la orden"),
      });
    }
  }

   async getAll(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      const q = (req as any).validatedQuery || req.query;
      const { status, deliveryType, userId, sellerId, withoutTrip, search, page, limit } = q;

      const effectiveSellerId =
        authUser?.userType === "seller"
          ? authUser.uid
          : typeof sellerId === "string" && sellerId.trim()
          ? sellerId.trim()
          : undefined;

      const isPaginatedRequest =
        page !== undefined || limit !== undefined || (typeof search === "string" && search.trim() !== "");

      if (isPaginatedRequest) {
        const result = await this.getAllOrdersUseCase.executePaginated({
          status: typeof status === "string" ? status : undefined,
          deliveryType: typeof deliveryType === "string" ? deliveryType : undefined,
          userId: typeof userId === "string" ? userId : undefined,
          withoutTrip: withoutTrip !== undefined ? Boolean(withoutTrip) : undefined,
          sellerId: effectiveSellerId,
          search: typeof search === "string" ? search : undefined,
          page: page !== undefined ? Number(page) : undefined,
          limit: limit !== undefined ? Number(limit) : undefined,
        });
        return res.status(200).json({ success: true, ...result });
      }

      const filters: any = {};
      if (typeof status === "string" && status.trim()) filters.status = status.trim();
      if (typeof deliveryType === "string" && deliveryType.trim()) filters.deliveryType = deliveryType.trim();
      if (typeof userId === "string" && userId.trim()) filters.userId = userId.trim();
      if (withoutTrip !== undefined) filters.withoutTrip = String(withoutTrip).toLowerCase() === "true";

      if (effectiveSellerId) {
        filters.sellerId = effectiveSellerId;
      }

      const orders = await this.getAllOrdersUseCase.execute(filters);
      res.status(200).json({ success: true, orders });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Error al obtener las órdenes" });
    }
  }

  async updateStatus(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      if (authUser?.userType !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Acceso denegado: solo un administrador activo puede modificar el estado o despacho de una orden.",
        });
      }

      const { id } = req.params;
      const { status, reason, driverId, tripsPlan } = req.body;
      await this.updateOrderStatusUseCase.execute(id, status, reason, driverId, tripsPlan);
      res.status(200).json({ success: true, message: "Orden actualizada correctamente" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message || "Error al actualizar la orden" });
    }
  }


  async updateDeliveries(req: Request, res: Response) {
    try {
      const authUser = (req as any).user;
      if (authUser?.userType !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Acceso denegado: solo un administrador activo puede reconfigurar las entregas de una orden.",
        });
      }

      const { id } = req.params;
      const { deliveryType, deliveries } = req.body;
      const updatedOrder = await this.updateOrderDeliveriesUseCase.execute(id, deliveryType, deliveries);
      res.status(200).json({
        success: true,
        message: "Entregas actualizadas y guardadas correctamente",
        order: updatedOrder,
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message || "Error al actualizar las entregas" });
    }
  }

  async updateReceipt(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const authUser = (req as any).user;

      let receiptImageUrl = req.body?.receiptImage;
      if (req.file) {
        receiptImageUrl = await uploadReceiptImage(req.file, authUser?.uid || "general");
      }

      if (!receiptImageUrl) {
        return res.status(400).json({ success: false, message: "Debe proporcionar una imagen o archivo de comprobante" });
      }

      await this.updateOrderReceiptUseCase.execute(id, receiptImageUrl, authUser?.uid, authUser?.userType);

      res.status(200).json({
        success: true,
        message: "Comprobante de pago actualizado correctamente",
        receiptImage: receiptImageUrl,
      });
    } catch (error: any) {
      const statusCode = error.message?.includes("permiso")
        ? 403
        : error.message?.includes("encontrada")
        ? 404
        : 500;
      res.status(statusCode).json({ success: false, message: error.message || "Error al actualizar el comprobante" });
    }
  }

  async getDispatchPlan(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const plan = await this.getOrderDispatchPlanUseCase.execute(id);
      return res.status(200).json({ success: true, plan });
    } catch (error: any) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message || "Error al calcular el plan de despacho",
      });
    }
  }
}
