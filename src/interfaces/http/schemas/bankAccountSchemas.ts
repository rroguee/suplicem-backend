import { z } from "zod";

const accountTypeEnum = z.preprocess((val) => {
  if (typeof val === "string") {
    const lower = val.toLowerCase().trim();
    if (lower.includes("ahorro")) return "savings";
    if (lower.includes("corriente")) return "current";
    if (lower === "checking") return "checking";
    if (lower === "savings") return "savings";
    if (lower === "current") return "current";
  }
  return val;
}, z.enum(["savings", "checking", "current"]));

export const CreateBankAccountSchema = z.object({
  bankName: z.string().min(1, "El nombre del banco es requerido"),
  accountHolder: z.string().min(1, "El titular de la cuenta es requerido"),
  accountNumber: z.string().min(1, "El número de cuenta es requerido"),
  accountType: accountTypeEnum,
  currency: z.string().min(1, "La moneda es requerida"),
  routingNumber: z.string().optional(),
  swiftCode: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const UpdateBankAccountSchema = z
  .object({
    bankName: z.string().min(1).optional(),
    accountHolder: z.string().min(1).optional(),
    accountNumber: z.string().min(1).optional(),
    accountType: accountTypeEnum.optional(),
    currency: z.string().min(1).optional(),
    routingNumber: z.string().optional(),
    swiftCode: z.string().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.bankName !== undefined ||
      data.accountHolder !== undefined ||
      data.accountNumber !== undefined ||
      data.accountType !== undefined ||
      data.currency !== undefined ||
      data.routingNumber !== undefined ||
      data.swiftCode !== undefined ||
      data.isActive !== undefined,
    {
      message: "Debe proporcionar al menos un campo para actualizar",
    }
  );
