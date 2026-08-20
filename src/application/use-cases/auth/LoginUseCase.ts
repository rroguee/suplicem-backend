import { AuthService } from "../../../domain/services/AuthService";
import { LoginDto } from "../../dtos/LoginDtos";


export class LoginUseCase {
  constructor(private authService: AuthService) {}

  async execute({ email, password }: LoginDto) {
    const loginResponse = await this.authService.login(email, password);
    const userInfo = await this.authService.getUserByUid(loginResponse.uid);

    return {
      success: true,
      ...loginResponse,
      emailVerified: userInfo.emailVerified,
    };
  }
}
