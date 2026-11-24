import { TripRepository } from "../../../domain/repositories/TripRepository";

export class GetTripDetailsUseCase {
  constructor(private tripRepo: TripRepository) {}

  async execute(tripId: string, authUser?: { uid: string; userType: string }): Promise<any> {
    const trip = await this.tripRepo.getByIdWithOrders(tripId);
    if (!trip) return null;

    if (!authUser) {
      throw new Error("Acceso denegado: usuario no autenticado.");
    }

    if (authUser.userType !== "admin") {
      if (authUser.userType === "driver") {
        const assignedDriver =
          trip.assignedDriverId || (trip as any).driverId || trip.driver?.id || trip.driver?.uid;
        if (assignedDriver !== authUser.uid && trip.status !== "available") {
          throw new Error("No tienes permiso para ver los detalles de este viaje.");
        }
      } else if (authUser.userType === "client") {
        const hasMyOrder = trip.orders?.some(
          (o: any) => o.userId === authUser.uid || o.userUid === authUser.uid
        );
        if (!hasMyOrder) {
          throw new Error("No tienes permiso para ver los detalles de este viaje.");
        }
      } else if (authUser.userType === "seller") {
        const hasMyOrder = trip.orders?.some(
          (o: any) => o.sellerId === authUser.uid || o.createdBySellerId === authUser.uid
        );
        if (!hasMyOrder) {
          throw new Error("No tienes permiso para ver los detalles de este viaje.");
        }
      } else {
        throw new Error("No tienes permiso para ver los detalles de este viaje.");
      }
    }

    const isAdmin = authUser?.userType === "admin";
    const isClientOwner =
      authUser?.userType === "client" &&
      trip.orders?.some((o: any) => o.userId === authUser.uid || o.userUid === authUser.uid);

    // Clonar para no mutar la entidad en memoria o caché
    const sanitized = { ...trip };

    // 1. Cero Fuga de PIN: El código de entrega de 4 dígitos nunca se expone a choferes ni a terceros
    if (!isAdmin && !isClientOwner && sanitized.deliveryPin) {
      delete sanitized.deliveryPin;
    }

    // 2. Prevención IDOR: En viajes combinados o mono-orden, el cliente SOLO puede ver sus propios pedidos
    if (authUser?.userType === "client" && Array.isArray(sanitized.orders)) {
      sanitized.orders = sanitized.orders.filter(
        (o: any) => o.userId === authUser.uid || o.userUid === authUser.uid
      );
    }

    // 3. Segregación de Cartera: El vendedor SOLO ve órdenes pertenecientes a su cartera
    if (authUser?.userType === "seller" && Array.isArray(sanitized.orders)) {
      sanitized.orders = sanitized.orders.filter(
        (o: any) => o.sellerId === authUser.uid || o.createdBySellerId === authUser.uid
      );
    }

    // 4. Menor Privilegio para Choferes: Retirar comprobantes e información bancaria/financiera
    if (authUser?.userType === "driver" && Array.isArray(sanitized.orders)) {
      sanitized.orders = sanitized.orders.map((o: any) => {
        const orderCopy = { ...o };
        delete orderCopy.receiptImage;
        delete orderCopy.bankAccountId;
        delete orderCopy.bankReferenceNumber;
        delete orderCopy.creditNote;
        delete orderCopy.aiRiskFlag;
        delete orderCopy.aiRiskScore;
        delete orderCopy.aiRiskReason;
        return orderCopy;
      });
    }

    return sanitized;
  }
}
