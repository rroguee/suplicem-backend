import { TripRepository } from "../../../domain/repositories/TripRepository";

export class AcceptTripUseCase {
  constructor(private tripRepo: TripRepository) {}

  async execute(tripId: string, driverId: string): Promise<void> {
    if (!tripId || !driverId) {
      throw new Error("ID del viaje o del conductor faltante");
    }

    await this.tripRepo.assignDriver(tripId, driverId);
  }
}
