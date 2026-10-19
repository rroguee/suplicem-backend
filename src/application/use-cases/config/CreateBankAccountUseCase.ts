import { BankAccount } from "../../../domain/entities/BankAccount";
import { BankAccountRepository } from "../../../domain/repositories/BankAccountRepository";

export class CreateBankAccountUseCase {
  constructor(private bankAccountRepo: BankAccountRepository) {}

  async execute(
    data: Omit<BankAccount, "id" | "createdAt" | "updatedAt">
  ): Promise<string> {
    const newAccount: Omit<BankAccount, "id"> = {
      ...data,
      isActive: data.isActive ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return await this.bankAccountRepo.create(newAccount);
  }
}
