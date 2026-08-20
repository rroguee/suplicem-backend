import { TripRepository } from "../../../domain/repositories/TripRepository";

export class GetTripByOrderIdUseCase {
  constructor(private tripRepo: TripRepository) {}

  async execute(orderId: string): Promise<{
    id: string;
    tripNumber: string;
    status: string;
    assignedDriverId: string;
    driver: any | null;
  } | null> {
    return await this.tripRepo.getTripByOrderId(orderId);
  }
}
