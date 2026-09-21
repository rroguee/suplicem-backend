import { z } from "zod";

export const AddToCartSchema = z.object({
  productId: z.string().min(1, "productId es requerido"),
  quantity: z.number().positive("quantity debe ser mayor a 0"),
  unit: z.string().min(1, "unit es requerido"),
});