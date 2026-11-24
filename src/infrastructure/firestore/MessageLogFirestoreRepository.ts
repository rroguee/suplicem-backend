import { firestore } from "../../config/firebase";
import { MessageLog } from "../../domain/entities/MessageLog";
import { MessageLogRepository } from "../../domain/repositories/MessageLogRepository";

const COLLECTION = "messageLogs";

export class MessageLogFirestoreRepository implements MessageLogRepository {
  async create(log: Omit<MessageLog, "id">): Promise<string> {
    try {
      const docRef = await firestore.collection(COLLECTION).add({
        ...log,
        createdAt: log.createdAt || new Date().toISOString(),
      });
      return docRef.id;
    } catch (error: any) {
      console.error("[MessageLogRepo] Error en create:", error?.message || error);
      throw new Error("No se pudo registrar el mensaje en la base de datos");
    }
  }

  async updateStatus(
    id: string,
    status: MessageLog["status"],
    extra: Partial<MessageLog> = {}
  ): Promise<void> {
    try {
      await firestore
        .collection(COLLECTION)
        .doc(id)
        .update({
          ...extra,
          status,
          updatedAt: new Date().toISOString(),
        });
    } catch (error: any) {
      console.error("[MessageLogRepo] Error en updateStatus:", error?.message || error);
    }
  }
}
