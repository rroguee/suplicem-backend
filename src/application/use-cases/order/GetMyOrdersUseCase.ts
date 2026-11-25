import { EnrichedOrder } from "../../../domain/entities/EnrichedOrder";
import { OrderRepository } from "../../../domain/repositories/OrderRepository";
import { UserRepository } from "../../../domain/repositories/UserRepository";

export interface GetMyOrdersFilterOptions {
  search?: string;
  status?: string;
}

export class GetMyOrdersUseCase {
  constructor(
    private orderRepo: OrderRepository,
    private userRepo: UserRepository
  ) {}

  async execute(
    userId: string,
    options?: GetMyOrdersFilterOptions
  ): Promise<EnrichedOrder[]> {
    let orders = await this.orderRepo.getByUser(userId);

    // 1. Filtrado por estado si se especifica
    if (options?.status && options.status !== "all") {
      orders = orders.filter((o) => o.status === options.status);
    }

    // 2. Filtrado por término de búsqueda (número de orden, ID o nombre de producto)
    if (options?.search) {
      const term = options.search.trim().toLowerCase();
      orders = orders.filter((order) => {
        const matchNumber = String(order.orderNumber ?? "").toLowerCase().includes(term);
        const matchId = String(order.id ?? "").toLowerCase().includes(term);
        const matchItem = order.items?.some(
          (item) => typeof item?.name === "string" && item.name.toLowerCase().includes(term)
        );
        return matchNumber || matchId || matchItem;
      });
    }

    // 3. Ordenamiento en el servidor: Pendientes primero, luego por número de orden descendente
    orders.sort((a, b) => {
      const aPending = a.status === "pending";
      const bPending = b.status === "pending";

      if (aPending && !bPending) return -1;
      if (!aPending && bPending) return 1;

      const numA = Number(a.orderNumber ?? 0);
      const numB = Number(b.orderNumber ?? 0);
      return numB - numA;
    });

    // 4. Enriquecer con los datos del cliente y creadores asistidos (Anti N+1 con batch fetch)
    const user = await this.userRepo.getById(userId);

    const creatorIds = [
      ...new Set(
        orders
          .map((o) => (o.createdBySellerId || o.createdByAdminId)?.trim())
          .filter((id): id is string => Boolean(id))
      ),
    ];

    const creatorMap = new Map<string, { names?: string; lastNames?: string; phone?: string }>();
    if (creatorIds.length > 0) {
      await Promise.all(
        creatorIds.map(async (cId) => {
          try {
            const creator = await this.userRepo.getById(cId);
            if (creator) {
              creatorMap.set(cId, creator);
            }
          } catch (e) {
            console.warn(`Error al obtener creador ${cId}:`, e);
          }
        })
      );
    }

    return orders.map((order) => {
      const isAssisted = Boolean(order.createdBySellerId || order.createdByAdminId);
      const cId = (order.createdBySellerId || order.createdByAdminId)?.trim();
      const creator = cId ? creatorMap.get(cId) : undefined;
      const createdByRole = order.createdBySellerId ? "seller" : order.createdByAdminId ? "admin" : undefined;
      const createdByName = creator
        ? `${creator.names} ${creator.lastNames || ""}`.trim()
        : isAssisted
        ? (createdByRole === "seller" ? "Vendedor Asignado" : "Administrador")
        : undefined;
      const createdByPhone = creator?.phone;

      // Principio Anti-Oracle: Sanitizar flags de riesgo de IA para el cliente
      const sanitized = { ...order };
      delete (sanitized as any).aiRiskFlag;
      delete (sanitized as any).aiRiskScore;
      delete (sanitized as any).aiRiskReason;

      return {
        ...sanitized,
        userNames: user?.names || (order as any).userNames || "",
        userLastNames: user?.lastNames || (order as any).userLastNames || "",
        ...(isAssisted ? { isAssisted, createdByName, createdByRole, createdByPhone } : {}),
      };
    });
  }
}