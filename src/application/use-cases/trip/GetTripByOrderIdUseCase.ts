import { Trip } from "../../../domain/entities/Trip";
import { TripRepository } from "../../../domain/repositories/TripRepository";
import { OrderRepository } from "../../../domain/repositories/OrderRepository";
import { ApplicationActor } from "../../dtos/UserDtos";

export class GetTripByOrderIdUseCase {
  constructor(
    private tripRepo: TripRepository,
    private orderRepo?: OrderRepository
  ) {}

  async execute(
    orderId: string,
    authUser?: ApplicationActor
  ): Promise<{
    trip: Trip | null;
    trips: Trip[];
  }> {
    if (!orderId || !orderId.trim()) {
      return { trip: null, trips: [] };
    }

    let order = null;
    if (this.orderRepo) {
      order = await this.orderRepo.getById(orderId);
    }

    if (!authUser) {
      throw new Error("Acceso denegado: usuario no autenticado.");
    }

    // 1. Verificación de Autorización BOLA / IDOR con política Default-Deny
    if (authUser.userType === "admin") {
      // Acceso global para administradores
    } else if (authUser.userType === "client") {
      if (!order || (order.userId !== authUser.uid && (order as any).userUid !== authUser.uid)) {
        throw new Error("No tienes permiso para ver los viajes de esta orden.");
      }
    } else if (authUser.userType === "seller") {
      const isAssignedSeller =
        order && (order.sellerId === authUser.uid || order.createdBySellerId === authUser.uid);
      if (!isAssignedSeller) {
        throw new Error("No tienes permiso para ver los viajes de esta orden.");
      }
    } else if (authUser.userType === "driver") {
      // Se valida la asignación del chofer tras obtener los viajes de la orden
    } else {
      throw new Error("Acceso denegado: rol de usuario no autorizado.");
    }

    // 2. Obtención de viajes
    const trips = await this.tripRepo.getTripsByOrderId(orderId);

    // Regla Chofer: debe estar asignado a al menos un viaje de esta orden
    if (authUser && authUser.userType === "driver") {
      const isAssignedDriver = trips.some((t) => {
        const dId = t.assignedDriverId || (t as any).driverId || t.driver?.id || t.driver?.uid;
        return dId === authUser.uid;
      });
      if (!isAssignedDriver) {
        throw new Error("No tienes permiso para ver los viajes de esta orden porque no eres el conductor asignado.");
      }
    }

    // 3. Selección del viaje activo prioritario
    const activeTrip =
      trips.find((t) =>
        ["available", "accepted", "started", "in_progress"].includes(t.status)
      ) ||
      trips[0] ||
      null;

    // 4. Seguridad de PIN: solo Admin o el Cliente dueño pueden ver el deliveryPin
    const canSeePin =
      authUser.userType === "admin" || (order && order.userId === authUser.uid);

    const sanitizeTrip = (t: Trip | null): Trip | null => {
      if (!t) return null;
      if (canSeePin) return t;
      const copy = { ...t };
      delete copy.deliveryPin;
      return copy;
    };

    return {
      trip: sanitizeTrip(activeTrip),
      trips: trips.map((t) => sanitizeTrip(t)!),
    };
  }
}
