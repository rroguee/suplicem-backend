import { TripRepository } from "../../../domain/repositories/TripRepository";
import { UserRepository } from "../../../domain/repositories/UserRepository";

export class AssignTripDriverUseCase {
  constructor(
    private tripRepo: TripRepository,
    private userRepo?: UserRepository
  ) {}

  async execute(tripId: string, driverId: string): Promise<void> {
    if (!tripId || tripId.trim() === "") {
      throw new Error("El ID del viaje es obligatorio");
    }
    if (!driverId || driverId.trim() === "") {
      throw new Error("El ID del conductor es obligatorio");
    }

    const trip = await this.tripRepo.getById(tripId);
    if (!trip) {
      throw new Error("El viaje solicitado no existe");
    }

    const assignableStatuses = ["available", "assigned", "accepted", "canceled"];
    if (!assignableStatuses.includes(trip.status)) {
      throw new Error(
        `El viaje ${trip.tripNumber || tripId} no está disponible para asignación (estado: ${trip.status}).`
      );
    }

    if (this.userRepo) {
      const driver = await this.userRepo.getById(driverId);
      if (!driver || driver.userType !== "driver") {
        throw new Error("El usuario especificado no es un conductor válido");
      }
    }

    await this.tripRepo.assignDriver(tripId, driverId);
  }
}
