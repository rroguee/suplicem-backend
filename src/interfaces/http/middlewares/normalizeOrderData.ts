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

  req.body = body;
  next();
};