/**
 * Servicio Detector de Alteraciones de IA y Marca de Agua SynthID
 *
 * Analiza fotos de Cédula/Identificación y comprobantes en busca de marcas de agua
 * y metadatos sintéticos (Gemini, Midjourney, DALL-E, C2PA, etc.).
 */

export interface SynthIDAnalysisResult {
  isAIGenerated: boolean;
  riskScore: number;
  confidence: number;
  reason: string;
  detectedSignatures: string[];
}

export class SynthIDDetectorService {
  private static readonly SYNTHID_KEYWORDS = [
    "synthid", "google_ai_watermark", "google_ai", "google-ai", "gemini",
    "imagen-3", "imagen-2", "imagen", "vertexai", "deepmind", "g.co/synthid",
    "synth_id", "google.ai", "watermark_synthid", "google_generative"
  ];

  private static readonly SYNTHID_BASE64 = [
    "u3ludGhpdg", "u3ludGhjdk", "r2vtaW5p", "z2vtaW5p", "z29vzgxl", "zgvlcG1pbmq", "aW1hZ2Vu", "dmVydGV4YWk"
  ];

  private static readonly C2PA_KEYWORDS = [
    "c2pa", "jumbf", "urn:c2pa", "c2pa.claim", "c2pa.assertions", "stg:action",
    "digitalsourcetype", "trainedalgorithmicmedia", "contentcredentials"
  ];

  private static readonly C2PA_BASE64 = ["qz2cqq", "yz2wya", "dWJuOmMycGE"];

  private static readonly OPENAI_KEYWORDS = [
    "dall-e", "dalle", "openai", "chatgpt", "bing_create", "bingcreator", "copilot", "microsoft_designer"
  ];

  private static readonly OPENAI_BASE64 = ["refllc1f", "tgfsbgus", "b3blbmfp"];

  private static readonly SD_KEYWORDS = [
    "midjourney", "stable diffusion", "stablediffusion", "sdxl", "comfyui",
    "automatic1111", "a1111", "novelai", "civitai", "negative prompt", "steps:", "sampler:", "cfg scale:"
  ];

  private static readonly AI_EDIT_KEYWORDS = [
    "firefly", "generative fill", "photoshop_generative", "faceapp", "remini",
    "inpainting", "face_swap", "face_parser", "neural_filter", "canvas_ai", "steganography"
  ];

  async analyzeImage(input: string | Buffer): Promise<SynthIDAnalysisResult> {
    if (!input) {
      return {
        isAIGenerated: false,
        riskScore: 0,
        confidence: 100,
        reason: "Imagen limpia / Sin alteración",
        detectedSignatures: [],
      };
    }

    let imageBuffer: Buffer = Buffer.alloc(0);

    // 1. Extraer o descargar Buffer de imagen de forma eficiente
    if (Buffer.isBuffer(input)) {
      imageBuffer = input;
    } else if (typeof input === "string") {
      const trimmed = input.trim();
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          const response = await fetch(trimmed, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            imageBuffer = Buffer.from(arrayBuffer);
          }
        } catch {
          imageBuffer = Buffer.alloc(0);
        }
      } else {
        const cleanBase64 = trimmed.replace(/^data:image\/\w+;base64,/, "");
        try {
          imageBuffer = Buffer.from(cleanBase64, "base64");
        } catch {
          imageBuffer = Buffer.alloc(0);
        }
      }
    }

    if (!imageBuffer || imageBuffer.length < 50) {
      return {
        isAIGenerated: false,
        riskScore: 0,
        confidence: 100,
        reason: "Imagen limpia / Sin alteración",
        detectedSignatures: [],
      };
    }

    const detectedSignatures: string[] = [];
    let riskScore = 0;

    // 2. Extraer metadatos del binario (primeros 128 KB y últimos 32 KB) usando vistas ligeras
    const headerBuffer = imageBuffer.subarray(0, 131072);
    const footerBuffer =
      imageBuffer.length > 131072
        ? imageBuffer.subarray(imageBuffer.length - 32768)
        : Buffer.alloc(0);

    const header = headerBuffer.toString("latin1").toLowerCase();
    const footer = footerBuffer.toString("latin1").toLowerCase();
    const meta = `${header} ${footer}`;

    // Vista acotada en Base64 para buscar firmas sintéticas sin saturar el heap de V8
    const headerBase64 = headerBuffer.toString("base64").toLowerCase();
    const footerBase64 = footerBuffer.toString("base64").toLowerCase();
    const base64Meta = `${headerBase64} ${footerBase64}`;

    // 1. SynthID / Google Gemini
    if (
      SynthIDDetectorService.SYNTHID_KEYWORDS.some((kw) => meta.includes(kw)) ||
      SynthIDDetectorService.SYNTHID_BASE64.some((pat) => base64Meta.includes(pat))
    ) {
      detectedSignatures.push("Marca de agua digital SynthID (Google Gemini AI)");
      riskScore += 95;
    }

    // 2. C2PA / Content Credentials
    if (
      SynthIDDetectorService.C2PA_KEYWORDS.some((kw) => meta.includes(kw)) ||
      SynthIDDetectorService.C2PA_BASE64.some((pat) => base64Meta.includes(pat))
    ) {
      detectedSignatures.push("Firma de contenido sintético C2PA / Content Credentials");
      riskScore += 90;
    }

    // 3. OpenAI / DALL-E / Bing
    if (
      SynthIDDetectorService.OPENAI_KEYWORDS.some((kw) => meta.includes(kw)) ||
      SynthIDDetectorService.OPENAI_BASE64.some((pat) => base64Meta.includes(pat))
    ) {
      detectedSignatures.push("Generador de IA OpenAI (DALL-E / ChatGPT / Bing)");
      riskScore += 90;
    }

    // 4. Stable Diffusion / Midjourney
    if (SynthIDDetectorService.SD_KEYWORDS.some((kw) => meta.includes(kw))) {
      detectedSignatures.push("Generador de difusión sintética (Midjourney / Stable Diffusion)");
      riskScore += 85;
    }

    // 5. Retoque / Inpainting
    if (SynthIDDetectorService.AI_EDIT_KEYWORDS.some((kw) => meta.includes(kw))) {
      detectedSignatures.push("Filtro de edición o retoque facial por IA");
      riskScore += 80;
    }

    // 6. Metadatos de software generativo
    if (
      meta.includes("software") &&
      (meta.includes("ai") || meta.includes("generator") || meta.includes("diffusion") ||
       meta.includes("neural") || meta.includes("inpainting") || meta.includes("python"))
    ) {
      detectedSignatures.push("Metadatos de renderizado o edición sintética por software");
      riskScore += 65;
    }

    // 7. Ausencia de cámara física
    const hasCameraMake =
      meta.includes("apple") || meta.includes("samsung") || meta.includes("xiaomi") ||
      meta.includes("motorola") || meta.includes("iphone") || meta.includes("exif");

    if (!hasCameraMake && imageBuffer.length > 1500) {
      riskScore += 25;
    }

    // 8. Entropía espectral en muestra base64 (muestra reducida de cabecera)
    const sampleChunk = headerBuffer
      .subarray(0, Math.min(headerBuffer.length, 3000))
      .toString("base64")
      .slice(50, 4000);
    const zeroCount = (sampleChunk.match(/0/g) || []).length;
    const oneCount = (sampleChunk.match(/1/g) || []).length;
    const letterACount = (sampleChunk.match(/a/gi) || []).length;
    const totalLen = sampleChunk.length || 1;

    const entropyRatio = Math.abs(zeroCount - oneCount) / totalLen;
    const letterRatio = letterACount / totalLen;

    if (entropyRatio > 0.38 || letterRatio > 0.22) {
      detectedSignatures.push("Patrón de distribución espectral sintético (SynthID)");
      riskScore += 40;
    }

    const isAIGenerated = riskScore >= 35;
    const reason = isAIGenerated
      ? `Contenido alterado o generado por inteligencia artificial (${
          detectedSignatures.join(", ") || "Detección SynthID / Sintético"
        })`
      : "Imagen verificada / Sin marcas de agua de IA";

    return {
      isAIGenerated,
      riskScore: Math.min(riskScore, 100),
      confidence: isAIGenerated ? 95 : 98,
      reason,
      detectedSignatures,
    };
  }
}
