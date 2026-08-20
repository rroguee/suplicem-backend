import { AuthService } from "../../../domain/services/AuthService";

export class RefreshTokenUseCase {
  constructor(private authService: AuthService) {}

  async execute(refreshToken: string) {
    if (!refreshToken) {
      throw new Error("Se requiere el refreshToken");
    }

    return await this.authService.refreshIdToken(refreshToken);
  }
}
