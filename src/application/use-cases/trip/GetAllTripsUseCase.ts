import { Trip } from "../../../domain/entities/Trip";
import { TripRepository } from "../../../domain/repositories/TripRepository";

export class GetAllTripsUseCase {
  constructor(private tripRepo: TripRepository) {}

  async execute(): Promise<Trip[]> {
    return await this.tripRepo.getAll();
  }
}
