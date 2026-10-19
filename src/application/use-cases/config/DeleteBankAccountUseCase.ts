import { BankAccountRepository } from "../../../domain/repositories/BankAccountRepository";

export class DeleteBankAccountUseCase {
  constructor(private bankAccountRepo: BankAccountRepository) {}

  async execute(id: string): Promise<void> {
    if (!id) {
      throw new Error("El ID de la cuenta bancaria es requerido");
    }

    const existing = await this.bankAccountRepo.findById(id);
    if (!existing) {
      throw new Error("Cuenta bancaria no encontrada");
    }

    await this.bankAccountRepo.delete(id);
  }
}
