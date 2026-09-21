import { ProductRepository } from "../../../domain/repositories/ProductRepository";
import { Product } from "../../../domain/entities/Product";

export class UpdateProductUseCase {
  constructor(private productRepo: ProductRepository) {}

  async execute(id: string, productData: Partial<Product>): Promise<void> {
    if (!id) {
      throw new Error("El ID del producto es requerido");
    }
    await this.productRepo.update(id, productData);
  }
}