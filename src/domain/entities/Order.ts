import { Address } from "./User";

export interface DeliveryDetail {
  productId: string;
  address?: Address;
  quantity: number;
  unit: string;
  status?: "pending" | "delivered";
  images?: string[];
  comment?: string;
  productName?: string; // para enriquecer luego si quieres
}

export interface OrderItem {
  productId: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  orderNumber: number;
  id?: string;
  userId: string;
  deliveryType: "almacen" | "domicilio";
  deliveries: DeliveryDetail[];
  items: OrderItem[];
  comments?: string;
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string;
  createdAt: string;
  tripId?: string;
}
