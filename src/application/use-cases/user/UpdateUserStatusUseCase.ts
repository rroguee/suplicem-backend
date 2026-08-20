import { UserRepository } from "../../../domain/repositories/UserRepository";
import { UpdateUserStatusDto } from "../../dtos/UserDtos";


export class UpdateUserStatusUseCase {
  constructor(private userRepo: UserRepository) {}

  async execute({ uid, status }: UpdateUserStatusDto): Promise<void> {
    const user = await this.userRepo.getById(uid);

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    user.status = status;
    await this.userRepo.update(uid, user);
  }
}
