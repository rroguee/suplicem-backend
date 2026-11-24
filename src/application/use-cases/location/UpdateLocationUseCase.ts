import { LocationRepository } from "../../../domain/repositories/LocationRepository";
import { TripRepository } from "../../../domain/repositories/TripRepository";

export class UpdateLocationUseCase {
  constructor(
    private repo: LocationRepository,
    private tripRepo?: TripRepository
  ) {}

  async execute(driverId: string, lat: number, lng: number): Promise<boolean> {
    // Privacidad GPS: Solo persistir telemetría si el chofer tiene un viaje en curso
    if (this.tripRepo) {
      const activeTrips = await this.tripRepo.getDriverActualTrips(driverId);
      const isCurrentlyInTransit = activeTrips.some(
        (t) => t.status === "started" || t.status === "in_progress"
      );
      if (!isCurrentlyInTransit) {
        return false;
      }
    }

    await this.repo.update(driverId, lat, lng);
    return true;
  }
}
