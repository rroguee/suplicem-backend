import { CorsOptions } from "cors";

const allowedOrigins = [
  process.env.ADMIN_URL,
  process.env.ADMIN_CORS_ORIGIN,
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:8081", // Expo Metro Bundler
  "http://localhost:5173",
].filter(Boolean) as string[];

/**
 * Validador de orígenes autorizados para HTTP y WebSockets
 */
export const isOriginAllowed = (origin?: string): boolean => {
  // Peticiones de apps móviles nativas (React Native/Expo en iOS y Android), curl o Postman no envían cabecera Origin
  if (!origin) return true;

  if (
    allowedOrigins.includes(origin) ||
    process.env.NODE_ENV !== "production" ||
    origin.startsWith("http://localhost:") ||
    origin.startsWith("http://127.0.0.1:") ||
    origin.startsWith("exp://")
  ) {
    return true;
  }

  return false;
};

/**
 * Opciones seguras de CORS para Express
 */
export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Acceso bloqueado por política CORS: origen ${origin} no autorizado`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "x-idempotency-key",
    "idempotency-key",
  ],
};
