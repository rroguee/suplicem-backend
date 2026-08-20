import { Product } from "../../../domain/entities/Product";
import { ProductRepository } from "../../../domain/repositories/ProductRepository";

export class SearchProductsUseCase {
  constructor(private productRepo: ProductRepository) {}

  async execute(query?: string): Promise<Product[]> {
    return await this.productRepo.search(query);
  }
}
