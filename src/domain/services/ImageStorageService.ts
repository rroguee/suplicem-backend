import { v4 as uuid } from "uuid";
import { storage } from "../../config/firebase";

export const uploadDeliveryImage = async (file: Express.Multer.File, orderId: string, index: number) => {
  const bucket = storage.bucket();
  const fileName = `orders/${orderId}/delivery_${index}_${Date.now()}.jpg`;
  const fileRef = bucket.file(fileName);

  await fileRef.save(file.buffer, {
    contentType: file.mimetype,
    public: true,
    metadata: {
      firebaseStorageDownloadTokens: uuid(),
    },
  });

  return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
};
