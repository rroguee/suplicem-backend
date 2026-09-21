import { Request, Response } from "express";
import { BankAccountFirestoreRepository } from "../../../infrastructure/firestore/BankAccountFirestoreRepository";
import { GetBankAccountsUseCase } from "../../../application/use-cases/config/GetBankAccountsUseCase";

const bankAccountRepo = new BankAccountFirestoreRepository();

export class ConfigController {
  constructor(
    private getBankAccountsUseCase = new GetBankAccountsUseCase(bankAccountRepo)
  ) {}

  async getBankAccounts(_req: Request, res: Response) {
    try {
      const bankAccounts = await this.getBankAccountsUseCase.execute();
      res.status(200).json({ success: true, bankAccounts });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Error al obtener las cuentas bancarias",
      });
    }
  }
}
