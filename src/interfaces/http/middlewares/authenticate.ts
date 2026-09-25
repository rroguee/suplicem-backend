import { Request, Response, NextFunction } from "express";
import { auth, firestore } from "../../../config/firebase";

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  userType: "client" | "driver" | "admin";
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
    // 2. Obtener el rol y estado real del usuario desde Firestore
    const userDoc = await firestore
      .collection("users")
      .doc(decodedToken.uid)
      .get();
    const userData = userDoc.data();
    const rawUserType = userData?.userType || "client";
    const normalizedUserType = String(rawUserType).trim().toLowerCase();

    (req as any).user = {
      ...decodedToken,
      uid: decodedToken.uid,
      email: decodedToken.email,
      userType: normalizedUserType,
      status: userData?.status || "pending",
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