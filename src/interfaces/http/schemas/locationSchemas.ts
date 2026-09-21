import { z } from "zod";

export const UpdateLocationSchema = z.object({
  lat: z
    .number({ message: "lat debe ser un número" })
    .min(-90, "latitud mínima es -90")
    .max(90, "latitud máxima es 90"),
  lng: z
    .number({ message: "lng debe ser un número" })
    .min(-180, "longitud mínima es -180")
    .max(180, "longitud máxima es 180"),
});