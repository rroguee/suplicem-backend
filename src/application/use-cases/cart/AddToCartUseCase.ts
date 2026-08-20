
import { CartItem } from "../../../domain/entities/CartItem";
import { CartRepository } from "../../../domain/repositories/CartRepository";
import { AddToCartDto } from "../../dtos/CartDtos";

export class AddToCartUseCase {
  constructor(private cartRepo: CartRepository) {}

  async execute(data: AddToCartDto): Promise<void> {
    const item: CartItem = {
      userId: data.userId,
      productId: data.productId,
      quantity: data.quantity,
      unit: data.unit,
      addedAt: new Date().toISOString(),
    };

    await this.cartRepo.add(item);
  }
}
