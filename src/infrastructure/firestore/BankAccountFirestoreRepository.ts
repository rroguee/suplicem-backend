import { firestore } from "../../config/firebase";
import { BankAccount } from "../../domain/entities/BankAccount";
import { BankAccountRepository } from "../../domain/repositories/BankAccountRepository";

const COLLECTION = "bank_accounts";

export class BankAccountFirestoreRepository implements BankAccountRepository {
  // ─── READ ALL ────────────────────────────────────────────────────────────────
  async getAll(): Promise<BankAccount[]> {
    try {
      const snapshot = await firestore.collection(COLLECTION).get();
      return snapshot.docs.map((doc) => this._mapDoc(doc)) as BankAccount[];
    } catch (error: any) {
      console.warn("[BankAccount] Error en getAll:", error?.message || error);
      return [];
    }
  }

  // ─── READ ONE ────────────────────────────────────────────────────────────────
  async findById(id: string): Promise<BankAccount | null> {
    try {
      const doc = await firestore.collection(COLLECTION).doc(id).get();
      if (!doc.exists) return null;
      return this._mapDoc(doc);
    } catch (error: any) {
      console.warn("[BankAccount] Error en findById:", error?.message || error);
      return null;
    }
  }

  // ─── CREATE ──────────────────────────────────────────────────────────────────
  async create(account: Omit<BankAccount, "id">): Promise<string> {
    try {
      const docRef = await firestore.collection(COLLECTION).add(account);
      return docRef.id;
    } catch (error: any) {
      console.error("[BankAccount] Error en create:", error?.message || error);
      throw new Error("No se pudo crear la cuenta bancaria en Firestore");
    }
  }

  // ─── UPDATE ──────────────────────────────────────────────────────────────────
  async update(id: string, data: Partial<BankAccount>): Promise<void> {
    try {
      await firestore.collection(COLLECTION).doc(id).update(data as Record<string, any>);
    } catch (error: any) {
      console.error("[BankAccount] Error en update:", error?.message || error);
      throw new Error("No se pudo actualizar la cuenta bancaria en Firestore");
    }
  }

  // ─── DELETE ──────────────────────────────────────────────────────────────────
  async delete(id: string): Promise<void> {
    try {
      await firestore.collection(COLLECTION).doc(id).delete();
    } catch (error: any) {
      console.error("[BankAccount] Error en delete:", error?.message || error);
      throw new Error("No se pudo eliminar la cuenta bancaria de Firestore");
    }
  }

  // ─── HELPER ──────────────────────────────────────────────────────────────────
  private _mapDoc(doc: FirebaseFirestore.DocumentSnapshot): BankAccount {
    const data = doc.data() || {};
    return {
      id: doc.id,
      bankName: data.bankName || data.bank || "Banco",
      accountHolder: data.accountHolder || data.holder || "SUPLICEM S.R.L.",
      accountNumber: data.accountNumber || "",
      accountType: data.accountType || "savings",
      currency: data.currency || "DOP",
      routingNumber: data.routingNumber || undefined,
      swiftCode: data.swiftCode || undefined,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      createdAt: data.createdAt || undefined,
      updatedAt: data.updatedAt || undefined,
      // Legacy
      rnc: data.rnc || undefined,
      holder: data.holder || undefined,
    };
  }
}
