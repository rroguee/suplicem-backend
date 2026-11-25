import { Request, Response, NextFunction } from "express";
import { auth } from "../../../config/firebase";
import { UserFirestoreRepository } from "../../../infrastructure/firestore/UserFirestoreRepository";

const userRepository = new UserFirestoreRepository();

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  userType: "client" | "driver" | "admin" | "seller";
  status?: string;
  [key: string]: any;
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Token no proporcionado o mal formado",
    });
    return;
  }

  const idToken = authHeader.split(" ")[1];

  let decodedToken;
  try {
    // 1. Verificación criptográfica estricta con Firebase Admin
    decodedToken = await auth.verifyIdToken(idToken);
  } catch (tokenError: any) {
    console.error("Token verification failed:", tokenError?.message || tokenError);
    res.status(401).json({
      success: false,
      message: "Token inválido o expirado",
    });
    return;
  }

  try {
    // 2. Obtener el rol y estado real del usuario desde caché/Firestore
    const userData = await userRepository.getByIdStrict(decodedToken.uid);
    // Extraer la ruta estricta sin query parameters para evitar evasiones por parameter pollution
    const cleanPath = req.baseUrl ? `${req.baseUrl}${req.path}` : req.path;
    const isAuthMe = cleanPath === "/api/auth/me" || req.path === "/auth/me";

    // Rechazar tokens válidos de Firebase cuyo usuario no exista en Firestore (cuenta huérfana o eliminada)
    if (!userData && !isAuthMe) {
      res.status(401).json({
        success: false,
        code: "USER_NOT_REGISTERED",
        message: "Acceso denegado: la cuenta de usuario no está registrada en el sistema",
      });
      return;
    }

    const rawUserType = userData?.userType || "client";
    const normalizedUserType = String(rawUserType).trim().toLowerCase();
    const userStatus = userData?.status || "pending";

    if (!isAuthMe && (userStatus === "inactive" || userStatus === "banned" || userStatus === "rejected")) {
      res.status(403).json({
        success: false,
        code: "ACCOUNT_INACTIVE",
        message: "Acceso denegado: su cuenta se encuentra inactiva, rechazada o suspendida",
      });
      return;
    }

    (req as any).user = {
      ...decodedToken,
      uid: decodedToken.uid,
      email: decodedToken.email,
      userType: normalizedUserType,
      status: userStatus,
    } as AuthenticatedUser;

    next();
  } catch (dbError: any) {
    console.error("Firestore error in auth middleware:", dbError?.message || dbError);
    res.status(500).json({
      success: false,
      message: "Error de conexión con la base de datos al validar usuario",
    });
  }
};