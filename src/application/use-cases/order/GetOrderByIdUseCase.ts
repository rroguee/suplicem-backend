import { Order } from "../../../domain/entities/Order";
import { OrderRepository } from "../../../domain/repositories/OrderRepository";
import { TripRepository } from "../../../domain/repositories/TripRepository";
import { ApplicationActor } from "../../dtos/UserDtos";

export class GetOrderByIdUseCase {
  constructor(
    private orderRepo: OrderRepository,
    private tripRepo?: TripRepository
  ) {}

  async execute(
    orderId: string,
    authUser?: ApplicationActor
  ): Promise<Order | null> {
    if (!orderId || !orderId.trim()) {
      return null;
    }

    const order = await this.orderRepo.getById(orderId);
    if (!order) {
      return null;
    }

    if (!authUser) {
      throw new Error("Acceso denegado: usuario no autenticado.");
    }

    // Administrador: Acceso total de gestión
    if (authUser.userType === "admin") {
      return order;
    }

    const sanitizeOrder = (ord: Order, isDriver: boolean = false): Order => {
      const sanitized = { ...ord };
      delete sanitized.aiRiskFlag;
      delete sanitized.aiRiskScore;
      delete sanitized.aiRiskReason;

      // Principio de Menor Privilegio: Un chofer no requiere acceso a comprobantes ni cuentas bancarias
      if (isDriver) {
        delete sanitized.receiptImage;
        delete sanitized.bankAccountId;
        delete sanitized.bankReferenceNumber;
        delete sanitized.creditNote;
      }
      return sanitized;
    };

    // 1. Regla Cliente: solo sus propios pedidos
    if (authUser.userType === "client") {
      const isOwner = order.userId === authUser.uid || (order as any).userUid === authUser.uid;
      if (!isOwner) {
        throw new Error("No tienes permiso para ver esta orden.");
      }
      return sanitizeOrder(order);
    }

    // 2. Regla Vendedor: solo pedidos de su cartera o creados por él
    if (authUser.userType === "seller") {
      const isAssignedSeller =
        order.sellerId === authUser.uid || order.createdBySellerId === authUser.uid;
      if (!isAssignedSeller) {
        throw new Error("No tienes permiso para ver esta orden.");
      }
      return sanitizeOrder(order);
    }

    // 3. Regla Conductor: solo si está asignado a un viaje vinculado a esta orden
    if (authUser.userType === "driver") {
      if (!this.tripRepo) {
        throw new Error("No tienes permiso para ver esta orden.");
      }

      let isAssignedDriver = false;
      if (this.tripRepo.getTripsByOrderId) {
        const trips = await this.tripRepo.getTripsByOrderId(orderId);
        isAssignedDriver = trips.some((t) => {
          const dId = t.assignedDriverId || (t as any).driverId || t.driver?.id || t.driver?.uid;
          return dId === authUser.uid;
        });
      }

      if (!isAssignedDriver) {
        const singleTrip = await this.tripRepo.getTripByOrderId(orderId);
        const singleDriverId =
          singleTrip?.assignedDriverId || (singleTrip as any)?.driverId || singleTrip?.driver?.id;
        if (singleDriverId === authUser.uid) {
          isAssignedDriver = true;
        }
      }

      if (!isAssignedDriver) {
        throw new Error("No tienes permiso para ver esta orden porque no eres el conductor asignado.");
      }

      return sanitizeOrder(order, true);
    }

    throw new Error("No tienes permiso para ver esta orden.");
  }
}
