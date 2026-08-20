import { firestore } from "../../config/firebase";
import { CartItem } from "../../domain/entities/CartItem";
import { CartRepository } from "../../domain/repositories/CartRepository";

export class CartFirestoreRepository implements CartRepository {
  async add(item: CartItem): Promise<void> {
    await firestore
      .collection("users")
      .doc(item.userId)
      .collection("cart")
      .add(item);
  }

  async getByUser(userId: string): Promise<CartItem[]> {
    const snapshot = await firestore
      .collection("users")
      .doc(userId)
      .collection("cart")
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CartItem[];
  }

  async removeByProduct(userId: string, productId: string): Promise<void> {
    const snapshot = await firestore
      .collection("users")
      .doc(userId)
      .collection("cart")
      .where("productId", "==", productId)
      .get();

    const batch = firestore.batch();

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  }
}
