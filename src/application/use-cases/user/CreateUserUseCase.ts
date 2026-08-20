import { User } from "../../../domain/entities/User";
import { UserRepository } from "../../../domain/repositories/UserRepository";
import { AuthService } from "../../../domain/services/AuthService";
import { CreateUserDto } from "../../dtos/UserDtos";

export class CreateUserUseCase {
  constructor(
    private userRepo: UserRepository,
    private authService: AuthService
  ) {}

  async execute(data: CreateUserDto): Promise<void> {
    const { email, password, names, lastNames } = data;

    // Crear usuario en Firebase Auth
    const { uid } = await this.authService.registerWithEmailAndPassword(
      email,
      password,
      `${names} ${lastNames}`
    );

    // Iniciar sesión para obtener el idToken
    const { idToken } = await this.authService.login(email, password);

    // Enviar correo de verificación
    await this.authService.sendVerificationEmail(idToken);

    // Guardar en Firestore
    const userToSave: User = {
      ...data,
      uid,
      createdAt: new Date().toISOString(),
      status: "pending"
    };

    await this.userRepo.create(userToSave);
  }
}
