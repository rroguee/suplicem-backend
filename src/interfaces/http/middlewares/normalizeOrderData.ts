import { Request, Response, NextFunction } from "express";

export const normalizeOrderData = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.body) {
    req.body = {};
    return next();
  }

  let body = { ...req.body };

  if (body.data) {
    if (typeof body.data === "string") {
      try {
        const parsed = JSON.parse(body.data);
        body = { ...body, ...parsed };
      } catch (e) {}
    } else if (typeof body.data === "object") {
      body = { ...body, ...body.data };
    }
  }

  if (typeof body.items === "string") {
    try {
      body.items = JSON.parse(body.items);
    } catch (e) {}
  }

    if (typeof body.deliveries === "string") {
    try {
      body.deliveries = JSON.parse(body.deliveries);
    } catch (e) {}
  }

  const headerKey = req.headers["idempotency-key"] || req.headers["x-idempotency-key"];
  if (headerKey && typeof headerKey === "string" && !body.idempotencyKey) {
    body.idempotencyKey = headerKey;
  }

  // 🔒 Prevención de escalada RBAC / Parameter Pollution:
  // Sanitización estricta: Eliminar campos privilegiados del payload de entrada
  const authUser = (req as any).user;
  delete body.createdBySellerId;
  delete body.createdByAdminId;

  if (authUser?.userType === "seller") {
    body.createdBySellerId = authUser.uid;
  } else if (authUser?.userType === "admin") {
    body.createdByAdminId = authUser.uid;
  } else {
    if (authUser?.userType === "client") {
      body.userId = authUser.uid;
    }
  }

  req.body = body;
  next();
};