import { Router } from "express";
import { BankAccountController } from "../controllers/ConfigController";
import { authenticate } from "../middlewares/authenticate";
import { requireRole } from "../middlewares/authorize";
import { validate } from "../middlewares/validate";
import {
  CreateBankAccountSchema,
  UpdateBankAccountSchema,
} from "../schemas/bankAccountSchemas";

export const configRoutes = (router: Router) => {
  const bankAccountController = new BankAccountController();

  // GET  /bank-accounts        — Lista todas las cuentas (admin + legacy /config/bank-accounts)
  router.get("/bank-accounts", authenticate, (req, res) =>
    bankAccountController.getAll(req, res)
  );
  router.get("/config/bank-accounts", authenticate, (req, res) =>
    bankAccountController.getAll(req, res)
  );

  // POST /bank-accounts        — Crea una nueva cuenta (solo admin)
  router.post(
    "/bank-accounts",
    authenticate,
    requireRole(["admin"]),
    validate(CreateBankAccountSchema),
    (req, res) => bankAccountController.create(req, res)
  );

  // PATCH /bank-accounts/:id   — Actualiza una cuenta (solo admin)
  router.patch(
    "/bank-accounts/:id",
    authenticate,
    requireRole(["admin"]),
    validate(UpdateBankAccountSchema),
    (req, res) => bankAccountController.update(req, res)
  );

  // DELETE /bank-accounts/:id  — Elimina una cuenta (solo admin)
  router.delete(
    "/bank-accounts/:id",
    authenticate,
    requireRole(["admin"]),
    (req, res) => bankAccountController.delete(req, res)
  );
};
