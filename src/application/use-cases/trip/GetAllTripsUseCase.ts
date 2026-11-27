import { Trip } from "../../../domain/entities/Trip";
import { TripRepository, TripFilters } from "../../../domain/repositories/TripRepository";
import { OrderRepository } from "../../../domain/repositories/OrderRepository";
import { UserRepository } from "../../../domain/repositories/UserRepository";

export interface TripsQueryParams {
  actorUid?: string;
  actorUserType?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedTripsResult {
  trips: Trip[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  counts: Record<string, number>;
  kpis: {
    totalTrips: number;
    pendingTrips: number;
    inRouteTrips: number;
    fractionalTrips: number;
    completedTrips: number;
    totalTonsInTransit: number;
  };
}

function isFractionalTripNumber(tripNumber?: string): boolean {
  if (!tripNumber) return false;
  return /-\d+$/.test(tripNumber.trim());
}

export class GetAllTripsUseCase {
  constructor(
    private tripRepo: TripRepository,
    private orderRepo?: OrderRepository,
    private userRepo?: UserRepository
  ) {}

  private async hydrateDrivers(trips: Trip[]): Promise<void> {
    if (!this.userRepo || trips.length === 0) return;

    const driverIds = [
      ...new Set(
        trips
          .map((t) => t.assignedDriverId || t.driverId)
          .filter((id): id is string => Boolean(id && typeof id === "string" && id.trim() !== ""))
      ),
    ];

    if (driverIds.length === 0) return;

    const drivers = await Promise.all(
      driverIds.map((id) => this.userRepo!.getById(id).catch(() => null))
    );

    const driverMap = new Map<string, any>();
    drivers.forEach((d) => {
      if (d && d.uid) {
        driverMap.set(d.uid, d);
      }
    });

    trips.forEach((trip) => {
      const dId = trip.assignedDriverId || trip.driverId;
      if (dId && driverMap.has(dId)) {
        const d = driverMap.get(dId);
        trip.driver = {
          uid: d.uid,
          names: d.names,
          lastNames: d.lastNames,
          phone: d.phone,
        };
      }
    });
  }

  async execute(
    actor?: { uid: string; userType: string },
    filters?: TripFilters
  ): Promise<Trip[]> {
    const trips = await this.tripRepo.getAll(filters);
    if (actor?.userType !== "seller" || !this.orderRepo) {
      return trips;
    }

    const sellerOrders = await this.orderRepo.getAll({ sellerId: actor.uid, limit: 150 });
    const sellerOrderIds = new Set<string>();
    sellerOrders.forEach((o) => {
      if (o.id) sellerOrderIds.add(o.id);
      if (o.orderNumber !== undefined) sellerOrderIds.add(String(o.orderNumber));
    });

    return trips.filter((t) =>
      (t.orderIds || []).some((id) => sellerOrderIds.has(id))
    );
  }

  async executePaginated(params: TripsQueryParams): Promise<PaginatedTripsResult> {
    const statusForRepo =
      params.status && params.status !== "Todos" && params.status !== "fractional"
        ? params.status
        : undefined;

    const scopedTrips = await this.execute(
      params.actorUid && params.actorUserType
        ? { uid: params.actorUid, userType: params.actorUserType }
        : undefined,
      {
        status: statusForRepo,
        limit: params.limit ? Math.min(params.limit * 5, 200) : 100,
      }
    );

    const priority: Record<string, number> = {
      started: 1,
      in_progress: 1,
      accepted: 2,
      available: 3,
      completed: 4,
      canceled: 5,
    };

    const sorted = [...scopedTrips].sort((a, b) => {
      const pA = priority[a.status || ""] || 99;
      const pB = priority[b.status || ""] || 99;
      if (pA !== pB) return pA - pB;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    const counts: Record<string, number> = {
      Todos: sorted.length,
      available: 0,
      accepted: 0,
      fractional: 0,
      completed: 0,
      canceled: 0,
    };

    let totalTonsInTransit = 0;

    for (const t of sorted) {
      let status = t.status || "default";
      if (status === "started" || status === "in_progress") {
        status = "accepted";
      } else if (status === "assigned") {
        status = "available";
      }
      if (counts[status] !== undefined) {
        counts[status]++;
      }
      if (isFractionalTripNumber(t.tripNumber)) {
        counts.fractional++;
      }
      if (["available", "accepted", "started", "in_progress"].includes(t.status || "")) {
        totalTonsInTransit += Number(t.totalTons) || 0;
      }
    }

    const q = (params.search || "").trim().toLowerCase();
    const statusFilter = (params.status || "").trim();

    const filtered = sorted.filter((trip) => {
      const matchesSearch =
        q === "" ||
        trip.tripNumber?.toLowerCase().includes(q) ||
        trip.comments?.toLowerCase().includes(q) ||
        trip.orderIds?.some((id) => id.toLowerCase().includes(q));

      const matchesStatus =
        !statusFilter ||
        statusFilter === "Todos" ||
        (statusFilter === "fractional" && isFractionalTripNumber(trip.tripNumber)) ||
        trip.status === statusFilter ||
        (statusFilter === "available" && trip.status === "assigned") ||
        (statusFilter === "accepted" &&
          (trip.status === "started" || trip.status === "in_progress"));

      return matchesSearch && matchesStatus;
    });

    const limit = params.limit || 20;
    const page = params.page || 1;
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;

    const pageTrips = filtered.slice(start, start + limit);
    await this.hydrateDrivers(pageTrips);

    return {
      trips: pageTrips,
      pagination: {
        page: safePage,
        limit,
        total,
        totalPages,
      },
      counts,
      kpis: {
        totalTrips: sorted.length,
        pendingTrips: counts.available,
        inRouteTrips: counts.accepted,
        fractionalTrips: counts.fractional,
        completedTrips: counts.completed,
        totalTonsInTransit,
      },
    };
  }
}
