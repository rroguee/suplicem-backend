import { firestore } from "../../config/firebase";
import { Product } from "../../domain/entities/Product";
import { ProductRepository } from "../../domain/repositories/ProductRepository";

export class ProductFirestoreRepository implements ProductRepository {
  async create(product: Product): Promise<string> {
    const docRef = await firestore.collection("products").add(product);
    return docRef.id;
  }

  async getAll(): Promise<Product[]> {
    const snapshot = await firestore.collection("products").get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];
  }

  async search(query?: string): Promise<Product[]> {
    let ref: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> =
      firestore.collection("products");

    if (query) {
      // Convertimos a minúscula y usamos el prefijo para búsqueda básica
      ref = ref
        .where("name", ">=", query.toLowerCase())
        .where("name", "<=", query.toLowerCase() + "\uf8ff");
    }

    const snapshot = await ref.get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Product[];
  }
}
