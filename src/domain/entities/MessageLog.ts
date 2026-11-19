export type MessageChannel = "sms" | "whatsapp" | "email" | "push";

export type MessageStatus = "queued" | "sent" | "delivered" | "failed";

export interface MessageLog {
  id?: string;
  recipientId?: string;
  channel: MessageChannel;
  provider: "twilio" | "sendgrid" | "firebase";
  providerMessageId?: string;
  phone?: string;
  template?: string;
  body?: string;
  status: MessageStatus;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt?: string;
}
