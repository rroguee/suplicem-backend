import { LocationRepository } from "../../../domain/repositories/LocationRepository";
import { ApplicationActor } from "../../dtos/UserDtos";

export class GetLocationUseCase {
  constructor(private repo: LocationRepository) {}

  async execute(driverId: string, authUser?: ApplicationActor) {
    if (!driverId || typeof driverId !== "string" || !driverId.trim()) {
      throw new Error("ID de conductor requerido");
    }

    if (authUser) {
      const isOwner = authUser.uid === driverId.trim();
      const isAdmin = authUser.userType === "admin";

      if (!isAdmin && !isOwner) {
        throw new Error("No tienes permiso para consultar la ubicación de este conductor");
      }
    }

    return await this.repo.get(driverId.trim());
  }
}

