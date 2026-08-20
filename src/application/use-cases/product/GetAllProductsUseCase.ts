import { Product } from "../../../domain/entities/Product";
import { ProductRepository } from "../../../domain/repositories/ProductRepository";

export class GetAllProductsUseCase {
  constructor(private productRepo: ProductRepository) {}

  async execute(): Promise<Product[]> {
    return await this.productRepo.getAll();
  }
}
