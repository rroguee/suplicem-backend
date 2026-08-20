import { Product } from "../entities/Product";

export interface ProductRepository {
  create(product: Product): Promise<string>; // retorna el ID generado
  getAll(): Promise<Product[]>;
  search(query?: string): Promise<Product[]>;
}
