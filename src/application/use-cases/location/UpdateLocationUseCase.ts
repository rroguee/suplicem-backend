import { LocationRepository } from "../../../domain/repositories/LocationRepository";

export class UpdateLocationUseCase {
  constructor(private repo: LocationRepository) {}

  async execute(driverId: string, lat: number, lng: number) {
    await this.repo.update(driverId, lat, lng);
  }
}
