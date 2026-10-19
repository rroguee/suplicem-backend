import { BankAccount } from "../../../domain/entities/BankAccount";
import { BankAccountRepository } from "../../../domain/repositories/BankAccountRepository";

export class UpdateBankAccountUseCase {
  constructor(private bankAccountRepo: BankAccountRepository) {}

  async execute(id: string, data: Partial<BankAccount>): Promise<void> {
    if (!id) {
      throw new Error("El ID de la cuenta bancaria es requerido");
    }

    const existing = await this.bankAccountRepo.findById(id);
    if (!existing) {
      throw new Error("Cuenta bancaria no encontrada");
    }

    await this.bankAccountRepo.update(id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  }
}
