import { CartItem } from "../entities/CartItem";

export interface CartRepository {
  add(item: CartItem): Promise<void>;
  getByUser(userId: string): Promise<CartItem[]>;
  removeByProduct(userId: string, productId: string): Promise<void>;
}
