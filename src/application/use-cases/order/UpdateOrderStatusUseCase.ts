import { OrderRepository } from "../../../domain/repositories/OrderRepository";

export class UpdateOrderStatusUseCase {
  constructor(private orderRepo: OrderRepository) {}

  async execute(orderId: string, status: "approved" | "rejected", reason?: string): Promise<void> {
    if (status === "rejected" && !reason) {
      throw new Error("Se requiere un motivo para rechazar la orden");
    }

    await this.orderRepo.updateStatus(orderId, status, reason);
  }
}
