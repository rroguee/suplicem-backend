import axios from "axios";
import { SmsService, SmsSendOptions } from "../../domain/services/SmsService";
import { MessageLog, MessageStatus } from "../../domain/entities/MessageLog";
import { MessageLogRepository } from "../../domain/repositories/MessageLogRepository";
import { MessageLogFirestoreRepository } from "../firestore/MessageLogFirestoreRepository";
import { TwilioSmsService } from "./TwilioSmsService";

interface VerifyResponse {
  sid?: string;
  status?: string;
}

/**
 * Proveedor OTP basado en Twilio Verify. Twilio genera y valida el código,
 * por lo que funciona con la plantilla de prueba de las cuentas Trial.
 * Los mensajes que no son OTP se delegan al servicio SMS normal.
 */
export class TwilioVerifySmsService implements SmsService {
  private fallback: TwilioSmsService;

  constructor(
    private messageLogRepo: MessageLogRepository = new MessageLogFirestoreRepository(),
    fallback?: TwilioSmsService
  ) {
    this.fallback = fallback || new TwilioSmsService(messageLogRepo);
  }

  async sendOtp(phone: string, _code: string): Promise<void> {
    await this.startOtpVerification(phone);
  }

  async startOtpVerification(phone: string): Promise<void> {
    const { accountSid, authToken, serviceSid } = this.config();

    try {
      const response = await this.post(
        `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`,
        { To: phone, Channel: "sms" },
        accountSid,
        authToken
      );

      await this.logMessage({
        channel: "sms",
        provider: "twilio",
        providerMessageId: response?.sid,
        phone,
        template: "verify",
        body: "[OTP Verify redactado]",
        status: this.mapStatus(response?.status),
        createdAt: new Date().toISOString(),
      });

      console.info(`[SMS] Verify enviado (SID: ${response?.sid || "N/D"})`);
    } catch (error) {
      await this.logFailure(error, phone);
      throw this.toTwilioError(error);
    }
  }

  async checkOtpVerification(phone: string, code: string): Promise<boolean> {
    const { accountSid, authToken, serviceSid } = this.config();

    try {
      const response = await this.post(
        `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`,
        { To: phone, Code: code },
        accountSid,
        authToken
      );

      return response?.status === "approved";
    } catch (error: any) {
      const httpStatus = error?.response?.status;
      const twilioCode = error?.response?.data?.code;

      // Sin verificación pendiente o máximo de intentos: el código no es válido.
      if (httpStatus === 404 || twilioCode === 60202) {
        return false;
      }

      throw this.toTwilioError(error);
    }
  }

  async sendMessage(
    phone: string,
    body: string,
    options: SmsSendOptions = {}
  ): Promise<void> {
    await this.fallback.sendMessage(phone, body, options);
  }

  private config() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
    const authToken = process.env.TWILIO_AUTH_TOKEN || "";
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID || "";

    if (!accountSid || !authToken || !serviceSid) {
      throw new Error("El servicio de Twilio Verify no está configurado.");
    }

    return { accountSid, authToken, serviceSid };
  }

  private async post(
    url: string,
    params: Record<string, string>,
    accountSid: string,
    authToken: string
  ): Promise<VerifyResponse | undefined> {
    const response = await axios.post<VerifyResponse>(
      url,
      new URLSearchParams(params),
      {
        auth: { username: accountSid, password: authToken },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 10000,
      }
    );

    return response.data;
  }

  private async logMessage(log: Omit<MessageLog, "id">): Promise<void> {
    try {
      await this.messageLogRepo.create(log);
    } catch (error: any) {
      console.warn("[SMS] No se pudo registrar el mensaje:", error?.message || error);
    }
  }

  private async logFailure(error: any, phone: string): Promise<void> {
    const twilioError = error?.response?.data;

    await this.logMessage({
      channel: "sms",
      provider: "twilio",
      phone,
      template: "verify",
      body: "[OTP Verify redactado]",
      status: "failed",
      errorCode: twilioError?.code ? String(twilioError.code) : undefined,
      errorMessage: twilioError?.message || error?.message || "Error desconocido",
      createdAt: new Date().toISOString(),
    });
  }

  private mapStatus(status?: string): MessageStatus {
    if (!status) return "queued";
    if (status === "approved" || status === "delivered" || status === "received") {
      return "delivered";
    }
    if (status === "failed" || status === "undelivered" || status === "canceled") {
      return "failed";
    }
    if (status === "sent" || status === "sending") return "sent";
    return "queued";
  }

  private toTwilioError(error: any): Error {
    const twilioError = error?.response?.data;
    const detail = twilioError?.message
      ? `${twilioError.code ? `[${twilioError.code}] ` : ""}${twilioError.message}`
      : error?.message || "Error desconocido";

    return new Error(`Twilio Verify: ${detail}`);
  }
}
