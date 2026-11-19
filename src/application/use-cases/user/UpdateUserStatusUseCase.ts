import { UserRepository } from "../../../domain/repositories/UserRepository";
import { AuthService } from "../../../domain/services/AuthService";
import { RegistrationBotService } from "../../../infrastructure/services/RegistrationBotService";
import { SmsService } from "../../../domain/services/SmsService";
import { normalizeDominicanPhone } from "../../../domain/services/PhoneService";
import { User } from "../../../domain/entities/User";
import { UpdateUserStatusDto } from "../../dtos/UserDtos";
import { NotificationDispatcherService } from "../../services/NotificationDispatcherService";

export class UpdateUserStatusUseCase {
  constructor(
    private userRepo: UserRepository,
    private authService?: AuthService,
    private smsService?: SmsService,
    private botService: RegistrationBotService = new RegistrationBotService(),
    private notificationDispatcher?: NotificationDispatcherService
  ) {}

  async execute({ uid, status }: UpdateUserStatusDto, requesterUid?: string): Promise<void> {
    if (requesterUid && requesterUid === uid && (status === "inactive" || status === "banned")) {
      throw new Error("No puedes desactivar o suspender tu propia cuenta de administrador");
    }

    const user = await this.userRepo.getById(uid);

    if (!user) {
      throw new Error("Usuario no encontrado");
    }

    const previousStatus = user.status;
    user.status = status;
    await this.userRepo.update(uid, user);

    // Sincronizar estado en Firebase Auth y revocar sesiones activas
    if (status === "inactive" || status === "banned") {
      await this.authService?.setUserDisabled?.(uid, true);
      await this.authService?.revokeRefreshTokens?.(uid);
    } else if (status === "active") {
      await this.authService?.setUserDisabled?.(uid, false);
    }

    if (previousStatus === status) {
      return;
    }

    // Si el administrador aprueba una cuenta nueva por primera vez (estado cambia de 'pending' a 'active'), enviar correo con el bot
    if (
      status === "active" &&
      previousStatus === "pending" &&
      user.email &&
      user.notifications?.email !== false
    ) {
      try {
        await this.botService.sendAccountApprovedEmailBot(
          user.email,
          user.names || "Usuario",
          user.lastNames || ""
        );
      } catch (error: any) {
        console.warn("[Email] No se pudo enviar el correo de aprobación:", error?.message || error);
      }
    }

    await this.sendInAppStatusNotification(user, status, previousStatus);
    await this.sendStatusSms(user, status, previousStatus);
  }

  private async sendInAppStatusNotification(
    user: User,
    status: User["status"],
    previousStatus: User["status"]
  ): Promise<void> {
    if (!this.notificationDispatcher || user.notifications?.inApp === false) return;
    if (status === "pending") return;

    try {
      await this.notificationDispatcher.notifyAccountStatusChanged({
        userId: user.uid,
        userType: user.userType,
        status,
        previousStatus,
        userName: `${user.names || ""} ${user.lastNames || ""}`.trim() || undefined,
      });
    } catch (error: any) {
      console.warn(
        "[Notification] No se pudo crear la notificación de estado:",
        error?.message || error
      );
    }
  }

  private async sendStatusSms(
    user: User,
    status: User["status"],
    previousStatus: User["status"]
  ): Promise<void> {
    if (!this.smsService || !user.phone) return;
    if (user.notifications?.sms === false) return;

    const message = this.buildStatusMessage(status, previousStatus);
    if (!message) return;

    try {
      const phone = normalizeDominicanPhone(user.phone);
      await this.smsService.sendMessage(phone, message, {
        recipientId: user.uid,
        kind: "account_status",
      });
    } catch (error: any) {
      console.warn("[SMS] No se pudo notificar el cambio de estado:", error?.message || error);
    }
  }

  private buildStatusMessage(
    status: User["status"],
    previousStatus: User["status"]
  ): string | null {
    if (status === "active") {
      return previousStatus === "pending"
        ? "Suplicem: ¡Buenas noticias! Tu cuenta ha sido aprobada. Ya puedes iniciar sesión en la app."
        : "Suplicem: Tu cuenta ha sido reactivada. Ya puedes iniciar sesión en la app.";
    }
    if (status === "rejected") {
      return "Suplicem: Tu solicitud de registro fue rechazada. Comunícate con soporte para más información.";
    }
    if (status === "inactive") {
      return "Suplicem: Tu cuenta ha sido desactivada. Comunícate con soporte para más información.";
    }
    if (status === "banned") {
      return "Suplicem: Tu cuenta ha sido suspendida. Comunícate con soporte para más información.";
    }
    return null;
  }
}
