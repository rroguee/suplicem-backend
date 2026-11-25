import { OrderRepository } from "../../../domain/repositories/OrderRepository";
import { SynthIDDetectorService } from "../../../infrastructure/services/SynthIDDetectorService";

export class UpdateOrderReceiptUseCase {
  constructor(
    private orderRepository: OrderRepository,
    private synthIDDetector: SynthIDDetectorService = new SynthIDDetectorService()
  ) {}

  async execute(
    orderId: string,
    receiptImage: string,
    userId?: string,
    userType?: string,
    receiptBuffer?: Buffer
  ): Promise<void> {
    const order = await this.orderRepository.getById(orderId);
    if (!order) {
      throw new Error("Orden no encontrada");
    }

    // 1. Verificación de permisos de usuario (Solo Admin o el Cliente propietario de la orden)
    if (userType !== "admin") {
      const isOwner = order.userId === userId || (order as any).userUid === userId;
      if (!isOwner) {
        throw new Error("No tienes permiso para actualizar esta orden");
      }
    }

    // 2. Integridad de estado: solo pedidos en estado 'pending' admiten reemplazo de comprobante
    if (userType !== "admin" && order.status !== "pending") {
      throw new Error(
        `No se puede actualizar el comprobante porque la orden se encuentra en estado '${order.status}'.`
      );
    }

    // 3. Detección de comprobantes fraudulentos o sintéticos por IA (Prioriza buffer en RAM)
    let aiRiskFlag = false;
    let aiRiskScore = 0;
    let aiRiskReason: string | undefined = undefined;

    const imageToAnalyze = receiptBuffer || receiptImage;
    if (imageToAnalyze) {
      const analysis = await this.synthIDDetector.analyzeImage(imageToAnalyze);
      aiRiskFlag = analysis.isAIGenerated;
      aiRiskScore = analysis.riskScore;
      aiRiskReason = analysis.isAIGenerated ? analysis.reason : undefined;
    }

    await this.orderRepository.updateReceiptImage(orderId, receiptImage, {
      aiRiskFlag,
      aiRiskScore,
      aiRiskReason,
    });
  }
}
