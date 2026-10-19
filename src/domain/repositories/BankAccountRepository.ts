import { BankAccount } from "../entities/BankAccount";

export interface BankAccountRepository {
  getAll(): Promise<BankAccount[]>;
  findById(id: string): Promise<BankAccount | null>;
  create(account: Omit<BankAccount, "id">): Promise<string>;
  update(id: string, data: Partial<BankAccount>): Promise<void>;
  delete(id: string): Promise<void>;
}
