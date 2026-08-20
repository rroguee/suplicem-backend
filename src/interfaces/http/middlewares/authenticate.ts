import { Request, Response, NextFunction } from "express";
import { auth } from "../../../config/firebase";

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      message: "Token no proporcionado o mal formado",
    });
    return;
  }

  const idToken = authHeader.split(" ")[1];

  auth
    .verifyIdToken(idToken)
    .then((decodedToken) => {
      (req as any).user = decodedToken;
      next();
    })
    .catch(() => {
      res.status(401).json({
        success: false,
        message: "Token inválido o expirado",
      });
    });
};
