import { Request, Response, NextFunction } from "express";
export const normalizeUserData = (req: Request, _res: Response, next: NextFunction): void => {
  if (!req.body) {
    req.body = {};
    return next();
  }

  let body = {...req.body};

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

  if (typeof body.addresses === "string") {
    try {
      body.addresses = JSON.parse(body.addresses);
    } catch (e) {}
  }

  if (typeof body.vehicle === "string") {
    try {
      body.vehicle = JSON.parse(body.vehicle);
    } catch (e) {}
  }
  req.body = body;
  next();
};