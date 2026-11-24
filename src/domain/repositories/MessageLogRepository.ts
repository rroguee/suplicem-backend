import { MessageLog } from "../entities/MessageLog";

export interface MessageLogRepository {
  create(log: Omit<MessageLog, "id">): Promise<string>;
  updateStatus(
    id: string,
    status: MessageLog["status"],
    extra?: Partial<MessageLog>
  ): Promise<void>;
}
