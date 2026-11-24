import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import { auth } from "../../config/firebase";
import { LocationFirestoreRepository } from "../firestore/LocationFirestoreRepository";
import { UserFirestoreRepository } from "../firestore/UserFirestoreRepository";
import { TripFirestoreRepository } from "../firestore/TripFirestoreRepository";
import { OrderFirestoreRepository } from "../firestore/OrderFirestoreRepository";
import { TripAuthorizationService } from "../../application/services/TripAuthorizationService";
import { isOriginAllowed } from "../../config/cors";

export interface DriverLocationPayload {
  tripId: string;
  lat: number;
  lng: number;
  speed?: number;
  heading?: number;
}

export class WebSocketServer {
  private static io: Server | null = null;
  private static locationRepo = new LocationFirestoreRepository();
  private static userRepo = new UserFirestoreRepository();
  private static tripAuthService = new TripAuthorizationService(
    new TripFirestoreRepository(),
    new OrderFirestoreRepository()
  );

  public static init(httpServer: HttpServer): Server {
    if (this.io) return this.io;

    this.io = new Server(httpServer, {
      cors: {
        origin: (origin, callback) => {
          if (isOriginAllowed(origin)) {
            return callback(null, true);
          }
          return callback(new Error(`WebSocket bloqueado por CORS: origen ${origin} no autorizado`));
        },
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 30000,
      pingInterval: 10000,
    });

    // 1. Middleware de Autenticación en el Handshake (Solo valida 1 vez por conexión)
    this.io.use(async (socket: Socket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.authorization?.replace("Bearer ", "");

        if (!token) {
          return next(new Error("Token de autenticación no proporcionado"));
        }

        const decoded = await auth.verifyIdToken(token);
        const userData = await this.userRepo.getByIdStrict(decoded.uid);

        if (!userData || userData.status !== "active") {
          return next(new Error("Acceso denegado: su cuenta debe estar activa y aprobada para conectar al canal en vivo"));
        }

        socket.data.user = {
          uid: decoded.uid,
          userType: userData?.userType || "client",
          names: userData?.names || "",
          status: userData.status,
        };

        next();
      } catch (err: any) {
        console.warn("[WebSocket] Conexión rechazada por token inválido:", err?.message || err);
        next(new Error("Autenticación fallida"));
      }
    });

    // 2. Manejador de eventos y salas
    this.io.on("connection", (socket: Socket) => {
      const user = socket.data.user;
      let lastWatchRequestTime = 0;

      // A. Cliente, Vendedor o Admin se une a la sala validando autorización BOLA con throttling anti-DoS
      socket.on("client:watch_trip", async (tripId: string) => {
        if (!tripId || typeof tripId !== "string") return;

        // Throttling: descarta emisiones con intervalo menor a 500ms por socket para proteger cuotas de Firestore
        const now = Date.now();
        if (now - lastWatchRequestTime < 500) {
          return;
        }
        lastWatchRequestTime = now;

        try {
          const isAllowed = await this.tripAuthService.canUserWatchTrip(user, tripId);
          if (!isAllowed) {
            socket.emit("trip:error", { message: "No autorizado para ver este viaje" });
            return;
          }

          socket.join(`trip:${tripId}`);
        } catch (err) {
          console.error("[WebSocket] Error validando watch_trip:", err);
        }
      });

      // B. Cliente o Admin abandona la sala al cerrar el modal o cambiar de pantalla
      socket.on("client:leave_trip", (tripId: string) => {
        if (!tripId || typeof tripId !== "string") return;
        socket.leave(`trip:${tripId}`);
      });

      let lastLocationEmissionTime = 0;

      // C. Chofer transmite posición en vivo validando que sea el chofer asignado
      socket.on("driver:location", async (payload: DriverLocationPayload) => {
        if (!user || user.userType !== "driver") return;
        if (!payload || !payload.tripId) return;

        // Throttling: descarta emisiones con intervalo menor a 1 segundo por socket
        const now = Date.now();
        if (now - lastLocationEmissionTime < 1000) {
          return;
        }
        lastLocationEmissionTime = now;

        // Validación estricta de coordenadas geográficas válidas (evita NaN, Infinity y valores fuera de rango)
        const lat = Number(payload.lat);
        const lng = Number(payload.lng);
        if (
          isNaN(lat) ||
          isNaN(lng) ||
          !isFinite(lat) ||
          !isFinite(lng) ||
          lat < -90 ||
          lat > 90 ||
          lng < -180 ||
          lng > 180
        ) {
          return;
        }

        try {
          const canEmit = await this.tripAuthService.canDriverEmitLocation(user.uid, payload.tripId);
          if (!canEmit) return;

          const driverId = user.uid;
          const nowIso = new Date().toISOString();

          // 1. Retransmisión instantánea en memoria RAM a los observadores de este viaje (< 10 ms)
          socket.to(`trip:${payload.tripId}`).emit("trip:location_update", {
            tripId: payload.tripId,
            driverId,
            lat: payload.lat,
            lng: payload.lng,
            latitude: payload.lat,
            longitude: payload.lng,
            speed: payload.speed || 0,
            heading: payload.heading || 0,
            updatedAt: nowIso,
          });

          // 2. Mantener en sincronía el buffer de memoria existente (persiste a BD solo cada 20s)
          this.locationRepo.update(driverId, payload.lat, payload.lng).catch(() => {});
        } catch (err) {
          console.error("[WebSocket] Error procesando driver:location:", err);
        }
      });

      socket.on("disconnect", () => {
        // Socket.IO limpia las salas automáticamente al desconectar
      });
    });

    console.log("⚡ Servidor WebSocket inicializado en memoria RAM");
    return this.io;
  }

  public static getIO(): Server | null {
    return this.io;
  }

  public static notifyTripCompleted(tripId: string): void {
    if (!this.io || !tripId) return;
    this.io.to(`trip:${tripId}`).emit("trip:completed", {
      tripId,
      message: "Viaje completado exitosamente",
      completedAt: new Date().toISOString(),
    });
    this.io.in(`trip:${tripId}`).socketsLeave(`trip:${tripId}`);
  }
}
