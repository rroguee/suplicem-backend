import { SmsService } from "../../domain/services/SmsService";
import { TwilioSmsService } from "./TwilioSmsService";
import { TwilioVerifySmsService } from "./TwilioVerifySmsService";

export const createSmsService = (): SmsService => {
  if (process.env.TWILIO_VERIFY_SERVICE_SID) {
    return new TwilioVerifySmsService();
  }

  return new TwilioSmsService();
};
