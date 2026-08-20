import { EnrichedOrder } from "../../../domain/entities/EnrichedOrder";
import { Order } from "../../../domain/entities/Order";
import { OrderRepository } from "../../../domain/repositories/OrderRepository";
import { UserRepository } from "../../../domain/repositories/UserRepository";

export class GetMyOrdersUseCase {
  constructor(
    private orderRepo: OrderRepository,
    private userRepo: UserRepository
  ) {}

  async execute(userId: string): Promise<EnrichedOrder[]> {
    const orders = await this.orderRepo.getByUser(userId);

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
