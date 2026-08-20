import { Order } from "../../../domain/entities/Order";
import { OrderRepository } from "../../../domain/repositories/OrderRepository";
import { CreateOrderDto } from "../../dtos/OrderDtos";

export class CreateOrderUseCase {
  constructor(private orderRepo: OrderRepository) {}

  async execute(
    data: CreateOrderDto
  ): Promise<{ orderId: string; orderNumber: number }> {
    const orderNumber = await this.orderRepo.getNextOrderNumber();

    const order: Order = {
      orderNumber,
      userId: data.userId,
      deliveryType: data.deliveryType,
      deliveries: (data.deliveries ?? []).map((d) => ({
        ...d,
        status: "pending",
        images: [],
      })),
      items: data.items,
      comments: data.comments,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    return await this.orderRepo.create(order);
  }
}
