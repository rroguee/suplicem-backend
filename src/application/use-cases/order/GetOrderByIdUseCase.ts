import { Order } from "../../../domain/entities/Order";
import { OrderRepository } from "../../../domain/repositories/OrderRepository";
import { TripRepository } from "../../../domain/repositories/TripRepository";
import { UserRepository } from "../../../domain/repositories/UserRepository";
import { ApplicationActor } from "../../dtos/UserDtos";

export class GetOrderByIdUseCase {
  constructor(
    private orderRepo: OrderRepository,
    private tripRepo?: TripRepository,
    private userRepo?: UserRepository
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

    // Administrador: Acceso total de gestión y enriquecimiento exclusivo de asistencia
    if (authUser.userType === "admin") {
      let isAssisted = false;
      let createdByName: string | undefined = undefined;
      let createdByRole: "seller" | "admin" | undefined = undefined;
      let createdByPhone: string | undefined = undefined;

      const creatorId = order.createdBySellerId || order.createdByAdminId;
      if (creatorId && typeof creatorId === "string" && creatorId.trim()) {
        isAssisted = true;
        createdByRole = order.createdBySellerId ? "seller" : "admin";
        if (this.userRepo) {
          try {
            const creator = await this.userRepo.getById(creatorId.trim());
            if (creator) {
              createdByName = `${creator.names} ${creator.lastNames || ""}`.trim();
              createdByPhone = creator.phone;
            }
          } catch (e) {
            console.warn(`Error al obtener creador ${creatorId}:`, e);
          }
        }
        if (!createdByName) {
          createdByName = createdByRole === "seller" ? "Vendedor Asignado" : "Administrador";
        }
      }

      return {
        ...order,
        ...(isAssisted ? { isAssisted, createdByName, createdByRole, createdByPhone } : {}),
      };
    }

    const sanitizeOrder = (ord: Order, isDriver: boolean = false): Order => {
      const sanitized = { ...ord };
      delete sanitized.aiRiskFlag;
      delete sanitized.aiRiskScore;
      delete sanitized.aiRiskReason;

      // Principio de Menor Privilegio: Un chofer no requiere acceso a comprobantes ni cuentas bancarias ni asistencia
      if (isDriver) {
        delete sanitized.receiptImage;
        delete sanitized.bankAccountId;
        delete sanitized.bankReferenceNumber;
        delete sanitized.creditNote;
        delete sanitized.isAssisted;
        delete sanitized.createdByName;
        delete sanitized.createdByRole;
        delete sanitized.createdByPhone;
      }
      return sanitized;
    };

    // 1. Regla Cliente: solo sus propios pedidos con enriquecimiento transparente de asistencia
    if (authUser.userType === "client") {
      const isOwner = order.userId === authUser.uid || (order as any).userUid === authUser.uid;
      if (!isOwner) {
        throw new Error("No tienes permiso para ver esta orden.");
      }

      let isAssisted = false;
      let createdByName: string | undefined = undefined;
      let createdByRole: "seller" | "admin" | undefined = undefined;
      let createdByPhone: string | undefined = undefined;

      const creatorId = order.createdBySellerId || order.createdByAdminId;
      if (creatorId && typeof creatorId === "string" && creatorId.trim()) {
        isAssisted = true;
        createdByRole = order.createdBySellerId ? "seller" : "admin";
        if (this.userRepo) {
          try {
            const creator = await this.userRepo.getById(creatorId.trim());
            if (creator) {
              createdByName = `${creator.names} ${creator.lastNames || ""}`.trim();
              createdByPhone = creator.phone;
            }
          } catch (e) {
            console.warn(`Error al obtener creador ${creatorId} para cliente:`, e);
          }
        }
        if (!createdByName) {
          createdByName = createdByRole === "seller" ? "Vendedor Asignado" : "Administrador";
        }
      }

      const clientOrder = {
        ...order,
        ...(isAssisted ? { isAssisted, createdByName, createdByRole, createdByPhone } : {}),
      };

      return sanitizeOrder(clientOrder);
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
