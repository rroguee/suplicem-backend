import { AuthService } from "../../../domain/services/AuthService";

export class RecoverPasswordUseCase {
  constructor(private authService: AuthService) {}

  async execute(email: string) {
    if (!email) {
      throw new Error("El correo es requerido");
    }

    await this.authService.sendPasswordResetEmail(email);
  }
}
