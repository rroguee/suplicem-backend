import { CartItem } from "../../../domain/entities/CartItem";
import { CartRepository } from "../../../domain/repositories/CartRepository";

export class GetCartUseCase {
  constructor(private cartRepo: CartRepository) {}

  async execute(userId: string): Promise<CartItem[]> {
    return await this.cartRepo.getByUser(userId);
  }
}
