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

  // Normalizar tipo de identificación
  if (body.identificationType === "Cédula") {
    body.identificationType = "Cedula";
  }

  // Limpiar vehicle si no es conductor o si está vacío
  if (body.vehicle) {
    const isVehicleEmpty =
      typeof body.vehicle !== "object" ||
      (!body.vehicle.brand && !body.vehicle.model && !body.vehicle.plateNumber);

    if (body.userType !== "driver" || isVehicleEmpty) {
      delete body.vehicle;
    }
  }

  req.body = body;
  next();
};