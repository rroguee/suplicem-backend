import { Request, Response, NextFunction } from "express";
import { auth, firestore } from "../../../config/firebase";
import { ApplicationActor } from "../../../application/dtos/UserDtos";

export const authenticateOptional = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  // Si no hay encabezado Authorization, continuar como anónimo
  if (!authHeader) {
    (req as any).user = undefined;
    return next();
  }

  if (!authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Token no proporcionado o mal formado",
    });
    return;
  }

  const idToken = authHeader.split(" ")[1];

  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const userDoc = await firestore
      .collection("users")
      .doc(decodedToken.uid)
      .get();
    
    const userData = userDoc.data();
    const rawUserType = userData?.userType || "client";
    const normalizedUserType = String(rawUserType).trim().toLowerCase() as any;

    (req as any).user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      userType: normalizedUserType,
      status: userData?.status || "pending",
    } as ApplicationActor;

    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: "Token inválido o expirado",
    });
  }
};