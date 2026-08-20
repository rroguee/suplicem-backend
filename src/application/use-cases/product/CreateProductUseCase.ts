import { Product } from "../../../domain/entities/Product";
import { ProductRepository } from "../../../domain/repositories/ProductRepository";

export class CreateProductUseCase {
  constructor(private productRepo: ProductRepository) {}

  async execute(data: Omit<Product, "id" | "createdAt">): Promise<string> {
    const newProduct: Product = {
      ...data,
      createdAt: new Date().toISOString(),
    };

    return await this.productRepo.create(newProduct);
  }
}
