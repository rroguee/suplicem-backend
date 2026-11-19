import { NotificationRepository } from "../../domain/repositories/NotificationRepository";
import { Notification } from "../../domain/entities/Notification";

export class NotificationDispatcherService {
  constructor(private notificationRepo: NotificationRepository) {}

  async notifyOrderCreated(params: {
    orderNumber: number;
    sellerId?: string;
    clientName: string;
    totalAmount?: string;
    totalTons?: number;
    address?: string;
  }): Promise<void> {
    if (!params.sellerId) return;

    const notif: Omit<Notification, "id"> = {
      recipientId: params.sellerId,
      recipientRole: "seller",
      type: "order_created",
      category: "orders",
      actorName: params.clientName,
      actorRole: "Cliente de Cartera",
      title: "ha creado un nuevo pedido",
      description: `Pedido de ${params.totalTons ? `${params.totalTons} Ton` : "cemento"} registrado en el sistema.`,
      isRead: false,
      createdAt: new Date().toISOString(),
      preview: {
        orderNumber: params.orderNumber,
        badgeLabel: "Por Aprobar",
        badgeColor: "warning",
        totalAmount: params.totalAmount,
        details: params.address || "Entrega programada",
        actionUrl: `/admin/orders?search=${params.orderNumber}`,
      },
    };

    await this.notificationRepo.create(notif);
  }

  async notifyOrderStatusChanged(params: {
    orderNumber: number;
    sellerId?: string;
    status: "approved" | "rejected";
    reason?: string;
    clientName: string;
  }): Promise<void> {
    if (!params.sellerId) return;

    const isApproved = params.status === "approved";
    const notif: Omit<Notification, "id"> = {
      recipientId: params.sellerId,
      recipientRole: "seller",
      type: isApproved ? "order_approved" : "order_rejected",
      category: "orders",
      actorName: "Administración",
      actorRole: "Finanzas",
      title: isApproved ? `aprobó el Pedido #${params.orderNumber}` : `rechazó el Pedido #${params.orderNumber}`,
      description: isApproved
        ? `El pago para ${params.clientName} ha sido verificado.`
        : `Motivo: ${params.reason || "Revisar comprobante adjunto"}`,
      isRead: false,
      createdAt: new Date().toISOString(),
      preview: {
        orderNumber: params.orderNumber,
        badgeLabel: isApproved ? "Aprobado" : "Rechazado",
        badgeColor: isApproved ? "success" : "error",
        details: `Cliente: ${params.clientName}`,
        actionUrl: `/admin/orders?search=${params.orderNumber}`,
      },
    };

    await this.notificationRepo.create(notif);
  }

  async notifyDeliveryCompleted(params: {
    sellerId?: string;
    driverName: string;
    clientName: string;
    orderNumber: number;
    tripNumber?: string;
    details?: string;
  }): Promise<void> {
    if (!params.sellerId) return;

    const notif: Omit<Notification, "id"> = {
      recipientId: params.sellerId,
      recipientRole: "seller",
      type: "delivery_completed",
      category: "deliveries",
      actorName: params.driverName || "Conductor",
      actorRole: "Conductor",
      title: "completó la entrega para tu cliente",
      description: `Entrega completada para ${params.clientName}${params.tripNumber ? ` (${params.tripNumber})` : ""}.`,
      isRead: false,
      createdAt: new Date().toISOString(),
      preview: {
        orderNumber: params.orderNumber,
        tripId: params.tripNumber,
        badgeLabel: "Entregado",
        badgeColor: "success",
        details: params.details || `Cliente: ${params.clientName}`,
        actionUrl: `/admin/orders?search=${params.orderNumber}`,
      },
    };

    await this.notificationRepo.create(notif);
  }

  async notifyClientAssigned(params: {
    sellerId?: string;
    adminName?: string;
    clientName: string;
    details?: string;
  }): Promise<void> {
    if (!params.sellerId) return;

    const notif: Omit<Notification, "id"> = {
      recipientId: params.sellerId,
      recipientRole: "seller",
      type: "client_assigned",
      category: "clients",
      actorName: params.adminName || "Administración",
      actorRole: "Administrador",
      title: "te asignó un nuevo cliente a tu cartera",
      description: `${params.clientName} ahora forma parte de tu cartera de clientes.`,
      isRead: false,
      createdAt: new Date().toISOString(),
      preview: {
        badgeLabel: "Nuevo Cliente",
        badgeColor: "primary",
        details: params.details || `Cliente: ${params.clientName}`,
        actionUrl: `/admin/user?search=${encodeURIComponent(params.clientName)}`,
      },
    };

    await this.notificationRepo.create(notif);
  }

  async notifyAccountStatusChanged(params: {
    userId: string;
    userType: "client" | "driver" | "admin" | "seller";
    status: "active" | "rejected" | "inactive" | "banned";
    previousStatus: "pending" | "active" | "inactive" | "banned" | "rejected";
    userName?: string;
  }): Promise<void> {
    const isApproved = params.status === "active";
    const isRejected = params.status === "rejected";
    const isInactive = params.status === "inactive";
    const reactivated = isApproved && params.previousStatus !== "pending";

    let title = "El estado de tu cuenta cambió";
    let description = "Revisa tu cuenta o comunícate con soporte para más información.";
    let badgeLabel = "Actualizada";
    let badgeColor: "success" | "warning" | "error" | "primary" | "info" = "info";

    if (isApproved) {
      title = reactivated ? "Tu cuenta fue reactivada" : "Tu cuenta fue aprobada";
      description = reactivated
        ? "Ya puedes volver a iniciar sesión en Suplicem."
        : "¡Bienvenido! Ya puedes iniciar sesión en Suplicem.";
      badgeLabel = reactivated ? "Reactivada" : "Aprobada";
      badgeColor = "success";
    } else if (isRejected) {
      title = "Tu solicitud de registro fue rechazada";
      description = "Comunícate con soporte para más información.";
      badgeLabel = "Rechazada";
      badgeColor = "error";
    } else if (isInactive) {
      title = "Tu cuenta fue desactivada";
      description = "Comunícate con soporte para más información.";
      badgeLabel = "Desactivada";
      badgeColor = "warning";
    } else {
      title = "Tu cuenta fue suspendida";
      description = "Comunícate con soporte para más información.";
      badgeLabel = "Suspendida";
      badgeColor = "error";
    }

    const notif: Omit<Notification, "id"> = {
      recipientId: params.userId,
      recipientRole: params.userType,
      type: "account_status_changed",
      category: "account",
      actorName: "Administración",
      actorRole: "Administrador",
      title,
      description,
      isRead: false,
      createdAt: new Date().toISOString(),
      preview: {
        badgeLabel,
        badgeColor,
        details: params.userName ? `Usuario: ${params.userName}` : undefined,
        actionUrl: "/",
      },
    };

    await this.notificationRepo.create(notif);
  }
}
