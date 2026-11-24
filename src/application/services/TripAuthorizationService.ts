import { TripRepository } from "../../domain/repositories/TripRepository";
import { OrderRepository } from "../../domain/repositories/OrderRepository";

export class TripAuthorizationService {
  constructor(
    private tripRepo: TripRepository,
    private orderRepo: OrderRepository
  ) {}

  /**
   * Valida si un chofer autenticado está asignado al viaje y puede emitir coordenadas
   */
  async canDriverEmitLocation(driverId: string, tripId: string): Promise<boolean> {
    if (!driverId || !tripId) return false;

    const trip = await this.tripRepo.getById(tripId);
    if (!trip) return false;

    // Solo el chofer asignado y ÚNICAMENTE durante el trayecto activo puede emitir GPS
    const isAssigned = trip.assignedDriverId === driverId || trip.driverId === driverId;
    const isInTransit = ["started", "in_progress"].includes(trip.status);

    return isAssigned && isInTransit;
  }

  /**
   * Valida si un usuario (admin, cliente dueño o vendedor de cartera) puede ver la ubicación en vivo
   */
  async canUserWatchTrip(
    user: { uid: string; userType: string },
    tripId: string
  ): Promise<boolean> {
    if (!user?.uid || !tripId) return false;

    // Los administradores tienen acceso global
    if (user.userType === "admin") return true;

    const trip = await this.tripRepo.getById(tripId);
    if (!trip) return false;

    // Privacidad GPS: si el viaje ya fue completado o cancelado, no se transmite en tiempo real
    const isTerminated = ["completed", "canceled"].includes(trip.status);
    if (isTerminated) return false;

    // Si es el chofer asignado al viaje, puede observarlo
    if (user.userType === "driver") {
      return trip.assignedDriverId === user.uid || trip.driverId === user.uid;
    }

    // Si es cliente o vendedor, verificamos si alguna orden del viaje le pertenece
    if (!trip.orderIds || trip.orderIds.length === 0) return false;

    // Resolver todas las órdenes en paralelo con Promise.all
    const orders = await Promise.all(
      trip.orderIds.map((orderId) => this.orderRepo.getById(orderId))
    );

    for (const order of orders) {
      if (!order) continue;

      if (user.userType === "client" && (order.userId === user.uid || (order as any).userUid === user.uid)) {
        return true;
      }

      if (
        user.userType === "seller" &&
        (order.sellerId === user.uid || order.createdBySellerId === user.uid)
      ) {
        return true;
      }
    }

    return false;
  }
}
