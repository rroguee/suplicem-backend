import { Request, Response, NextFunction } from "express";

export const validateImageFile = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const file = req.file;

  if (!file) {
    res.status(400).json({
      success: false,
      message: "Debe adjuntar una imagen",
    });
    return;
  }

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

  // Comprobación de Magic Bytes
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
      message: "La firma binaria del archivo no corresponde a una imagen válida",
    });
    return;
  }

  next();
};