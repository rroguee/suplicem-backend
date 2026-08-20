import { Order } from "../../../domain/entities/Order";
import { OrderRepository } from "../../../domain/repositories/OrderRepository";

export class GetOrderByIdUseCase {
  constructor(private orderRepo: OrderRepository) {}

  async execute(orderId: string): Promise<Order | null> {
    return await this.orderRepo.getById(orderId);
  }
}