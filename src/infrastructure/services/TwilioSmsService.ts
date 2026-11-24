import axios from "axios";
import { SmsService, SmsSendOptions } from "../../domain/services/SmsService";
import { MessageLog, MessageStatus } from "../../domain/entities/MessageLog";
import { MessageLogRepository } from "../../domain/repositories/MessageLogRepository";
import { MessageLogFirestoreRepository } from "../firestore/MessageLogFirestoreRepository";

/**
 * Envía mensajes SMS usando la API REST de Twilio y registra cada intento
 * en la colección `messageLogs` de Firestore.
 * Si no hay credenciales configuradas, registra el mensaje en consola
 * únicamente fuera de producción para permitir pruebas locales.
 */
export class TwilioSmsService implements SmsService {
  constructor(
    private messageLogRepo: MessageLogRepository = new MessageLogFirestoreRepository()
  ) {}

  async sendOtp(phone: string, code: string): Promise<void> {
    const body = `Suplicem: tu código de verificación es ${code}. Vence en 5 minutos.`;
    await this.sendMessage(phone, body, { kind: "otp" });
  }

  async sendMessage(
    phone: string,
    body: string,
    options: SmsSendOptions = {}
  ): Promise<void> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID || "";
    const authToken = process.env.TWILIO_AUTH_TOKEN || "";
    const from = process.env.TWILIO_SMS_FROM || "";

    if (!accountSid || !authToken || !from) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("El servicio de SMS no está configurado.");
      }
      console.info(`[SMS] Mensaje para ${phone}: ${body}`);
      return;
    }

    const kind = options.kind || "generic";
    const logBody = kind === "otp" ? "[OTP redactado]" : body;

    try {
      const response = await this.postMessage(accountSid, authToken, from, phone, body);
      console.info(`[SMS] Enviado (SID: ${response?.sid || "N/D"})`);
      await this.logMessage({
        recipientId: options.recipientId,
        channel: "sms",
        provider: "twilio",
        providerMessageId: response?.sid,
        phone,
        body: logBody,
        status: this.mapStatus(response?.status),
        createdAt: new Date().toISOString(),
      });
    } catch (error: any) {
      const twilioError = error?.response?.data;

      // Las cuentas trial solo permiten plantillas predefinidas (error 572006).
      if (twilioError?.code === 572006) {
        const template = this.trialTemplateFor(body);
        console.info(`[SMS] Cuenta trial: reintentando con plantilla ${template}`);
        try {
          const response = await this.postMessage(
            accountSid,
            authToken,
            from,
            phone,
            template
          );
          console.info(`[SMS] Enviado (trial ${template}, SID: ${response?.sid || "N/D"})`);
          await this.logMessage({
            recipientId: options.recipientId,
            channel: "sms",
            provider: "twilio",
            providerMessageId: response?.sid,
            phone,
            template,
            body: logBody,
            status: this.mapStatus(response?.status),
            createdAt: new Date().toISOString(),
          });
          return;
        } catch (retryError: any) {
          await this.logFailure(retryError, phone, logBody, template, options);
          throw this.toTwilioError(retryError);
        }
      }

      await this.logFailure(error, phone, logBody, undefined, options);
      throw this.toTwilioError(error);
    }
  }

  private async postMessage(
    accountSid: string,
    authToken: string,
    from: string,
    to: string,
    body: string
  ): Promise<{ sid?: string; status?: string } | undefined> {
    const response = await axios.post<{ sid?: string; status?: string }>(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      new URLSearchParams({
        To: to,
        From: from,
        Body: body,
      }),
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

  private async logFailure(
    error: any,
    phone: string,
    body: string,
    template: string | undefined,
    options: SmsSendOptions
  ): Promise<void> {
    const twilioError = error?.response?.data;
    await this.logMessage({
      recipientId: options.recipientId,
      channel: "sms",
      provider: "twilio",
      phone,
      template,
      body,
      status: "failed",
      errorCode: twilioError?.code ? String(twilioError.code) : undefined,
      errorMessage: twilioError?.message || error?.message || "Error desconocido",
      createdAt: new Date().toISOString(),
    });
  }

  private mapStatus(status?: string): MessageStatus {
    if (!status) return "queued";
    if (status === "delivered" || status === "received") return "delivered";
    if (status === "failed" || status === "undelivered") return "failed";
    if (status === "sent" || status === "sending") return "sent";
    return "queued";
  }

  private trialTemplateFor(body: string): string {
    return /c[oó]digo de verificaci[oó]n/i.test(body) ? "sms_2fa" : "sms_account_alerts";
  }

  private toTwilioError(error: any): Error {
    const twilioError = error?.response?.data;
    const detail = twilioError?.message
      ? `${twilioError.code ? `[${twilioError.code}] ` : ""}${twilioError.message}`
      : error?.message || "Error desconocido";
    return new Error(`Twilio SMS: ${detail}`);
  }
}
