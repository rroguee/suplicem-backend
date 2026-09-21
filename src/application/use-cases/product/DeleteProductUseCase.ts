import { ProductRepository } from "../../../domain/repositories/ProductRepository";

export class DeleteProductUseCase {
  constructor(private productRepo: ProductRepository) {}

  async execute(id: string): Promise<void> {
    if (!id) {
      throw new Error("El ID del producto es requerido");
    }
    await this.productRepo.delete(id);
  }
}