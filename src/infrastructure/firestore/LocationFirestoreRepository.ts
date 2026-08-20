import { firestore } from "../../config/firebase";
import { LocationRepository } from "../../domain/repositories/LocationRepository";

export class LocationFirestoreRepository implements LocationRepository {
  private collection = firestore.collection("locations");

  async update(driverId: string, lat: number, lng: number) {
    await this.collection.doc(driverId).set({
      lat,
      lng,
      updatedAt: new Date().toISOString(),
    });
  }

  async get(driverId: string) {
    const snap = await this.collection.doc(driverId).get();
    if (!snap.exists) return null;
    return snap.data() as { lat: number; lng: number; updatedAt: string };
  }
}
