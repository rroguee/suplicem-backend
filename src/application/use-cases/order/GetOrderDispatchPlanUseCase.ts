import { OrderRepository } from "../../../domain/repositories/OrderRepository";
import { TonnageCalculatorService } from "../../../domain/services/TonnageCalculatorService";

export interface SuggestedTruckItem {
  id: string;
  totalTons: number;
  deliveryId?: string;
}

export interface SuggestedDeliveryPlanItem {
  id?: string;
  index: number;
  addressDescription: string;
  recipientName?: string;
  destinationAddress?: any;
  quantityFundas: number;
  totalTons: number;
  trucks: SuggestedTruckItem[];
}

export interface OrderDispatchPlanDto {
  orderId: string;
  orderNumber: number;
  totalTons: number;
  deliveries: SuggestedDeliveryPlanItem[];
}

export class GetOrderDispatchPlanUseCase {
  private tonnageCalculator = new TonnageCalculatorService();

  constructor(private orderRepo: OrderRepository) {}

  async execute(orderId: string): Promise<OrderDispatchPlanDto> {
    const order = await this.orderRepo.getById(orderId);
    if (!order) {
      const err: any = new Error("Orden no encontrada");
      err.statusCode = 404;
      throw err;
    }

    const rawDeliveries = order.deliveries || [];
    const orderTotalTons = Number(order.totalTons || order.pendingBalance) || 0;
    const MAX_TRUCK_TONS = 21; // Capacidad estándar Suplicem por flete

    const rawEstimatedTons = rawDeliveries.map((del) => {
      const qty = Number(del.quantity) || 0;
      const matchedItem = (order.items || []).find((i) => i.productId === del.productId);
      return this.tonnageCalculator.calculateItemTons({
        name: matchedItem?.name || del.productId,
        unit: del.unit || matchedItem?.unit,
        quantity: qty,
        weightKg: del.weightKg || matchedItem?.weightKg,
      });
    });

    const totalEstimated = rawEstimatedTons.reduce((sum, t) => sum + t, 0);
    let accumulatedTons = 0;

    const deliveries: SuggestedDeliveryPlanItem[] = rawDeliveries.map((del, idx) => {
      const qtyFundas = Number(del.quantity) || 0;
      let tons: number;

      if (orderTotalTons > 0) {
        if (idx === rawDeliveries.length - 1) {
          tons = Number(Math.max(0, orderTotalTons - accumulatedTons).toFixed(2));
        } else if (totalEstimated > 0) {
          tons = Number(((rawEstimatedTons[idx] / totalEstimated) * orderTotalTons).toFixed(2));
        } else {
          tons = Number((orderTotalTons / rawDeliveries.length).toFixed(2));
        }
        accumulatedTons += tons;
      } else {
        tons = Number(rawEstimatedTons[idx].toFixed(2));
      }

      const addressDesc = del.address?.description || "Dirección de orden";
      const truckCount = Math.max(1, Math.ceil(tons / MAX_TRUCK_TONS));
      const tonsPerTruck = Number((tons / truckCount).toFixed(2));

      const trucks: SuggestedTruckItem[] = Array.from({ length: truckCount }, (_, tIdx) => ({
        id: `truck-${idx}-${tIdx}-${Date.now()}`,
        totalTons:
          tIdx === truckCount - 1
            ? Number((tons - tonsPerTruck * (truckCount - 1)).toFixed(2))
            : tonsPerTruck,
        deliveryId: del.id,
      }));

      return {
        id: del.id,
        index: idx,
        addressDescription: addressDesc,
        recipientName: (del.address as any)?.recipientName,
        destinationAddress: del.address,
        quantityFundas: qtyFundas,
        totalTons: tons,
        trucks,
      };
    });

    return {
      orderId: order.id || orderId,
      orderNumber: order.orderNumber || 0,
      totalTons: orderTotalTons,
      deliveries,
    };
  }
}
