import { Request, Response, NextFunction } from "express";

/**
 * Middleware híbrido que valida la subida o actualización de comprobantes de pago.
 * Soporta tanto FormData binario (req.file) como JSON con URI/URL (req.body.receiptImage).
 */
export const validateReceiptUpload = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { id } = req.params;
  if (!id || typeof id !== "string" || !id.trim()) {
    res.status(400).json({
      success: false,
      message: "ID de orden inválido",
    });
    return;
  }

  const file = req.file;
  const bodyReceipt = req.body?.receiptImage;

  // 1. Si adjuntó un archivo físico, validar tipo MIME y Magic Bytes
  if (file) {
    const allowedMimes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
    if (!allowedMimes.includes(file.mimetype)) {
      res.status(400).json({
        success: false,
        message: "Tipo de archivo no permitido. Solo se admiten imágenes (JPEG, PNG, WEBP)",
      });
      return;
    }

    const buffer = file.buffer;
    if (!buffer || buffer.length < 4) {
      res.status(400).json({
        success: false,
        message: "Archivo de imagen inválido o vacío",
      });
      return;
    }

    const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    const isPng =
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47;
    const isWebp =
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP";

    if (!isJpeg && !isPng && !isWebp) {
      res.status(400).json({
        success: false,
        message: "El archivo adjunto no es una imagen válida o está dañado",
      });
      return;
    }

    return next();
  }

  // 2. Si envió una URL o base64 en el cuerpo JSON
  if (bodyReceipt && typeof bodyReceipt === "string" && bodyReceipt.trim().length > 10) {
    return next();
  }

  // 3. Si no adjuntó archivo ni string válido
  res.status(400).json({
    success: false,
    message: "Debe proporcionar una imagen o archivo de comprobante válido",
  });
};
