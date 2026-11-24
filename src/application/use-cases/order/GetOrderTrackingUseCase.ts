import { OrderRepository } from "../../../domain/repositories/OrderRepository";
import { TripRepository } from "../../../domain/repositories/TripRepository";
import { LocationRepository } from "../../../domain/repositories/LocationRepository";
import { UserRepository } from "../../../domain/repositories/UserRepository";

export interface TripTrackingItemDto {
  id: string;
  tripNumber: string;
  status: string;
  totalTons: number;
  assignedDriverId?: string;
  driver: {
    id?: string;
    names?: string;
    lastNames?: string;
    phone?: string;
    vehicle?: any;
  } | null;
  deliveryPin?: string;
  location: {
    latitude: number;
    longitude: number;
    updatedAt?: string;
  } | null;
  createdAt?: string;
}

export interface OrderTrackingDto {
  orderId: string;
  orderNumber: number;
  orderStatus: string;
  totalTons: number;
  deliveredTons: number;
  pendingBalance: number;
  trips: TripTrackingItemDto[];
  trip: TripTrackingItemDto | null;
  driver: {
    id?: string;
    names?: string;
    lastNames?: string;
    phone?: string;
    vehicle?: any;
  } | null;
  location: {
    latitude: number;
    longitude: number;
    updatedAt?: string;
  } | null;
}

export class GetOrderTrackingUseCase {
  constructor(
    private orderRepo: OrderRepository,
    private tripRepo: TripRepository,
    private locationRepo: LocationRepository,
    private userRepo?: UserRepository
  ) {}

  async execute(
    orderId: string,
    userId?: string,
    userRole?: string
  ): Promise<OrderTrackingDto | null> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) {
      return null;
    }

    if (!userId || !userRole) {
      throw new Error("Acceso denegado: usuario no autenticado.");
    }

    // Validación estricta RBAC / BOLA con política Default-Deny
    if (userRole === "client") {
      if (order.userId !== userId && (order as any).userUid !== userId) {
        throw new Error("No tienes permiso para ver el tracking de esta orden.");
      }
    } else if (userRole === "seller") {
      const isAssignedSeller =
        order.sellerId === userId || order.createdBySellerId === userId;
      if (!isAssignedSeller) {
        throw new Error("No tienes permiso para ver el tracking de esta orden.");
      }
    } else if (userRole === "driver") {
      // Verificación de asignación del chofer tras cargar los viajes
    } else if (userRole === "admin") {
      // Acceso global para administradores
    } else {
      throw new Error("Acceso denegado: rol no autorizado para consultar tracking.");
    }

    // 1. Obtener todos los viajes asociados a la orden
    let rawTrips: any[] = [];
    if (this.tripRepo.getTripsByOrderId) {
      rawTrips = await this.tripRepo.getTripsByOrderId(orderId);
    }
    if (rawTrips.length === 0) {
      const single = await this.tripRepo.getTripByOrderId(orderId);
      if (single && single.status !== "canceled") {
        rawTrips = [single];
      }
    }

    // Si el usuario es chofer, verificar que esté asignado a al menos uno de los viajes
    if (userRole === "driver") {
      const isAssigned = rawTrips.some((t) => {
        const dId = t.assignedDriverId || t.driverId || t.driver?.id || t.driver?.uid;
        return dId === userId;
      });
      if (!isAssigned) {
        throw new Error("No tienes permiso para ver el tracking de esta orden porque no eres el chofer asignado.");
      }
    }

    // 2. Precargar datos de choferes y ubicaciones en paralelo (sin N+1 ni duplicados)
    const missingDriverIds = new Set<string>();
    const activeLocationDriverIds = new Set<string>();

    for (const t of rawTrips) {
      const driverId = t.assignedDriverId || t.driverId || t.driver?.id || t.driver?.uid;
      if (!driverId) continue;
      if (!t.driver && this.userRepo) {
        missingDriverIds.add(driverId);
      }
      // Privacidad del Conductor: solo consultar ubicación si el viaje está efectivamente en ruta
      if (t.status === "started" || t.status === "in_progress") {
        activeLocationDriverIds.add(driverId);
      }
    }

    const driverMap = new Map<string, any>();
    const locationMap = new Map<string, { latitude: number; longitude: number; updatedAt?: string }>();

    await Promise.all([
      ...Array.from(missingDriverIds).map(async (driverId) => {
        try {
          const userDoc = await this.userRepo?.getById(driverId);
          if (userDoc) {
            driverMap.set(driverId, {
              id: userDoc.uid,
              names: userDoc.names,
              lastNames: userDoc.lastNames,
              phone: userDoc.phone,
              vehicle: userDoc.vehicle,
            });
          }
        } catch {
          // Ignorar error al cargar usuario secundario
        }
      }),
      ...Array.from(activeLocationDriverIds).map(async (driverId) => {
        try {
          const loc = await this.locationRepo.get(driverId);
          if (loc) {
            locationMap.set(driverId, {
              latitude: loc.lat,
              longitude: loc.lng,
              updatedAt: loc.updatedAt,
            });
          }
        } catch {
          // Ignorar error individual de ubicación
        }
      }),
    ]);

    const mappedTrips: TripTrackingItemDto[] = rawTrips.map((t) => {
      const driverId = t.assignedDriverId || t.driverId || t.driver?.id || t.driver?.uid;
      const driverData = t.driver || (driverId ? driverMap.get(driverId) || null : null);
      const isActiveTrip = t.status === "started" || t.status === "in_progress";
      const locationData =
        driverId && isActiveTrip ? locationMap.get(driverId) || null : null;

      // Asegurar que cada viaje cuente con PIN único
      let tripPin = t.deliveryPin;
      if (!tripPin) {
        tripPin = Math.floor(1000 + Math.random() * 9000).toString();
        t.deliveryPin = tripPin;
        if (t.id && this.tripRepo.updateTripPin) {
          this.tripRepo.updateTripPin(t.id, tripPin).catch(() => {});
        }
      }

      const showPin = (userRole === "admin" || order.userId === userId) && t.status !== "completed";

      return {
        id: t.id || "",
        tripNumber: t.tripNumber,
        status: t.status,
        totalTons: Number(t.totalTons) || 0,
        assignedDriverId: driverId,
        driver: driverData,
        deliveryPin: showPin ? tripPin : undefined,
        location: locationData,
        createdAt: t.createdAt,
      };
    });

    // Identificar el viaje principal activo para compatibilidad hacia atrás
    const activeTrip =
      mappedTrips.find((t) => ["started", "in_progress"].includes(t.status)) ||
      mappedTrips.find((t) => t.status === "accepted") ||
      mappedTrips.find((t) => t.status === "assigned") ||
      mappedTrips.find((t) => t.status === "available") ||
      mappedTrips[0] ||
      null;

    return {
      orderId: order.id || orderId,
      orderNumber: order.orderNumber,
      orderStatus: order.status,
      totalTons: Number(order.totalTons) || 0,
      deliveredTons: Number(order.deliveredTons) || 0,
      pendingBalance: Number(order.pendingBalance) || 0,
      trips: mappedTrips,
      trip: activeTrip,
      driver: activeTrip?.driver || null,
      location: activeTrip?.location || null,
    };
  }
}