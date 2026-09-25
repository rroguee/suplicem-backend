import { ProductRepository } from "../../../domain/repositories/ProductRepository";
import { deleteStorageFile } from "../../../domain/services/ImageStorageService";

export class DeleteProductUseCase {
  constructor(private productRepo: ProductRepository) {}

  async execute(id: string): Promise<void> {
    if (!id) {
      throw new Error("El ID del producto es requerido");
    }

    const product = await this.productRepo.findById(id);

    await this.productRepo.delete(id);

    if (product?.imageUrl) {
      await deleteStorageFile(product.imageUrl);
    }
  }
}