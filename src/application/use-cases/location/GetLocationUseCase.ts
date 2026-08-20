import { LocationRepository } from "../../../domain/repositories/LocationRepository";

export class GetLocationUseCase {
  constructor(private repo: LocationRepository) {}

  async execute(driverId: string) {
    return await this.repo.get(driverId);
  }
}
