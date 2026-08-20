import { Trip } from "../../../domain/entities/Trip";
import { TripRepository } from "../../../domain/repositories/TripRepository";

export class CreateTripUseCase {
  constructor(private tripRepo: TripRepository) {}

  async execute(data: {
    tripNumber: string;
    orderIds: string[];
    comments?: string;
    totalTons: number;
  }): Promise<string> {
    if (!data.tripNumber || !data.orderIds?.length || !data.totalTons) {
      throw new Error("Faltan campos requeridos");
    }

    const newTrip: Trip = {
      ...data,
      status: "available",
      createdAt: new Date().toISOString(),
    };

    return await this.tripRepo.create(newTrip);
  }
}
