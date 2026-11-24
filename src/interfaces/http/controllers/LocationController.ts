import { Request, Response } from "express";
import { LocationFirestoreRepository } from "../../../infrastructure/firestore/LocationFirestoreRepository";
import { TripFirestoreRepository } from "../../../infrastructure/firestore/TripFirestoreRepository";
import { UpdateLocationUseCase } from "../../../application/use-cases/location/UpdateLocationUseCase";
import { GetLocationUseCase } from "../../../application/use-cases/location/GetLocationUseCase";

const locationRepo = new LocationFirestoreRepository();
const tripRepo = new TripFirestoreRepository();

export class LocationController {
  constructor(
    private updateLocationUseCase = new UpdateLocationUseCase(locationRepo, tripRepo),
    private getLocationUseCase = new GetLocationUseCase(locationRepo)
  ) {}

  async update(req: Request, res: Response) {
    const { lat, lng } = req.body;
    const driverId = (req as any).user?.uid;

    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: "Lat y lng son requeridos" });
    }

    const wasUpdated = await this.updateLocationUseCase.execute(`${driverId}`, Number(lat), Number(lng));
    if (!wasUpdated) {
      return res.status(200).json({
        success: true,
        tracked: false,
        message: "Telemetría omitida: no cuenta con un viaje activo en ruta",
      });
    }

    res.status(200).json({ success: true, tracked: true, message: "Ubicación actualizada correctamente" });
  }

  async get(req: Request, res: Response) {
    try {
      const { driverId } = req.params;
      const authUser = (req as any).user;

      const data = await this.getLocationUseCase.execute(driverId, authUser);

      if (!data) {
        return res.status(200).json({ success: true, location: null, message: "Ubicación no disponible" });
      }

      res.status(200).json({ success: true, location: data });
    } catch (error: any) {
      const isForbidden =
        error.message?.includes("permiso") ||
        error.message?.includes("Acceso denegado");
      const status = isForbidden ? 403 : 500;
      res.status(status).json({
        success: false,
        message: error.message || "Error al obtener la ubicación",
      });
    }
  }
}
