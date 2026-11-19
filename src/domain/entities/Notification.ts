export type NotificationType =
  | "order_created"
  | "order_approved"
  | "order_rejected"
  | "order_risk"
  | "trip_assigned"
  | "trip_in_transit"
  | "delivery_completed"
  | "client_assigned"
  | "credit_approved"
  | "account_status_changed";

export type NotificationCategory = "orders" | "deliveries" | "clients" | "account";

export interface NotificationPreview {
  badgeLabel: string;
  badgeColor: "success" | "warning" | "error" | "primary" | "info";
  orderNumber?: number;
  tripId?: string;
  totalAmount?: string;
  details?: string;
  imageUrl?: string;
  actionUrl: string;
}

export interface Notification {
  id?: string;
  recipientId: string;
  recipientRole?: "seller" | "admin" | "client" | "driver";
  type: NotificationType;
  category: NotificationCategory;
  actorId?: string;
  actorName: string;
  actorRole?: string;
  actorAvatar?: string;
  title: string;
  description: string;
  isRead: boolean;
  createdAt: string;
  preview?: NotificationPreview;
}
