import { OrderRepository } from "../../../domain/repositories/OrderRepository";

export class MarkDeliveryCompletedUseCase {
  constructor(private orderRepo: OrderRepository) {}

  async execute(orderId: string, index: number) {
    await this.orderRepo.markDeliveryAsCompleted(orderId, index);
  }
}
