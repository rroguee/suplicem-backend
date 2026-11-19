export type SmsMessageKind = "otp" | "account_status" | "generic";

export interface SmsSendOptions {
  recipientId?: string;
  kind?: SmsMessageKind;
}

export interface SmsService {
  sendOtp(phone: string, code: string): Promise<void>;
  sendMessage(phone: string, body: string, options?: SmsSendOptions): Promise<void>;
}
