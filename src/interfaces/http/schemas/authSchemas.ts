import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email("Formato de correo electrónico no válido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "refreshToken es requerido"),
});

export const RecoverPasswordSchema = z.object({
  email: z.string().email("Formato de correo electrónico no válido"),
});