import { TripRepository } from "../../../domain/repositories/TripRepository";

export class GetTripDetailsUseCase {
  constructor(private tripRepo: TripRepository) {}

  async execute(tripId: string): Promise<any> {
    return await this.tripRepo.getByIdWithOrders(tripId);
  }
}
