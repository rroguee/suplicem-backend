import { Trip } from "../../../domain/entities/Trip";
import { TripRepository } from "../../../domain/repositories/TripRepository";

export class GetTripByIdUseCase {
  constructor(private tripRepo: TripRepository) {}

  async execute(tripId: string): Promise<Trip | null> {
    return await this.tripRepo.getById(tripId);
  }
}