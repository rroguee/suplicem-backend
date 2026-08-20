import { TripRepository } from "../../../domain/repositories/TripRepository";

export class UpdateTripStatusUseCase {
  constructor(private tripRepo: TripRepository) {}

  async execute(tripId: string, status: string): Promise<void> {
    if (!tripId || !status) {
      throw new Error("ID del viaje o del status faltante");
    }

    await this.tripRepo.updateTripStatus(tripId, status);
  }
}
