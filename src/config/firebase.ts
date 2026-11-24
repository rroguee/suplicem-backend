import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import fs from "fs";
import path from "path";

if (!getApps().length) {
  let credential;
  const keysPath = path.join(__dirname, "keys.json");

  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
    credential = cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  } else if (fs.existsSync(keysPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(keysPath, "utf8"));
    if (serviceAccount.private_key && typeof serviceAccount.private_key === "string") {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }
    credential = cert(serviceAccount);
  } else {
    credential = applicationDefault();
  }

  initializeApp({
    credential,
    projectId: process.env.FIREBASE_PROJECT_ID || "suplicem-dev",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "suplicem-dev.firebasestorage.app",
  });
}

export const firestore = getFirestore();
firestore.settings({ ignoreUndefinedProperties: true });
export const auth = getAuth();
export const storage = getStorage();
