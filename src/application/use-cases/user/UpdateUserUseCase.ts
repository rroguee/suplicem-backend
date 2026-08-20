import { User } from "../../../domain/entities/User";
import { UserRepository } from "../../../domain/repositories/UserRepository";

export class UpdateUserUseCase {
  constructor(private userRepo: UserRepository) {}

  async execute(user: User): Promise<void> {
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    await this.userRepo.update(user.uid, user);
  }
}
