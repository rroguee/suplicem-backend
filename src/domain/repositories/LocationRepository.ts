export interface LocationRepository {
  update(driverId: string, lat: number, lng: number): Promise<void>;
  get(driverId: string): Promise<{ lat: number; lng: number; updatedAt: string } | null>;
}
