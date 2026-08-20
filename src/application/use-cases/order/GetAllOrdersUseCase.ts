import { UserRepository } from "../../../domain/repositories/UserRepository";
import { OrderRepository } from "../../../domain/repositories/OrderRepository";
import { EnrichedOrder } from "../../../domain/entities/EnrichedOrder";

export class GetAllOrdersUseCase {
  constructor(
    private orderRepo: OrderRepository,
    private userRepo: UserRepository
  ) {}

  async execute(status?: string): Promise<EnrichedOrder[]> {
    const orders = await this.orderRepo.getAll(status);

    const enrichedOrders: EnrichedOrder[] = await Promise.all(
      orders.map(async (order) => {
        const user = await this.userRepo.getById(order.userId);

        return {
          ...order,
          userNames: user?.names,
          userLastNames: user?.lastNames,
        };
      })
    );

    return enrichedOrders;
  }
}
