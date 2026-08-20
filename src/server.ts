import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import { registerRoutes } from "./interfaces/http/routes";

export const startServer = () => {
  const app = express();

  app.use(cors());

  // Logging middleware
  app.use((req, _res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
  });

  app.use(express.json());

  // Handle JSON parse errors gracefully
  app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (err instanceof SyntaxError && "body" in err) {
      res.status(400).json({ success: false, message: "JSON mal formado en el cuerpo de la petición" });
      return;
    }
    next(err);
  });

  app.use("/api", registerRoutes());

  const PORT = process.env.PORT || 3000;
  app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Servidor corriendo en http://0.0.0.0:${PORT}`);
  });
};
