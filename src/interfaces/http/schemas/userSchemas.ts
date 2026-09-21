import { z } from "zod";

export const AddressSchema = z.object({
  placeId: z.string().optional().default(""),
  description: z.string().min(1, "description es requerida"),
  latitude: z.number().optional().default(0),
  longitude: z.number().optional().default(0),
  additionalInfo: z.string().optional().default(""),
});

export const VehicleSchema = z.object({
  brand: z.string().min(1, "brand es requerida"),
  model: z.string().min(1, "model es requerido"),
  year: z.string().min(1, "year es requerido"),
  tons: z.string().min(1, "tons es requerido"),
  plateNumber: z.string().min(1, "plateNumber es requerido"),
});

export const CreateUserSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  names: z.string().min(1, "names es requerido"),
  lastNames: z.string().min(1, "lastNames es requerido"),
  identification: z.string().min(1, "identification es requerida"),
  identificationType: z.enum(["Cedula", "Pasaporte"], {
    message: "identificationType debe ser Cedula o Pasaporte",
  }),
  phone: z.string().min(1, "phone es requerido"),
  userType: z.enum(["client", "driver", "admin"]).optional().default("client"),
  addresses: z.array(AddressSchema).optional(),
  vehicle: VehicleSchema.optional(),
});

export const UpdateUserSchema = z.object({
  uid: z.string().min(1, "uid es requerido"),
  names: z.string().optional(),
  lastNames: z.string().optional(),
  phone: z.string().optional(),
  addresses: z.array(AddressSchema).optional(),
  vehicle: VehicleSchema.optional(),
  identificationImage: z.string().optional(),
});

export const UpdateUserStatusSchema = z.object({
  uid: z.string().min(1, "uid es requerido"),
  status: z.enum(["pending", "active", "inactive", "banned", "rejected"], {
    message: "status no válido",
  }),
});