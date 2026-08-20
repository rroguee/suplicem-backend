import { User } from "../../../domain/entities/User";
import { UserRepository } from "../../../domain/repositories/UserRepository";

export class GetCurrentUserUseCase {
  constructor(private userRepo: UserRepository) {}

  async execute(uid: string): Promise<User> {
    const user = await this.userRepo.getById(uid);

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    return user;
  }
}
