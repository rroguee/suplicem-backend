import { CartRepository } from "../../../domain/repositories/CartRepository";

export class RemoveFromCartUseCase {
  constructor(private cartRepo: CartRepository) {}

  async execute(userId: string, productId: string): Promise<void> {
    return await this.cartRepo.removeByProduct(userId, productId);
  }
}
