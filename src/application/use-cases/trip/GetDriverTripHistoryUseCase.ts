import { Trip } from "../../../domain/entities/Trip";
import { TripRepository } from "../../../domain/repositories/TripRepository";

export class GetDriverTripHistoryUseCase {
  constructor(private tripRepo: TripRepository) {}

  async execute(userId: string): Promise<Trip[]> {
    return await this.tripRepo.getDriverTripHistory(userId);
  }
}
