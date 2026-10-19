import { Request, Response } from "express";
import { BankAccountFirestoreRepository } from "../../../infrastructure/firestore/BankAccountFirestoreRepository";
import { GetBankAccountsUseCase } from "../../../application/use-cases/config/GetBankAccountsUseCase";
import { CreateBankAccountUseCase } from "../../../application/use-cases/config/CreateBankAccountUseCase";
import { UpdateBankAccountUseCase } from "../../../application/use-cases/config/UpdateBankAccountUseCase";
import { DeleteBankAccountUseCase } from "../../../application/use-cases/config/DeleteBankAccountUseCase";

const bankAccountRepo = new BankAccountFirestoreRepository();

export class BankAccountController {
  constructor(
    private getBankAccountsUseCase = new GetBankAccountsUseCase(bankAccountRepo),
    private createBankAccountUseCase = new CreateBankAccountUseCase(bankAccountRepo),
    private updateBankAccountUseCase = new UpdateBankAccountUseCase(bankAccountRepo),
    private deleteBankAccountUseCase = new DeleteBankAccountUseCase(bankAccountRepo)
  ) {}

  // GET /bank-accounts
  async getAll(_req: Request, res: Response) {
    try {
      const bankAccounts = await this.getBankAccountsUseCase.execute();
      res.status(200).json(bankAccounts);
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Error al obtener las cuentas bancarias",
      });
    }
  }

  // POST /bank-accounts
  async create(req: Request, res: Response) {
    try {
      const id = await this.createBankAccountUseCase.execute(req.body);
      res.status(201).json({
        success: true,
        message: "Cuenta bancaria creada correctamente",
        id,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message || "Error al crear la cuenta bancaria",
      });
    }
  }

  // PATCH /bank-accounts/:id
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.updateBankAccountUseCase.execute(id, req.body);
      res.status(200).json({
        success: true,
        message: "Cuenta bancaria actualizada correctamente",
      });
    } catch (error: any) {
      const status = error.message?.includes("no encontrada") ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message || "Error al actualizar la cuenta bancaria",
      });
    }
  }

  // DELETE /bank-accounts/:id
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await this.deleteBankAccountUseCase.execute(id);
      res.status(200).json({
        success: true,
        message: "Cuenta bancaria eliminada correctamente",
      });
    } catch (error: any) {
      const status = error.message?.includes("no encontrada") ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message || "Error al eliminar la cuenta bancaria",
      });
    }
  }
}

// Backward-compatible alias
export { BankAccountController as ConfigController };
